const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const url = process.env.URL || "http://localhost:5173";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForAtlas(page) {
  await page.waitForFunction(
    () => Boolean(window.BimsAtlas?.state?.city && window.BimsAtlas?.state?.eventsIndex),
    null,
    { timeout: 30000 }
  );
  await page.waitForSelector("#eventList .event-card", { timeout: 30000 });
  await page.waitForFunction(
    () => Boolean(window.BimsAtlas?.state?.mapSceneReady && document.querySelectorAll(".maplibregl-canvas").length >= 2),
    null,
    { timeout: 30000 }
  );
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push("pageerror: " + error.message));

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForAtlas(page);
  await page.waitForTimeout(500);

  const health = await (await page.request.get(`${url}/api/health`)).json();
  assert(health.ok === true && health.mode === "city-change-atlas" && health.atlasIndex === true, "Health endpoint did not report the active city atlas.");
  assert(!("legacyReplayManifest" in health), "Health endpoint still exposes legacy replay manifest state.");
  const retiredManifest = await page.request.get(`${url}/api/manifest`);
  assert(retiredManifest.status() === 404, "Retired /api/manifest path is still served.");
  const retiredReplayManifest = await page.request.get(`${url}/api/replay-manifest.json`);
  assert(retiredReplayManifest.status() === 404, "Retired /api/replay-manifest.json path is still served.");
  const retiredModeA = await page.request.get(`${url}/data/mode-a/summary.json`);
  assert(retiredModeA.status() === 410, "Retired /data/mode-a path is not explicitly quarantined.");
  const encodedModeA = await page.request.get(`${url}/data/mode-a%2Fsummary.json`);
  assert(encodedModeA.status() === 410, "Retired encoded /data/mode-a path is not explicitly quarantined.");
  const encodedModeARoot = await page.request.get(`${url}/data%2Fmode-a%2Fsummary.json`);
  assert(encodedModeARoot.status() === 410, "Retired encoded root /data/mode-a path is not explicitly quarantined.");
  const encodedModeABackslash = await page.request.get(`${url}/data%5Cmode-a%5Csummary.json`);
  assert(encodedModeABackslash.status() === 410, "Retired encoded backslash /data/mode-a path is not explicitly quarantined.");
  const dotSegmentModeA = await page.request.get(`${url}/x/..%2Fdata/mode-a/summary.json`);
  assert(dotSegmentModeA.status() === 410, "Retired dot-segment encoded /data/mode-a path is not explicitly quarantined.");
  const dotSegmentBackslashModeA = await page.request.get(`${url}/x/..%5Cdata%5Cmode-a%5Csummary.json`);
  assert(dotSegmentBackslashModeA.status() === 410, "Retired dot-segment encoded backslash /data/mode-a path is not explicitly quarantined.");
  const encodedDotSegmentRootModeA = await page.request.get(`${url}/data%2F..%2Fdata%2Fmode-a%2Fsummary.json`);
  assert(encodedDotSegmentRootModeA.status() === 410, "Retired encoded dot-segment root /data/mode-a path is not explicitly quarantined.");
  const encodedCurrentDirModeA = await page.request.get(`${url}/.%2Fdata%2Fmode-a%2Fsummary.json`);
  assert(encodedCurrentDirModeA.status() === 410, "Retired encoded current-dir /data/mode-a path is not explicitly quarantined.");

  const initial = await page.evaluate(() => ({
    title: document.title,
    cityOptions: Array.from(document.querySelectorAll("#citySelect option")).map((option) => option.value),
    layerLabels: Array.from(document.querySelectorAll(".layer-button")).map((button) => button.textContent.trim()),
    visibleText: document.body.innerText,
    eventCount: window.BimsAtlas.filteredEvents().length,
    mapEventCount: window.BimsAtlas.filteredMapEvents().length,
    markers: document.querySelectorAll(".map-marker").length,
    tiles: document.querySelectorAll(".tile-layer img").length,
    mapCanvases: document.querySelectorAll(".maplibregl-canvas").length,
    mapSceneReady: window.BimsAtlas.state.mapSceneReady,
    tileSrc: document.querySelector(".tile-layer img")?.getAttribute("src") || "",
    imageryProvider: window.BimsAtlas.state.imageryArchive?.provider || "",
    eventThumbs: document.querySelectorAll(".event-thumb").length,
    eventThumbImages: document.querySelectorAll(".event-thumb img").length,
    evidenceFrames: document.querySelectorAll(".mini-frame").length,
    impactModes: Array.from(document.querySelectorAll("[data-impact-mode]")).map((button) => button.textContent.trim()),
    impactCards: document.querySelectorAll(".impact-card").length,
    impactText: document.querySelector("#impactPanel")?.textContent || "",
    selectedTitle: document.querySelector("#detailTitle")?.textContent || "",
  }));

  assert(initial.title.includes("CivicReplay"), "CivicReplay title did not render.");
  for (const cityId of ["belfast", "london", "nyc"]) {
    assert(initial.cityOptions.includes(cityId), `Missing city selector option ${cityId}.`);
  }
  for (const label of ["All layers", "Planning", "Transport", "Environment", "Public services", "Economy"]) {
    assert(initial.layerLabels.some((text) => text.includes(label)), `Missing layer ${label}.`);
  }
  assert(initial.eventCount > 0, "Change log did not load events.");
  assert(initial.mapEventCount > 0, "Timeline/map year did not expose events.");
  assert(initial.markers > 0, "Map did not render event markers.");
  assert(initial.mapSceneReady && initial.mapCanvases >= 2, "Native MapLibre before/after map scenes did not initialize.");
  assert(initial.tiles >= 24, "Imagery basemap tiles did not render.");
  assert(/Esri World Imagery Wayback/i.test(initial.imageryProvider), "Wayback imagery manifest did not load.");
  assert(/wayback\.maptiles\.arcgis\.com/.test(initial.tileSrc), "Map is not using dated Wayback imagery tiles.");
  assert(initial.eventThumbs > 0, "Change log thumbnails did not render.");
  assert(initial.eventThumbImages > 0, "Event thumbnails did not load imagery tiles.");
  assert(initial.evidenceFrames === 2, "Before/after evidence frames did not render.");
  assert(initial.impactModes.some((text) => /Place change/i.test(text)) && initial.impactModes.some((text) => /Traffic/i.test(text)) && initial.impactModes.some((text) => /Components/i.test(text)), "Impact mode controls did not render.");
  assert(initial.impactCards > 0, "Impact/component cards did not render for the selected event.");
  assert(/not causal|observed place|affected/i.test(initial.impactText), "Impact panel is missing descriptive, caveated copy.");
  assert(initial.selectedTitle.length > 5, "Evidence brief did not select an initial event.");

  await page.locator('[data-impact-mode="traffic"]').click();
  await page.waitForFunction(() => window.BimsAtlas.state.impactMode === "traffic", null, { timeout: 5000 });
  const trafficImpact = await page.evaluate(() => ({
    active: document.querySelector('[data-impact-mode="traffic"]')?.getAttribute("aria-pressed"),
    text: document.querySelector("#impactPanel")?.textContent || "",
    meters: document.querySelectorAll("#impactPanel .impact-meter").length,
    mode: document.querySelector("#mapStage")?.dataset.impactView || "",
  }));
  assert(trafficImpact.active === "true" && trafficImpact.mode === "traffic", "Traffic impact mode did not become active.");
  assert(/traffic|congestion|mobility|not causal/i.test(trafficImpact.text) && trafficImpact.meters > 0, "Traffic impact mode did not render traffic context and meters.");

  await page.locator('[data-impact-mode="components"]').click();
  await page.waitForFunction(() => window.BimsAtlas.state.impactMode === "components", null, { timeout: 5000 });
  const componentImpact = await page.evaluate(() => ({
    active: document.querySelector('[data-impact-mode="components"]')?.getAttribute("aria-pressed"),
    text: document.querySelector("#impactPanel")?.textContent || "",
    cards: document.querySelectorAll("#impactPanel .component-card").length,
    activeCards: document.querySelectorAll("#impactPanel .component-card.active").length,
    mode: document.querySelector("#mapStage")?.dataset.impactView || "",
  }));
  assert(componentImpact.active === "true" && componentImpact.mode === "components", "Components impact mode did not become active.");
  assert(componentImpact.cards >= 2 && componentImpact.activeCards >= 1 && /Components come from|Affected/i.test(componentImpact.text), "Components impact mode did not render affected/current-state component cards.");

  await page.locator('[data-impact-mode="place"]').click();
  await page.waitForFunction(() => window.BimsAtlas.state.impactMode === "place", null, { timeout: 5000 });
  assert(/Historical evidence map, not a prediction engine/i.test(initial.visibleText), "Non-prediction caveat is not visible.");
  assert(!/Run Simulation|Solana|Scenario Studio|2036 Scenario|Branch Workspace/i.test(initial.visibleText), "Legacy simulator UI copy is still visible.");

  await page.locator("#citySelect").selectOption("nyc");
  await page.waitForFunction(() => window.BimsAtlas.state.cityId === "nyc" && window.BimsAtlas.state.city?.city_id === "nyc", null, { timeout: 10000 });
  await page.waitForSelector("#eventList .event-card", { timeout: 10000 });
  const nycState = await page.evaluate(() => ({
    area: document.querySelector("#areaTitle")?.textContent || "",
    selected: window.BimsAtlas.state.selectedEvent?.title || "",
    markers: document.querySelectorAll(".map-marker").length,
  }));
  assert(/New York City/i.test(nycState.area), "City selector did not switch to NYC.");
  assert(nycState.markers > 0, "NYC map did not render markers.");

  await page.locator('[data-category="transport"]').click();
  await page.waitForFunction(() => window.BimsAtlas.state.category === "transport", null, { timeout: 10000 });
  const transportState = await page.evaluate(() => ({
    category: window.BimsAtlas.state.category,
    count: window.BimsAtlas.filteredEvents().length,
    listMeta: document.querySelector("#listMeta")?.textContent || "",
  }));
  assert(transportState.category === "transport", "Transport layer did not activate.");
  assert(transportState.count > 0, "Transport filter should show records.");
  assert(/records/i.test(transportState.listMeta), "Filter result count did not update.");

  await page.locator("#view3dButton").click();
  const mode3d = await page.locator("#mapStage").evaluate((node) => node.classList.contains("mode-3d"));
  assert(mode3d, "3D view toggle did not activate.");

  const mapBox = await page.locator("#mapViewport").boundingBox();
  assert(mapBox && mapBox.width > 100 && mapBox.height > 100, "Map viewport bounds are unavailable.");
  const centerBeforeDrag = await page.evaluate(() => [...window.BimsAtlas.state.mapCenter]);
  const dragStartX = mapBox.x + mapBox.width * 0.80;
  const dragStartY = mapBox.y + mapBox.height * 0.42;
  await page.mouse.move(dragStartX, dragStartY);
  await page.mouse.down();
  await page.mouse.move(mapBox.x + mapBox.width * 0.70, mapBox.y + mapBox.height * 0.54, { steps: 6 });
  await page.mouse.up();
  const centerAfterDrag = await page.evaluate(() => [...window.BimsAtlas.state.mapCenter]);
  assert(
    Math.abs(centerAfterDrag[0] - centerBeforeDrag[0]) > 0.0001 || Math.abs(centerAfterDrag[1] - centerBeforeDrag[1]) > 0.0001,
    "Dragging the 3D map did not move the map center."
  );
  const zoomBeforeWheel = await page.evaluate(() => window.BimsAtlas.state.mapZoom);
  await page.mouse.move(mapBox.x + mapBox.width * 0.80, mapBox.y + mapBox.height * 0.48);
  await page.mouse.wheel(0, -700);
  await page.waitForFunction((zoom) => window.BimsAtlas.state.mapZoom !== zoom, zoomBeforeWheel, { timeout: 5000 });
  const zoomAfterWheel = await page.evaluate(() => window.BimsAtlas.state.mapZoom);
  assert(zoomAfterWheel > zoomBeforeWheel, "Wheel zoom did not zoom into the 3D map.");

  const timelineBefore = await page.evaluate(() => ({
    selectedId: window.BimsAtlas.state.selectedEventId,
    selectedTitle: document.querySelector("#detailTitle")?.textContent || "",
    firstMarkerTitle: document.querySelector(".map-marker")?.getAttribute("aria-label") || "",
    markerCount: document.querySelectorAll(".map-marker").length,
    firstCardId: document.querySelector("#eventList [data-event-id]")?.dataset.eventId || "",
    year: window.BimsAtlas.state.year,
    afterImageryId: window.BimsAtlas.state.afterImagery?.id || "",
  }));
  const timelineTarget = await page.evaluate(() => {
    const current = window.BimsAtlas.state.year;
    return window.BimsAtlas.state.years.filter((year) => year >= 2014 && year !== current)[0]
      || window.BimsAtlas.state.years.filter((year) => year >= 2000 && year !== current)[0]
      || current;
  });
  await page.evaluate(async (year) => window.BimsAtlas.setYear(year), timelineTarget);
  await page.waitForFunction((year) => window.BimsAtlas.state.year === year, timelineTarget, { timeout: 10000 });
  const timelineAfter = await page.evaluate(() => ({
    selectedId: window.BimsAtlas.state.selectedEventId,
    selectedTitle: document.querySelector("#detailTitle")?.textContent || "",
    firstMarkerTitle: document.querySelector(".map-marker")?.getAttribute("aria-label") || "",
    markerCount: document.querySelectorAll(".map-marker").length,
    firstCardId: document.querySelector("#eventList [data-event-id]")?.dataset.eventId || "",
    timelineText: document.querySelector("#timelineSummary")?.textContent || "",
    afterImageryId: window.BimsAtlas.state.afterImagery?.id || "",
  }));
  assert(timelineAfter.selectedId === timelineBefore.selectedId, "Timeline scrub changed the selected event.");
  assert(timelineAfter.selectedTitle === timelineBefore.selectedTitle, "Timeline scrub changed the evidence brief.");
  assert(timelineAfter.firstCardId === timelineBefore.firstCardId, "Timeline scrub rerendered or reordered the changelog.");
  assert(timelineAfter.firstMarkerTitle !== timelineBefore.firstMarkerTitle || timelineAfter.markerCount !== timelineBefore.markerCount, "Timeline scrub did not change the visible year-specific map markers.");
  assert(new RegExp(String(timelineTarget)).test(timelineAfter.timelineText), "Timeline summary did not announce the target year.");
  assert(timelineAfter.afterImageryId !== timelineBefore.afterImageryId, "Timeline scrub did not switch the dated imagery layer.");

  await page.locator("#eventSearch").fill("congestion");
  await page.waitForFunction(() => /congestion/i.test(window.BimsAtlas.state.search), null, { timeout: 10000 });
  const searchState = await page.evaluate(() => ({
    count: window.BimsAtlas.filteredEvents().length,
    title: document.querySelector("#detailTitle")?.textContent || "",
  }));
  assert(searchState.count > 0, "Search should find congestion records in NYC.");

  await page.locator("#citySelect").selectOption("belfast");
  await page.waitForFunction(() => window.BimsAtlas.state.cityId === "belfast" && window.BimsAtlas.state.city?.city_id === "belfast", null, { timeout: 10000 });
  await page.waitForSelector("#eventList .event-card", { timeout: 10000 });
  const belfastState = await page.evaluate(() => ({
    area: document.querySelector("#areaTitle")?.textContent || "",
    records: window.BimsAtlas.filteredEvents().length,
    sourcesText: document.querySelector("#sourceList")?.textContent || "",
    limitations: document.querySelector("#limitationsList")?.textContent || "",
  }));
  assert(/Belfast/i.test(belfastState.area), "City selector did not switch to Belfast.");
  assert(belfastState.records > 0, "Belfast records did not load.");
  assert(/Causal claim is not made|source limitations/i.test(belfastState.limitations), "Limitations do not show the causal caveat.");
  assert(belfastState.sourcesText.length > 20, "Evidence sources did not render.");

  await page.screenshot({ path: path.join(outputDir, "civicreplay-browser-smoke.png"), fullPage: false });
  await browser.close();

  const filteredErrors = consoleErrors.filter((error) => !/favicon/i.test(error));
  assert(filteredErrors.length === 0, `Browser console errors:\n${filteredErrors.join("\n")}`);
  console.log("CivicReplay browser smoke OK: city switching, filters, map overlay, timeline, evidence brief, and legacy-copy guard.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
