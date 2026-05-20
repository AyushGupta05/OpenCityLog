const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGET_START = "2008-01-01";
const TARGET_END = "2026-05-20";
const MILESTONES_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json",
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function inferDatePrecision(value) {
  const text = compactText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return "day";
  if (/^\d{4}-\d{2}$/.test(text)) return "month";
  if (/^\d{4}$/.test(text)) return "year";
  if (/\d{4}.*\d{4}/.test(text)) return "range";
  return "unknown";
}

function firstSource(sourceById, event) {
  for (const sourceId of event.source_ids || []) {
    const source = sourceById.get(sourceId);
    if (source) return source;
  }
  return null;
}

function normalizeEvent(event, sourceById) {
  const source = firstSource(sourceById, event);
  let changed = false;

  if (!compactText(event.date_precision)) {
    event.date_precision = inferDatePrecision(event.date);
    changed = true;
  }

  if (!compactText(event.license_or_terms_note)) {
    event.license_or_terms_note = compactText(source?.licence)
      || "Source-specific terms; this event stores factual metadata, coordinates for atlas navigation, and source URLs only.";
    changed = true;
  }

  if (!compactText(event.attribution)) {
    const publisher = compactText(event.publisher || source?.publisher || event.source_name || source?.title || (event.source_ids || [])[0]);
    event.attribution = publisher ? `Attribute ${publisher}.` : "Attribute the cited source publisher.";
    changed = true;
  }

  if (!compactText(event.transformation_method)) {
    event.transformation_method = "Normalized from public architecture milestone metadata with source URL, source date field, point geometry, confidence and limitations retained.";
    changed = true;
  }

  return changed;
}

function main() {
  const payload = readJson(MILESTONES_PATH);
  payload.scope_note = `Curated architecture and built-environment milestones for London, New York City, and Belfast from ${TARGET_START} through ${TARGET_END}. This file is a reviewed seed layer for administrative and documented milestones and does not claim exhaustive coverage of every building, permit, design decision, construction outcome or city impact.`;
  payload.target_scope = {
    start_date: TARGET_START,
    end_date: TARGET_END,
    interpretation: "Records are evidence of the stated source milestone only. Planning approval is not construction, permit issuance is not completion, and completion/opening is used only where a source explicitly says completed or opened.",
  };
  payload.last_normalized_at = "2026-05-20";

  const sourceById = new Map((payload.sources || []).map((source) => [source.source_id, source]));
  let changedEvents = 0;
  for (const event of payload.events || []) {
    if (normalizeEvent(event, sourceById)) changedEvents += 1;
  }

  writeJson(MILESTONES_PATH, payload);
  console.log(`Normalized architecture milestone package: ${changedEvents} event(s) updated; scope ${TARGET_START} through ${TARGET_END}.`);
}

if (require.main === module) {
  main();
}
