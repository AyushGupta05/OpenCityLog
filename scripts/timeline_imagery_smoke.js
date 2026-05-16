const path = require("path");
const {
  actionableConsoleMessages,
  assert,
  assertDetailedPng,
  atlasState,
  atlasUrl,
  attachConsoleCapture,
  chromium,
  ensureOutputDir,
  openAtlas,
  outputDir,
} = require("./atlas_smoke_helpers");

async function scrubTo(page, ratio) {
  const scrub = await page.locator("#tlScrub").boundingBox();
  assert(scrub, "Timeline scrub element is missing.");
  await page.mouse.click(scrub.x + scrub.width * ratio, scrub.y + scrub.height / 2);
  await page.waitForTimeout(800);
  return atlasState(page);
}

(async () => {
  ensureOutputDir();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const consoleMessages = [];
  const pageErrors = [];
  attachConsoleCapture(page, consoleMessages, pageErrors);

  await openAtlas(page, atlasUrl);
  await page.waitForTimeout(1600);
  const start = await atlasState(page);
  assert(/OpenStreetMap contributors/i.test(start.attribution), "OSM attribution is missing on first render.");
  assert(start.mapCanvas === 1 && start.visiblePinCount > 0, "Initial map canvas or pins are missing.");

  const early = await scrubTo(page, 0.25);
  assert(early.year !== start.year, "Timeline did not move to an earlier year.");
  assert(early.visiblePinCount > 0 && early.activePin?.inViewport, "Earlier timeline year lost visible event pins.");
  assert(/OpenStreetMap contributors/i.test(early.attribution), "OSM attribution disappeared after timeline scrub.");
  assert(!/satellite|wayback|imagery/i.test(early.bodyText), "Legacy imagery/satellite language appeared in the paper atlas.");
  const earlyPng = await page.screenshot({ path: path.join(outputDir, "paper-atlas-timeline-early.png"), fullPage: false });
  assertDetailedPng(earlyPng, assert, "Paper atlas early timeline");

  const late = await scrubTo(page, 0.95);
  assert(late.year !== early.year, "Timeline did not move to a later year.");
  assert(late.visiblePinCount > 0, "Later timeline year lost visible event pins.");
  assert(/OpenStreetMap contributors/i.test(late.attribution), "OSM attribution disappeared after later timeline scrub.");
  const latePng = await page.screenshot({ path: path.join(outputDir, "paper-atlas-timeline-late.png"), fullPage: false });
  assertDetailedPng(latePng, assert, "Paper atlas late timeline");

  await browser.close();
  const actionable = actionableConsoleMessages(consoleMessages);
  assert(pageErrors.length === 0, `Timeline imagery page errors:\n${pageErrors.join("\n")}`);
  assert(actionable.length === 0, `Timeline imagery console warnings/errors:\n${actionable.map((message) => `${message.type}: ${message.text}`).join("\n")}`);
  console.log("Timeline basemap smoke OK: OSM canvas, attribution, event pins, and screenshots survived timeline scrubbing.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
