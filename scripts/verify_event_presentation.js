const fs = require("fs");
const path = require("path");

const DEFAULT_ATLAS_DIR = "web/data/city-atlas";

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

function relativeFromRoot(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value) {
  return compactText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sourceDuplicateKey(event) {
  const provenance = event.provenance || {};
  const recordId = compactText(
    provenance.source_record_id
      || provenance.planning_application_id
      || provenance.legacy_source_id
      || event.evidence?.find((item) => item?.record_id)?.record_id,
  );
  if (!recordId) return null;
  return [
    event.city_id,
    (event.source_ids || []).map(String).sort().join("|"),
    recordId,
    event.effective_date || "",
    event.source_date_field || provenance.source_date_field || "",
    event.category || "",
  ].join("\u0000");
}

function verifyEvent(event, seenIds, seenTitles, seenSourceKeys, label, failures) {
  const id = compactText(event.event_id);
  if (!id) failures.push(`${label} missing event_id`);
  if (seenIds.has(id)) failures.push(`${label} duplicates event_id ${id}`);
  seenIds.add(id);

  for (const field of ["title", "short_description", "subtitle", "details"]) {
    const text = compactText(event[field]);
    if (text.length < 12) failures.push(`${label}.${field} is missing or too terse`);
  }

  const cityYearTitle = [event.city_id, event.year, normalizeKey(event.title)].join("\u0000");
  if (seenTitles.has(cityYearTitle)) {
    failures.push(`${label} repeats display title within ${event.city_id}/${event.year}: ${event.title}`);
  }
  seenTitles.add(cityYearTitle);

  const sourceKey = sourceDuplicateKey(event);
  if (sourceKey) {
    const previous = seenSourceKeys.get(sourceKey);
    if (previous && normalizeKey(previous.title) === normalizeKey(event.title)) {
      failures.push(`${label} repeats source record/date/title with ${previous.event_id}: ${event.event_id}`);
    }
    seenSourceKeys.set(sourceKey, event);
  }
}

function verify(args) {
  const failures = [];
  const atlasRoot = resolve(args.root, args.atlasDir);
  const citiesDir = path.join(atlasRoot, "cities");
  const seenIds = new Set();
  const seenTitles = new Set();
  const seenSourceKeys = new Map();

  for (const cityId of fs.readdirSync(citiesDir).sort()) {
    const eventsIndexPath = path.join(citiesDir, cityId, "events.json");
    if (!fs.existsSync(eventsIndexPath)) continue;
    const eventsIndex = readJson(eventsIndexPath);
    if (!eventsIndex.presentation?.contract) {
      failures.push(`${relativeFromRoot(args.root, eventsIndexPath)} missing presentation normalization metadata`);
    }
    for (const chunk of eventsIndex.chunks || []) {
      const chunkPath = resolve(args.root, chunk.json_path);
      const payload = readJson(chunkPath);
      (payload.events || []).forEach((event, index) => {
        verifyEvent(event, seenIds, seenTitles, seenSourceKeys, `${relativeFromRoot(args.root, chunkPath)}.events[${index}]`, failures);
      });
    }
  }
  return failures;
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const failures = verify(args);
    if (failures.length) {
      console.error("Event presentation verification failed:");
      for (const failure of failures.slice(0, 80)) console.error(`- ${failure}`);
      if (failures.length > 80) console.error(`- ... ${failures.length - 80} more failure(s)`);
      process.exit(1);
    }
    console.log("Event presentation OK: event ids, display titles, subtitles, and details are unique enough for the atlas UI.");
  } catch (error) {
    console.error(`verify:event-presentation failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  verify,
  sourceDuplicateKey,
};
