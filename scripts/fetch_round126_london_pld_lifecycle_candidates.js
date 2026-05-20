const fs = require("fs");
const path = require("path");

const outDir = "tmp/subagents/round126_london_pld_lifecycle_direct";
const corpusPath = "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json";
const api = "https://planningdata.london.gov.uk/api-guest/applications/_search";
const sourceUrlPrefix = "https://planningdata.london.gov.uk/api-guest/applications/_source/";
const accessedAt = "2026-05-19";
const startDate = "2020-01-01";
const endDate = accessedAt;
const londonEnvelope = { minLon: -0.5103, maxLon: 0.334, minLat: 51.2868, maxLat: 51.6919 };

const fields = [
  "id",
  "lpa_name",
  "borough",
  "lpa_app_no",
  "site_name",
  "site_number",
  "street_name",
  "secondary_street_name",
  "locality",
  "postcode",
  "description",
  "decision",
  "decision_date",
  "status",
  "application_type_full",
  "centroid",
  "wgs84_polygon",
  "url_planning_app",
  "actual_commencement_date",
  "actual_completion_date",
  "application_details.scheme_name",
  "application_details.site_area",
  "application_details.total_gia_gained",
  "application_details.total_gia_lost",
  "application_details.projected_cost_of_works",
  "application_details.residential_details.total_no_proposed_residential_units"
];

const lifecycleSpecs = [
  {
    field: "actual_completion_date",
    milestone: "completion",
    sourceDateField: "actual_completion_date",
    observedChange: "Planning London Datahub records an actual completion date for this planning application row.",
    titleAction: "actual completion date"
  },
  {
    field: "actual_commencement_date",
    milestone: "commencement",
    sourceDateField: "actual_commencement_date",
    observedChange: "Planning London Datahub records an actual commencement date for this planning application row.",
    titleAction: "actual commencement date"
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(value, limit = 90) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .toLowerCase()
    .slice(0, limit)
    .replace(/_+$/g, "");
}

function isoFromPldDate(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return "";
}

function sentenceTrim(value, limit = 300) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1).split(" ").slice(0, -1).join(" ").replace(/[,:;.-]+$/, "");
  return `${cut}...`;
}

function pointFor(row) {
  const centroid = row.centroid || {};
  const lon = Number(centroid.lon);
  const lat = Number(centroid.lat);
  if (Number.isFinite(lon) && Number.isFinite(lat)) {
    return { lon, lat, source: "Planning London Datahub centroid field" };
  }
  const coords = [];
  function visit(value) {
    if (!value) return;
    if (Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) {
      coords.push({ lon: Number(value[0]), lat: Number(value[1]) });
      return;
    }
    if (Array.isArray(value)) value.forEach(visit);
  }
  visit(row.wgs84_polygon?.coordinates);
  const usable = coords.filter((p) => Number.isFinite(p.lon) && Number.isFinite(p.lat));
  if (!usable.length) return null;
  return {
    lon: usable.reduce((sum, item) => sum + item.lon, 0) / usable.length,
    lat: usable.reduce((sum, item) => sum + item.lat, 0) / usable.length,
    source: "Approximate centroid derived from Planning London Datahub WGS84 polygon coordinates"
  };
}

function inLondon(point) {
  return point &&
    point.lon >= londonEnvelope.minLon &&
    point.lon <= londonEnvelope.maxLon &&
    point.lat >= londonEnvelope.minLat &&
    point.lat <= londonEnvelope.maxLat;
}

function addressFor(row) {
  return [
    row.site_name,
    [row.site_number, row.street_name].filter(Boolean).join(" "),
    row.secondary_street_name,
    row.locality,
    row.postcode
  ].filter(Boolean).join(", ") || row.lpa_app_no || row.id;
}

function textFor(row) {
  return [
    row.site_name,
    row.description,
    row.application_details?.scheme_name,
    row.application_type_full,
    row.street_name,
    row.postcode,
    row.lpa_name
  ].filter(Boolean).join(" ");
}

