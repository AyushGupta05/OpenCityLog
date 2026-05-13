const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { assertDetailedPng } = require("./image_detail");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const url = process.env.URL || "http://127.0.0.1:5173";

const scenarios = [
  { city: "belfast", area: "City Centre", query: "City Centre", center: [-5.9301, 54.5973], zoom: 14.2, beforeYear: 2016, afterYear: 2024 },
  { city: "london", area: "Stratford / Olympic Park", query: "Stratford / Olympic Park", center: [-0.013, 51.543], zoom: 14.2, beforeYear: 2016, afterYear: 2024 },
  { city: "nyc", area: "Hudson Yards / West Chelsea", query: "Hudson Yards / West Chelsea", center: [-74.002, 40.755], zoom: 14.2, beforeYear: 2016, afterYear: 2024 },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function slug(input) {
  return String(input).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
      && window.BimsAtlas.state.map?.getStyle()?.sources?.basemap
      && document.querySelector(".maplibregl-canvas")
    ),
    null,
    { timeout: 45000 }
  );
  if (city === "belfast") {
    await page.waitForFunction(
      () => Boolean(
        window.BimsAtlas?.state?.detailLayerLoaded
        && window.BimsAtlas?.state?.lensOverlayLoaded
        && window.BimsAtlas.state.map?.getLayer("detail-roads-visible")
        && window.BimsAtlas.state.map?.getLayer("detail-buildings-fill")
        && window.BimsAtlas.state.map?.getLayer("lens-heatmap")
        && window.BimsAtlas.state.map?.getLayer("lens-transport-roads")
      ),
      null,
      { timeout: 60000 }
    );
  }
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
  await page.evaluate(async (nextYear) => {
    const slider = document.querySelector("#yearSlider");
    if (slider) slider.value = String(nextYear);
    await window.BimsAtlas.setYear(nextYear);
  }, year);
  await page.waitForFunction(
    (expectedYear) => {
      const state = window.BimsAtlas?.state;
      const sources = state?.map?.getStyle()?.sources || {};
      return Boolean(
        state?.year === expectedYear
        && state?.basemapYear === expectedYear
        && sources.basemap?.tiles?.some((tile) => /tile\.openstreetmap\.org/.test(tile))
        && !sources.imagery
        && !sources["compare-before"]
      );
    },
    year,
    { timeout: 30000 }
  );
  await page.waitForFunction(
    () => window.BimsAtlas.state.map.areTilesLoaded?.() === true,
    null,
    { timeout: 8000 }
  ).catch(() => {});
  await page.waitForTimeout(350);
}

async function readTimelineSnapshot(page) {
  return page.evaluate(() => {
    const state = window.BimsAtlas.state;
    const sources = state.map.getStyle()?.sources || {};
    const attribution = document.querySelector("#mapAttribution")?.textContent || "";
    return {
      city: state.cityId,
      year: state.year,
      basemapYear: state.basemapYear,
      basemapTile: sources.basemap?.tiles?.[0] || "",
      legacyImageryTile: sources.imagery?.tiles?.[0] || "",
      compareTile: sources["compare-before"]?.tiles?.[0] || "",
      detailLayerLoaded: Boolean(state.detailLayerLoaded),
      lensOverlayLoaded: Boolean(state.lensOverlayLoaded),
      detailRoadLayer: Boolean(state.map.getLayer("detail-roads-visible")),
      detailBuildingLayer: Boolean(state.map.getLayer("detail-buildings-fill")),
      lensHeatmapLayer: Boolean(state.map.getLayer("lens-heatmap")),
      lensTransportRoadLayer: Boolean(state.map.getLayer("lens-transport-roads")),
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
  assert(snapshot.basemapYear === expectedYear, `${label}: basemap year stayed at ${snapshot.basemapYear}, expected ${expectedYear}.`);
  assert(snapshot.currentYear === String(expectedYear), `${label}: visible year label did not update.`);
  assert(snapshot.activeTimeline === String(expectedYear), `${label}: active timeline marker did not follow the year.`);
  assert(/tile\.openstreetmap\.org/.test(snapshot.basemapTile), `${label}: map raster source did not use OpenStreetMap tiles.`);
  assert(!snapshot.legacyImageryTile, `${label}: legacy imagery source is still attached.`);
  assert(!snapshot.compareTile, `${label}: legacy compare imagery source is still attached.`);
  if (snapshot.city === "belfast") {
    assert(snapshot.detailLayerLoaded && snapshot.detailRoadLayer && snapshot.detailBuildingLayer, `${label}: detailed Belfast road/building layers are missing.`);
    assert(snapshot.lensOverlayLoaded && snapshot.lensHeatmapLayer && snapshot.lensTransportRoadLayer, `${label}: Belfast lens heatmap/transport road overlays are missing.`);
  }
  assert(/OpenStreetMap contributors/i.test(snapshot.attribution), `${label}: map attribution did not show OpenStreetMap contributors.`);
  assert(/orientation context|not event timing evidence/i.test(snapshot.attribution), `${label}: OSM basemap caveat was not visible.`);
  assert(snapshot.cards > 0, `${label}: changelog cards disappeared after timeline change.`);
  assert(snapshot.markers > 0, `${label}: map markers disappeared after timeline change.`);
  assert(snapshot.sourceBackedVisible > 0, `${label}: no source-backed visible records remained.`);
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const consoleErrors = [];

  for (let index = 0; index < scenarios.length; index += 1) {
    const scenario = scenarios[index];
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

    assert(before.basemapTile === after.basemapTile, `${runLabel}: OSM basemap tile template changed between timeline years.`);

    const png = await page.locator("#cityMap").screenshot();
    assertDetailedPng(png, assert, `${runLabel} OSM basemap`);
    fs.writeFileSync(path.join(outputDir, `timeline-osm-basemap-${slug(scenario.city)}.png`), png);

    results.push({
      run: index + 1,
      city: scenario.city,
      area: scenario.area,
      beforeYear: scenario.beforeYear,
      afterYear: scenario.afterYear,
      basemapTile: after.basemapTile,
    });
    console.log(`Timeline OSM basemap run ${runLabel}: ${scenario.beforeYear} -> ${scenario.afterYear}`);
    await page.goto("about:blank", { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
    await context.close();
  }

  await browser.close();

  const filteredErrors = consoleErrors.filter((error) => !/favicon|ERR_CACHE_WRITE_FAILURE/i.test(error));
  assert(filteredErrors.length === 0, `Browser console errors:\n${filteredErrors.join("\n")}`);
  assert(results.length === scenarios.length, `Expected ${scenarios.length} timeline basemap runs, got ${results.length}.`);

  fs.writeFileSync(
    path.join(outputDir, "timeline-osm-basemap-smoke.json"),
    JSON.stringify({ checkedAt: new Date().toISOString(), runCount: results.length, results }, null, 2)
  );
  console.log(`Timeline OSM basemap smoke OK: ${results.length} Playwright runs kept OpenStreetMap tiles while timeline state, markers, and caveats updated.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
