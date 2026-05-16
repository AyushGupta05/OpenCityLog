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
  pinPosition,
} = require("./atlas_smoke_helpers");

(async () => {
  ensureOutputDir();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const consoleMessages = [];
  const pageErrors = [];
  attachConsoleCapture(page, consoleMessages, pageErrors);

  await openAtlas(page, atlasUrl);
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
  assert(initial.compareOpen === "false", "Compare panel should start closed.");
  assert(initial.layersCount === "6/6 on", "All paper-atlas layers should be active on first load.");
  assert(initial.detailOpen && initial.detailTitle.length > 8, "Selected event detail panel did not render.");
  assert(initial.welcomeOpen === "false" && initial.welcomeVisibility === "hidden", "Welcome card did not close cleanly.");
  assert(!/CivicReplay|Run Simulation|Scenario Studio|10-year/i.test(initial.bodyText), "Legacy simulator copy is visible.");

  const yorkPin = await clickPin(page, "York Street");
  await page.waitForFunction(
    () => document.querySelector(".detail-title")?.textContent.includes("York Street"),
    null,
    { timeout: 10000 }
  );
  const afterPinClick = await atlasState(page);
  assert(afterPinClick.detailTitle === "York Street rail station opened", "Clicking a map pin did not update the evidence detail panel.");
  assert(afterPinClick.activePin?.text.includes("York Street"), "Clicked map pin did not become the active event.");

  await page.locator("#eventList .event-row").filter({ hasText: "Belfast Grand Central Station opened" }).first().click();
  await page.waitForFunction(
    () => document.querySelector(".detail-title")?.textContent.includes("Belfast Grand Central Station opened"),
    null,
    { timeout: 10000 }
  );
  const afterListClick = await atlasState(page);
  assert(afterListClick.detailTitle === "Belfast Grand Central Station opened", "Clicking the changelog list did not select the event detail.");
  assert(afterListClick.activePin?.text.includes("Belfast Grand Central"), "Changelog selection did not sync to the map pin.");

  await page.locator(".layer-row[data-layer='transport']").click();
  await page.waitForFunction(
    () => document.querySelector(".layer-row[data-layer='transport']")?.getAttribute("data-on") === "false",
    null,
    { timeout: 10000 }
  );
  const afterFilterOff = await atlasState(page);
  assert(afterFilterOff.layersCount === "5/6 on", "Layer click did not update the active layer count.");
  assert(afterFilterOff.transportOn === "false", "Transport layer did not toggle off.");
  assert(afterFilterOff.visiblePinCount < afterListClick.visiblePinCount, "Layer filter did not reduce visible map pins.");

  await page.locator(".layer-row[data-layer='transport']").click();
  await page.waitForFunction(
    () => document.querySelector(".layer-row[data-layer='transport']")?.getAttribute("data-on") === "true",
    null,
    { timeout: 10000 }
  );

  const beforeZoom = await pinPosition(page, "Belfast Grand Central");
  await page.locator(".maplibregl-ctrl-zoom-in").click();
  await page.waitForTimeout(800);
  const afterZoom = beforeZoom ? await pinPosition(page, beforeZoom.text) : null;
  assert(beforeZoom && afterZoom && (beforeZoom.x !== afterZoom.x || beforeZoom.y !== afterZoom.y), "Map zoom control did not move marker positions.");

  await page.locator("#compareBtn").click();
  await page.waitForFunction(
    () => document.querySelector("#comparePanel")?.getAttribute("data-open") === "true",
    null,
    { timeout: 10000 }
  );
  const afterCompare = await atlasState(page);
  assert(afterCompare.compareOpen === "true" && /Delta|records logged/.test(afterCompare.compareStats), "Compare panel did not show record-count stats.");

  await page.locator("#tiltBtn").click();
  await page.waitForFunction(() => window.BimsAtlas?.state?.map?.getPitch?.() > 10, null, { timeout: 10000 });
  const afterTilt = await atlasState(page);
  assert(afterTilt.tiltPressed === "true" && afterTilt.mapPitch > 10, "Tilt map tool did not change map pitch.");
  await page.locator("#recenterBtn").click();
  await page.waitForTimeout(500);

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
  await page.mouse.click(scrubRect.x + scrubRect.width * 0.35, scrubRect.y + scrubRect.height / 2);
  await page.waitForTimeout(700);
  const afterTimeline = await atlasState(page);
  assert(afterTimeline.year !== "2024", "Timeline scrub did not change the selected year.");
  assert(afterTimeline.pinCount > 0 && afterTimeline.activePin?.inViewport, "Timeline scrub did not keep map events visible.");

  const screenshot = await page.screenshot({ path: path.join(outputDir, "paper-atlas-browser-smoke.png"), fullPage: false });
  assertDetailedPng(screenshot, assert, "Paper atlas browser smoke");
  fs.writeFileSync(path.join(outputDir, "paper-atlas-browser-smoke-state.json"), JSON.stringify({
    initial,
    yorkPin,
    afterPinClick,
    afterListClick,
    afterFilterOff,
    beforeZoom,
    afterZoom,
    afterTimeline,
    afterCompare,
    afterTilt,
  }, null, 2));

  await browser.close();
  const actionable = actionableConsoleMessages(consoleMessages);
  assert(pageErrors.length === 0, `Browser page errors:\n${pageErrors.join("\n")}`);
  assert(actionable.length === 0, `Browser console warnings/errors:\n${actionable.map((message) => `${message.type}: ${message.text}`).join("\n")}`);
  console.log("OpenCityLog paper-atlas browser smoke OK: load, pins, changelog, compare, map tools, filter, zoom, scroll, timeline, and screenshot checks passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
