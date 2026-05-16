const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { assertDetailedPng } = require("./image_detail");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const baseUrl = (process.env.URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const atlasUrl = (process.env.ATLAS_URL || `${baseUrl}/atlas`).replace(/\/$/, "");

const scenarios = [
  { city: "belfast", area: "City Centre", query: "City Centre", center: [-5.9301, 54.5973], zoom: 14.2, beforeYear: 2016, afterYear: 2026 },
  { city: "london", area: "Stratford / Olympic Park", query: "Stratford / Olympic Park", center: [-0.013, 51.543], zoom: 14.2, beforeYear: 2016, afterYear: 2026 },
  { city: "nyc", area: "Hudson Yards / West Chelsea", query: "Hudson Yards / West Chelsea", center: [-74.002, 40.755], zoom: 14.2, beforeYear: 2016, afterYear: 2026 },
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
  await page.waitForFunction(
    (cityId) => Boolean(
      window.BimsAtlas?.state?.lensOverlayLoaded
      && window.BimsAtlas.state.map?.getLayer("lens-heatmap")
      && window.BimsAtlas.state.map?.getLayer("lens-transport-base")
      && window.BimsAtlas.state.map?.getLayer("lens-transport-roads")
      && (
        cityId !== "belfast"
        || (
          window.BimsAtlas.state.detailLayerLoaded
          && window.BimsAtlas.state.map?.getLayer("detail-roads-visible")
          && window.BimsAtlas.state.map?.getLayer("detail-buildings-fill")
        )
      )
    ),
    city,
    { timeout: 60000 }
  );
}

async function useAreaSearch(page, scenario) {
  await page.locator("#eventSearch").fill(scenario.query);
  await page.waitForSelector("#searchResults button", { timeout: 10000 });
  await page.locator("#searchResults button").first().click();
  await page.waitForTimeout(350);
  await page.locator("#eventSearch").evaluate((input) => {
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForFunction(() => window.BimsAtlas.state.search === "", null, { timeout: 5000 });
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
        && state?.transportRoadYearLoaded === expectedYear
        && String(state?.transportRoadYearPathLoaded || "").includes(`transport_roads_${expectedYear}.geojson`)
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
  await page.waitForFunction(
    (expectedYear) => {
      const state = window.BimsAtlas?.state;
      const map = state?.map;
      if (!map || state.category !== "transport" || !map.getLayer("lens-transport-roads")) return true;
      const features = map.queryRenderedFeatures({ layers: ["lens-transport-roads"] });
      return features.length > 0 && features.every((feature) => Number(feature.properties.year) === expectedYear);
    },
    year,
    { timeout: 30000 }
  );
  await page.waitForFunction(
    (expectedYear) => {
      const events = window.BimsAtlas?.filteredEvents?.() || [];
      const years = new Set(events.map((event) => event.year));
      return events.length > 0
        && years.size === 1
        && years.has(expectedYear)
        && document.querySelectorAll("#eventList .event-card").length > 0
        && document.querySelectorAll(".map-marker").length > 0;
    },
    year,
    { timeout: 30000 }
  );
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
      lensTransportBaseLayer: Boolean(state.map.getLayer("lens-transport-base")),
      lensTransportRoadLayer: Boolean(state.map.getLayer("lens-transport-roads")),
      lensTransportBaseRendered: state.map.queryRenderedFeatures({ layers: ["lens-transport-base"] }).length,
      lensTransportRoadRendered: state.map.queryRenderedFeatures({ layers: ["lens-transport-roads"] }).length,
      roadActivitySum: state.map.queryRenderedFeatures({ layers: ["lens-transport-roads"] })
        .reduce((total, feature) => total + Number(feature.properties.transport_activity || 0), 0),
      roadYearSource: String(state.transportRoadYearPathLoaded || sources["lens-transport-road-year"]?.data || ""),
      attribution,
      cards: document.querySelectorAll("#eventList .event-card").length,
      markers: document.querySelectorAll(".map-marker").length,
      currentYear: document.querySelector("#currentYear")?.textContent || "",
      activeTimeline: document.querySelector(".timeline-event.active")?.dataset.year || "",
      selectedRange: state.selectedYearRange,
      selectedEventState: state.selectedEventState,
      visibleStateCount: state.visibleEventCount,
      visibleOverlayState: state.visibleOverlays,
      changeCount: document.querySelector("#changeCount")?.textContent || "",
      markerIds: Array.from(document.querySelectorAll(".map-marker")).map((marker) => marker.dataset.eventId),
      visibleYears: [...new Set(window.BimsAtlas.filteredEvents().map((event) => event.year))],
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
  }
  assert(snapshot.lensOverlayLoaded && snapshot.lensHeatmapLayer && snapshot.lensTransportBaseLayer && snapshot.lensTransportRoadLayer, `${label}: lens heatmap/transport road overlays are missing.`);
  assert(snapshot.roadYearSource.includes(`transport_roads_${expectedYear}.geojson`), `${label}: selected-year transport road source did not follow the timeline.`);
  assert(snapshot.selectedRange?.start === expectedYear && snapshot.selectedRange?.end === expectedYear, `${label}: explicit selected year range did not follow the timeline.`);
  assert(snapshot.visibleYears.length === 1 && snapshot.visibleYears[0] === expectedYear, `${label}: rendered events are not scoped to ${expectedYear}: ${snapshot.visibleYears.join(", ")}.`);
  assert(snapshot.selectedEventState === null || snapshot.selectedEventState.visibleInSelectedTime === true, `${label}: selected event is outside the selected time.`);
  assert(/OpenStreetMap contributors/i.test(snapshot.attribution), `${label}: map attribution did not show OpenStreetMap contributors.`);
  assert(/orientation context|not event timing evidence/i.test(snapshot.attribution), `${label}: OSM basemap caveat was not visible.`);
  assert(snapshot.cards > 0, `${label}: changelog cards disappeared after timeline change.`);
  assert(snapshot.markers > 0, `${label}: map markers disappeared after timeline change.`);
  assert(snapshot.sourceBackedVisible > 0, `${label}: no source-backed visible records remained.`);
  assert(snapshot.visibleStateCount === snapshot.sourceBackedVisible, `${label}: explicit visible count does not match filtered source-backed events.`);
  assert(snapshot.changeCount && snapshot.changeCount !== "0", `${label}: visible change count did not update.`);
}

function assertTransportSnapshot(snapshot, expectedYear, label) {
  assert(snapshot.year === expectedYear, `${label}: state year stayed at ${snapshot.year}, expected ${expectedYear}.`);
  assert(snapshot.roadYearSource.includes(`transport_roads_${expectedYear}.geojson`), `${label}: selected-year transport road source did not follow the timeline.`);
  assert(snapshot.lensTransportBaseRendered > 0, `${label}: citywide transport base roads did not render.`);
  assert(snapshot.lensTransportRoadRendered > 0 && snapshot.roadActivitySum > 0, `${label}: selected-year transport road activity did not render.`);
  assert(snapshot.visibleOverlayState?.transportRoads === true, `${label}: explicit overlay state did not mark transport roads visible.`);
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

    await page.goto(`${atlasUrl}?city=${encodeURIComponent(scenario.city)}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitForAtlas(page, scenario.city);
    await useAreaSearch(page, scenario);
    await page.evaluate(() => window.BimsAtlas.setCategory("all"));
    await page.waitForFunction(() => window.BimsAtlas.state.category === "all", null, { timeout: 5000 });

    await setTimelineYear(page, scenario.beforeYear);
    const before = await readTimelineSnapshot(page);
    assertSnapshot(before, scenario.beforeYear, `${runLabel} before`);

    await setTimelineYear(page, scenario.afterYear);
    const after = await readTimelineSnapshot(page);
    assertSnapshot(after, scenario.afterYear, `${runLabel} after`);

    assert(before.basemapTile === after.basemapTile, `${runLabel}: OSM basemap tile template changed between timeline years.`);
    assert(before.sourceBackedVisible !== after.sourceBackedVisible || before.markerIds.join("|") !== after.markerIds.join("|"), `${runLabel}: visible event state did not change between ${scenario.beforeYear} and ${scenario.afterYear}.`);

    await page.evaluate(() => window.BimsAtlas.setCategory("transport"));
    await page.waitForFunction(() => window.BimsAtlas.state.category === "transport", null, { timeout: 5000 });
    await setTimelineYear(page, scenario.beforeYear);
    const transportBefore = await readTimelineSnapshot(page);
    assertTransportSnapshot(transportBefore, scenario.beforeYear, `${runLabel} transport before`);
    await setTimelineYear(page, scenario.afterYear);
    const transportAfter = await readTimelineSnapshot(page);
    assertTransportSnapshot(transportAfter, scenario.afterYear, `${runLabel} transport after`);
    assert(Math.abs(transportBefore.roadActivitySum - transportAfter.roadActivitySum) > 0.1, `${runLabel}: transport road activity did not visually change between ${scenario.beforeYear} and ${scenario.afterYear}.`);
    await page.evaluate(() => window.BimsAtlas.setCategory("all"));
    await page.waitForFunction(() => window.BimsAtlas.state.category === "all", null, { timeout: 5000 });

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

  const filteredErrors = consoleErrors.filter((error) => !(
    /favicon|ERR_CACHE_WRITE_FAILURE/i.test(error)
    || /AJAXError: Failed to fetch \(0\): https:\/\/tile\.openstreetmap\.org\//i.test(error)
  ));
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
