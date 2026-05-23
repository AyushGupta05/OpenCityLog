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
const OUTPUT_PATH = path.join(ROOT, "manifests", "architecture_url_spot_check.json");
const CITY_IDS = ["london", "nyc", "belfast"];
const EVENT_SAMPLE_PER_CITY = 6;
const TIMEOUT_MS = 12000;

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

function firstAccessUrl(access) {
  return access.landing_url || access.portal_url || access.api_url || access.csv_url || access.docs_url || null;
}

function uniqueEventSamples(events, cityId) {
  const samples = [];
  const seenUrls = new Set();
  for (const event of events) {
    if (event.city_id !== cityId || !/^https?:\/\//i.test(String(event.source_url || ""))) continue;
    if (seenUrls.has(event.source_url)) continue;
    seenUrls.add(event.source_url);
    samples.push({
      kind: "event_source_url",
      city_id: cityId,
      event_id: event.event_id,
      source_ids: event.source_ids || [],
      source_record_id: event.source_record_id,
      url: event.source_url,
    });
    if (samples.length >= EVENT_SAMPLE_PER_CITY) break;
  }
  return samples;
}

function prioritySourceSamples(inventory) {
  return (inventory.sources || [])
    .map((source) => ({
      kind: "priority_source_access_url",
      city_id: (source.city_ids || []).join(","),
      source_id: source.source_id,
      url: firstAccessUrl(source.access || {}),
    }))
    .filter((sample) => /^https?:\/\//i.test(String(sample.url || "")));
}

async function checkUrl(sample) {
  const result = {
    ...sample,
    checked_at: "2026-05-23T00:00:00Z",
    ok: false,
    status: null,
    final_url: null,
    error: null,
  };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const response = await fetch(sample.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Bims-5 architecture source verifier (metadata spot check)",
        "Range": "bytes=0-512",
      },
    });
    clearTimeout(timeout);
    result.status = response.status;
    result.final_url = response.url;
    result.ok = response.status >= 200 && response.status < 400;
    result.response_class = response.status < 400
      ? "reachable"
      : response.status === 401 || response.status === 403
        ? "access_controlled"
        : response.status < 500
          ? "client_error"
          : "server_error";
  } catch (error) {
    result.error = compactText(error.message || error);
    result.response_class = "network_error";
  }
  return result;
}

function summarize(results) {
  const byClass = {};
  const eventByCity = {};
  for (const result of results) {
    byClass[result.response_class || "unknown"] = (byClass[result.response_class || "unknown"] || 0) + 1;
    if (result.kind === "event_source_url") {
      eventByCity[result.city_id] ||= { checked: 0, reachable: 0, hard_failures: 0 };
      eventByCity[result.city_id].checked += 1;
      if (result.ok) eventByCity[result.city_id].reachable += 1;
      if (["client_error", "server_error", "network_error"].includes(result.response_class)) {
        eventByCity[result.city_id].hard_failures += 1;
      }
    }
  }
  return { byClass, eventByCity };
}

function assertSpotCheckQuality(summary) {
  const failures = [];
  for (const cityId of CITY_IDS) {
    const row = summary.eventByCity[cityId] || { checked: 0, reachable: 0, hard_failures: 0 };
    if (row.checked < EVENT_SAMPLE_PER_CITY) {
      failures.push(`${cityId} checked ${row.checked} event URL(s), expected ${EVENT_SAMPLE_PER_CITY}`);
    }
    if (row.reachable < 1) {
      failures.push(`${cityId} has no reachable event source URL in deterministic spot check`);
    }
    if (row.hard_failures > Math.floor(EVENT_SAMPLE_PER_CITY / 2)) {
      failures.push(`${cityId} has too many hard URL failures: ${row.hard_failures}/${row.checked}`);
    }
  }
  return failures;
}

async function main() {
  const inventory = readJson(INVENTORY_PATH);
  const milestones = readJson(MILESTONES_PATH);
  const eventSamples = CITY_IDS.flatMap((cityId) => uniqueEventSamples(milestones.events || [], cityId));
  const samples = [...eventSamples, ...prioritySourceSamples(inventory)];
  const results = [];
  for (const sample of samples) {
    results.push(await checkUrl(sample));
  }
  const summary = summarize(results);
  const failures = assertSpotCheckQuality(summary);
  const payload = {
    artifact_kind: "architecture_url_spot_check",
    generated_at: "2026-05-23T00:00:00Z",
    target_scope: inventory.target_scope,
    sample_count: results.length,
    summary,
    failures,
    results,
  };
  writeJson(OUTPUT_PATH, payload);
  if (failures.length) {
    console.error("Architecture URL spot check failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`Architecture URL spot check OK: ${results.length} URLs checked (${JSON.stringify(summary.byClass)}).`);
}

if (require.main === module) {
  main();
}
