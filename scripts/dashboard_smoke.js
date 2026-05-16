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

async function assertResponsiveLayout(page, label) {
  const state = await atlasState(page);
  assert(state.scrollWidth <= state.clientWidth + 4, `${label}: page overflows horizontally.`);
  assert(state.mapCanvas === 1, `${label}: MapLibre canvas is missing.`);
  assert(state.pinCount > 0 && state.visiblePinCount > 0, `${label}: map event pins are missing.`);
  assert(state.zoomButtons === 2, `${label}: zoom buttons are missing.`);
  assert(/OpenStreetMap contributors/i.test(state.attribution), `${label}: OSM attribution is missing.`);
  assert(state.detailTitle.length > 8, `${label}: evidence detail panel did not render.`);
  assert(state.layersCount.includes("/6"), `${label}: layer state is missing.`);
  assert(!/CivicReplay|Run Simulation|Scenario Studio|10-year/i.test(state.bodyText), `${label}: stale legacy copy is visible.`);
  return state;
}

(async () => {
  ensureOutputDir();
  const browser = await chromium.launch({ headless: true });
  const consoleMessages = [];
  const pageErrors = [];

  const desktop = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  attachConsoleCapture(desktop, consoleMessages, pageErrors);
  await openAtlas(desktop, atlasUrl);
  await desktop.waitForTimeout(1800);
  const desktopState = await assertResponsiveLayout(desktop, "desktop");
  assert(desktopState.scrollHeight <= desktopState.clientHeight + 4, "desktop: fixed atlas shell should not vertically overflow.");
  const desktopPng = await desktop.screenshot({ path: path.join(outputDir, "paper-atlas-desktop.png"), fullPage: false });
  assertDetailedPng(desktopPng, assert, "Paper atlas desktop");

  const tablet = await browser.newPage({ viewport: { width: 900, height: 760 }, deviceScaleFactor: 1 });
  attachConsoleCapture(tablet, consoleMessages, pageErrors);
  await openAtlas(tablet, atlasUrl);
  await tablet.waitForTimeout(1200);
  const tabletState = await assertResponsiveLayout(tablet, "tablet");
  assert(tabletState.scrollWidth <= 904, "tablet: responsive shell exceeded viewport width.");
  await tablet.screenshot({ path: path.join(outputDir, "paper-atlas-tablet.png"), fullPage: false });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  attachConsoleCapture(mobile, consoleMessages, pageErrors);
  await openAtlas(mobile, atlasUrl);
  await mobile.waitForTimeout(1200);
  const mobileState = await assertResponsiveLayout(mobile, "mobile");
  assert(mobileState.scrollWidth <= mobileState.clientWidth + 4, "mobile: responsive shell has horizontal overflow.");
  assert(mobileState.activePin?.inViewport, "mobile: active selected event pin is not visible.");
  const mobilePng = await mobile.screenshot({ path: path.join(outputDir, "paper-atlas-mobile.png"), fullPage: false });
  assertDetailedPng(mobilePng, assert, "Paper atlas mobile");

  await browser.close();
  const actionable = actionableConsoleMessages(consoleMessages);
  assert(pageErrors.length === 0, `Dashboard page errors:\n${pageErrors.join("\n")}`);
  assert(actionable.length === 0, `Dashboard console warnings/errors:\n${actionable.map((message) => `${message.type}: ${message.text}`).join("\n")}`);
  console.log("OpenCityLog paper-atlas dashboard smoke OK: desktop, tablet, and mobile layouts passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
