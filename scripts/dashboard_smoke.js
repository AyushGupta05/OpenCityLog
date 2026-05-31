const path = require("path");
const {
  actionableConsoleMessages,
  assert,
  assertDetailedPng,
  atlasState,
  atlasUrl,
  attachConsoleCapture,
  chromium,
  chromiumLaunchOptions,
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
  if (label === "desktop" || label.startsWith("city ") || label === "mobile") {
    assert(state.panelOverlaps.length === 0, `${label}: panels overlap (${state.panelOverlaps.join(", ")}).`);
  }
  if (label === "desktop" || label.startsWith("city ")) {
    assert(state.contentOverflows.length === 0, `${label}: key content clips horizontally (${state.contentOverflows.join(", ")}).`);
  }
  assert(!/CivicReplay|Run Simulation|Scenario Studio|10-year/i.test(state.bodyText), `${label}: stale legacy copy is visible.`);
  return state;
}

async function assertDesktopCoreInteractions(page) {
  const startYear = await page.locator("#tlYear").innerText();
  await page.locator("#prevYearBtn").click();
  await page.waitForTimeout(500);
  const previousYear = await page.locator("#tlYear").innerText();
  assert(Number(previousYear) === Number(startYear) - 1, `desktop: previous-year control did not move from ${startYear} to ${Number(startYear) - 1}.`);
  await page.locator("#nextYearBtn").click();
  await page.waitForTimeout(500);
  const restoredYear = await page.locator("#tlYear").innerText();
  assert(restoredYear === startYear, "desktop: next-year control did not restore the original year.");

  const lensButtons = await page.locator("#lensSwitcher .lens-choice").count();
  assert(lensButtons >= 15, "desktop: lens switcher does not expose the full lens set.");
  await page.locator("#lensSwitcher .lens-choice[data-aspect='planning-pressure']").click();
  await page.waitForTimeout(700);
  let state = await atlasState(page);
  assert(state.activeAspect === "planning-pressure", "desktop: lens switch did not activate Planning Activity.");

  await page.locator("#searchInput").fill("BT2");
  await page.waitForTimeout(400);
  const areaRows = await page.locator("#searchResults .search-row[data-result-type='area']").count();
  assert(areaRows > 0, "desktop: postcode/area search did not return an area result.");
  const firstAreaText = await page.locator("#searchResults .search-row[data-result-type='area']").first().innerText();
  assert(/BT2/i.test(firstAreaText), "desktop: postcode search returned the wrong postcode label.");
  await page.locator("#searchResults .search-row[data-result-type='area']").first().click();
  await page.waitForTimeout(700);
  state = await atlasState(page);
  assert(state.areaFilterValue.length > 0, "desktop: selecting an area search result did not set the area filter.");

  await page.locator("#lensSwitcher .lens-choice[data-aspect='transport-speed']").click();
  await page.waitForTimeout(700);
  await page.locator("#searchInput").fill("gra");
  await page.waitForTimeout(400);
  const eventRows = await page.locator("#searchResults .search-row[data-result-type='event']").count();
  assert(eventRows > 0, "desktop: event search did not return selectable records.");
  await page.locator("#searchResults .search-row[data-result-type='event']").first().click();
  await page.waitForTimeout(700);
  state = await atlasState(page);
  assert(/grand central/i.test(state.detailTitle), "desktop: selecting an event search result did not update the evidence brief.");
}

(async () => {
  ensureOutputDir();
  const browser = await chromium.launch(chromiumLaunchOptions);
  const consoleMessages = [];
  const pageErrors = [];

  const desktop = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  attachConsoleCapture(desktop, consoleMessages, pageErrors);
  await openAtlas(desktop, atlasUrl);
  await desktop.waitForTimeout(1800);
  const desktopState = await assertResponsiveLayout(desktop, "desktop");
  assert(desktopState.scrollHeight <= desktopState.clientHeight + 4, "desktop: fixed atlas shell should not vertically overflow.");
  await assertDesktopCoreInteractions(desktop);
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
  assert(mobileState.visibleLensButtonCount > 0, "mobile: 15-lens controls are hidden.");
  assert(mobileState.visibleLayerRowCount >= 6, "mobile: layer toggles are hidden.");
  assert(mobileState.filterControlCount >= 3, "mobile: evidence, area, and inferred filters are hidden.");
  assert(mobileState.activePin?.inViewport, "mobile: active selected event pin is not visible.");
  const mobilePng = await mobile.screenshot({ path: path.join(outputDir, "paper-atlas-mobile.png"), fullPage: false });
  assertDetailedPng(mobilePng, assert, "Paper atlas mobile");

  const cityChecks = [
    { id: "belfast", label: "Belfast", placeholder: /Belfast/i },
    { id: "london", label: "London", placeholder: /London/i },
    { id: "nyc", label: "New York City", placeholder: /New York City/i },
  ];
  for (const city of cityChecks) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 1 });
    attachConsoleCapture(page, consoleMessages, pageErrors);
    await openAtlas(page, `${atlasUrl}?city=${city.id}&year=2026`);
    await page.waitForTimeout(city.id === "london" ? 2400 : 1400);
    const cityState = await assertResponsiveLayout(page, `city ${city.id}`);
    assert(cityState.city === city.label, `city ${city.id}: loaded ${cityState.city} instead of ${city.label}.`);
    assert(city.placeholder.test(cityState.searchPlaceholder), `city ${city.id}: search placeholder is not city-specific.`);
    assert(cityState.visiblePinCount >= 8, `city ${city.id}: too few visible city records.`);
    await page.close();
  }

  await browser.close();
  const actionable = actionableConsoleMessages(consoleMessages);
  assert(pageErrors.length === 0, `Dashboard page errors:\n${pageErrors.join("\n")}`);
  assert(actionable.length === 0, `Dashboard console warnings/errors:\n${actionable.map((message) => `${message.type}: ${message.text}`).join("\n")}`);
  console.log("OpenCityLog paper-atlas dashboard smoke OK: desktop, tablet, mobile, and Belfast/London/NYC city checks passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