function score(row, spec, date) {
  const text = textFor(row).toLowerCase();
  let value = 0;
  const keywords = [
    [/school|academy|college|university|campus|student/, 32],
    [/hospital|health|clinic|medical|nhs|care/, 32],
    [/library|museum|gallery|theatre|cinema|cultural|arts|heritage/, 32],
    [/town hall|civic|community centre|community hub|leisure centre|market/, 30],
    [/estate regeneration|regeneration|masterplan|comprehensive redevelopment|public realm/, 26],
    [/station|transport|bridge|interchange|public square|park/, 22],
    [/mixed use|hotel|office|commercial|retail/, 10]
  ];
  for (const [regex, points] of keywords) if (regex.test(text)) value += points;
  const gia = Number(row.application_details?.total_gia_gained || 0);
  const lost = Math.abs(Number(row.application_details?.total_gia_lost || 0));
  const units = Number(row.application_details?.residential_details?.total_no_proposed_residential_units || 0);
  const siteArea = Number(row.application_details?.site_area || 0);
  if (gia >= 25000) value += 45;
  else if (gia >= 10000) value += 35;
  else if (gia >= 2500) value += 20;
  if (lost >= 5000) value += 12;
  if (units >= 500) value += 36;
  else if (units >= 150) value += 24;
  else if (units >= 50) value += 12;
  if (siteArea >= 1) value += 10;
  if (/lawful development|advert|tree|telecommunications/i.test(row.application_type_full || "")) value -= 25;
  if (/certificate of lawfulness|existing use|tree works|advertisement/i.test(row.description || "")) value -= 25;
  if (String(row.status || "").toLowerCase().includes("completed")) value += spec.milestone === "completion" ? 12 : 4;
  const year = Number(date.slice(0, 4));
  value += Math.max(0, year - 2019) * 0.5;
  return value;
}

