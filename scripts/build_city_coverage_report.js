const fs = require("fs");
const path = require("path");

const DEFAULT_GENERATED_AT = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const DEFAULT_TARGET_EVENTS = 100000;

function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, ".."),
    atlasDir: "web/data/city-atlas",
    output: "web/data/city-atlas/coverage-report.json",
    markdownOutput: "docs/data_coverage_report.md",
    generatedAt: process.env.BIMS_DATA_GENERATED_AT || DEFAULT_GENERATED_AT,
    targetEvents: DEFAULT_TARGET_EVENTS,
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
    } else if (arg === "--output") {
      args.output = next;
      index += 1;
    } else if (arg === "--markdown-output") {
      args.markdownOutput = next;
      index += 1;
    } else if (arg === "--generated-at") {
      args.generatedAt = next;
      index += 1;
    } else if (arg === "--target-events") {
      args.targetEvents = Number(next);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!Number.isFinite(args.targetEvents) || args.targetEvents < 1) {
    throw new Error("--target-events must be a positive number");
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

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeFile(filePath, body) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.writeFileSync(tmpPath, body, "utf8");
      try {
        fs.renameSync(tmpPath, filePath);
      } catch (renameError) {
        if (!["EPERM", "EACCES", "EEXIST"].includes(renameError.code)) {
          throw renameError;
        }
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
      sleep(150 * (attempt + 1));
    }
  }
  throw lastError;
}

