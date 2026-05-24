const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const DEFAULT_CITIES = ["london", "nyc"];
const DEFAULT_START_YEAR = 2007;
const DEFAULT_END_YEAR = 2026;
const DEFAULT_BASE_URL = "http://127.0.0.1:5173";

const ASPECTS = [
  ["transport", "transport-speed"],
  ["transport", "transport-access"],
  ["transport", "transport-reliability"],
  ["built_environment", "planning-pressure"],
  ["built_environment", "planning-delta"],
  ["built_environment", "planning-parcels"],
  ["civic_services", "civic-access-gaps"],
  ["civic_services", "civic-catchment"],
  ["civic_services", "civic-demand"],
  ["economy", "economy-vitality"],
  ["economy", "economy-land-use"],
  ["economy", "economy-gravity"],
  ["utilities", "utilities-capacity"],
  ["utilities", "utilities-resilience"],
  ["utilities", "utilities-works"],
];

const RENDERED_LAYERS = [
  "lens-guide-cell-fill",
  "lens-guide-cell-line",
  "lens-guide-ring-line",
  "lens-guide-area-line",
  "lens-guide-coverage-flow",
  "lens-guide-flow",
  "lens-guide-flow-case",
  "lens-guide-node",
  "lens-guide-icon-node",
  "lens-transport-base",
  "lens-transport-base-case",
  "lens-transport-roads",
  "lens-transport-roads-case",
  "lens-transport-event-points",
  "lens-planning-cells-fill",
  "lens-planning-cells-outline",
  "lens-civic-coverage-fill",
  "lens-civic-coverage-outline",
  "lens-civic-facility-icons",
  "lens-economy-cells-fill",
  "lens-economy-cells-outline",
  "lens-economy-frontage",
  "lens-economy-frontage-case",
  "lens-utilities-trace",
  "lens-utilities-trace-case",
  "lens-utility-asset-icons",
  "lens-utility-network",
  "lens-utility-network-assets",
];