async function fetchRows(spec) {
  const rows = [];
  const seen = new Set();
  for (let from = 0; from < 7000; from += 500) {
    const body = {
      from,
      size: 500,
      _source: fields,
      sort: [{ [spec.field]: { order: "desc", missing: "_last" } }],
      query: {
        bool: {
          filter: [
            { exists: { field: spec.field } },
            { range: { [spec.field]: { gte: "01/01/2020", lte: "19/05/2026" } } }
          ],
          should: [
            { match_phrase: { description: "school" } },
            { match_phrase: { description: "hospital" } },
            { match_phrase: { description: "library" } },
            { match_phrase: { description: "museum" } },
            { match_phrase: { description: "public realm" } },
            { match_phrase: { description: "estate regeneration" } },
            { match_phrase: { description: "mixed use" } },
            { match_phrase: { description: "leisure centre" } },
            { match_phrase: { description: "community centre" } },
            { range: { "application_details.total_gia_gained": { gte: 2500 } } },
            { range: { "application_details.residential_details.total_no_proposed_residential_units": { gte: 50 } } }
          ],
          minimum_should_match: 1
        }
      }
    };
    const response = await fetch(api, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": "Bims5Round126PldLifecycle/0.1" },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`${spec.field} ${from}: ${response.status} ${await response.text()}`);
    const data = await response.json();
    const hits = data.hits?.hits || [];
    for (const hit of hits) {
      const row = { ...(hit._source || {}), id: hit._source?.id || hit._id };
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push(row);
    }
    console.log(`${spec.field}: fetched ${rows.length}`);
    if (hits.length < 500 || rows.length >= 2200) break;
  }
  return rows;
}

function existingPldIds() {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8").replace(/^\uFEFF/, ""));
  const ids = new Set();
  for (const event of corpus.events || []) {
    const text = `${event.source_record_id || ""} ${event.source_url || ""}`;
    for (const match of text.matchAll(/\b(?:PLD:)?([A-Za-z]+-[A-Za-z0-9_/-]+)\b/g)) {
      ids.add(match[1].replace(/\//g, "_"));
    }
  }
  return ids;
}

function candidateFor(row, spec, date, point) {
  const address = addressFor(row);
  const sourceUrl = `${sourceUrlPrefix}${encodeURIComponent(row.id)}`;
  const sourceIds = ["gla-planning-datahub-applications"];
  const gia = Number(row.application_details?.total_gia_gained || 0);
  const units = Number(row.application_details?.residential_details?.total_no_proposed_residential_units || 0);
  const metrics = [
    gia ? `${gia} sqm GIA gained` : "",
    units ? `${units} proposed residential units` : ""
  ].filter(Boolean).join("; ");
  const metricText = metrics ? ` The row includes ${metrics}.` : "";
  return {
    city_id: "london",
    candidate_id: `round126_lon_pld_${spec.milestone}_${slugify(row.id)}_${date.replace(/-/g, "_")}`,
    title: `PLD ${spec.titleAction} row for ${address}`,
    summary: `Planning London Datahub records ${spec.titleAction} ${date} for ${row.lpa_app_no || row.id} at ${address}. Proposal description: ${sentenceTrim(row.description)}${metricText}`,
    observed_change: spec.observedChange,
    date,
    effective_date: date,
    date_precision: "day",
    source_id: "gla-planning-datahub-applications",
    source_ids: sourceIds,
    source_name: "Planning London Datahub applications",
    publisher: `Greater London Authority / ${row.lpa_name || row.borough || "London planning authority"}`,
    source_url: sourceUrl,
    source_record_id: `PLD:${row.id}; LPA:${row.lpa_app_no || ""}`.trim(),
    source_type: "official Planning London Datahub application API row",
    accessed_at: accessedAt,
    source_date_field: `Planning London Datahub ${spec.sourceDateField}`,
    latitude: Number(point.lat.toFixed(6)),
    longitude: Number(point.lon.toFixed(6)),
    geometry: { type: "Point", coordinates: [Number(point.lon.toFixed(6)), Number(point.lat.toFixed(6))] },
    geometry_source: `${point.source}; PLD source row ${sourceUrl}.`,
    geometry_precision: point.source.includes("polygon") ? "approximate centroid from PLD polygon; not a surveyed project boundary" : "PLD centroid for atlas navigation; not a surveyed project boundary",
    license_or_terms_note: "Planning London Datahub/London Datastore terms for applications are not stated as a bulk open-data licence in this repo; retain factual row metadata, source URL, publisher attribution and retrieval date.",
    attribution: "Greater London Authority and relevant London planning authority via Planning London Datahub.",
    confidence: "documented",
    project_type: `${spec.milestone} lifecycle planning record`,
    limitations: `PLD ${spec.sourceDateField} is an administrative lifecycle field from the planning data feed. It is not evidence of opening, occupation, current use, design quality, delivery outcomes, or causation. Borough feed completeness and date semantics can vary; coordinates are source centroids for navigation, not measured footprints.`
  };
}

async function main() {
  ensureDir(outDir);
  const existing = existingPldIds();
  const candidates = [];
  const batchIds = new Set();
  for (const spec of lifecycleSpecs) {
    const rows = await fetchRows(spec);
    const scored = [];
    for (const row of rows) {
      if (existing.has(String(row.id).replace(/\//g, "_"))) continue;
      const date = isoFromPldDate(row[spec.field]);
      if (!date || date < startDate || date > endDate) continue;
      const point = pointFor(row);
      if (!inLondon(point)) continue;
      const itemScore = score(row, spec, date);
      if (itemScore < 20) continue;
      scored.push({ row, date, point, score: itemScore });
    }
    scored.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
    for (const item of scored.slice(0, 70)) {
      const candidate = candidateFor(item.row, spec, item.date, item.point);
      const key = candidate.candidate_id;
      if (batchIds.has(key)) continue;
      batchIds.add(key);
      candidates.push(candidate);
    }
  }
  candidates.sort((a, b) => a.effective_date.localeCompare(b.effective_date) || a.candidate_id.localeCompare(b.candidate_id));
  const trimmed = candidates.slice(0, 100);
  const pack = {
    generated_at: new Date().toISOString(),
    task: "Round126 direct PLD lifecycle candidate fetch",
    accessed_at: accessedAt,
    candidate_count: trimmed.length,
    candidates: trimmed
  };
  const sourceAudit = {
    generated_at: accessedAt,
    sources: [
      {
        source_id: "gla-planning-datahub-applications",
        source_name: "Planning London Datahub applications",
        publisher: "Greater London Authority / London planning authorities",
        source_url: "https://data.london.gov.uk/dataset/planning-london-datahub-applications/",
        api_endpoint: api,
        source_type: "official planning application and lifecycle API",
        accessed_at: accessedAt,
        coverage_years: "Queried actual_commencement_date and actual_completion_date for 2020-01-01 through 2026-05-19.",
        update_frequency: "Daily according to London Datastore/GLA PLD guidance.",
        geographic_scope: "Greater London planning authorities represented in Planning London Datahub.",
        key_fields_used: fields,
        license_or_terms_note: "London Datastore applications source terms are not clearly stated as a bulk open-data licence in this repo. Candidate events retain factual row metadata, row URLs, publisher attribution and access date only.",
        reliability_assessment: "usable with caveats",
        required_caveats: "PLD lifecycle fields are administrative feed fields. They do not prove opening, occupation, design quality, current use, delivery outcomes, or causal effects; borough completeness and field semantics vary.",
        ingestion_recommendation: "Use selected high-signal lifecycle rows as documented planning-process milestones only, with inline limitations and source-row URLs."
      }
    ]
  };
  fs.writeFileSync(path.join(outDir, "candidates.json"), `${JSON.stringify(pack, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "source_audit.json"), `${JSON.stringify(sourceAudit, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "notes.md"), [
    "# Round 126 London PLD Lifecycle Direct",
    "",
    `Generated ${trimmed.length} candidate rows from actual_commencement_date and actual_completion_date.`,
    "",
    "The pack keeps lifecycle rows as administrative planning-data milestones only. It deliberately avoids claims about openings, occupation, completed public use, current use, outcomes, or causation.",
    "",
    "Rows are scored toward civic, health, education, culture, public-realm, estate-regeneration, large-GIA, or substantial-unit signals, and duplicate PLD IDs already present in the manual corpus are skipped."
  ].join("\n"));
  console.log(JSON.stringify({ written: trimmed.length, outDir }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
