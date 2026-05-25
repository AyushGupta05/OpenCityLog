const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "tmp", "benchmarks");
const baseUrl = (process.env.URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const cities = (process.env.CITIES || "belfast,london,nyc")
  .split(",")
  .map((city) => city.trim())
  .filter(Boolean);
const year = Number(process.env.YEAR || 2024);
const timeoutMs = Number(process.env.ATLAS_BENCH_TIMEOUT_MS || 60000);

function resourceSummary(entries) {
  const local = entries.filter((entry) => {
    try {
      const url = new URL(entry.name);
      return url.origin === baseUrl && url.pathname.startsWith("/data/");
    } catch (_error) {
      return false;
    }
  });
  const decodedBytes = local.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0);
  const transferBytes = local.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
  const largest = local
    .map((entry) => {
      const url = new URL(entry.name);
      return {
        path: url.pathname,
        decodedMB: Number(((entry.decodedBodySize || 0) / 1024 / 1024).toFixed(1)),
        transferMB: Number(((entry.transferSize || 0) / 1024 / 1024).toFixed(1)),
        durationMs: Number((entry.duration || 0).toFixed(1)),
      };
    })
    .sort((a, b) => b.decodedMB - a.decodedMB)
    .slice(0, 12);
  return {
    resourceCount: entries.length,
    dataResourceCount: local.length,
    decodedDataMB: Number((decodedBytes / 1024 / 1024).toFixed(1)),
    transferDataMB: Number((transferBytes / 1024 / 1024).toFixed(1)),
    largest,
  };
}

async function waitForAtlasReady(page) {
  await page.waitForFunction(
    () => {
      const atlas = window.BimsAtlas;
      const state = atlas?.state;
      return Boolean(
        state?.map
          && state?.lensOverlayLoaded
          && document.querySelectorAll("#eventList .event-row").length > 0
          && document.querySelector("#appStatus")?.textContent.trim() === ""
      );
    },
    null,
    { timeout: timeoutMs }
  );
}

