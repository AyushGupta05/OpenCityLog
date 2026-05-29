const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ATLAS_ROOT = path.join(ROOT, "web", "data", "city-atlas");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  const text = `${JSON.stringify(payload)}\n`;
  const tmpPath = `${filePath}.tmp`;
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.writeFileSync(tmpPath, text, "utf8");
      try {
        fs.renameSync(tmpPath, filePath);
      } catch (renameError) {
        if (!["EPERM", "EACCES", "EEXIST", "UNKNOWN"].includes(renameError.code)) throw renameError;
        fs.copyFileSync(tmpPath, filePath);
        fs.unlinkSync(tmpPath);
      }
      return;
    } catch (error) {
      lastError = error;
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch (_) {
        // Best-effort cleanup before retrying a generated artifact write.
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150 * (attempt + 1));
    }
  }
  throw lastError;
}

function resolveArtifact(value) {
  return path.isAbsolute(value) ? value : path.join(ROOT, value);
}

function normalizeAreaText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function eventAreaLabel(event) {
  const props = event?.properties || event || {};
  return props.affected_area?.label || props.affected_area_label || "Unknown area";
}

function inc(target, key, amount = 1) {
  target[key] = Number(target[key] || 0) + amount;
}

function incNested(target, a, b, amount = 1) {
  if (!target[a]) target[a] = {};
  inc(target[a], b, amount);
}

function sortedObject(value) {
  return Object.fromEntries(Object.entries(value || {}).sort(([a], [b]) => a.localeCompare(b)));
}

function sortedNestedObject(value) {
  return Object.fromEntries(
    Object.entries(value || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, sortedObject(nested)]),
  );
}

function buildFacets(events) {
  const byKey = new Map();
  for (const event of events) {
    const label = String(eventAreaLabel(event) || "Unknown area").trim() || "Unknown area";
    const key = normalizeAreaText(label) || "unknown-area";
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        label,
        search_text: key,
        basis: "affected_area.label",
        count: 0,
        counts_by_category: {},
        counts_by_confidence: {},
        counts_by_category_confidence: {},
      });
    }
    const facet = byKey.get(key);
    const props = event.properties || event;
    const category = props.category || "unknown";
    const confidence = props.confidence || "documented";
    facet.count += 1;
    inc(facet.counts_by_category, category);
    inc(facet.counts_by_confidence, confidence);
    incNested(facet.counts_by_category_confidence, category, confidence);
  }
  return [...byKey.values()]
    .map((facet) => ({
      ...facet,
      counts_by_category: sortedObject(facet.counts_by_category),
      counts_by_confidence: sortedObject(facet.counts_by_confidence),
      counts_by_category_confidence: sortedNestedObject(facet.counts_by_category_confidence),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function augmentCity(citySummary) {
  const eventsPath = resolveArtifact(citySummary.artifact_paths?.events || `web/data/city-atlas/cities/${citySummary.city_id}/events.json`);
  const eventsIndex = readJson(eventsPath);
  let changed = false;
  for (const chunk of eventsIndex.chunks || []) {
    const chunkPath = resolveArtifact(chunk.json_path);
    const payload = readJson(chunkPath);
    const events = Array.isArray(payload.events) ? payload.events : [];
    const facets = buildFacets(events);
    const facetTotal = facets.reduce((sum, facet) => sum + Number(facet.count || 0), 0);
    if (facetTotal !== Number(chunk.event_count || events.length)) {
      throw new Error(`${citySummary.city_id} ${chunk.year} area facet count mismatch: ${facetTotal} != ${chunk.event_count}`);
    }
    chunk.area_facet_basis = "affected_area.label";
    chunk.area_facet_count = facets.length;
    chunk.area_facets = facets;
    changed = true;
  }
  if (changed) writeJson(eventsPath, eventsIndex);
  return { city_id: citySummary.city_id, chunks: eventsIndex.chunks?.length || 0 };
}

function main() {
  const indexPath = path.join(ATLAS_ROOT, "index.json");
  const index = readJson(indexPath);
  const summaries = (index.cities || []).map(augmentCity);
  console.log(`Area facets OK: ${summaries.map((item) => `${item.city_id}:${item.chunks}`).join(", ")}`);
}

if (require.main === module) main();

module.exports = {
  buildFacets,
  normalizeAreaText,
};
