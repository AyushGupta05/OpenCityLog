const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { assertDetailedPng } = require("./image_detail");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const url = process.env.URL || "http://127.0.0.1:5173";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForAtlas(page) {
  await page.waitForFunction(
    () => Boolean(window.BimsAtlas?.state?.city && window.BimsAtlas?.filteredEvents),
    null,
    { timeout: 30000 }
  );
  await page.waitForSelector("#eventList .event-card", { timeout: 30000 });
  await page.waitForFunction(
    () => Boolean(
      window.BimsAtlas?.state?.mapReady
      && document.querySelector(".maplibregl-canvas")
      && document.querySelectorAll(".map-marker").length > 0
    ),
    null,
    { timeout: 45000 }
  );
  await page.waitForFunction(
    () => Boolean(
      window.BimsAtlas?.state?.detailLayerLoaded
      && window.BimsAtlas?.state?.lensOverlayLoaded
      && window.BimsAtlas.state.map?.getLayer("detail-roads-visible")
      && window.BimsAtlas.state.map?.getLayer("detail-buildings-extrusion")
      && window.BimsAtlas.state.map?.getLayer("lens-heatmap")
      && window.BimsAtlas.state.map?.getLayer("lens-transport-base")
      && window.BimsAtlas.state.map?.getLayer("lens-transport-roads")
    ),
    null,
    { timeout: 60000 }
  );
}

