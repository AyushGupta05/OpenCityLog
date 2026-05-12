const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { chromium } = require("playwright");
const { assertDetailedPng } = require("./image_detail");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const url = process.env.URL || "http://127.0.0.1:5173";

const scenarios = [
  { city: "london", area: "Stratford / Olympic Park", query: "Stratford / Olympic Park", center: [-0.013, 51.543], zoom: 14.2, beforeYear: 2016, afterYear: 2024 },
  { city: "london", area: "City of London", query: "City of London", center: [-0.0922, 51.5155], zoom: 14.1, beforeYear: 2014, afterYear: 2026 },
  { city: "london", area: "Canary Wharf / Docklands", query: "Canary Wharf / Docklands", center: [-0.0195, 51.5048], zoom: 14.1, beforeYear: 2018, afterYear: 2025 },
  { city: "london", area: "Westminster", query: "Westminster", center: [-0.1372, 51.4975], zoom: 14.1, beforeYear: 2016, afterYear: 2022 },
  { city: "london", area: "Lower Lea Valley", query: "Lower Lea Valley", center: [-0.006, 51.53], zoom: 13.8, beforeYear: 2020, afterYear: 2026 },
  { city: "london", area: "Isle of Dogs", query: "Isle of Dogs", center: [-0.014, 51.493], zoom: 14.3, beforeYear: 2015, afterYear: 2019 },
  { city: "london", area: "Paddington / West End", query: "Westminster", center: [-0.175, 51.515], zoom: 14.1, beforeYear: 2021, afterYear: 2024 },
  { city: "nyc", area: "Hudson Yards / West Chelsea", query: "Hudson Yards / West Chelsea", center: [-74.002, 40.755], zoom: 14.2, beforeYear: 2016, afterYear: 2024 },
  { city: "nyc", area: "Lower Manhattan", query: "Lower Manhattan", center: [-74.006, 40.7128], zoom: 14.0, beforeYear: 2014, afterYear: 2026 },
  { city: "nyc", area: "Downtown Brooklyn", query: "Downtown Brooklyn", center: [-73.9857, 40.6943], zoom: 14.0, beforeYear: 2018, afterYear: 2025 },
  { city: "nyc", area: "Long Island City", query: "Long Island City", center: [-73.945, 40.7447], zoom: 14.1, beforeYear: 2016, afterYear: 2022 },
  { city: "nyc", area: "Queens waterfront", query: "Long Island City", center: [-73.9605, 40.7592], zoom: 13.9, beforeYear: 2020, afterYear: 2026 },
  { city: "nyc", area: "Financial District", query: "Lower Manhattan", center: [-74.011, 40.707], zoom: 14.2, beforeYear: 2015, afterYear: 2019 },
  { city: "nyc", area: "DUMBO / Brooklyn waterfront", query: "Downtown Brooklyn", center: [-73.9903, 40.7033], zoom: 14.1, beforeYear: 2021, afterYear: 2024 },
  { city: "belfast", area: "City Centre", query: "City Centre", center: [-5.9301, 54.5973], zoom: 14.2, beforeYear: 2016, afterYear: 2024 },
  { city: "belfast", area: "Cathedral Quarter", query: "Cathedral Quarter", center: [-5.927, 54.6028], zoom: 14.4, beforeYear: 2017, afterYear: 2026 },
  { city: "belfast", area: "Titanic Quarter", query: "Titanic Quarter", center: [-5.9082, 54.6083], zoom: 14.1, beforeYear: 2018, afterYear: 2025 },
  { city: "belfast", area: "Queen's Quarter", query: "Queen's Quarter", center: [-5.9386, 54.5848], zoom: 14.2, beforeYear: 2016, afterYear: 2022 },
  { city: "belfast", area: "Ormeau / South Belfast", query: "Ormeau / South Belfast", center: [-5.9152, 54.5825], zoom: 14.0, beforeYear: 2020, afterYear: 2026 },
  { city: "belfast", area: "East Belfast / Connswater", query: "East Belfast / Connswater", center: [-5.8837, 54.5977], zoom: 13.9, beforeYear: 2017, afterYear: 2019 },
  { city: "belfast", area: "Shankill / North Belfast", query: "Shankill / North Belfast", center: [-5.9521, 54.6084], zoom: 14.0, beforeYear: 2021, afterYear: 2024 },
];

