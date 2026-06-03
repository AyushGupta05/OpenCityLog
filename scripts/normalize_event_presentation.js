const fs = require("fs");
const path = require("path");

const DEFAULT_ATLAS_DIR = "web/data/city-atlas";
const MAX_TITLE_LENGTH = 140;
const MAX_SUBTITLE_LENGTH = 180;
const MAX_DETAILS_LENGTH = 500;

function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, ".."),
    atlasDir: DEFAULT_ATLAS_DIR,
  };
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--root") {
      args.root = path.resolve(next);
      index += 1;
    } else if (arg === "--atlas-dir") {
      args.atlasDir = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function resolve(root, value) {
  return path.isAbsolute(value) ? value : path.join(root, value);
}

function toPosix(value) {
  return String(value).split(path.sep).join("/");
}

function relativeFromRoot(root, filePath) {
  return toPosix(path.relative(root, filePath));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload)}\n`, "utf8");
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value) {
  return compactText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function clipText(value, maxLength) {
  const text = compactText(value);
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength - 3);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 48 ? lastSpace : clipped.length).replace(/[ .,;:]+$/, "")}...`;
}

function titleWithSuffix(title, suffix, maxLength = MAX_TITLE_LENGTH) {
  const cleanTitle = compactText(title) || "Source-backed city change record";
  const cleanSuffix = compactText(suffix);
  if (!cleanSuffix) return clipText(cleanTitle, maxLength);
  const separator = " — ";
  const suffixText = clipText(cleanSuffix, Math.min(48, Math.max(18, maxLength - 32)));
  const suffixBlock = `${separator}${suffixText}`;
  const baseBudget = Math.max(32, maxLength - suffixBlock.length);
  return `${clipText(cleanTitle, baseBudget)}${suffixBlock}`;
}