async function layoutState(page) {
  return page.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      if (!box) return null;
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
      };
    };
    const overlaps = (a, b, gutter = 0) => Boolean(a && b)
      && a.left < b.right + gutter
      && a.right > b.left - gutter
      && a.top < b.bottom + gutter
      && a.bottom > b.top - gutter;
    const invalidVisible = window.BimsAtlas.filteredEvents().filter((event) => !(
      event.displayVerified
      && Array.isArray(event.lngLat)
      && event.sourceIds.some((id) => window.BimsAtlas.state.sourceById.has(id))
    ));
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      topbar: rect(".topbar"),
      lens: rect(".lens-panel"),
      changelog: rect(".change-panel"),
      selected: rect(".selected-project"),
      timeline: rect(".timeline-dock"),
      overview: rect(".overview-card"),
      mapStage: rect("#mapStage"),
      cityMap: rect("#cityMap"),
      attribution: rect("#mapAttribution"),
      eventCards: document.querySelectorAll(".event-card").length,
      lensRows: document.querySelectorAll(".lens-row").length,
      markers: document.querySelectorAll(".map-marker").length,
      mapCanvas: document.querySelectorAll(".maplibregl-canvas").length,
      detailLayerLoaded: Boolean(window.BimsAtlas.state.detailLayerLoaded),
      lensOverlayLoaded: Boolean(window.BimsAtlas.state.lensOverlayLoaded),
      detailRoadLayer: Boolean(window.BimsAtlas.state.map?.getLayer("detail-roads-visible")),
      detailBuildingLayer: Boolean(window.BimsAtlas.state.map?.getLayer("detail-buildings-extrusion")),
      lensHeatmapLayer: Boolean(window.BimsAtlas.state.map?.getLayer("lens-heatmap")),
      lensTransportBaseLayer: Boolean(window.BimsAtlas.state.map?.getLayer("lens-transport-base")),
      lensTransportRoadLayer: Boolean(window.BimsAtlas.state.map?.getLayer("lens-transport-roads")),
      staleVisuals: document.querySelectorAll(".scene-image, .territory-layer, .map-pin, .place-label, .cloud").length,
      bodyText: document.body.innerText,
      invalidVisible: invalidVisible.map((event) => event.id),
      timelineOverlapsPanels: overlaps(rect(".timeline-dock"), rect(".change-panel"), 8) || overlaps(rect(".timeline-dock"), rect(".overview-card"), 8),
      selectedOverlapsChangelog: overlaps(rect(".selected-project"), rect(".change-panel"), 8),
      attributionOverlapsTimeline: overlaps(rect("#mapAttribution"), rect(".timeline-dock"), 8),
    };
  });
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];

  const desktop = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  desktop.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  desktop.on("pageerror", (error) => consoleErrors.push("desktop pageerror: " + error.message));
  await desktop.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForAtlas(desktop);
  await desktop.waitForTimeout(1200);

  const desktopState = await layoutState(desktop);
  assert(desktopState.scrollWidth <= desktopState.clientWidth + 4, `Desktop overflows horizontally: ${desktopState.scrollWidth} > ${desktopState.clientWidth}.`);
  assert(desktopState.scrollHeight <= desktopState.clientHeight + 4, `Desktop overflows vertically: ${desktopState.scrollHeight} > ${desktopState.clientHeight}.`);
  assert(desktopState.mapStage.width >= 1500 && desktopState.mapStage.height >= 860, "Desktop map stage is not full bleed.");
  assert(desktopState.cityMap.width >= 1500 && desktopState.cityMap.height >= 860, "Desktop real map is not full bleed.");
  assert(desktopState.mapCanvas === 1 && desktopState.markers > 0, "Desktop real map canvas or markers are missing.");
  assert(desktopState.detailLayerLoaded && desktopState.detailRoadLayer && desktopState.detailBuildingLayer, "Desktop detailed road/building layers are missing.");
  assert(desktopState.lensOverlayLoaded && desktopState.lensHeatmapLayer && desktopState.lensTransportBaseLayer && desktopState.lensTransportRoadLayer, "Desktop lens heatmap/transport road layers are missing.");
  assert(desktopState.staleVisuals === 0, "Desktop still contains stale fake map visuals.");
  assert(desktopState.lensRows === 5 && desktopState.eventCards === 3, "Desktop panels did not render the expected dense atlas layout.");
  assert(desktopState.invalidVisible.length === 0, `Desktop visible records without sourced geometry: ${desktopState.invalidVisible.join(", ")}`);
  assert(!desktopState.timelineOverlapsPanels, "Desktop timeline overlaps side panels.");
  assert(!desktopState.selectedOverlapsChangelog, "Selected project card overlaps the changelog panel.");
  assert(!desktopState.attributionOverlapsTimeline, "Map attribution overlaps the timeline dock.");
  assert(/OpenCityLog|Lenses|Changelog|City Overview/i.test(desktopState.bodyText), "Desktop key UI regions are missing.");

  const desktopMapPng = await desktop.locator("#cityMap").screenshot();
  assertDetailedPng(desktopMapPng, assert, "Desktop real city basemap");
  fs.writeFileSync(path.join(outputDir, "open-citylog-real-map-desktop-canvas.png"), desktopMapPng);
  const desktopPng = await desktop.screenshot({ path: path.join(outputDir, "open-citylog-real-map-desktop.png"), fullPage: false });
  assertDetailedPng(desktopPng, assert, "Real-map desktop screenshot");

  const medium = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  medium.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  medium.on("pageerror", (error) => consoleErrors.push("medium pageerror: " + error.message));
  await medium.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForAtlas(medium);
  await medium.waitForTimeout(1200);
  const mediumState = await layoutState(medium);
  assert(mediumState.scrollWidth <= mediumState.clientWidth + 4, "Medium desktop overflows horizontally.");
  assert(mediumState.mapCanvas === 1 && mediumState.markers > 0, "Medium real map canvas or markers are missing.");
  assert(mediumState.detailLayerLoaded && mediumState.detailRoadLayer && mediumState.detailBuildingLayer, "Medium detailed road/building layers are missing.");
  assert(mediumState.lensOverlayLoaded && mediumState.lensHeatmapLayer && mediumState.lensTransportBaseLayer && mediumState.lensTransportRoadLayer, "Medium lens heatmap/transport road layers are missing.");
  assert(mediumState.staleVisuals === 0, "Medium still contains stale fake map visuals.");
  assert(mediumState.invalidVisible.length === 0, `Medium visible records without sourced geometry: ${mediumState.invalidVisible.join(", ")}`);
  assert(!mediumState.timelineOverlapsPanels, "Medium desktop timeline overlaps panels.");
  await medium.screenshot({ path: path.join(outputDir, "open-citylog-real-map-medium.png"), fullPage: false });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2, isMobile: true });
  mobile.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  mobile.on("pageerror", (error) => consoleErrors.push("mobile pageerror: " + error.message));
  await mobile.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForAtlas(mobile);
  await mobile.waitForTimeout(1200);

  const mobileState = await layoutState(mobile);
  assert(mobileState.scrollWidth <= mobileState.clientWidth + 4, `Mobile overflows horizontally: ${mobileState.scrollWidth} > ${mobileState.clientWidth}.`);
  assert(mobileState.scrollHeight > mobileState.clientHeight, "Mobile should stack the atlas panels into a scrollable flow.");
  assert(mobileState.topbar.height > 150, "Mobile topbar did not collapse into stacked controls.");
  assert(mobileState.mapStage.height >= 860 && mobileState.cityMap.height >= 860, "Mobile real-map background is too short.");
  assert(mobileState.mapCanvas === 1 && mobileState.markers > 0, "Mobile real map canvas or markers are missing.");
  assert(mobileState.detailLayerLoaded && mobileState.detailRoadLayer && mobileState.detailBuildingLayer, "Mobile detailed road/building layers are missing.");
  assert(mobileState.lensOverlayLoaded && mobileState.lensHeatmapLayer && mobileState.lensTransportBaseLayer && mobileState.lensTransportRoadLayer, "Mobile lens heatmap/transport road layers are missing.");
  assert(mobileState.staleVisuals === 0, "Mobile still contains stale fake map visuals.");
  assert(mobileState.invalidVisible.length === 0, `Mobile visible records without sourced geometry: ${mobileState.invalidVisible.join(", ")}`);
  assert(/OpenCityLog|Changelog|Lenses|View details/i.test(mobileState.bodyText), "Mobile key UI regions are missing.");
  const mobilePng = await mobile.screenshot({ path: path.join(outputDir, "open-citylog-real-map-mobile.png"), fullPage: true });
  assertDetailedPng(mobilePng, assert, "Real-map mobile screenshot");

  await browser.close();

  const filteredErrors = consoleErrors.filter((error) => !(
    /favicon|ERR_CACHE_WRITE_FAILURE/i.test(error)
    || /AJAXError: Failed to fetch \(0\): \/api\/imagery\/wayback\//i.test(error)
  ));
  assert(filteredErrors.length === 0, `Browser console errors:\n${filteredErrors.join("\n")}`);
  console.log("OpenCityLog real-map dashboard smoke OK: desktop, medium, and mobile layout checks passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
