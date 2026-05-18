const fs = require("fs");
const path = require("path");
const {
  actionableConsoleMessages,
  assert,
  assertDetailedPng,
  atlasState,
  atlasUrl,
  attachConsoleCapture,
  chromium,
  clickPin,
  ensureOutputDir,
  openAtlas,
  outputDir,
} = require("./atlas_smoke_helpers");

function cameraMatches(before, after) {
  if (!before?.mapCenter || !after?.mapCenter) return false;
  return Math.abs(before.mapCenter.lng - after.mapCenter.lng) < 0.001
    && Math.abs(before.mapCenter.lat - after.mapCenter.lat) < 0.001
    && Math.abs(before.mapZoom - after.mapZoom) < 0.02
    && Math.abs(before.mapPitch - after.mapPitch) <= 1
    && Math.abs(before.mapBearing - after.mapBearing) < 0.05;
}

(async () => {
  ensureOutputDir();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const consoleMessages = [];
  const pageErrors = [];
  attachConsoleCapture(page, consoleMessages, pageErrors);

  await openAtlas(page, atlasUrl);
  await page.waitForFunction(
    () => window.BimsAtlas?.state?.detailLayerLoaded && window.BimsAtlas?.state?.lensOverlayLoaded,
    null,
    { timeout: 45000 }
  );
  await page.waitForTimeout(1200);
  const initial = await atlasState(page);

  assert(initial.title === "OpenCityLog — A City Change Atlas", "Atlas page title changed or did not load.");
  assert(initial.mapCanvas === 1, "MapLibre canvas did not render.");
  assert(initial.pinCount > 0 && initial.visiblePinCount > 0, "Map event pins did not render in the viewport.");
  assert(initial.zoomButtons === 2, "Map zoom controls are missing.");
  assert(/OpenStreetMap contributors/i.test(initial.attribution), "OpenStreetMap attribution is missing.");
  assert(initial.eventRows > 0 && initial.changelogOpen === "true", "Restored changelog list did not render on desktop.");
  assert(initial.mapTools === 2, "Restored map tools are missing.");
  assert(initial.bimsAtlasApi, "BimsAtlas compatibility API is missing.");
  assert(initial.detailLayerLoaded && !initial.detailLayerError, `OSM-derived detail layers did not mount: ${initial.detailLayerError}`);
  assert(initial.lensOverlayLoaded && !initial.lensOverlayError, `Event-derived lens overlays did not mount: ${initial.lensOverlayError}`);
  assert(initial.lensEventFeatureCount > 0, "Event-derived lens source did not receive current timeline records.");
  assert(initial.lensHeatmapVisible && initial.lensPointsVisible, "Event heatmap and current-year lens point overlays are not visible.");
  assert(initial.transportRoadVisible, "Transport road lens should be visible while the transport layer is enabled.");
  assert(initial.transportRoadYearLoaded === Number(initial.year), "Transport road lens did not load the current timeline year.");
  assert(initial.compareOpen === "false", "Compare panel should start closed.");
  assert(initial.layersCount === "6/6 on", "All paper-atlas layers should be active on first load.");
  assert(initial.detailOpen && initial.detailTitle.length > 8, "Selected event detail panel did not render.");
  assert(initial.detailLensEvidenceRows === 6 && initial.detailEvidenceButtons > 0, "Detail panel did not render before/after evidence across lenses.");
  assert(initial.welcomeOpen === "false" && initial.welcomeVisibility === "hidden", "Welcome card did not close cleanly.");
  assert(!/CivicReplay|Run Simulation|Scenario Studio|10-year/i.test(initial.bodyText), "Legacy simulator copy is visible.");

  await page.evaluate(() => window.BimsAtlas?.recenterMap?.());
  await page.waitForTimeout(800);
  const yorkPin = await clickPin(page, "York Street");
  await page.waitForFunction(
    () => document.querySelector(".detail-title")?.textContent.includes("York Street"),
    null,
    { timeout: 10000 }
  );
  const afterPinClick = await atlasState(page);
  assert(afterPinClick.detailTitle === "York Street rail station opened", "Clicking a map pin did not update the evidence detail panel.");
  assert(afterPinClick.activePin?.text.includes("York Street"), "Clicked map pin did not become the active event.");

  const grandCentralTitle = "Belfast Grand Central Station opened";
  await page.locator("#searchInput").fill(grandCentralTitle);
  await page.waitForFunction(
    (title) => [...document.querySelectorAll("#eventList .event-row")].some((row) => row.textContent.includes(title)),
    grandCentralTitle,
    { timeout: 10000 }
  );
  await page.locator("#eventList .event-row").filter({ hasText: grandCentralTitle }).first().click();
  await page.waitForFunction(
    () => document.querySelector(".detail-title")?.textContent.includes("Belfast Grand Central Station opened"),
    null,
    { timeout: 10000 }
  );
  const afterListClick = await atlasState(page);
  assert(afterListClick.detailTitle === "Belfast Grand Central Station opened", "Clicking the changelog list did not select the event detail.");
  assert(afterListClick.activePin?.text.includes("Belfast Grand Central"), "Changelog selection did not sync to the map pin.");
  await page.locator("#searchInput").fill("");
  await page.waitForFunction(() => !window.BimsAtlas?.state?.search, null, { timeout: 10000 });

  await page.locator(".layer-row[data-layer='transport']").click();
  await page.waitForFunction(
    () => document.querySelector(".layer-row[data-layer='transport']")?.getAttribute("data-on") === "false",
    null,
    { timeout: 10000 }
  );
  const afterFilterOff = await atlasState(page);
  assert(afterFilterOff.layersCount === "5/6 on", "Layer click did not update the active layer count.");
  assert(afterFilterOff.transportOn === "false", "Transport layer did not toggle off.");
  assert(afterFilterOff.lensHeatmapVisible && !afterFilterOff.transportRoadVisible, "Layer filter did not update heatmap/transport lens visibility.");
  assert(afterFilterOff.pinCount > 0 && afterFilterOff.transportPinCount === 0, "Transport layer filter did not remove transport map pins.");

  await page.locator(".layer-row[data-layer='transport']").click();
  await page.waitForFunction(
    () => document.querySelector(".layer-row[data-layer='transport']")?.getAttribute("data-on") === "true",
    null,
    { timeout: 10000 }
  );
  const afterFilterOn = await atlasState(page);
  assert(afterFilterOn.transportRoadVisible, "Transport road lens did not return when the transport layer was re-enabled.");

  const beforeZoom = await atlasState(page);
  await page.locator(".maplibregl-ctrl-zoom-in").click();
  await page.waitForFunction(
    (zoom) => window.BimsAtlas?.state?.map?.getZoom?.() > zoom + 0.2,
    beforeZoom.mapZoom,
    { timeout: 10000 }
  );
  const afterZoom = await atlasState(page);
  assert(afterZoom.mapZoom > beforeZoom.mapZoom, "Map zoom control did not change the map zoom.");

  await page.locator("#compareBtn").click();
  await page.waitForFunction(
    () => document.querySelector("#comparePanel")?.getAttribute("data-open") === "true"
      && document.querySelectorAll("#compareStats .lens-evidence-row").length === 6,
    null,
    { timeout: 10000 }
  );
  const afterCompare = await atlasState(page);
  assert(afterCompare.compareOpen === "true" && /Delta|records logged/.test(afterCompare.compareStats), "Compare panel did not show record-count stats.");
  assert(afterCompare.compareEvidenceButtons > 0, "Compare panel did not expose before/after evidence rows.");

  await page.locator("#tiltBtn").click();
  await page.waitForFunction(() => window.BimsAtlas?.state?.map?.getPitch?.() > 10, null, { timeout: 10000 });
  const afterTilt = await atlasState(page);
  assert(afterTilt.tiltPressed === "true" && afterTilt.mapPitch > 10, "Tilt map tool did not change map pitch.");
  await page.locator("#recenterBtn").click();
  await page.waitForTimeout(800);

  const detailScroll = await page.evaluate(() => {
    const detailBody = document.querySelector(".detail-body");
    if (!detailBody) return { hasBody: false };
    detailBody.scrollTop = 0;
    const before = detailBody.scrollTop;
    detailBody.scrollTop = Math.min(160, detailBody.scrollHeight - detailBody.clientHeight);
    return { hasBody: true, before, after: detailBody.scrollTop, scrollHeight: detailBody.scrollHeight, clientHeight: detailBody.clientHeight };
  });
  assert(detailScroll.hasBody && detailScroll.scrollHeight > detailScroll.clientHeight && detailScroll.after > detailScroll.before, "Detail evidence panel is not scrollable.");

  const scrubRect = await page.locator("#tlScrub").boundingBox();
  assert(scrubRect, "Timeline scrub target is missing.");
  const beforeTimeline = await atlasState(page);
  await page.mouse.click(scrubRect.x + scrubRect.width * 0.35, scrubRect.y + scrubRect.height / 2);
  await page.waitForFunction(
    (oldYear) => {
      const state = window.BimsAtlas?.state;
      return state && String(state.year) !== oldYear && state.transportRoadYearLoaded === state.year;
    },
    beforeTimeline.year,
    { timeout: 10000 }
  );
  await page.waitForTimeout(400);
  const afterTimeline = await atlasState(page);
  assert(afterTimeline.year !== "2024", "Timeline scrub did not change the selected year.");
  assert(afterTimeline.pinCount > 0 && afterTimeline.visiblePinCount > 0, "Timeline scrub did not keep map events visible.");
  assert(cameraMatches(beforeTimeline, afterTimeline), "Timeline scrub moved the map camera instead of preserving the current viewport.");
  assert(afterTimeline.lensHeatmapVisible && afterTimeline.lensPointsVisible, "Timeline scrub hid the event lens overlays.");
  assert(afterTimeline.transportRoadYearLoaded === Number(afterTimeline.year), "Timeline scrub did not swap the transport lens to the selected year.");

  const screenshot = await page.screenshot({ path: path.join(outputDir, "paper-atlas-browser-smoke.png"), fullPage: false });
  assertDetailedPng(screenshot, assert, "Paper atlas browser smoke");
  fs.writeFileSync(path.join(outputDir, "paper-atlas-browser-smoke-state.json"), JSON.stringify({
    initial,
    yorkPin,
    afterPinClick,
    afterListClick,
    afterFilterOff,
    afterFilterOn,
    beforeZoom,
    afterZoom,
    beforeTimeline,
    afterTimeline,
    afterCompare,
    afterTilt,
  }, null, 2));

  await browser.close();
  const actionable = actionableConsoleMessages(consoleMessages);
  assert(pageErrors.length === 0, `Browser page errors:\n${pageErrors.join("\n")}`);
  assert(actionable.length === 0, `Browser console warnings/errors:\n${actionable.map((message) => `${message.type}: ${message.text}`).join("\n")}`);
  console.log("OpenCityLog paper-atlas browser smoke OK: load, pins, changelog, lenses, compare, map tools, filter, zoom, scroll, timeline, camera, and screenshot checks passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
