const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const GENERATED_AT = process.env.BIMS_DATA_GENERATED_AT || "2026-05-20T00:00:00Z";
const INVENTORY_PATH = path.join(ROOT, "config", "architecture_source_inventory.json");
const MILESTONES_PATH = path.join(
  ROOT,
  "data",
  "manual_drops",
  "architecture_milestones",
  "architecture_milestones_2008_2026.json",
);
const JSON_OUTPUT = path.join(ROOT, "web", "data", "city-atlas", "architecture-coverage-report.json");
const MARKDOWN_OUTPUT = path.join(ROOT, "docs", "architecture_coverage_report.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeFile(filePath, body) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body, "utf8");
}

function increment(object, key, amount = 1) {
  object[key] = (object[key] || 0) + amount;
}

function sortedObject(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
}

function topEntries(object, limit = 12) {
  return Object.entries(object)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([key, value]) => ({ key, value }));
}

function firstYear(value) {
  const match = String(value || "").match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function eventSourceFamily(event) {
  const bucket = String(event.bucket || "unknown");
  if (/permit/i.test(bucket)) return "permits";
  if (/heritage|listed|landmark|lpc|nhle|harni/i.test(bucket)) return "heritage";
  if (/completion|opening|opened|public[-_\s]?realm|civic|project|architecture/i.test(bucket)) return "documented_milestones";
  if (/planning|application|decision|approval|refusal|certificate/i.test(bucket)) return "planning_admin";
  return "other_architecture";
}

function buildReport() {
  const inventory = readJson(INVENTORY_PATH);
  const milestones = readJson(MILESTONES_PATH);
  const byCity = {};
  const byCityYear = {};
  const byCityFamily = {};
  const byConfidence = {};
  const byPrecision = {};
  const bySource = {};
  const eventYears = new Set();

  for (const event of milestones.events || []) {
    const city = event.city_id || "unknown";
    const year = firstYear(event.date);
    const family = eventSourceFamily(event);
    increment(byCity, city);
    increment(byConfidence, event.confidence || "unknown");
    increment(byPrecision, event.date_precision || "unknown");
    increment(bySource, (event.source_ids || ["unknown"]).join(","));
    if (year) {
      eventYears.add(year);
      byCityYear[city] ||= {};
      increment(byCityYear[city], String(year));
    }
    byCityFamily[city] ||= {};
    increment(byCityFamily[city], family);
  }

  const inventoryByCity = {};
  for (const source of inventory.sources || []) {
    for (const city of source.city_ids || []) {
      inventoryByCity[city] ||= [];
      inventoryByCity[city].push({
        source_id: source.source_id,
        title: source.title,
        publisher: source.publisher,
        source_family: source.source_family,
        priority_rank: source.priority_rank,
        event_types: source.event_types,
        coverage_years: source.coverage.years,
        caveats: source.caveats,
        next_checks: source.next_checks,
      });
    }
  }

  const report = {
    artifact_kind: "architecture_coverage_report",
    generated_at: GENERATED_AT,
    target_scope: inventory.target_scope,
    summary: {
      event_count: milestones.events?.length || 0,
      source_count: milestones.sources?.length || 0,
      frozen_inventory_source_count: inventory.sources?.length || 0,
      event_years: [...eventYears].sort((a, b) => a - b),
      city_counts: sortedObject(byCity),
      confidence_counts: sortedObject(byConfidence),
      date_precision_counts: sortedObject(byPrecision),
    },
    city_year_counts: Object.fromEntries(Object.entries(byCityYear).map(([city, counts]) => [city, sortedObject(counts)])),
    city_source_family_counts: Object.fromEntries(Object.entries(byCityFamily).map(([city, counts]) => [city, sortedObject(counts)])),
    top_manual_source_ids: topEntries(bySource, 20),
    frozen_inventory_by_city: Object.fromEntries(
      Object.entries(inventoryByCity).map(([city, sources]) => [
        city,
        sources.sort((a, b) => a.priority_rank - b.priority_rank || a.source_id.localeCompare(b.source_id)),
      ]),
    ),
    quality_rules: {
      rejection_rules: inventory.rejection_rules,
      dedupe_rules: inventory.dedupe_rules,
    },
    caveats: [
      "Counts are coverage of the current source-backed architecture package, not complete city coverage.",
      "Planning approval is not construction, permit issuance is not completion, and source-reported lifecycle fields are labelled by source date field.",
      "Manual project pages and official press releases support only the stated milestone. Forward-looking dates remain caveated and are not counted as delivered outcomes.",
    ],
    priority_gaps: [
      "Belfast: continue application-level annual planning CSV and NI Planning Portal linking for row-level geometry and exact decisions.",
      "London: deepen borough planning document links beyond PLD summaries, especially for listed-building consent and demolition/refurbishment evidence.",
      "NYC: strengthen lifecycle linking across DOB NOW filings, approved permits, legacy DOB permits, LPC permits and certificates of occupancy.",
    ],
  };

  return report;
}

function markdownTable(rows, headers) {
  const lines = [];
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const row of rows) {
    lines.push(`| ${row.map((value) => String(value).replace(/\|/g, "\\|")).join(" | ")} |`);
  }
  return lines.join("\n");
}

function writeMarkdown(report) {
  const summaryRows = Object.entries(report.summary.city_counts).map(([city, count]) => [
    city,
    count,
    Object.entries(report.city_source_family_counts[city] || {}).map(([key, value]) => `${key} ${value}`).join(", "),
  ]);
  const inventoryRows = Object.entries(report.frozen_inventory_by_city).flatMap(([city, sources]) =>
    sources.map((source) => [
      city,
      source.source_id,
      source.source_family,
      `${source.coverage_years.start}-${source.coverage_years.end}`,
      source.event_types.join(", "),
    ]),
  );
  const body = [
    "# Architecture Coverage Report",
    "",
    `Generated: ${report.generated_at}`,
    "",
    `Target window: ${report.target_scope.start_date} through ${report.target_scope.end_date}.`,
    "",
    "This report counts source-backed architecture-related administrative and documented milestones. It is not a claim of complete city coverage, construction outcomes, or causal impact.",
    "",
    "## Current Event Coverage",
    "",
    markdownTable(summaryRows, ["City", "Events", "Dominant source families"]),
    "",
    `Total architecture events: ${report.summary.event_count}. Manual source entries: ${report.summary.source_count}. Frozen priority inventory sources: ${report.summary.frozen_inventory_source_count}.`,
    "",
    "## Frozen Priority Sources",
    "",
    markdownTable(inventoryRows, ["City", "Source", "Family", "Coverage years", "Event types"]),
    "",
    "## Priority Gaps",
    "",
    ...report.priority_gaps.map((item) => `- ${item}`),
    "",
    "## Caveats",
    "",
    ...report.caveats.map((item) => `- ${item}`),
    "",
  ].join("\n");
  writeFile(MARKDOWN_OUTPUT, body);
}

function main() {
  const report = buildReport();
  writeFile(JSON_OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
  writeMarkdown(report);
  console.log(`Wrote architecture coverage report with ${report.summary.event_count} events.`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildReport,
};