function parseArgs(argv) {
  const args = {
    cities: DEFAULT_CITIES,
    startYear: DEFAULT_START_YEAR,
    endYear: DEFAULT_END_YEAR,
    baseUrl: DEFAULT_BASE_URL,
    outDir: "",
    screenshots: false,
    viewport: { width: 1440, height: 950 },
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--cities") args.cities = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (arg === "--city") args.cities = [argv[++i]];
    else if (arg === "--start") args.startYear = Number(argv[++i]);
    else if (arg === "--end") args.endYear = Number(argv[++i]);
    else if (arg === "--base-url") args.baseUrl = argv[++i].replace(/\/+$/, "");
    else if (arg === "--out-dir") args.outDir = argv[++i];
    else if (arg === "--screenshots") args.screenshots = true;
    else if (arg === "--viewport") {
      const [width, height] = String(argv[++i] || "").split("x").map((value) => Number(value));
      if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 240) {
        throw new Error("Invalid viewport. Expected WIDTHxHEIGHT, for example 1920x1080.");
      }
      args.viewport = { width, height };
    }
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.cities.length) throw new Error("At least one city is required.");
  if (!Number.isInteger(args.startYear) || !Number.isInteger(args.endYear) || args.endYear < args.startYear) {
    throw new Error("Invalid year range.");
  }
  if (!args.outDir) {
    args.outDir = path.join(
      "output",
      "playwright",
      `audit-city-lenses-${args.startYear}-${args.endYear}-${new Date().toISOString().replace(/[:.]/g, "-")}`
    );
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function artifactCoverage(city, startYear, endYear) {
  const dir = path.join("web", "data", "city-atlas", "cities", city);
  const eventsIndexPath = path.join(dir, "events.json");
  const cityPath = path.join(dir, "city.json");
  const coverage = {
    city,
    cityPath,
    eventsIndexPath,
    hasCity: fileExists(cityPath),
    hasEventsIndex: fileExists(eventsIndexPath),
    missingEventChunks: [],
    missingEventJson: [],
    missingEventGeojson: [],
    missingLensDetail: [],
    missingTransportRoads: [],
    missingCurrentTransportStops: [],
    eventCountsByYear: {},
    categoryCountsByYear: {},
    totalEventsInRange: 0,
  };
  if (!fileExists(path.join(dir, "transport_stops_2026.geojson"))) {
    coverage.missingCurrentTransportStops.push(path.join(dir, "transport_stops_2026.geojson"));
  }
  if (!coverage.hasEventsIndex) return coverage;
  const eventsIndex = readJson(eventsIndexPath);
  const chunkByYear = new Map((eventsIndex.chunks || []).map((chunk) => [Number(chunk.year), chunk]));
  for (let year = startYear; year <= endYear; year += 1) {
    const chunk = chunkByYear.get(year);
    if (!chunk) coverage.missingEventChunks.push(year);
    const eventCount = Number(chunk?.event_count || 0);
    coverage.eventCountsByYear[year] = eventCount;
    coverage.categoryCountsByYear[year] = chunk?.counts_by_category || {};
    coverage.totalEventsInRange += eventCount;
    if (!fileExists(path.join(dir, `events_${year}.json`))) coverage.missingEventJson.push(year);
    if (!fileExists(path.join(dir, `events_${year}.geojson`))) coverage.missingEventGeojson.push(year);
    if (!fileExists(path.join(dir, `lens_detail_${year}.geojson`))) coverage.missingLensDetail.push(year);
    if (!fileExists(path.join(dir, `transport_roads_${year}.geojson`))) coverage.missingTransportRoads.push(year);
  }
  return coverage;
}

function actionableConsoleMessage(message) {
  return !/WebGL.*GPU stall|ReadPixels|favicon|ERR_CACHE_WRITE_FAILURE|Failed to load resource: the server responded with a status of 404/i.test(message.text);
}

function summaryFromResults(city, years, pageErrors, consoleMessages, httpFailures, results, artifactSummary) {
  const missingLensEvidence = results
    .filter((row) => row.lensEvidenceCount === 0)
    .map((row) => `${row.year}:${row.aspect}`);
  const missingSameCategory = results
    .filter((row) => row.sameCategoryCount === 0)
    .map((row) => `${row.year}:${row.category}/${row.aspect}`);
  const warningMismatchRows = results
    .filter((row) => !row.warningOk)
    .map((row) => ({
      year: row.year,
      aspect: row.aspect,
      expectedWarning: row.expectedWarning,
      coverageNote: row.coverageNote,
    }));
  return {
    city,
    checked: results.length,
    years,
    pageErrors: pageErrors.length,
    actionableConsoleMessages: consoleMessages.length,
    httpFailures: httpFailures.length,
    guideGenerated: results.filter((row) => row.guideCount > 0).length,
    sameCategoryPresent: results.filter((row) => row.sameCategoryCount > 0).length,
    lensEvidencePresent: results.filter((row) => row.lensEvidenceCount > 0).length,
    renderedSignalPresent: results.filter((row) => row.renderedSignal).length,
    meaningfulSignalPresent: results.filter((row) => row.meaningfulSignal).length,
    warningMismatches: warningMismatchRows.length,
    expectedWarnings: results.filter((row) => row.expectedWarning).length,
    unexpectedWarnings: results.filter((row) => !row.expectedWarning && /No source-backed/i.test(row.coverageNote)).length,
    noRenderedSignal: results.filter((row) => !row.renderedSignal).map((row) => `${row.year}:${row.aspect}`),
    noMeaningfulSignal: results.filter((row) => !row.meaningfulSignal).map((row) => `${row.year}:${row.aspect}`),
    noGuide: results.filter((row) => !row.guideCount).map((row) => `${row.year}:${row.aspect}`),
    retryCount: results.filter((row) => row.renderRetry).length,
    missingLensEvidence,
    missingSameCategory,
    artifactGaps: {
      missingEventChunks: artifactSummary.missingEventChunks,
      missingEventJson: artifactSummary.missingEventJson,
      missingEventGeojson: artifactSummary.missingEventGeojson,
      missingLensDetail: artifactSummary.missingLensDetail,
      missingTransportRoads: artifactSummary.missingTransportRoads,
      missingCurrentTransportStops: artifactSummary.missingCurrentTransportStops,
    },
    warningMismatchRows,
    pageErrorsSample: pageErrors.slice(0, 10),
    consoleMessagesSample: consoleMessages.slice(0, 10),
    httpFailuresSample: httpFailures.slice(0, 20),
  };
}

async function collect(page) {
  return page.evaluate(({ renderedLayers }) => {
    const state = window.BimsAtlas.state;
    const year = state.year;
    const cityId = state.cityId;
    const category = state.activeLens;
    const aspect = state.activeAspect;
    const loaded = state.loadedEvents.get(year) || [];
    const sameCategoryCount = loaded.filter((event) => event.category === category).length;
    const landUseSpecificEvent = (event) => {
      if (!event) return false;
      const text = [
        event.id,
        event.title,
        event.shortDescription,
        event.summary,
        event.area,
        event.sourceDateField,
        ...(event.affectedSignals || []),
      ].filter(Boolean).join(" ").toLowerCase();
      if (/\b(planning[-\s]?statistics|statistics[-\s]?dataset|dataset[-\s]?csv|house[-\s]?price|hpi|citywide|aggregate|borough)\b/.test(text)) {
        return false;
      }
      return /\b(retail|shop|market|office|business|hospitality|hotel|restaurant|cafe|bar|pub|visitor|tourism|culture|vacan|derelict|commercial|employment|workspace|industrial|warehouse|residential|student)\b/.test(text);
    };
    const lensEvidenceCount = aspect === "economy-land-use"
      ? loaded.filter((event) => event.category === category && landUseSpecificEvent(event)).length
      : sameCategoryCount;
    const guide = (state.lensGuideFeatureCache?.features || []).filter((feature) => feature.properties?.lens_id === aspect);
    const sourceKinds = {};
    const evidenceRoles = {};
    const guideKinds = {};
    const surfaceStyles = {};
    const flowStyles = {};
    const nodeStyles = {};
    let eventLinkedGuideCount = 0;
    let contextOnlyGuideCount = 0;
    for (const feature of guide) {
      const props = feature.properties || {};
      guideKinds[props.kind || ""] = (guideKinds[props.kind || ""] || 0) + 1;
      if (props.surface_style) surfaceStyles[props.surface_style] = (surfaceStyles[props.surface_style] || 0) + 1;
      if (props.flow_style) flowStyles[props.flow_style] = (flowStyles[props.flow_style] || 0) + 1;
      if (props.node_style) nodeStyles[props.node_style] = (nodeStyles[props.node_style] || 0) + 1;
      if (props.source_kind) sourceKinds[props.source_kind] = (sourceKinds[props.source_kind] || 0) + 1;
      if (props.evidence_role) evidenceRoles[props.evidence_role] = (evidenceRoles[props.evidence_role] || 0) + 1;
      if (props.event_id) eventLinkedGuideCount += 1;
      if (
        props.evidence_role === "context_not_year_specific_change_evidence"
        || /current_context/i.test(String(props.source_kind || ""))
      ) {
        contextOnlyGuideCount += 1;
      }
    }
    const renderedByLayer = {};
    for (const layer of renderedLayers) {
      try {
        if (!state.map.getLayer(layer)) continue;
        const count = state.map.queryRenderedFeatures({ layers: [layer] }).length;
        if (count) renderedByLayer[layer] = count;
      } catch (error) {
        renderedByLayer[layer] = `error:${error.message}`;
      }
    }
    const coverageNote = (
      document.querySelector("#coverageNote")?.textContent
      || document.querySelector("[data-role='coverage-note']")?.textContent
      || document.querySelector(".coverage-note")?.textContent
      || ""
    ).trim();
    const lensLegendText = (document.querySelector("#lensLegend")?.textContent || "").replace(/\s+/g, " ").trim();
    const renderedSignal = Object.values(renderedByLayer).some((value) => Number(value) > 0);
    const count = (layer) => Number(renderedByLayer[layer] || 0);
    const anyLayer = (layers, minimum = 1) => layers.some((layer) => count(layer) >= minimum);
    const hasGuideKind = (kind, minimum = 1) => Number(guideKinds[kind] || 0) >= minimum;
    const hasSurface = (style, minimum = 1) => Number(surfaceStyles[style] || 0) >= minimum;
    const hasFlow = (style, minimum = 1) => Number(flowStyles[style] || 0) >= minimum;
    const meaningfulChecks = {
      "transport-speed": () => (hasFlow("transport_thread", 4) || hasFlow("transport_backbone", 1)) && count("lens-guide-flow") >= 4,
      "transport-access": () => hasSurface("access_fabric", 4) && anyLayer(["lens-guide-cell-fill", "lens-guide-flow", "lens-guide-node", "lens-transport-roads"], 4),
      "transport-reliability": () => anyLayer(["lens-transport-roads", "lens-guide-flow", "lens-guide-node", "lens-transport-event-points"]),
      "planning-pressure": () => (hasSurface("planning_footprint", 4) && count("lens-guide-cell-fill") >= 4) || (hasFlow("planning_pressure_trace", 1) && count("lens-guide-flow") >= 4) || count("lens-planning-cells-fill") >= 4,
      "planning-delta": () => (hasSurface("planning_footprint", 4) && count("lens-guide-cell-fill") >= 4) || count("lens-planning-cells-fill") >= 3,
      "planning-parcels": () => (hasSurface("planning_footprint", 2) && count("lens-guide-cell-fill") >= 2) || count("lens-planning-cells-fill") >= 3,
      "civic-access-gaps": () => anyLayer(["lens-guide-coverage-flow", "lens-guide-flow", "lens-guide-node", "lens-guide-icon-node", "lens-civic-coverage-fill", "lens-civic-facility-icons"], 3),
      "civic-catchment": () => (hasSurface("catchment_area", 2) || hasSurface("catchment_backdrop", 2) || hasSurface("catchment_patch", 2)) && anyLayer(["lens-guide-cell-fill", "lens-guide-node", "lens-guide-icon-node"], 2),
      "civic-demand": () => hasSurface("demand_surface", 4) && anyLayer(["lens-guide-cell-fill", "lens-guide-flow", "lens-guide-node", "lens-guide-icon-node"], 4),
      "economy-vitality": () => anyLayer(["lens-economy-cells-fill", "lens-economy-frontage", "lens-guide-flow", "lens-guide-node"], 3),
      "economy-land-use": () => {
        if (!hasSurface("land_use_tile", 12) || count("lens-guide-cell-fill") < 12) return false;
        return lensEvidenceCount > 0 ? eventLinkedGuideCount > 0 : contextOnlyGuideCount > 0;
      },
      "economy-gravity": () => (hasFlow("economy_gravity_arc", 1) || hasGuideKind("flow", 1)) && anyLayer(["lens-guide-flow", "lens-guide-node", "lens-guide-icon-node"], 1),
      "utilities-capacity": () => anyLayer(["lens-utilities-trace", "lens-utility-asset-icons", "lens-utility-network", "lens-utility-network-assets", "lens-guide-flow", "lens-guide-node", "lens-guide-icon-node"], 1),
      "utilities-resilience": () => (hasSurface("utility_outage_area", 1) && count("lens-guide-cell-fill") >= 1) || anyLayer(["lens-utilities-trace", "lens-utility-network", "lens-guide-node", "lens-guide-icon-node"], 1),
      "utilities-works": () => anyLayer(["lens-guide-works-symbol", "lens-guide-works-type-symbol", "lens-guide-flow", "lens-utilities-trace", "lens-utility-asset-icons"], 1),
    };
    const meaningfulSignal = Boolean((meaningfulChecks[aspect] || (() => renderedSignal))());
    return {
      cityId,
      year,
      category,
      aspect,
      sameCategoryCount,
      lensEvidenceCount,
      guideCount: guide.length,
      guideKinds,
      surfaceStyles,
      flowStyles,
      nodeStyles,
      sourceKinds,
      evidenceRoles,
      eventLinkedGuideCount,
      contextOnlyGuideCount,
      renderedByLayer,
      renderedSignal,
      meaningfulSignal,
      coverageNote,
      lensLegendText,
    };
  }, { renderedLayers: RENDERED_LAYERS });
}

async function auditCity(browser, args, city) {
  const years = Array.from({ length: args.endYear - args.startYear + 1 }, (_, index) => args.startYear + index);
  const artifactSummary = artifactCoverage(city, args.startYear, args.endYear);
  const pageErrors = [];
  const consoleMessages = [];
  const httpFailures = [];
  const page = await browser.newPage({ viewport: args.viewport });
  page.on("pageerror", (error) => pageErrors.push(String(error.message || error)));
  page.on("console", (msg) => {
    const message = {
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    };
    if (msg.type() === "error" && actionableConsoleMessage(message)) consoleMessages.push(message);
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      const url = response.url();
      if (!/favicon/i.test(url)) httpFailures.push({ status, url });
    }
  });
  await page.goto(`${args.baseUrl}/atlas?city=${encodeURIComponent(city)}&auditCity=${Date.now()}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    (expectedCity) => window.BimsAtlas?.state?.mapReady
      && window.BimsAtlas?.state?.cityId === expectedCity
      && window.BimsAtlas?.setYear
      && window.BimsAtlas?.setActiveLens
      && window.BimsAtlas?.setActiveAspect,
    city,
    { timeout: 60000 }
  );
  const results = [];
  for (const year of years) {
    for (const [category, aspect] of ASPECTS) {
      await page.evaluate(async ({ year, category, aspect }) => {
        await window.BimsAtlas.setYear(year);
        window.BimsAtlas.setActiveLens(category);
        window.BimsAtlas.setActiveAspect(aspect);
      }, { year, category, aspect });
      await page.waitForFunction(
        ({ year, category, aspect }) => window.BimsAtlas.state.year === year
          && window.BimsAtlas.state.activeLens === category
          && window.BimsAtlas.state.activeAspect === aspect,
        { year, category, aspect },
        { timeout: 15000 }
      );
      await page.waitForFunction(({ aspect }) => {
        const features = window.BimsAtlas.state.lensGuideFeatureCache?.features || [];
        return features.some((feature) => feature.properties?.lens_id === aspect);
      }, { aspect }, { timeout: 15000 }).catch(() => {});
      await page.waitForFunction(({ aspect }) => {
        const state = window.BimsAtlas?.state || {};
        if (["economy-vitality", "economy-gravity"].includes(aspect)) {
          return state.economyAnchorFeaturesPathLoaded === null || (state.economyAnchorFeatures || []).length > 0;
        }
        if (String(aspect || "").startsWith("utilities-")) {
          return state.utilityNetworkFeaturesPathLoaded === null || (state.utilityNetworkFeatures || []).length > 0;
        }
        if (["civic-access-gaps", "civic-catchment", "civic-demand"].includes(aspect)) {
          return state.civicServiceFeaturesPathLoaded === null || (state.civicServiceFeatures || []).length > 0;
        }
        return true;
      }, { aspect }, { timeout: 12000 }).catch(() => {});
      let result = null;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        await page.waitForTimeout(attempt ? 900 : 350);
        result = await collect(page);
        const expectedMissingData = result.category !== "transport" && result.lensEvidenceCount === 0;
        const hasMissingDataWarning = /No source-backed/i.test(`${result.coverageNote} ${result.lensLegendText}`);
        if (result.meaningfulSignal || (result.renderedSignal && expectedMissingData && hasMissingDataWarning)) {
          result.renderRetry = attempt > 0;
          result.renderAttempts = attempt + 1;
          break;
        }
        result.renderRetry = true;
        result.renderAttempts = attempt + 1;
      }
      const expectedWarning = result.category !== "transport" && result.lensEvidenceCount === 0;
      const hasWarning = /No source-backed/i.test(`${result.coverageNote} ${result.lensLegendText}`);
      result.expectedWarning = expectedWarning;
      result.warningOk = expectedWarning ? hasWarning : !hasWarning;
      results.push(result);
    }
  }
  if (args.screenshots) {
    const screenshotDir = path.join(args.outDir, city, "screenshots");
    fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotYear = years.includes(2024) ? 2024 : years[years.length - 1];
    for (const [category, aspect] of ASPECTS) {
      await page.evaluate(async ({ year, category, aspect }) => {
        await window.BimsAtlas.setYear(year);
        window.BimsAtlas.setActiveLens(category);
        window.BimsAtlas.setActiveAspect(aspect);
      }, { year: screenshotYear, category, aspect });
      await page.waitForFunction(
        ({ year, category, aspect }) => window.BimsAtlas.state.year === year
          && window.BimsAtlas.state.activeLens === category
          && window.BimsAtlas.state.activeAspect === aspect,
        { year: screenshotYear, category, aspect },
        { timeout: 15000 }
      );
      await page.waitForFunction(({ aspect }) => {
        const state = window.BimsAtlas?.state || {};
        if (["economy-vitality", "economy-gravity"].includes(aspect)) {
          return state.economyAnchorFeaturesPathLoaded === null || (state.economyAnchorFeatures || []).length > 0;
        }
        if (String(aspect || "").startsWith("utilities-")) {
          return state.utilityNetworkFeaturesPathLoaded === null || (state.utilityNetworkFeatures || []).length > 0;
        }
        if (["civic-access-gaps", "civic-catchment", "civic-demand"].includes(aspect)) {
          return state.civicServiceFeaturesPathLoaded === null || (state.civicServiceFeatures || []).length > 0;
        }
        return true;
      }, { aspect }, { timeout: 12000 }).catch(() => {});
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(screenshotDir, `${aspect}-${screenshotYear}.png`), fullPage: false });
    }
  }
  await page.close();
  const summary = summaryFromResults(city, years, pageErrors, consoleMessages, httpFailures, results, artifactSummary);
  return { city, summary, artifactSummary, results };
}

async function main() {
  const args = parseArgs(process.argv);
  fs.mkdirSync(args.outDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
  });
  const cityReports = [];
  try {
    for (const city of args.cities) {
      console.log(`Auditing ${city} ${args.startYear}-${args.endYear}...`);
      const report = await auditCity(browser, args, city);
      cityReports.push(report);
      const cityDir = path.join(args.outDir, city);
      fs.mkdirSync(cityDir, { recursive: true });
      fs.writeFileSync(path.join(cityDir, `browser-audit-${city}-${args.startYear}-${args.endYear}.json`), JSON.stringify(report, null, 2));
      console.log(JSON.stringify(report.summary, null, 2));
    }
  } finally {
    await browser.close();
  }
  const totals = cityReports.reduce((acc, report) => {
    for (const key of [
      "checked",
      "pageErrors",
      "actionableConsoleMessages",
      "httpFailures",
      "guideGenerated",
      "sameCategoryPresent",
      "lensEvidencePresent",
      "renderedSignalPresent",
      "meaningfulSignalPresent",
      "warningMismatches",
      "expectedWarnings",
      "unexpectedWarnings",
      "retryCount",
    ]) {
      acc[key] = (acc[key] || 0) + Number(report.summary[key] || 0);
    }
    acc.noRenderedSignal.push(...report.summary.noRenderedSignal.map((row) => `${report.city}:${row}`));
    acc.noMeaningfulSignal.push(...report.summary.noMeaningfulSignal.map((row) => `${report.city}:${row}`));
    acc.noGuide.push(...report.summary.noGuide.map((row) => `${report.city}:${row}`));
    acc.missingLensEvidence.push(...report.summary.missingLensEvidence.map((row) => `${report.city}:${row}`));
    acc.missingSameCategory.push(...report.summary.missingSameCategory.map((row) => `${report.city}:${row}`));
    return acc;
  }, {
    noRenderedSignal: [],
    noMeaningfulSignal: [],
    noGuide: [],
    missingLensEvidence: [],
    missingSameCategory: [],
  });
  const combined = {
    generatedAt: new Date().toISOString(),
    args,
    summaries: cityReports.map((report) => report.summary),
    artifactSummaries: cityReports.map((report) => report.artifactSummary),
    totals,
  };
  fs.writeFileSync(path.join(args.outDir, "combined-summary.json"), JSON.stringify(combined, null, 2));
  console.log(JSON.stringify({ outDir: path.resolve(args.outDir), totals }, null, 2));
  if (
    totals.pageErrors
    || totals.actionableConsoleMessages
    || totals.warningMismatches
    || totals.noRenderedSignal.length
    || totals.noGuide.length
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