async function interactionTiming(page, label, action, done, args = {}) {
  return page.evaluate(
    async ({ label, actionSource, doneSource, args }) => {
      const actionFn = new Function(`return (${actionSource});`)();
      const doneFn = new Function(`return (${doneSource});`)();
      const start = performance.now();
      await actionFn(args);
      const deadline = performance.now() + 30000;
      while (!doneFn(args)) {
        if (performance.now() > deadline) throw new Error(`${label} did not settle`);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return Number((performance.now() - start).toFixed(1));
    },
    {
      label,
      actionSource: action.toString(),
      doneSource: done.toString(),
      args,
    }
  );
}

async function pageSummary(page) {
  return page.evaluate(() => {
    const heap = performance.memory || {};
    return {
      eventRows: document.querySelectorAll("#eventList .event-row").length,
      eventListCount: document.querySelector("#eventListCount")?.textContent.trim() || "",
      pins: document.querySelectorAll(".pin").length,
      domNodes: document.querySelectorAll("*").length,
      jsHeapUsedMB: heap.usedJSHeapSize ? Number((heap.usedJSHeapSize / 1024 / 1024).toFixed(1)) : 0,
      jsHeapTotalMB: heap.totalJSHeapSize ? Number((heap.totalJSHeapSize / 1024 / 1024).toFixed(1)) : 0,
      activeLens: window.BimsAtlas?.state?.activeLens || "",
      activeYear: window.BimsAtlas?.state?.year || null,
    };
  });
}

async function collectCity(browser, city) {
  const page = await browser.newPage({ viewport: { width: 1360, height: 820 }, deviceScaleFactor: 1 });
  const messages = [];
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) messages.push(`${message.type()}: ${message.text()}`);
  });
  await page.addInitScript(() => {
    window.__atlasLongTasks = [];
    try {
      const observer = new PerformanceObserver((list) => {
        window.__atlasLongTasks.push(...list.getEntries().map((entry) => ({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
        })));
      });
      observer.observe({ type: "longtask", buffered: true });
      window.__atlasLongTaskObserver = observer;
    } catch (_error) {
      window.__atlasLongTasksUnsupported = true;
    }
  });

  const url = `${baseUrl}/atlas?city=${encodeURIComponent(city)}&year=${year}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  await page.waitForFunction(() => Boolean(window.BimsAtlasBoot), null, { timeout: timeoutMs });
  const previewReadyMs = await page.evaluate(() => Number((window.BimsAtlasBoot?.readyAt || 0).toFixed(1)));
  await waitForAtlasReady(page);
  const fullReadyMs = await page.evaluate(() => Number(performance.now().toFixed(1)));
  await page.waitForTimeout(250);
  const initial = await pageSummary(page);
  const initialResources = resourceSummary(await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.toJSON())));

  const years = await page.evaluate(() => window.BimsAtlas?.state?.years || []);
  const targetYear = years
    .map(Number)
    .filter((item) => Number.isFinite(item) && item !== year)
    .sort((a, b) => Math.abs(a - year) - Math.abs(b - year))[0] || year;
  const timelineMs = targetYear === year
    ? 0
    : await interactionTiming(
      page,
      "timeline switch",
      async ({ targetYear }) => window.BimsAtlas.setYear(targetYear),
      ({ targetYear }) => {
        const state = window.BimsAtlas?.state;
        return Number(state?.year) === Number(targetYear)
          && document.querySelectorAll("#eventList .event-row").length > 0
          && document.querySelector("#appStatus")?.textContent.trim() === "";
      },
      { targetYear }
    );

  const lensMs = await interactionTiming(
    page,
    "lens switch",
    async () => window.BimsAtlas.setActiveLens("economy"),
    () => window.BimsAtlas?.state?.activeLens === "economy"
      && document.querySelector(".lens-choice[data-active='true']")?.getAttribute("data-lens") === "economy"
  );

  const searchMs = await interactionTiming(
    page,
    "search filter",
    async () => {
      const input = document.querySelector("#searchInput");
      input.value = "station";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    },
    () => window.BimsAtlas?.state?.search === "station"
      && document.querySelector("#searchInput")?.value === "station"
  );

  const runtime = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const longTasks = window.__atlasLongTasks || [];
    const longTaskDurations = longTasks.map((entry) => entry.duration).sort((a, b) => a - b);
    const longTaskP95 = longTaskDurations.length
      ? longTaskDurations[Math.min(longTaskDurations.length - 1, Math.max(0, Math.ceil(longTaskDurations.length * 0.95) - 1))]
      : 0;
    return {
      domContentLoadedMs: nav ? Number(nav.domContentLoadedEventEnd.toFixed(1)) : 0,
      loadEventMs: nav ? Number(nav.loadEventEnd.toFixed(1)) : 0,
      longTaskCount: longTasks.length,
      longTaskTotalMs: Number(longTasks.reduce((sum, entry) => sum + entry.duration, 0).toFixed(1)),
      longTaskP95Ms: Number(longTaskP95.toFixed(1)),
    };
  });
  const resources = await page.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.toJSON()));
  const postInteraction = await pageSummary(page);
  await page.close();
  return {
    city,
    url,
    previewReadyMs,
    fullReadyMs,
    timelineMs,
    lensMs,
    searchMs,
    ...runtime,
    initial,
    initialResources,
    postInteraction,
    allResources: resourceSummary(resources),
    consoleMessages: messages.filter((message) => !/WebGL.*ReadPixels|favicon/i.test(message)).slice(0, 20),
  };
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--disable-dev-shm-usage"],
  });
  try {
    const results = [];
    for (const city of cities) results.push(await collectCity(browser, city));
    const payload = {
      createdAt: new Date().toISOString(),
      baseUrl,
      year,
      results,
    };
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outPath = path.join(outputDir, `atlas-current-${stamp}.json`);
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
    console.log(JSON.stringify(payload, null, 2));
    console.error(`Atlas performance probe wrote ${outPath}`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
