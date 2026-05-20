const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INVENTORY_PATH = path.join(ROOT, "config", "architecture_source_inventory.json");
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

function main() {
  const inventory = readJson(INVENTORY_PATH);
  const registry = readJson(REGISTRY_PATH);
  const byId = new Map((registry.sources || []).map((source, index) => [source.source_id, { source, index }]));
  let added = 0;
  let updated = 0;

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

  writeJson(REGISTRY_PATH, registry);
  console.log(`Synchronized architecture priority sources into source registry: ${added} added, ${updated} updated.`);
}

if (require.main === module) {
  main();
}