function writeJson(filePath, payload) {
  writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function writeText(filePath, body) {
  writeFile(filePath, body);
}

function increment(object, key, amount = 1) {
  object[key] = (object[key] || 0) + amount;
}

function sortedObject(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
}

function sortedNumericStrings(values) {
  return [...values].map(Number).filter(Number.isFinite).sort((a, b) => a - b).map(String);
}

function sourceTitle(source) {
  return source?.title || source?.source_id || "Unknown source";
}

function layerForEvent(event) {
  return String(event.category || event.lens || "uncategorised");
}

function compactSource(source, eventCount, yearSet, layerCounts, confidenceCounts) {
  const years = sortedNumericStrings(yearSet);
  return {
    source_id: source.source_id,
    title: sourceTitle(source),
    provider: source.provider || "Unknown provider",
    reliability: source.reliability || "unknown",
    licence: source.licence || "Unknown licence",
    event_count: eventCount,
    years: years.map(Number),
    first_year: years.length ? Number(years[0]) : null,
    last_year: years.length ? Number(years[years.length - 1]) : null,
    layer_counts: sortedObject(layerCounts),
    confidence_counts: sortedObject(confidenceCounts),
    coverage_status: eventCount > 0 ? "events_emitted" : "source_catalog_only",
  };
}

function buildCityCoverage(root, atlasRoot, citySummary, targetEvents) {
  const cityDir = path.join(atlasRoot, "cities", citySummary.city_id);
  const cityPath = path.join(cityDir, "city.json");
  const sourcesPath = path.join(cityDir, "sources.json");
  const eventsPath = path.join(cityDir, "events.json");
  const city = readJson(cityPath);
  const sourcesPayload = readJson(sourcesPath);
  const eventsIndex = readJson(eventsPath);
  const sources = sourcesPayload.sources || [];
  const sourceById = new Map(sources.map((source) => [source.source_id, source]));

  const allEvents = [];
  for (const chunk of eventsIndex.chunks || []) {
    const chunkPath = resolve(root, chunk.json_path);
    const payload = readJson(chunkPath);
    for (const event of payload.events || []) {
      allEvents.push(event);
    }
  }

  const seenEventIds = new Set();
  const duplicateEventIds = new Set();
  const sourceStats = new Map();
  const cityYearCounts = {};
  const cityLayerCounts = {};
  const cityConfidenceCounts = {};
  const sourceYearLayerCounts = new Map();
  const yearLayerCounts = new Map();

  for (const source of sources) {
    sourceStats.set(source.source_id, {
      source,
      eventCount: 0,
      years: new Set(),
      layerCounts: {},
      confidenceCounts: {},
    });
  }

  for (const event of allEvents) {
    const eventId = String(event.event_id || "");
    if (seenEventIds.has(eventId)) duplicateEventIds.add(eventId);
    seenEventIds.add(eventId);

    const year = Number(event.year);
    const layer = layerForEvent(event);
    const confidence = String(event.confidence || "unknown");
    increment(cityYearCounts, String(year));
    increment(cityLayerCounts, layer);
    increment(cityConfidenceCounts, confidence);

    const yearLayerKey = `${year}\u0000${layer}`;
    yearLayerCounts.set(yearLayerKey, (yearLayerCounts.get(yearLayerKey) || 0) + 1);

    for (const sourceId of event.source_ids || []) {
      const source = sourceById.get(sourceId) || { source_id: sourceId, title: sourceId };
      if (!sourceStats.has(sourceId)) {
        sourceStats.set(sourceId, {
          source,
          eventCount: 0,
          years: new Set(),
          layerCounts: {},
          confidenceCounts: {},
        });
      }
      const stat = sourceStats.get(sourceId);
      stat.eventCount += 1;
      stat.years.add(year);
      increment(stat.layerCounts, layer);
      increment(stat.confidenceCounts, confidence);

      const key = `${sourceId}\u0000${year}\u0000${layer}`;
      sourceYearLayerCounts.set(key, (sourceYearLayerCounts.get(key) || 0) + 1);
    }
  }

  const sourceRows = [...sourceStats.values()]
    .map((stat) => compactSource(stat.source, stat.eventCount, stat.years, stat.layerCounts, stat.confidenceCounts))
    .sort((a, b) => b.event_count - a.event_count || a.source_id.localeCompare(b.source_id));

  const sourceYearLayerRows = [...sourceYearLayerCounts.entries()]
    .map(([key, eventCount]) => {
      const [sourceId, year, layer] = key.split("\u0000");
      const source = sourceById.get(sourceId);
      return {
        city_id: citySummary.city_id,
        source_id: sourceId,
        source_title: sourceTitle(source),
        year: Number(year),
        layer,
        event_count: eventCount,
      };
    })
    .sort((a, b) =>
      a.source_id.localeCompare(b.source_id)
      || a.year - b.year
      || a.layer.localeCompare(b.layer)
    );

  const yearLayerRows = [...yearLayerCounts.entries()]
    .map(([key, eventCount]) => {
      const [year, layer] = key.split("\u0000");
      return { year: Number(year), layer, event_count: eventCount };
    })
    .sort((a, b) => a.year - b.year || a.layer.localeCompare(b.layer));

  const eventYears = Object.keys(cityYearCounts).map(Number).sort((a, b) => a - b);
  const configuredYears = new Set();
  for (const family of city.source_families || []) {
    for (const year of family.years || []) configuredYears.add(Number(year));
  }
  const yearsWithoutEvents = [...configuredYears]
    .filter((year) => Number.isFinite(year) && !cityYearCounts[String(year)])
    .sort((a, b) => a - b);

  const sourcesWithoutEvents = sourceRows
    .filter((source) => source.event_count === 0)
    .map((source) => ({
      source_id: source.source_id,
      title: source.title,
      provider: source.provider,
      reliability: source.reliability,
    }));

  return {
    city_id: citySummary.city_id,
    display_name: city.display_name || citySummary.display_name,
    event_count: allEvents.length,
    unique_event_count: seenEventIds.size,
    duplicate_event_id_count: duplicateEventIds.size,
    duplicate_event_ids: [...duplicateEventIds].sort(),
    source_count: sources.length,
    active_source_count: sourceRows.filter((source) => source.event_count > 0).length,
    source_catalog_only_count: sourcesWithoutEvents.length,
    target_coverage_gap: {
      target_events: targetEvents,
      backed_event_count: allEvents.length,
      gap_events: Math.max(0, targetEvents - allEvents.length),
      note: "This is only a transparent large-count benchmark. Gaps are not filled with synthetic or unsupported records.",
    },
    year_range: {
      first_event_year: eventYears.length ? eventYears[0] : null,
      last_event_year: eventYears.length ? eventYears[eventYears.length - 1] : null,
    },
    event_counts_by_year: sortedObject(cityYearCounts),
    event_counts_by_layer: sortedObject(cityLayerCounts),
    event_counts_by_confidence: sortedObject(cityConfidenceCounts),
    event_counts_by_year_layer: yearLayerRows,
    source_year_layer_rows: sourceYearLayerRows,
    sources: sourceRows,
    gaps: {
      configured_years_without_events: yearsWithoutEvents,
      sources_without_events: sourcesWithoutEvents,
      notes: [
        "Source catalog entries with zero emitted events are discovered or configured sources whose row-level adapter is not implemented yet.",
        "Years without events reflect current emitted artifacts, not proof that no city changes occurred.",
      ],
    },
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# City Atlas Coverage Report");
  lines.push("");
  lines.push(`Generated: ${report.generated_at}`);
  lines.push("");
  lines.push("This report counts source-backed records emitted into `web/data/city-atlas`. It is not a claim of complete city coverage, and gaps are not padded with synthetic records.");
  lines.push("");
  lines.push("| City | Events | Active sources | Catalog-only sources | Event years | Top layers | Gap to 100k |");
  lines.push("| --- | ---: | ---: | ---: | --- | --- | ---: |");
  for (const city of report.cities) {
    const topLayers = Object.entries(city.event_counts_by_layer)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 3)
      .map(([layer, count]) => `${layer} ${count}`)
      .join(", ");
    const years = city.year_range.first_event_year === null
      ? "none"
      : `${city.year_range.first_event_year}-${city.year_range.last_event_year}`;
    lines.push(`| ${city.display_name} | ${city.event_count} | ${city.active_source_count} | ${city.source_catalog_only_count} | ${years} | ${topLayers || "none"} | ${city.target_coverage_gap.gap_events} |`);
  }
  lines.push("");

  for (const city of report.cities) {
    lines.push(`## ${city.display_name}`);
    lines.push("");
    lines.push(`Backed events: ${city.event_count}. Unique event IDs: ${city.unique_event_count}. Duplicate IDs: ${city.duplicate_event_id_count}.`);
    lines.push("");
    lines.push("| Source | Events | Years | Layers | Reliability |");
    lines.push("| --- | ---: | --- | --- | --- |");
    for (const source of city.sources.filter((item) => item.event_count > 0).slice(0, 12)) {
      const years = source.first_year === null ? "none" : `${source.first_year}-${source.last_year}`;
      const layers = Object.entries(source.layer_counts)
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 3)
        .map(([layer, count]) => `${layer} ${count}`)
        .join(", ");
      lines.push(`| ${escapeMarkdown(source.title)} | ${source.event_count} | ${years} | ${escapeMarkdown(layers || "none")} | ${escapeMarkdown(source.reliability)} |`);
    }
    lines.push("");
    if (city.gaps.sources_without_events.length) {
      lines.push(`Catalog-only sources without emitted event rows: ${city.gaps.sources_without_events.length}.`);
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

function escapeMarkdown(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function buildCoverageReport(args) {
  const atlasRoot = resolve(args.root, args.atlasDir);
  const indexPath = path.join(atlasRoot, "index.json");
  const index = readJson(indexPath);
  const cities = (index.cities || []).map((citySummary) =>
    buildCityCoverage(args.root, atlasRoot, citySummary, args.targetEvents)
  );
  const coverageRows = cities.flatMap((city) => city.source_year_layer_rows);
  const report = {
    schema_version: "1.0.0",
    artifact_kind: "city_atlas_coverage_report",
    generated_at: args.generatedAt,
    atlas_index_path: relativeFromRoot(args.root, indexPath),
    summary: {
      city_count: cities.length,
      total_events: cities.reduce((total, city) => total + city.event_count, 0),
      total_unique_events: cities.reduce((total, city) => total + city.unique_event_count, 0),
      duplicate_event_id_count: cities.reduce((total, city) => total + city.duplicate_event_id_count, 0),
      active_source_count: cities.reduce((total, city) => total + city.active_source_count, 0),
      source_catalog_only_count: cities.reduce((total, city) => total + city.source_catalog_only_count, 0),
      source_year_layer_row_count: coverageRows.length,
      notes: [
        "Counts are emitted source-backed atlas events, not complete civic coverage.",
        "A row in coverage_rows is keyed by city_id, source_id, year, and layer.",
        "No unsupported causal, predictive, or synthetic coverage claims are added by this report.",
      ],
    },
    coverage_rows: coverageRows,
    cities,
  };

  writeJson(resolve(args.root, args.output), report);
  writeText(resolve(args.root, args.markdownOutput), renderMarkdown(report));

  const coverageByCity = new Map(cities.map((city) => [city.city_id, city]));
  const nextIndex = {
    ...index,
    cities: (index.cities || []).map((citySummary) => {
      const coverage = coverageByCity.get(citySummary.city_id);
      if (!coverage) return citySummary;
      return {
        ...citySummary,
        event_count: coverage.event_count,
        source_count: coverage.source_count,
      };
    }),
    coverage_report_path: toPosix(args.output),
    coverage_report_generated_at: args.generatedAt,
    coverage_summary: report.summary,
  };
  writeJson(indexPath, nextIndex);

  return report;
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const report = buildCoverageReport(args);
    console.log(
      `Coverage report ready: ${report.summary.total_events} events, ${report.summary.active_source_count} active sources, ${report.summary.source_year_layer_row_count} city/source/year/layer rows.`,
    );
  } catch (error) {
    console.error(`build:coverage failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildCoverageReport,
  parseArgs,
};