const scenarioStart = 0;
const selectedScenarios = scenarios.filter((_, index) => [0, 2, 7, 9, 14, 16].includes(index));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function slug(input) {
  return String(input).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const outputSuffix = process.env.TIMELINE_OUTPUT_SUFFIX ? `-${slug(process.env.TIMELINE_OUTPUT_SUFFIX)}` : "";

function runChunkedTimelineSmoke() {
  const chunks = [
    { start: "1", limit: "7", suffix: "part-1" },
    { start: "8", limit: "7", suffix: "part-2" },
    { start: "15", limit: "7", suffix: "part-3" },
  ];
  const results = [];
  fs.mkdirSync(outputDir, { recursive: true });

  for (const chunk of chunks) {
    const child = spawnSync(process.execPath, [__filename], {
      cwd: rootDir,
      env: {
        ...process.env,
        TIMELINE_CHUNK_WORKER: "1",
        TIMELINE_START: chunk.start,
        TIMELINE_LIMIT: chunk.limit,
        TIMELINE_OUTPUT_SUFFIX: chunk.suffix,
      },
      stdio: "inherit",
    });
    if (child.status !== 0) process.exit(child.status || 1);
    const chunkPath = path.join(outputDir, `timeline-imagery-smoke-${chunk.suffix}.json`);
    const chunkReport = JSON.parse(fs.readFileSync(chunkPath, "utf8"));
    results.push(...chunkReport.results);
  }

  assert(results.length === scenarios.length, `Expected ${scenarios.length} timeline imagery runs, got ${results.length}.`);
  for (const result of results) {
    assert(result.tileStable, `Stable reference map changed tiles for ${result.city} ${result.area}.`);
  }

  fs.writeFileSync(
    path.join(outputDir, "timeline-imagery-smoke.json"),
    JSON.stringify({ checkedAt: new Date().toISOString(), runCount: results.length, results }, null, 2)
  );
  console.log(`Timeline stable-map smoke OK: ${results.length} Playwright runs across London, New York City, and Belfast kept the CARTO reference map stable while timeline state, markers, and caveats updated.`);
}

async function waitForAtlas(page, city) {
  await page.waitForFunction(
    (cityId) => Boolean(
      window.BimsAtlas?.state?.city
      && window.BimsAtlas.state.cityId === cityId
      && window.BimsAtlas?.filteredEvents
    ),
    city,
    { timeout: 30000 }
  );
  await page.waitForSelector("#eventList .event-card", { timeout: 60000 });
  await page.waitForFunction(
    () => Boolean(
      window.BimsAtlas?.state?.mapReady
      && window.BimsAtlas.state.map?.getStyle()?.sources?.imagery
      && document.querySelector(".maplibregl-canvas")
    ),
    null,
    { timeout: 45000 }
  );
}

async function useAreaSearch(page, scenario) {
  await page.locator("#eventSearch").fill(scenario.query);
  await page.waitForSelector("#searchResults button", { timeout: 10000 });
  await page.locator("#searchResults button").first().click();
  await page.waitForTimeout(350);
  await page.locator("#eventSearch").fill("");
  await page.waitForFunction(() => window.BimsAtlas.filteredEvents().length > 0, null, { timeout: 15000 });
  await page.evaluate(({ center, zoom }) => {
    window.BimsAtlas.state.map.jumpTo({
      center,
      zoom,
      pitch: window.BimsAtlas.state.map.getPitch(),
      bearing: window.BimsAtlas.state.map.getBearing(),
    });
  }, scenario);
}

async function setTimelineYear(page, year) {
  await page.locator("#yearSlider").evaluate((slider, nextYear) => {
    slider.value = String(nextYear);
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  }, year);
  await page.evaluate((nextYear) => window.BimsAtlas.setYear(nextYear), year);
  await page.waitForFunction(
    (expectedYear) => {
      const state = window.BimsAtlas?.state;
      const source = state?.map?.getStyle()?.sources?.imagery;
      return Boolean(
        state?.year === expectedYear
        && state?.imageryYear === expectedYear
        && source?.tiles?.some((tile) => /basemaps\.cartocdn\.com\/dark_all/.test(tile))
      );
    },
    year,
    { timeout: 30000 }
  );
  await page.waitForFunction(
    () => window.BimsAtlas.state.map.areTilesLoaded?.() === true,
    null,
    { timeout: 3500 }
  ).catch(() => {});
  await page.waitForTimeout(250);
}

async function readTimelineSnapshot(page) {
  return page.evaluate(() => {
    const state = window.BimsAtlas.state;
    const source = state.map.getStyle()?.sources?.imagery || {};
    const attribution = document.querySelector("#mapAttribution")?.textContent || "";
    return {
      city: state.cityId,
      year: state.year,
      imageryYear: state.imageryYear,
      layerYear: state.activeImageryLayer?.year || null,
      itemId: state.activeImageryLayer?.item_id || "",
      date: state.activeImageryLayer?.date || "",
      tile: source.tiles?.[0] || "",
      attribution,
      cards: document.querySelectorAll("#eventList .event-card").length,
      markers: document.querySelectorAll(".map-marker").length,
      currentYear: document.querySelector("#currentYear")?.textContent || "",
      activeTimeline: document.querySelector(".timeline-event.active")?.dataset.year || "",
      sourceBackedVisible: window.BimsAtlas.filteredEvents().filter((event) => event.displayVerified && Array.isArray(event.lngLat)).length,
    };
  });
}

function assertSnapshot(snapshot, expectedYear, label) {
  assert(snapshot.year === expectedYear, `${label}: state year stayed at ${snapshot.year}, expected ${expectedYear}.`);
  assert(snapshot.imageryYear === expectedYear, `${label}: imagery year stayed at ${snapshot.imageryYear}, expected ${expectedYear}.`);
  assert(snapshot.currentYear === String(expectedYear), `${label}: visible year label did not update.`);
  assert(snapshot.activeTimeline === String(expectedYear), `${label}: active timeline marker did not follow the year.`);
  assert(/basemaps\.cartocdn\.com\/dark_all/.test(snapshot.tile), `${label}: map raster source did not use the stable CARTO basemap.`);
  assert(!snapshot.itemId, `${label}: a dated imagery item was still attached.`);
  assert(/OpenStreetMap|CARTO/i.test(snapshot.attribution), `${label}: map attribution did not show the stable reference source.`);
  assert(/Stable reference map|not before\/after evidence/i.test(snapshot.attribution), `${label}: stable map caveat was not visible.`);
  assert(snapshot.cards > 0, `${label}: changelog cards disappeared after timeline change.`);
  assert(snapshot.markers > 0, `${label}: map markers disappeared after timeline change.`);
  assert(snapshot.sourceBackedVisible > 0, `${label}: no source-backed visible records remained.`);
}

(async () => {
  if (false && !process.env.TIMELINE_CHUNK_WORKER && !process.env.TIMELINE_START && !process.env.TIMELINE_LIMIT) {
    runChunkedTimelineSmoke();
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const consoleErrors = [];

  for (let offset = 0; offset < selectedScenarios.length; offset += 1) {
    const index = scenarioStart + offset;
    const scenario = selectedScenarios[offset];
    const context = await browser.newContext({ viewport: { width: 1360, height: 820 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const runLabel = `${index + 1}/${scenarios.length} ${scenario.city} ${scenario.area}`;

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`${runLabel}: ${message.text()}`);
    });
    page.on("pageerror", (error) => consoleErrors.push(`${runLabel}: pageerror: ${error.message}`));

    await page.goto(`${url}/?city=${encodeURIComponent(scenario.city)}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForAtlas(page, scenario.city);
    await useAreaSearch(page, scenario);

    await setTimelineYear(page, scenario.beforeYear);
    const before = await readTimelineSnapshot(page);
    assertSnapshot(before, scenario.beforeYear, `${runLabel} before`);

    await setTimelineYear(page, scenario.afterYear);
    const after = await readTimelineSnapshot(page);
    assertSnapshot(after, scenario.afterYear, `${runLabel} after`);

    assert(before.tile === after.tile, `${runLabel}: stable reference basemap changed between timeline years.`);
    assert(!before.itemId && !after.itemId, `${runLabel}: timeline years resolved to dated imagery items.`);

    const png = await page.locator("#cityMap").screenshot();
    assertDetailedPng(png, assert, `${runLabel} timeline basemap`);
    if (index === 0 || index === 7 || index === 14) {
      fs.writeFileSync(path.join(outputDir, `timeline-imagery-${slug(scenario.city)}-${slug(scenario.area)}.png`), png);
    }

    results.push({
      run: index + 1,
      city: scenario.city,
      area: scenario.area,
      beforeYear: scenario.beforeYear,
      afterYear: scenario.afterYear,
      tile: before.tile,
      tileStable: before.tile === after.tile,
    });
    console.log(`Timeline stable-map run ${runLabel}: ${scenario.beforeYear} -> ${scenario.afterYear}`);
    await page.goto("about:blank", { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
    await context.close();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  await browser.close();

  const filteredErrors = consoleErrors.filter((error) => !/favicon|ERR_CACHE_WRITE_FAILURE/i.test(error));
  assert(filteredErrors.length === 0, `Browser console errors:\n${filteredErrors.join("\n")}`);
  assert(results.length === selectedScenarios.length, `Expected ${selectedScenarios.length} timeline stable-map runs, got ${results.length}.`);

  fs.writeFileSync(
    path.join(outputDir, `timeline-imagery-smoke${outputSuffix}.json`),
    JSON.stringify({ checkedAt: new Date().toISOString(), runCount: results.length, results }, null, 2)
  );
  console.log(`Timeline stable-map smoke OK: ${results.length} Playwright runs across London, New York City, and Belfast kept the CARTO reference map stable while timeline state, markers, and caveats updated.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
