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
const REGISTRY_PATH = path.join(ROOT, "config", "source_registry.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function firstUrl(access) {
  return access.landing_url || access.portal_url || access.api_url || access.csv_url || access.docs_url || "";
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function unique(values) {
  return [...new Set(values.map(compactText).filter(Boolean))];
}

function firstYear(value) {
  const match = String(value || "").match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function manualSourceFamily(source) {
  const text = `${source.source_id || ""} ${source.bucket || ""} ${source.title || ""}`.toLowerCase();
  if (/lpc|landmark|heritage|listed/.test(text)) return "heritage_permits";
  if (/dob|permit|building_permits/.test(text)) return "building_permits";
  if (/planning|application|pld|development/.test(text)) return "planning_applications";
  return compactText(source.bucket) || "architecture";
}

function manualCoverageYears(source, events) {
  const years = events.map((event) => firstYear(event.date || event.effective_date)).filter(Number.isInteger);
  const start = Number(source.coverage_years?.start) || (years.length ? Math.min(...years) : 2008);
  const end = Number(source.coverage_years?.end) || (years.length ? Math.max(...years) : 2026);
  return {
    start,
    end: Math.max(start, end),
  };
}

function toRegistryEntry(source, targetScope) {
  const localPaths = Object.values(source.current_artifacts || {})
    .filter((value) => value && !/^https?:\/\//i.test(value));
  return {
    source_id: source.source_id,
    title: source.title,
    provider: source.publisher,
    source_family: source.source_family,
    city_ids: source.city_ids,
    licence: source.legal.licence,
    licence_url: source.legal.licence_url,
    coverage_years: source.coverage.years,
    update_frequency: source.coverage.update_frequency,
    url: firstUrl(source.access),
    local_paths: localPaths,
    reliability: "usable_with_caveats",
    source_confidence: source.confidence_default,
    attribution_text: source.legal.attribution_text,
    provenance_notes: `${targetScope.start_date} through ${targetScope.end_date}. Frozen architecture priority source. Date fields: ${source.data_shape.date_fields.join(", ")}. Geometry fields: ${source.data_shape.geometry_fields.join(", ")}. Row id fields: ${source.data_shape.row_id_fields.join(", ")}. Event types: ${source.event_types.join(", ")}.`,
    caveats: [
      ...source.caveats,
      source.legal.redistribution_caveat,
    ],
    architecture_inventory: {
      priority_rank: source.priority_rank,
      access: source.access,
      data_shape: source.data_shape,
      event_types: source.event_types,
      current_artifacts: source.current_artifacts,
      next_checks: source.next_checks,
    },
  };
}

function toManualRegistryEntry(source, events, milestoneMeta) {
  const publisher = compactText(source.publisher || source.provider || "Unknown publisher");
  const dateFields = unique(events.map((event) => event.source_date_field));
  const rowIds = unique(events.slice(0, 8).map((event) => event.source_record_id));
  const caveats = unique([
    source.limitations,
    source.spatial_granularity ? `Geometry note: ${source.spatial_granularity}` : "",
    /not specified|terms|copyright|review/i.test(source.licence || "")
      ? "Licence or terms require source-level review before redistribution or formal analytical reuse."
      : "",
    milestoneMeta.license_note,
  ]);
  const entry = {
    source_id: source.source_id,
    title: source.title,
    provider: publisher,
    source_family: manualSourceFamily(source),
    city_ids: Array.isArray(source.city_ids) ? source.city_ids : [],
    licence: source.licence,
    licence_url: source.licence_url,
    coverage_years: manualCoverageYears(source, events),
    update_frequency: compactText(source.update_frequency) || "Source/page-specific publication.",
    url: source.access_url || source.url || "",
    local_paths: [],
    reliability: "usable_with_caveats",
    source_confidence: "documented",
    attribution_text: `Attribute ${publisher}.`,
    provenance_notes: unique([
      source.time_coverage,
      source.temporal_granularity ? `Date fields: ${source.temporal_granularity}.` : "",
      rowIds.length ? `Sample source row ids: ${rowIds.join(", ")}.` : "",
      "Dynamic architecture milestone source synced from data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json.",
    ]).join(" "),
    caveats,
    architecture_milestone_source: {
      bucket: source.bucket || null,
      temporal_granularity: source.temporal_granularity || null,
      spatial_granularity: source.spatial_granularity || null,
      source_date_fields: dateFields,
      retrieved_at: source.retrieved_at || source.accessed_at || null,
    },
  };
  if (source.retrieved_at || source.accessed_at) {
    entry.retrieved_at = source.retrieved_at || source.accessed_at;
  }
  return entry;
}

function main() {
  const inventory = readJson(INVENTORY_PATH);
  const milestones = readJson(MILESTONES_PATH);
  const registry = readJson(REGISTRY_PATH);
  const byId = new Map((registry.sources || []).map((source, index) => [source.source_id, { source, index }]));
  const inventoryIds = new Set((inventory.sources || []).map((source) => source.source_id));
  const eventsBySource = new Map();
  let added = 0;
  let updated = 0;
  let manualAdded = 0;
  let manualUpdated = 0;

  for (const source of inventory.sources || []) {
    const entry = toRegistryEntry(source, inventory.target_scope);
    const existing = byId.get(entry.source_id);
    if (existing) {
      registry.sources[existing.index] = { ...existing.source, ...entry };
      updated += 1;
    } else {
      registry.sources.push(entry);
      added += 1;
    }
  }

  for (const event of milestones.events || []) {
    for (const sourceId of event.source_ids || []) {
      if (!eventsBySource.has(sourceId)) eventsBySource.set(sourceId, []);
      eventsBySource.get(sourceId).push(event);
    }
  }

  for (const source of milestones.sources || []) {
    if (inventoryIds.has(source.source_id)) continue;
    const entry = toManualRegistryEntry(source, eventsBySource.get(source.source_id) || [], milestones);
    const existing = byId.get(entry.source_id);
    if (existing?.source?.architecture_milestone_source) {
      registry.sources[existing.index] = { ...existing.source, ...entry };
      manualUpdated += 1;
    } else if (!existing) {
      registry.sources.push(entry);
      byId.set(entry.source_id, { source: entry, index: registry.sources.length - 1 });
      manualAdded += 1;
    }
  }

  writeJson(REGISTRY_PATH, registry);
  console.log(
    `Synchronized architecture sources into source registry: ${added} priority added, ${updated} priority updated, ${manualAdded} milestone added, ${manualUpdated} milestone updated.`,
  );
}

if (require.main === module) {
  main();
}