function titleCase(value) {
  return compactText(value)
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function compactRecordId(value) {
  const text = compactText(value);
  if (!text) return "";
  const parts = text.split(/[|;,\s]+/).map((part) => part.trim()).filter(Boolean);
  const candidate = parts.find((part) => /[A-Za-z]*\d[A-Za-z0-9/_-]*/.test(part)) || parts[0] || text;
  return candidate.replace(/[^A-Za-z0-9/_-]+/g, "").slice(-18);
}

function shortHash(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(6, "0").slice(0, 8);
}

function eventRecordId(event) {
  const provenance = event.provenance || {};
  return compactRecordId(
    provenance.source_record_id
      || provenance.planning_application_id
      || provenance.legacy_source_id
      || provenance.osm_changeset
      || event.evidence?.find((item) => item?.record_id)?.record_id
      || event.event_id,
  );
}

function categoryLabel(event) {
  const value = String(event.category || event.lens || "record").replace(/_/g, " ");
  return titleCase(value);
}

function dateLabel(event) {
  return compactText(event.effective_date || event.effective_date_range?.start || event.year || "");
}

function areaLabel(event) {
  return compactText(event.affected_area?.label || event.area || "");
}

function sourceLabel(event) {
  const evidence = Array.isArray(event.evidence) ? event.evidence : [];
  const item = evidence.find((entry) => compactText(entry?.label)) || evidence.find((entry) => compactText(entry?.source_id));
  return compactText(item?.label || item?.source_id || (Array.isArray(event.source_ids) ? event.source_ids[0] : ""));
}

function baseSubtitle(event) {
  const parts = [
    areaLabel(event),
    dateLabel(event),
    event.confidence ? titleCase(event.confidence) : "",
    sourceLabel(event),
  ].filter(Boolean);
  return clipText(parts.join(" / "), MAX_SUBTITLE_LENGTH);
}

function baseDetails(event) {
  const text = compactText(event.details || event.explanation || event.short_description || event.summary || event.title);
  if (text.length >= 12) return clipText(text, MAX_DETAILS_LENGTH);
  return clipText(`${event.title} Source-backed record; inspect the cited evidence for limits and provenance.`, MAX_DETAILS_LENGTH);
}

function disambiguatorForEvent(event) {
  const values = [
    areaLabel(event),
    eventRecordId(event),
    sourceLabel(event),
  ].map(compactText).filter(Boolean);
  return values[0] || values[1] || values[2] || compactText(event.event_id).slice(-18);
}

function uniqueTitleForEvent(event, group, usedTitles) {
  const original = clipText(event.title || "Source-backed city change record", MAX_TITLE_LENGTH);
  if (group.length === 1 && !usedTitles.has(normalizeKey(original))) {
    usedTitles.add(normalizeKey(original));
    return original;
  }

  const candidates = [
    titleWithSuffix(original, disambiguatorForEvent(event)),
    titleWithSuffix(original, `${disambiguatorForEvent(event)} · ${eventRecordId(event)}`),
    titleWithSuffix(original, `${disambiguatorForEvent(event)} · record ${shortHash(event.event_id)}`),
    titleWithSuffix(original, `${categoryLabel(event)} ${dateLabel(event)} · ${compactText(event.event_id).slice(-10)}`),
  ];
  for (const candidate of candidates) {
    const clipped = candidate;
    const key = normalizeKey(clipped);
    if (!usedTitles.has(key)) {
      usedTitles.add(key);
      return clipped;
    }
  }
  const fallback = titleWithSuffix(original, `record ${shortHash(event.event_id)}`);
  usedTitles.add(normalizeKey(fallback));
  return fallback;
}

function presentationGroupKey(event) {
  return [
    normalizeKey(event.title),
    String(event.year || ""),
    normalizeKey(event.category || event.lens || ""),
  ].join("\u0000");
}

function loadEvents(root, eventsIndex) {
  const rows = [];
  for (const chunk of eventsIndex.chunks || []) {
    const chunkPath = resolve(root, chunk.json_path);
    const payload = readJson(chunkPath);
    rows.push({ chunk, chunkPath, payload, events: payload.events || [] });
  }
  return rows;
}

function featureForEvent(event) {
  const properties = {
    city_id: event.city_id,
    event_id: event.event_id,
    title: event.title,
    subtitle: event.subtitle,
    details: event.details,
    year: event.year,
    effective_date: event.effective_date,
    date_precision: event.date_precision,
    short_description: event.short_description,
    category: event.category,
    lens: event.lens,
    confidence: event.confidence,
    source_ids: event.source_ids,
    affected_area_label: event.affected_area?.label || null,
    explanation: event.explanation,
  };
  if (Array.isArray(event.excluded_lens_slugs) && event.excluded_lens_slugs.length) {
    properties.excluded_lens_slugs = event.excluded_lens_slugs;
  }
  if (event.exclude_transport_road_scoring === true) {
    properties.exclude_transport_road_scoring = true;
  }
  return {
    type: "Feature",
    id: event.event_id,
    properties,
    geometry: event.geometry || null,
  };
}

function normalizeCity(root, cityDir) {
  const eventsIndexPath = path.join(cityDir, "events.json");
  if (!fs.existsSync(eventsIndexPath)) return null;
  const eventsIndex = readJson(eventsIndexPath);
  const chunkRows = loadEvents(root, eventsIndex);
  const allEvents = chunkRows.flatMap((row) => row.events);
  const groups = new Map();
  for (const event of allEvents) {
    const key = presentationGroupKey(event);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }

  const usedByCityYear = new Map();
  let changed = 0;
  let repeatedTitleGroups = 0;
  for (const group of groups.values()) {
    if (group.length > 1) repeatedTitleGroups += 1;
    for (const event of group) {
      const cityYear = `${event.city_id}\u0000${event.year}`;
      if (!usedByCityYear.has(cityYear)) usedByCityYear.set(cityYear, new Set());
      const usedTitles = usedByCityYear.get(cityYear);
      const nextTitle = uniqueTitleForEvent(event, group, usedTitles);
      const nextSubtitle = baseSubtitle(event);
      const nextDetails = baseDetails(event);
      if (event.title !== nextTitle || event.subtitle !== nextSubtitle || event.details !== nextDetails) {
        event.title = nextTitle;
        event.subtitle = nextSubtitle;
        event.details = nextDetails;
        changed += 1;
      }
    }
  }

  for (const row of chunkRows) {
    writeJson(row.chunkPath, row.payload);
    const geojsonPath = resolve(root, row.chunk.geojson_path);
    if (fs.existsSync(geojsonPath)) {
      const geojson = readJson(geojsonPath);
      geojson.features = row.events.map(featureForEvent);
      writeJson(geojsonPath, geojson);
    }
  }

  eventsIndex.presentation = {
    normalized_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    contract: "Each event has a city-year unique display title plus subtitle and details fields.",
    repeated_title_groups_disambiguated: repeatedTitleGroups,
    events_updated: changed,
  };
  writeJson(eventsIndexPath, eventsIndex);
  return {
    city_id: eventsIndex.city_id,
    events: allEvents.length,
    repeated_title_groups_disambiguated: repeatedTitleGroups,
    events_updated: changed,
  };
}

function normalize(args) {
  const atlasRoot = resolve(args.root, args.atlasDir);
  const citiesDir = path.join(atlasRoot, "cities");
  const summaries = [];
  for (const cityId of fs.readdirSync(citiesDir).sort()) {
    const cityDir = path.join(citiesDir, cityId);
    if (!fs.statSync(cityDir).isDirectory()) continue;
    const summary = normalizeCity(args.root, cityDir);
    if (summary) summaries.push(summary);
  }
  return summaries;
}

function main() {
  try {
    const summaries = normalize(parseArgs(process.argv));
    for (const summary of summaries) {
      console.log(
        `[event-presentation] ${summary.city_id}: ${summary.events} events, ${summary.repeated_title_groups_disambiguated} repeated title group(s), ${summary.events_updated} updated`,
      );
    }
  } catch (error) {
    console.error(`normalize:event-presentation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  normalize,
  normalizeKey,
  baseSubtitle,
  baseDetails,
};
