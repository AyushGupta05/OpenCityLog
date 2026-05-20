const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INVENTORY_PATH = path.join(ROOT, "config", "architecture_source_inventory.json");
const MILESTONES_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json",
);
const OUTPUT_PATH = path.join(ROOT, "manifests", "architecture_source_registry.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function firstYear(value) {
  const match = String(value || "").match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function sourceUrl(accessUrl) {
  return /^https?:\/\//i.test(String(accessUrl || "")) ? accessUrl : null;
}

function uniqueSorted(values) {
  return [...new Set(values.map(compactText).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function deriveType(bucket) {
  const value = String(bucket || "").toLowerCase();
  if (/permit|certificate of occupancy|co\b|dob/.test(value)) return "permit_issued";
  if (/heritage|listed|landmark|lpc|nhle|harni|designation|de-list/.test(value)) return "listed_building_change";
  if (/demolition|demolish/.test(value)) return "demolition";
  if (/commencement|start|work begins|construction/.test(value)) return "construction_start";
  if (/opening|opened|reopening|launched/.test(value)) return "opening";
  if (/completion|completed|certificate/.test(value)) return "completion";
  if (/decision|approval|refusal|committee|planning/.test(value)) return "planning_decision";
  return "planning_application";
}

function buildRegistry() {
  const inventory = readJson(INVENTORY_PATH);
  const milestones = readJson(MILESTONES_PATH);
  const priorityById = new Map((inventory.sources || []).map((source) => [source.source_id, source]));
  const eventsBySource = new Map();

  for (const event of milestones.events || []) {
    for (const sourceId of event.source_ids || []) {
      if (!eventsBySource.has(sourceId)) eventsBySource.set(sourceId, []);
      eventsBySource.get(sourceId).push(event);
    }
  }

  const sources = (milestones.sources || []).map((source) => {
    const events = eventsBySource.get(source.source_id) || [];
    const years = uniqueSorted(events.map((event) => firstYear(event.date)).filter(Number.isInteger)).map(Number);
    const priority = priorityById.get(source.source_id);
    const dateFields = uniqueSorted(events.map((event) => event.source_date_field));
    const eventTypes = uniqueSorted(events.map((event) => deriveType(event.bucket)));
    const sampleRecordIds = uniqueSorted(events.slice(0, 8).map((event) => event.source_record_id));
    const accessUrl = sourceUrl(source.access_url);

    return {
      source_id: source.source_id,
      title: source.title,
      publisher: source.publisher,
      source_family: source.bucket || priority?.source_family || "architecture",
      city_ids: source.city_ids || [],
      access: {
        api_url: priority?.access?.api_url || null,
        csv_url: priority?.access?.csv_url || null,
        portal_url: priority?.access?.portal_url || accessUrl,
        docs_url: priority?.access?.docs_url || sourceUrl(source.licence_url) || accessUrl,
        source_url: accessUrl,
      },
      coverage: {
        years: source.coverage_years,
        observed_years: years,
        update_frequency: source.update_frequency,
        geography: source.spatial_granularity,
        temporal_granularity: source.temporal_granularity || source.time_coverage,
      },
      legal: {
        licence: source.licence,
        licence_url: source.licence_url,
        attribution_text: `Attribute ${source.publisher}.`,
        redistribution_caveat: milestones.license_note,
      },
      data_shape: {
        date_fields: dateFields.length ? dateFields : ["source_date_field"],
        geometry_fields: ["latitude", "longitude", "area", "geometry_source", "geometry_precision"],
        row_id_fields: ["source_record_id", "source_url", "event_id"],
        status_fields: ["bucket", "confidence", "project_type"],
        sample_record_ids: sampleRecordIds,
      },
      event_types: eventTypes,
      event_count: events.length,
      confidence_counts: events.reduce((counts, event) => {
        counts[event.confidence || "unknown"] = (counts[event.confidence || "unknown"] || 0) + 1;
        return counts;
      }, {}),
      caveats: uniqueSorted([source.limitations, ...(events.slice(0, 4).map((event) => event.limitations))]),
      priority_inventory_source: Boolean(priority),
    };
  });

  return {
    schema_version: "1.0.0",
    artifact_kind: "architecture_source_registry",
    generated_at: "2026-05-20T00:00:00Z",
    target_scope: inventory.target_scope,
    source_count: sources.length,
    sources: sources.sort((a, b) => a.source_id.localeCompare(b.source_id)),
  };
}

function main() {
  const registry = buildRegistry();
  writeJson(OUTPUT_PATH, registry);
  console.log(`Wrote ${registry.source_count} architecture source registry rows to ${path.relative(ROOT, OUTPUT_PATH).split(path.sep).join("/")}.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildRegistry,
};
