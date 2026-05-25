const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const DEFAULT_BASE_URL = "http://127.0.0.1:5173";
const DEFAULT_YEAR = 2024;
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

function parseArgs(argv) {
  const args = {
    baseUrl: DEFAULT_BASE_URL,
    cities: ["belfast", "london", "nyc"],
    year: DEFAULT_YEAR,
    outDir: path.join("output", "playwright", `map-canvas-lens-screens-${DEFAULT_YEAR}`),
    viewport: { width: 1920, height: 1080 },
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base-url") args.baseUrl = String(argv[++i] || "").replace(/\/+$/, "");
    else if (arg === "--cities") args.cities = String(argv[++i] || "").split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--city") args.cities = [String(argv[++i] || "").trim()].filter(Boolean);
    else if (arg === "--year") args.year = Number(argv[++i]);
    else if (arg === "--out-dir") args.outDir = argv[++i];
    else if (arg === "--viewport") {
      const [width, height] = String(argv[++i] || "").split("x").map((value) => Number(value));
      if (!Number.isInteger(width) || !Number.isInteger(height)) throw new Error("Expected --viewport WIDTHxHEIGHT.");
      args.viewport = { width, height };
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

async function waitForContext(page, aspect) {
  await page.waitForFunction((lensAspect) => {
    const state = window.BimsAtlas?.state || {};
    const guide = state.lensGuideFeatureCache?.features || [];
    if (!guide.some((feature) => feature.properties?.lens_id === lensAspect)) return false;
    if (String(lensAspect || "").startsWith("transport-")) {
      const roadCache = state.transportRoadFeaturesByYear;
      const roadLoaded = roadCache?.has?.(state.year) || (
        state.transportRoadFeatureCountYearLoaded === state.year
        && (state.transportRoadFeatures || []).length > 0
      );
      const guideCount = guide.filter((feature) => feature.properties?.lens_id === lensAspect).length;
      return roadLoaded && guideCount >= (lensAspect === "transport-speed" ? 80 : 40);
    }
    if (["economy-vitality", "economy-gravity"].includes(lensAspect)) {
      return state.economyAnchorFeaturesPathLoaded === null || (state.economyAnchorFeatures || []).length > 0;
    }
    if (String(lensAspect || "").startsWith("utilities-")) {
      return state.utilityNetworkFeaturesPathLoaded === null || (state.utilityNetworkFeatures || []).length > 0;
    }
    if (["civic-access-gaps", "civic-catchment", "civic-demand"].includes(lensAspect)) {
      return state.civicServiceFeaturesPathLoaded === null || (state.civicServiceFeatures || []).length > 0;
    }
    return true;
  }, aspect, { timeout: 45000 }).catch(() => {});
}

async function captureAspect(args, city, category, aspect) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
  });
  try {
    const page = await browser.newPage({ viewport: args.viewport });
    const url = `${args.baseUrl}/atlas?city=${encodeURIComponent(city)}&year=${args.year}&aspect=${encodeURIComponent(aspect)}&visualCapture=${Date.now()}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(
      (expectedCity) => window.BimsAtlas?.state?.mapReady
        && window.BimsAtlas?.state?.cityId === expectedCity
        && window.BimsAtlas?.setActiveAspect,
      city,
      { timeout: 60000 },
    );
    await page.evaluate(async ({ year, category, aspect }) => {
      await window.BimsAtlas.setYear(year);
      window.BimsAtlas.setActiveLens(category);
      window.BimsAtlas.setActiveAspect(aspect);
    }, { year: args.year, category, aspect });
    await waitForContext(page, aspect);
    await page.waitForTimeout(3600);
    const screenshotDir = path.join(args.outDir, city, "screenshots");
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotDir, `${aspect}-${args.year}.png`), fullPage: false });
    return await page.evaluate(() => ({
      guide: window.BimsAtlas.state.lensGuideFeatureCache.features.length,
      pitch: window.BimsAtlas.state.map.getPitch(),
      economyAnchors: window.BimsAtlas.state.economyAnchorFeatures.length,
      utilityFeatures: window.BimsAtlas.state.utilityNetworkFeatures.length,
    }));
  } finally {
    await browser.close().catch(() => {});
  }
}

async function main() {
  const args = parseArgs(process.argv);
  fs.mkdirSync(args.outDir, { recursive: true });
  for (const city of args.cities) {
    for (const [category, aspect] of ASPECTS) {
      try {
        const summary = await captureAspect(args, city, category, aspect);
        console.log(`${city} ${aspect} ${JSON.stringify(summary)}`);
      } catch (error) {
        console.error(`CAPTURE_FAIL ${city} ${aspect}: ${error.message || error}`);
        process.exitCode = 1;
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
