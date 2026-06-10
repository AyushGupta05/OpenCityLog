const fs = require("fs");
const path = require("path");
const {
  actionableConsoleMessages,
  assert,
  assertDetailedPng,
  imageDetail,
  atlasState,
  atlasUrl,
  attachConsoleCapture,
  chromium,
  chromiumLaunchOptions,
  ensureOutputDir,
  openAtlas,
  outputDir,
} = require("./atlas_smoke_helpers");

function progress(...parts) {
  if (process.env.SMOKE_PROGRESS) console.log("[dashboard_smoke]", ...parts);
}

const REFERENCE_VIEWPORT = { width: 1920, height: 1080 };
const UTILITY_NETWORK_CONTEXT_LAYER_IDS = [
  "lens-utility-network-area-fill",
  "lens-utility-network-area-line",
  "lens-utility-network-case",
  "lens-utility-network",
  "lens-utility-network-assets",
];

function assertReferenceViewportPng(buffer, label) {
  const detail = imageDetail(buffer);
  assert(
    detail.width === REFERENCE_VIEWPORT.width && detail.height === REFERENCE_VIEWPORT.height,
    `${label} screenshot must match the 1920x1080 reference contract, got ${detail.width}x${detail.height}.`
  );
  return detail;
}

function assertReferenceCitywideScreenshotsPersist() {
  for (const [cityId, checks] of Object.entries(CITYWIDE_REFERENCE_LENS_CHECKS)) {
    for (const check of checks) {
      const file = path.join(outputDir, `paper-atlas-${cityId}-${check.aspect}-citywide.png`);
      assert(fs.existsSync(file), `city ${cityId}: missing persisted reference screenshot for ${check.aspect}.`);
      assertReferenceViewportPng(fs.readFileSync(file), `city ${cityId} ${check.aspect} persisted citywide`);
    }
  }
}

const CITYWIDE_REFERENCE_LENS_CHECKS = {
  belfast: [
    { aspect: "transport-speed", year: 2007, rendered: ["visiblePinCount"], renderedLayers: ["lens-guide-flow"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 1, label: "transport speed context" },
    { aspect: "transport-access", year: 2007, rendered: ["visiblePinCount"], renderedLayers: ["lens-guide-citywide-cell-fill", "lens-guide-flow"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 1, label: "transport access context" },
    { aspect: "transport-reliability", year: 2007, rendered: ["visiblePinCount"], renderedLayers: ["lens-transport-event-points"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 1, label: "transport reliability source marker" },
    { aspect: "planning-pressure", year: 2007, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], detailLayers: ["planning_cell"], minDetailFeatures: 1, minDirectRecords: 1, label: "planning pressure cells" },
    { aspect: "planning-delta", year: 2007, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], detailLayers: ["planning_cell"], minDetailFeatures: 1, minDirectRecords: 1, label: "built-change planning cells" },
    { aspect: "planning-parcels", year: 2007, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], detailLayers: ["planning_cell"], minDetailFeatures: 1, minDirectRecords: 1, label: "parcel-stage planning cells" },
    { aspect: "civic-access-gaps", year: 2007, rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], detailLayers: ["civic_coverage_cell", "civic_facility"], minDetailFeatures: 2, minDirectRecords: 1, label: "civic access-gap cells" },
    { aspect: "civic-catchment", year: 2008, rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], detailLayers: ["civic_coverage_cell", "civic_facility"], minDetailFeatures: 2, minDirectRecords: 1, label: "civic catchment cells" },
    { aspect: "civic-demand", year: 2008, rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], detailLayers: ["civic_coverage_cell", "civic_facility"], minDetailFeatures: 2, minDirectRecords: 1, label: "civic demand cells" },
    { aspect: "economy-land-use", year: 2012, rendered: ["lensEconomyCellsRendered"], renderedLayers: ["lens-economy-cells-fill"], detailLayers: ["economy_activity_cell"], minDetailFeatures: 1, minDirectRecords: 1, label: "land-use economy cells" },
    { aspect: "economy-vitality", year: 2015, rendered: ["lensEconomyCellsRendered", "lensEconomyFrontageRendered"], renderedLayers: ["lens-economy-cells-fill", "lens-economy-frontage"], detailLayers: ["economy_activity_cell", "economy_frontage"], minDetailFeatures: 2, minDirectRecords: 1, guideExpected: true, vitalityContextExpected: true, label: "high-street activity context" },
    { aspect: "economy-gravity", year: 2015, rendered: ["lensEconomyCellsRendered", "lensEconomyFrontageRendered"], renderedLayers: ["lens-economy-cells-fill", "lens-economy-frontage"], detailLayers: ["economy_activity_cell", "economy_frontage"], minDetailFeatures: 2, minDirectRecords: 1, label: "economic context links" },
    { aspect: "utilities-capacity", year: 2026, rendered: [], renderedLayers: ["lens-utility-network-area-line", "lens-utility-network-case", "lens-utility-network", "lens-utility-network-assets"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 0, contextArtifact: "utility_network", label: "current utility context" },
    { aspect: "utilities-resilience", year: 2026, rendered: [], renderedLayers: ["lens-utility-network-area-line", "lens-utility-network-case", "lens-utility-network", "lens-utility-network-assets"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 0, contextArtifact: "utility_network", label: "current utility network context" },
    { aspect: "utilities-works", year: 2026, rendered: [], renderedLayers: ["lens-utility-network-area-line", "lens-utility-network-case", "lens-utility-network", "lens-utility-network-assets"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 0, contextArtifact: "utility_network", label: "current utility works context" },
  ],
  london: [
    { aspect: "transport-speed", year: 2023, rendered: ["visiblePinCount"], renderedLayers: ["lens-guide-flow"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 4500, label: "transport speed context" },
    { aspect: "transport-access", year: 2023, rendered: ["visiblePinCount"], renderedLayers: ["lens-guide-citywide-cell-fill", "lens-guide-flow"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 4500, label: "transport access context" },
    { aspect: "transport-reliability", year: 2023, rendered: ["visiblePinCount"], renderedLayers: ["lens-guide-flow"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 4500, label: "transport reliability context" },
    { aspect: "planning-pressure", year: 2018, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], detailLayers: ["planning_cell"], minDetailFeatures: 1200, minDirectRecords: 1600, label: "planning pressure cells" },
    { aspect: "planning-delta", year: 2018, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], detailLayers: ["planning_cell"], minDetailFeatures: 1200, minDirectRecords: 1600, label: "built-change planning cells" },
    { aspect: "planning-parcels", year: 2018, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], detailLayers: ["planning_cell"], minDetailFeatures: 1200, minDirectRecords: 1600, label: "parcel-stage planning cells" },
    { aspect: "civic-access-gaps", year: 2009, rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], detailLayers: ["civic_coverage_cell", "civic_facility"], minDetailFeatures: 16, minDirectRecords: 8, label: "civic access-gap cells" },
    { aspect: "civic-catchment", year: 2009, rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], detailLayers: ["civic_coverage_cell", "civic_facility"], minDetailFeatures: 16, minDirectRecords: 8, label: "civic catchment cells" },
    { aspect: "civic-demand", year: 2024, rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], detailLayers: ["civic_coverage_cell", "civic_facility"], minDetailFeatures: 21000, minDirectRecords: 18000, label: "civic demand cells" },
    { aspect: "economy-land-use", year: 2025, rendered: ["lensEconomyCellsRendered"], renderedLayers: ["lens-economy-cells-fill"], detailLayers: ["economy_activity_cell"], minDetailFeatures: 4000, minDirectRecords: 3000, label: "land-use economy cells" },
    { aspect: "economy-vitality", year: 2025, rendered: ["lensEconomyCellsRendered", "lensEconomyFrontageRendered"], renderedLayers: ["lens-economy-cells-fill", "lens-economy-frontage"], detailLayers: ["economy_activity_cell", "economy_frontage"], minDetailFeatures: 8000, minDirectRecords: 5000, guideExpected: true, vitalityContextExpected: true, label: "high-street activity context" },
    { aspect: "economy-gravity", year: 2025, rendered: ["lensEconomyCellsRendered", "lensEconomyFrontageRendered"], renderedLayers: ["lens-economy-cells-fill", "lens-economy-frontage"], detailLayers: ["economy_activity_cell", "economy_frontage"], minDetailFeatures: 8000, minDirectRecords: 5000, label: "economic context links" },
    { aspect: "utilities-capacity", year: 2026, rendered: [], renderedLayers: ["lens-utility-network-area-line", "lens-utility-network-case", "lens-utility-network", "lens-utility-network-assets"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 0, contextArtifact: "utility_network", label: "current utility context" },
    { aspect: "utilities-resilience", year: 2026, rendered: [], renderedLayers: ["lens-utility-network-area-line", "lens-utility-network-case", "lens-utility-network", "lens-utility-network-assets"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 0, contextArtifact: "utility_network", label: "current utility network context" },
    { aspect: "utilities-works", year: 2026, rendered: [], renderedLayers: ["lens-utility-network-area-line", "lens-utility-network-case", "lens-utility-network", "lens-utility-network-assets"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 0, contextArtifact: "utility_network", label: "current utility works context" },
  ],
  nyc: [
    { aspect: "transport-speed", year: 2026, rendered: ["visiblePinCount"], renderedLayers: ["lens-guide-flow"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 500, label: "transport speed context" },
    { aspect: "transport-access", year: 2026, rendered: ["visiblePinCount"], renderedLayers: ["lens-guide-citywide-cell-fill", "lens-guide-flow"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 500, label: "transport access context" },
    { aspect: "transport-reliability", year: 2026, rendered: ["visiblePinCount"], renderedLayers: ["lens-guide-flow"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 500, label: "transport reliability context" },
    { aspect: "planning-pressure", year: 2025, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], detailLayers: ["planning_cell"], minDetailFeatures: 4900, minDirectRecords: 7000, label: "planning pressure cells" },
    { aspect: "planning-delta", year: 2025, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], detailLayers: ["planning_cell"], minDetailFeatures: 4900, minDirectRecords: 7000, label: "built-change planning cells" },
    { aspect: "planning-parcels", year: 2025, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], detailLayers: ["planning_cell"], minDetailFeatures: 4900, minDirectRecords: 7000, label: "parcel-stage planning cells" },
    { aspect: "civic-access-gaps", year: 2026, rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], detailLayers: ["civic_coverage_cell", "civic_facility"], minDetailFeatures: 230, minDirectRecords: 150, label: "civic access-gap cells" },
    { aspect: "civic-catchment", year: 2026, rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], detailLayers: ["civic_coverage_cell", "civic_facility"], minDetailFeatures: 230, minDirectRecords: 150, label: "civic catchment cells" },
    { aspect: "civic-demand", year: 2026, rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], detailLayers: ["civic_coverage_cell", "civic_facility"], minDetailFeatures: 230, minDirectRecords: 150, label: "civic demand cells" },
    { aspect: "economy-land-use", year: 2009, rendered: ["lensEconomyCellsRendered"], renderedLayers: ["lens-economy-cells-fill"], detailLayers: ["economy_activity_cell"], minDetailFeatures: 260, minDirectRecords: 120, label: "land-use economy cells" },
    { aspect: "economy-vitality", year: 2009, rendered: ["lensEconomyCellsRendered", "lensEconomyFrontageRendered"], renderedLayers: ["lens-economy-cells-fill", "lens-economy-frontage"], detailLayers: ["economy_activity_cell", "economy_frontage"], minDetailFeatures: 520, minDirectRecords: 290, guideExpected: true, vitalityContextExpected: true, label: "high-street activity context" },
    { aspect: "economy-gravity", year: 2009, rendered: ["lensEconomyCellsRendered", "lensEconomyFrontageRendered"], renderedLayers: ["lens-economy-cells-fill", "lens-economy-frontage"], detailLayers: ["economy_activity_cell", "economy_frontage"], minDetailFeatures: 520, minDirectRecords: 290, label: "economic context links" },
    { aspect: "utilities-capacity", year: 2026, rendered: [], renderedLayers: ["lens-utility-network-area-line", "lens-utility-network-case", "lens-utility-network", "lens-utility-network-assets"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 0, contextArtifact: "utility_network", label: "current utility context" },
    { aspect: "utilities-resilience", year: 2026, rendered: [], renderedLayers: ["lens-utility-network-area-line", "lens-utility-network-case", "lens-utility-network", "lens-utility-network-assets"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 0, contextArtifact: "utility_network", label: "current utility network context" },
    { aspect: "utilities-works", year: 2026, rendered: [], renderedLayers: ["lens-utility-network-area-line", "lens-utility-network-case", "lens-utility-network", "lens-utility-network-assets"], detailLayers: [], minDetailFeatures: 0, minDirectRecords: 0, contextArtifact: "utility_network", label: "current utility works context" },
  ],
};

async function openAtlasShell(page, targetUrl) {
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#map .maplibregl-canvas", { timeout: 45000 });
  await page.waitForSelector("#activeLensCard", { timeout: 45000 });
  await page.waitForSelector("#layersList .layer-row", { state: "attached", timeout: 45000 });
  await page.waitForFunction(
    () => document.querySelector("#appStatus")?.textContent.trim() === "",
    null,
    { timeout: 45000 }
  );
  const welcome = page.locator("#welcome[data-open='true']");
  if (await welcome.count()) {
    await page.getByText("Start exploring", { exact: false }).click();
    await page.waitForFunction(
      () => document.querySelector("#welcome")?.getAttribute("data-open") === "false"
        && getComputedStyle(document.querySelector("#welcome")).visibility === "hidden",
      null,
      { timeout: 10000 }
    );
  }
}

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

async function chooseLens(page, aspectId) {
  const details = page.locator("#lensSwitcher .lens-picker");
  if (await details.count()) {
    await details.locator("summary").click();
    await page.waitForFunction(
      (id) => {
        const picker = document.querySelector("#lensSwitcher .lens-picker");
        const button = document.querySelector(`#lensSwitcher .lens-choice[data-aspect="${id}"]`);
        return picker?.open && button && button.offsetParent !== null;
      },
      aspectId,
      { timeout: 10000 }
    );
  }
  const clicked = await page.evaluate((id) => {
    const button = document.querySelector(`#lensSwitcher .lens-choice[data-aspect="${id}"]`);
    if (!button) return false;
    button.scrollIntoView?.({ block: "nearest", inline: "center" });
    button.click();
    return true;
  }, aspectId);
  assert(clicked, `Could not find lens button ${aspectId}.`);
}

async function chooseCity(page, cityId) {
  await page.locator("#cityToggle").click();
  await page.waitForFunction(() => document.querySelector("#cityToggle")?.getAttribute("aria-expanded") === "true", null, { timeout: 10000 });
  const row = page.locator(`#cityMenu .city-row[data-city-id="${cityId}"]`);
  assert(await row.count(), `Could not find city menu row ${cityId}.`);
  await row.click();
  await page.waitForFunction(
    (id) => window.BimsAtlas?.state?.cityId === id
      && window.BimsAtlas?.state?.detailLayerLoaded
      && window.BimsAtlas?.state?.lensOverlayLoaded,
    cityId,
    { timeout: 45000 }
  );
}

async function assertActiveSelectionMatchesFilters(page, label, opts = {}) {
  const selection = await page.evaluate(() => {
    const atlas = window.BimsAtlas;
    const selected = atlas?.state?.selectedEvent || null;
    const filtered = atlas?.filteredEvents?.() || [];
    return {
      activeLens: atlas?.state?.activeLens || "",
      activeAspect: atlas?.state?.activeAspect || "",
      year: Number(atlas?.state?.year),
      selectedId: selected?.id || "",
      selectedTitle: selected?.title || "",
      selectedCategory: selected?.category || "",
      selectedYear: Number(selected?.year),
      inFiltered: selected ? filtered.some((event) => event?.id === selected.id) : false,
    };
  });
  if (!selection.selectedId) {
    assert(!opts.required, `${label}: expected an active source-backed selection but none was selected.`);
    return selection;
  }
  assert(
    selection.selectedCategory === selection.activeLens,
    `${label}: selected ${selection.selectedId} (${selection.selectedTitle}) is ${selection.selectedCategory}, not active lens ${selection.activeLens}.`,
  );
  assert(selection.selectedYear === selection.year, `${label}: selected ${selection.selectedId} is from ${selection.selectedYear}, not active year ${selection.year}.`);
  assert(selection.inFiltered, `${label}: selected ${selection.selectedId} is not present in filtered events for ${selection.activeAspect}.`);
  return selection;
}

async function ensureActiveSourceBackedSelection(page, label) {
  await page.evaluate(async () => {
    const atlas = window.BimsAtlas;
    const events = atlas?.filteredEvents?.() || [];
    const selectedId = atlas?.state?.selectedEvent?.id || "";
    if (selectedId && events.some((event) => event.id === selectedId)) return;
    const documented = events.find((event) => event.confidence === "documented");
    const first = documented || events[0];
    if (first) await atlas?.selectEvent?.(first.id, { silent: true, keepCamera: true });
  });
  await page.waitForFunction(
    () => {
      const atlas = window.BimsAtlas;
      const selected = atlas?.state?.selectedEvent;
      if (!selected) return false;
      if (!(atlas?.filteredEvents?.() || []).some((event) => event.id === selected.id)) return false;
      return (document.querySelector(".detail-title")?.textContent || "").trim().length > 8;
    },
    null,
    { timeout: 10000 }
  );
  return assertActiveSelectionMatchesFilters(page, label, { required: true });
}

async function assertDesktopCoreInteractions(page) {
  const startYear = await page.locator("#tlYear").innerText();
  const canStepPrevious = !(await page.locator("#prevYearBtn").isDisabled());
  const canStepNext = !(await page.locator("#nextYearBtn").isDisabled());
  assert(canStepPrevious || canStepNext, "desktop: both timeline year-step controls are disabled.");
  const stepButton = canStepPrevious ? "#prevYearBtn" : "#nextYearBtn";
  const restoreButton = canStepPrevious ? "#nextYearBtn" : "#prevYearBtn";
  const expectedStepYear = Number(startYear) + (canStepPrevious ? -1 : 1);
  await page.locator(stepButton).click();
  await page.waitForTimeout(500);
  const steppedYear = await page.locator("#tlYear").innerText();
  assert(Number(steppedYear) === expectedStepYear, `desktop: year-step control did not move from ${startYear} to ${expectedStepYear}.`);
  await page.locator(restoreButton).click();
  await page.waitForTimeout(500);
  const restoredYear = await page.locator("#tlYear").innerText();
  assert(restoredYear === startYear, "desktop: opposite year-step control did not restore the original year.");

  const lensButtons = await page.locator("#lensSwitcher .lens-choice").count();
  assert(lensButtons >= 15, "desktop: lens switcher does not expose the full lens set.");
  await chooseLens(page, "planning-pressure");
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

  await page.evaluate(async () => {
    await window.BimsAtlas?.setAreaFilter?.("");
    await window.BimsAtlas?.setYear?.(2007);
    await window.BimsAtlas?.setActiveAspect?.("transport-speed");
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(
    () => Number(window.BimsAtlas?.state?.year) === 2007
      && window.BimsAtlas?.state?.activeAspect === "transport-speed"
      && (window.BimsAtlas?.filteredEvents?.() || []).length > 0,
    null,
    { timeout: 20000 }
  );
  const eventSearchTitle = await page.evaluate(() => {
    const row = document.querySelector("#eventList .event-row");
    const title = row?.querySelector(".event-title")?.textContent || row?.querySelector("strong")?.textContent || row?.textContent || "";
    return String(title).replace(/\s+/g, " ").trim();
  });
  assert(eventSearchTitle.length > 4, "desktop: source-compatible transport view did not expose an event title for search.");
  await page.locator("#searchInput").fill(eventSearchTitle);
  await page.waitForTimeout(400);
  const eventRows = await page.locator("#searchResults .search-row[data-result-type='event']").count();
  assert(eventRows > 0, "desktop: event search did not return selectable records.");
  await page.locator("#searchResults .search-row[data-result-type='event']").first().click();
  await page.waitForTimeout(700);
  state = await atlasState(page);
  assert(state.detailTitle.includes(eventSearchTitle), "desktop: selecting an event search result did not update the evidence brief.");
}

async function assertDesktopButtonsRespond(page) {
  let state = await atlasState(page);
  const startingTheme = await page.locator("body").getAttribute("data-theme");

  await page.locator("#changelogToggle").click();
  await page.waitForFunction(() => document.querySelector("#changelogPanel")?.getAttribute("data-open") === "false", null, { timeout: 10000 });
  await page.locator("#changelogToggle").click();
  await page.waitForFunction(() => document.querySelector("#changelogPanel")?.getAttribute("data-open") === "true", null, { timeout: 10000 });

  await page.locator("#compareBtn").click();
  await page.waitForFunction(() => document.querySelector("#comparePanel")?.getAttribute("data-open") === "true", null, { timeout: 10000 });
  state = await atlasState(page);
  assert(/records logged|Delta/i.test(state.compareStats), "desktop: compare button opened an empty compare panel.");
  await page.locator("#compareClose").click();
  await page.waitForFunction(() => document.querySelector("#comparePanel")?.getAttribute("data-open") === "false", null, { timeout: 10000 });

  await page.locator("#themeBtn").click();
  await page.waitForFunction(
    (theme) => document.body.getAttribute("data-theme") !== theme,
    startingTheme,
    { timeout: 10000 }
  );
  await page.locator("#themeBtn").click();
  await page.waitForFunction(
    (theme) => document.body.getAttribute("data-theme") === theme,
    startingTheme,
    { timeout: 10000 }
  );

  const beforeTilt = await atlasState(page);
  await page.locator("#tiltBtn").click();
  await page.waitForFunction(() => window.BimsAtlas?.state?.map?.getPitch?.() > 10, null, { timeout: 10000 });
  state = await atlasState(page);
  assert(state.tiltPressed === "true" && state.mapPitch > beforeTilt.mapPitch, "desktop: tilt button did not change map pitch.");
  await page.locator("#tiltBtn").click();
  await page.waitForFunction(() => window.BimsAtlas?.state?.map?.getPitch?.() < 10, null, { timeout: 10000 });

  await page.locator("#cityToggle").click();
  await page.waitForFunction(() => document.querySelector("#cityToggle")?.getAttribute("aria-expanded") === "true", null, { timeout: 10000 });
  assert(await page.locator("#cityMenu .city-row").count() >= 3, "desktop: city menu did not expose city choices.");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("#cityToggle")?.getAttribute("aria-expanded") === "false", null, { timeout: 10000 });

  await page.locator("#methodBtn").click();
  await page.waitForFunction(() => document.querySelector("#methodOverlay")?.getAttribute("data-open") === "true", null, { timeout: 10000 });
  await page.locator("#methodClose").click();
  await page.waitForFunction(() => document.querySelector("#methodOverlay")?.getAttribute("data-open") === "false", null, { timeout: 10000 });

  await page.locator("#shareBtn").click();
  await page.waitForFunction(() => document.querySelector("#toast")?.getAttribute("data-show") === "true", null, { timeout: 10000 });

  await page.locator("#playBtn").click();
  await page.waitForFunction(() => document.querySelector("#playBtn")?.getAttribute("aria-pressed") === "true", null, { timeout: 10000 });
  await page.locator("#playBtn").click();
  await page.waitForFunction(() => document.querySelector("#playBtn")?.getAttribute("aria-pressed") === "false", null, { timeout: 10000 });

  await chooseCity(page, "london");
  await page.evaluate(async () => {
    await window.BimsAtlas?.setAreaFilter?.("");
    await window.BimsAtlas?.setYear?.(2024);
    await window.BimsAtlas?.setActiveAspect?.("civic-demand");
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(
    () => window.BimsAtlas?.state?.cityId === "london"
      && Number(window.BimsAtlas?.state?.year) === 2024
      && window.BimsAtlas?.state?.activeAspect === "civic-demand"
      && (window.BimsAtlas?.filteredEvents?.() || []).length > Number(window.BimsAtlas?.state?.eventListLimit || 0)
      && !document.querySelector("#eventListMore")?.hidden,
    null,
    { timeout: 20000 }
  );
  const limitBeforeMore = await page.evaluate(() => Number(window.BimsAtlas?.state?.eventListLimit || 0));
  await page.locator("#eventListMore").click();
  await page.waitForFunction(
    (previous) => Number(window.BimsAtlas?.state?.eventListLimit || 0) > previous,
    limitBeforeMore,
    { timeout: 10000 }
  );
}

async function assertMobileButtonsRespond(page) {
  const startingTheme = await page.locator("body").getAttribute("data-theme");

  await page.locator("#methodBtn").click();
  await page.waitForFunction(() => document.querySelector("#methodOverlay")?.getAttribute("data-open") === "true", null, { timeout: 10000 });
  await page.locator("#methodClose").click();
  await page.waitForFunction(() => document.querySelector("#methodOverlay")?.getAttribute("data-open") === "false", null, { timeout: 10000 });

  await page.locator("#compareBtn").click();
  await page.waitForFunction(() => document.querySelector("#comparePanel")?.getAttribute("data-open") === "true", null, { timeout: 10000 });
  await page.locator("#compareClose").click();
  await page.waitForFunction(() => document.querySelector("#comparePanel")?.getAttribute("data-open") === "false", null, { timeout: 10000 });

  await page.locator("#shareBtn").click();
  await page.waitForFunction(() => document.querySelector("#toast")?.getAttribute("data-show") === "true", null, { timeout: 10000 });

  await page.locator("#themeBtn").click();
  await page.waitForFunction(
    (theme) => document.body.getAttribute("data-theme") !== theme,
    startingTheme,
    { timeout: 10000 }
  );
  await page.locator("#themeBtn").click();
  await page.waitForFunction(
    (theme) => document.body.getAttribute("data-theme") === theme,
    startingTheme,
    { timeout: 10000 }
  );

  await page.locator("#playBtn").click();
  await page.waitForFunction(() => document.querySelector("#playBtn")?.getAttribute("aria-pressed") === "true", null, { timeout: 10000 });
  await page.locator("#playBtn").click();
  await page.waitForFunction(() => document.querySelector("#playBtn")?.getAttribute("aria-pressed") === "false", null, { timeout: 10000 });

  await page.locator("#cityToggle").click();
  await page.waitForFunction(() => document.querySelector("#cityToggle")?.getAttribute("aria-expanded") === "true", null, { timeout: 10000 });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("#cityToggle")?.getAttribute("aria-expanded") === "false", null, { timeout: 10000 });

  await chooseLens(page, "planning-pressure");
  await page.waitForFunction(() => window.BimsAtlas?.state?.activeAspect === "planning-pressure", null, { timeout: 10000 });
  const state = await atlasState(page);
  assert(state.scrollWidth <= state.clientWidth + 4, "mobile after buttons: responsive shell has horizontal overflow.");
  assert(state.activeLens === "built_environment", "mobile: lens button did not switch to Planning & Built.");
}

function lensGroupForAspect(aspectId) {
  if (String(aspectId || "").startsWith("transport-")) return "transport";
  if (String(aspectId || "").startsWith("planning-")) return "planning";
  if (String(aspectId || "").startsWith("civic-")) return "civic";
  if (String(aspectId || "").startsWith("economy-")) return "economy";
  if (String(aspectId || "").startsWith("utilities-")) return "utilities";
  return "other";
}

async function resetDesktopCitywideCoveragePage(page) {
  await page.evaluate(async () => {
    const atlas = window.BimsAtlas;
    if (!atlas) return;
    const input = document.querySelector("#searchInput");
    if (input) input.value = "";
    atlas.state.search = "";
    await atlas.setAreaFilter?.("");
    await atlas.setYear?.(2024);
    atlas.recenterMap?.();
  });
  await page.waitForFunction(
    () => document.querySelector("#mapStudyChip")?.dataset.scope === "city"
      && window.BimsAtlas?.state?.activeAspect,
    null,
    { timeout: 15000 }
  );
}

async function assertDesktopCitywideCoverage(page) {
  await resetDesktopCitywideCoveragePage(page);
  const lensButtons = await page.locator("#lensSwitcher .lens-choice").evaluateAll((buttons) =>
    buttons.map((button) => ({
      id: button.getAttribute("data-aspect"),
      label: button.textContent.trim(),
    })).filter((button) => button.id)
  );
  assert(lensButtons.length === 15, `desktop citywide: expected 15 lens buttons, got ${lensButtons.length}.`);

  let previousGroup = "";
  for (const lens of lensButtons) {
    const group = lensGroupForAspect(lens.id);
    if (previousGroup && group !== previousGroup) {
      progress("desktop reload before", group, "lens family");
      await openAtlas(page, atlasUrl);
      await resetDesktopCitywideCoveragePage(page);
    }
    previousGroup = group;
    progress("desktop lens", lens.id);
    await chooseLens(page, lens.id);
    await page.waitForFunction(
      (id) => window.BimsAtlas?.state?.activeAspect === id,
      lens.id,
      { timeout: 10000 }
    );
    await page.waitForFunction(
      () => {
        const state = window.BimsAtlas?.state;
        if (!state?.map || state.activeLens === "transport") return true;
        if (!state.map.getSource?.("lens-detail-overlays")) return false;
        try {
          return state.map.isSourceLoaded?.("lens-detail-overlays") === true;
        } catch (_error) {
          return false;
        }
      },
      null,
      { timeout: 20000 }
    );
    await page.waitForTimeout(350);
    await page.waitForFunction(
      () => {
        const atlas = window.BimsAtlas;
        const row = atlas?.state?.lensYearCoverageByKey?.get?.(`${atlas?.state?.activeAspect}:${Number(atlas?.state?.year)}`);
        if (row?.visible_map_contract !== false) return true;
        return /broad source-backed|No direct source-backed|No source-backed|withheld|rights|Current mapped OSM utility|current.*utility context/i.test(document.querySelector("#lensLegend")?.textContent || "");
      },
      null,
      { timeout: 10000 }
    );
    await page.waitForFunction(
      () => {
        const state = window.BimsAtlas?.state;
        if (state?.activeLens !== "transport") return true;
        const row = state?.lensYearCoverageByKey?.get?.(`${state?.activeAspect}:${Number(state?.year)}`);
        if (row?.visible_map_contract === false) return true;
        if (state?.transportRoadFeatureCountYearLoaded !== Number(state?.year)) return false;
        if (state?.transportRoadFeatureCount !== 0) return true;
        return /No linework|no generated linework|no filler geometry/i.test(document.querySelector("#lensLegend")?.textContent || "");
      },
      null,
      { timeout: 20000 }
    );
    await page.waitForFunction(
      () => {
        const state = window.BimsAtlas?.state;
        if (state?.activeLens !== "transport") return true;
        if (state?.transportRoadFeatureCountYearLoaded !== Number(state?.year)) return false;
        if (state?.transportRoadFeatureCount === 0) return true;
        const map = state?.map;
        if (!map?.getLayer?.("lens-transport-roads") || map.getLayoutProperty("lens-transport-roads", "visibility") === "none") return false;
        try {
          return map.queryRenderedFeatures({ layers: ["lens-transport-roads"] }).length > 0;
        } catch (_error) {
          return false;
        }
      },
      null,
      { timeout: 20000 }
    );
    const state = await atlasState(page);
    await assertActiveSelectionMatchesFilters(page, `desktop citywide ${lens.id}`, { required: state.lensYearCoverageVisible });
    assert(state.scrollWidth <= state.clientWidth + 4, `desktop citywide ${lens.id}: page overflows horizontally.`);
    assert(state.mapCanvas === 1, `desktop citywide ${lens.id}: MapLibre canvas is missing.`);
    assert(state.citywideLensMode, `desktop citywide ${lens.id}: lens switch left citywide camera mode.`);
    assert(state.mapZoom <= 11.7, `desktop citywide ${lens.id}: lens switch zoomed into a local study area (${state.mapZoom}).`);
    if (state.lensYearCoverageVisible) {
      assert(state.pinCount > 0 && state.visiblePinCount > 0, `desktop citywide ${lens.id}: map event pins are missing.`);
    } else {
      assert(/broad source-backed|No direct source-backed|No source-backed|withheld|rights|Current mapped OSM utility|current.*utility context/i.test(state.lensLegendText), `desktop citywide ${lens.id}: non-visible lens-year lacks a missing/adjacent/withheld evidence warning.`);
      assert(state.pinCount === 0, `desktop citywide ${lens.id}: non-visible lens-year still rendered ${state.pinCount} event pin(s).`);
    }
    assert(state.zoomButtons === 2, `desktop citywide ${lens.id}: zoom buttons are missing.`);
    assert(state.panelOverlaps.length === 0, `desktop citywide ${lens.id}: panels overlap (${state.panelOverlaps.join(", ")}).`);
    assert(state.contentOverflows.length === 0, `desktop citywide ${lens.id}: key content clips horizontally (${state.contentOverflows.join(", ")}).`);
    assert(state.lensLegendText.length > 24, `desktop citywide ${lens.id}: legend did not render.`);
    await page.waitForFunction(() => {
      const atlas = window.BimsAtlas;
      const state = atlas?.state;
      const activeAspect = state?.activeAspect || "";
      const year = Number(state?.year);
      const row = state?.lensYearCoverageByKey?.get?.(`${activeAspect}:${year}`);
      const detailLayer = activeAspect === "planning-pressure"
        ? "planning_cell"
        : activeAspect === "economy-land-use"
        ? "economy_activity_cell"
        : activeAspect === "economy-vitality"
        ? "economy_frontage"
        : "";
      const matchingDetailCount = detailLayer
        ? (state?.lensDetailFeatures || []).filter((feature) => {
          const props = feature?.properties || {};
          return props.layer === detailLayer && Number(props.year || props.visible_year || 0) === year;
        }).length
        : 0;
      const canRenderGuide = ["planning-pressure", "economy-land-use", "economy-vitality"].includes(activeAspect)
        && row?.status === "source_backed_records"
        && row?.visible_map_contract !== false
        && matchingDetailCount > 0;
      if (!canRenderGuide) return true;
      const map = state?.map;
      const guideLayers = [
        "lens-guide-flow",
        "lens-guide-citywide-cell-fill",
        "lens-guide-citywide-cell-line",
        "lens-guide-cell-fill",
        "lens-guide-area-line",
        "lens-guide-ring-line",
        "lens-guide-node",
      ];
      let rendered = 0;
      for (const layer of guideLayers) {
        if (!map?.getLayer?.(layer) || map.getLayoutProperty(layer, "visibility") === "none") continue;
        try {
          rendered += map.queryRenderedFeatures({ layers: [layer] }).length;
        } catch (_error) {
          // Wait for guide source/layer state to settle.
        }
      }
      return (state?.lensGuideFeatureCache?.features?.length || 0) > 0 && rendered > 0;
    }, null, { timeout: 8000 }).catch(() => {});
    const citywideState = await page.evaluate(() => {
      const atlas = window.BimsAtlas;
      const map = atlas?.state?.map;
      const guideLayers = [
        "lens-guide-flow",
        "lens-guide-citywide-cell-fill",
        "lens-guide-citywide-cell-line",
        "lens-guide-cell-fill",
        "lens-guide-area-line",
        "lens-guide-ring-line",
        "lens-guide-node",
      ];
      let renderedGuides = 0;
      for (const layer of guideLayers) {
        if (!map?.getLayer?.(layer) || map.getLayoutProperty(layer, "visibility") === "none") continue;
        try {
          renderedGuides += map.queryRenderedFeatures({ layers: [layer] }).length;
        } catch (_error) {
          // Empty guide layers are acceptable in strict source-only mode.
        }
      }
      const coverageRows = atlas?.state?.lensYearCoverage?.rows || [];
      const activeAspect = atlas?.state?.activeAspect || "";
      const activeLens = atlas?.state?.activeLens || "";
      const activeCoverageRow = coverageRows.find((row) => row?.lens_slug === activeAspect && Number(row?.year) === Number(atlas?.state?.year)) || null;
      const contextRows = coverageRows.filter((row) => /context/i.test(row?.status || "") || Number(row?.coverage_context_feature_count || 0) > 0).length;
      const guideFeatures = atlas?.state?.lensGuideFeatureCache?.features || [];
      const detailLayerForGuide = activeAspect === "planning-pressure"
        ? "planning_cell"
        : activeAspect === "economy-land-use"
        ? "economy_activity_cell"
        : activeAspect === "economy-vitality"
        ? "economy_frontage"
        : ["civic-access-gaps", "civic-catchment", "civic-demand"].includes(activeAspect)
        ? "civic_coverage_cell"
        : "";
      const matchingDetailCount = detailLayerForGuide
        ? (atlas?.state?.lensDetailFeatures || []).filter((feature) => {
          const props = feature?.properties || {};
          return props.layer === detailLayerForGuide && Number(props.year || props.visible_year || 0) === Number(atlas?.state?.year);
        }).length
        : 0;
      const directCanRenderGuide = ["planning-pressure", "economy-land-use", "economy-vitality", "civic-access-gaps", "civic-catchment", "civic-demand"].includes(activeAspect)
        && activeCoverageRow?.status === "source_backed_records"
        && activeCoverageRow?.visible_map_contract !== false
        && matchingDetailCount > 0;
      const citywideScope = Boolean(atlas?.state?.citywideLensMode) || document.querySelector("#mapStudyChip")?.dataset.scope === "city";
      const civicContextCanRenderGuide = ["civic-access-gaps", "civic-catchment", "civic-demand"].includes(activeAspect)
        && Boolean(atlas?.state?.activeLayers?.has?.("civic_services"))
        && (atlas?.state?.civicServiceFeatures || []).length > 0
        && citywideScope
        && atlas?.state?.showInferred !== false
        && !atlas?.state?.search
        && !atlas?.state?.areaFilter;
      const transportContextCanRenderGuide = activeAspect === "transport-access"
        && Boolean(atlas?.state?.activeLayers?.has?.("transport"))
        && (atlas?.state?.transportStopFeatures || []).length > 0
        && citywideScope
        && atlas?.state?.showInferred !== false
        && !atlas?.state?.search
        && !atlas?.state?.areaFilter;
      const transportNetworkContextCanRenderGuide = ["transport-speed", "transport-reliability"].includes(activeAspect)
        && Boolean(atlas?.state?.activeLayers?.has?.("transport"))
        && citywideScope
        && atlas?.state?.showInferred !== false
        && !atlas?.state?.search
        && !atlas?.state?.areaFilter
        && activeCoverageRow?.status === "source_backed_records"
        && activeCoverageRow?.visible_map_contract !== false
        && Number(activeCoverageRow?.direct_event_count || 0) > 0;
      const economyContextCanRenderGuide = ["economy-land-use", "economy-vitality"].includes(activeAspect)
        && Boolean(atlas?.state?.activeLayers?.has?.("economy"))
        && (atlas?.state?.economyAnchorFeatures || []).length > 0
        && citywideScope
        && atlas?.state?.showInferred !== false
        && !atlas?.state?.search
        && !atlas?.state?.areaFilter
        && activeCoverageRow?.status === "source_backed_records"
        && activeCoverageRow?.visible_map_contract !== false
        && Number(activeCoverageRow?.direct_event_count || 0) > 0;
      const canRenderGuide = directCanRenderGuide || civicContextCanRenderGuide || economyContextCanRenderGuide || transportContextCanRenderGuide || transportNetworkContextCanRenderGuide;
      const splitIds = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
      const forbiddenContext = /mapped_context|current_context|road_infill|building_context|context_not_year_specific/i;
      const invalidGuideCount = guideFeatures.filter((feature) => {
        const props = feature?.properties || {};
        const eventIds = splitIds(props.event_ids || props.event_id);
        const sourceIds = splitIds(props.source_ids || props.source_id);
        const transportActivityFeature = props.source_kind === "selected_year_transport_activity_context"
          && props.evidence_role === "selected_year_activity_surface_not_direct_change_evidence";
        if (transportActivityFeature) {
          const objectIds = splitIds(props.source_object_ids || props.source_object_id);
          return !feature?.geometry
            || props.kind !== "flow"
            || !props.flow_style
            || !props.surface_style
            || !props.context_year
            || props.detail_layer !== "transport_roads_year"
            || !props.generated_from
            || !props.source_urls
            || !props.confidence
            || !props.caveat
            || props.direct_evidence_counted !== false
            || props.headline_count_included !== false
            || eventIds.length > 0
            || !sourceIds.length
            || !objectIds.length
            || !sourceIds.every((id) => atlas?.state?.sourceById?.has?.(id));
        }
        const contextFeature = props.source_kind === "current_context"
          || props.evidence_role === "context_not_year_specific_change_evidence";
        if (contextFeature) {
          const objectIds = splitIds(props.source_object_ids || props.source_object_id);
          return !feature?.geometry
            || !props.kind
            || !props.surface_style
            || props.source_kind !== "current_context"
            || props.evidence_role !== "context_not_year_specific_change_evidence"
            || !props.context_year
            || !props.detail_layer
            || !props.generated_from
            || !props.source_urls
            || !props.confidence
            || !props.caveat
            || props.direct_evidence_counted !== false
            || props.headline_count_included !== false
            || eventIds.length > 0
            || !sourceIds.length
            || !objectIds.length
            || !sourceIds.every((id) => atlas?.state?.sourceById?.has?.(id));
        }
        return !feature?.geometry
          || !props.kind
          || !props.surface_style
          || !props.source_kind
          || !props.evidence_role
          || !props.context_year
          || !props.detail_layer
          || !props.generated_from
          || !props.source_urls
          || !props.confidence
          || forbiddenContext.test(`${props.source_kind} ${props.evidence_role}`)
          || !eventIds.length
          || !sourceIds.length
          || !eventIds.every((id) => atlas?.state?.eventById?.has?.(id))
          || !sourceIds.every((id) => atlas?.state?.sourceById?.has?.(id));
      }).length;
      const renderedLayerCount = (layerId) => {
        if (!map?.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") return 0;
        try {
          return map.queryRenderedFeatures({ layers: [layerId] }).length;
        } catch (_error) {
          return 0;
        }
      };
      const renderedUtilityContext = [
        "lens-utility-network-area-fill",
        "lens-utility-network-area-line",
        "lens-utility-network-case",
        "lens-utility-network",
        "lens-utility-network-assets",
      ].reduce((sum, layerId) => sum + renderedLayerCount(layerId), 0);
      const detailLayersByLens = {
        built_environment: ["lens-planning-cells-fill"],
        civic_services: ["lens-civic-coverage-fill", "lens-civic-facility-icons"],
        economy: activeAspect === "economy-land-use"
          ? ["lens-economy-cells-fill"]
          : ["lens-economy-cells-fill", "lens-economy-frontage"],
        utilities: ["lens-utilities-trace", "lens-utility-asset-icons"],
        transport: ["lens-transport-roads", "lens-transport-base"],
      };
      const renderedSourceBackedDetail = (detailLayersByLens[activeLens] || [])
        .reduce((sum, layerId) => sum + renderedLayerCount(layerId), 0);
      const renderedTransportYearRoads = renderedLayerCount("lens-transport-roads");
      const bounds = atlas?.state?.city?.bounds || [];
      const [west, south, east, north] = bounds.map(Number);
      const cells = new Set();
      const cityPins = [...document.querySelectorAll(".pin[data-scope='city']")].length;
      for (const [id, marker] of atlas?.state?.markers || []) {
        const event = atlas?.state?.eventById?.get(id);
        if (!event?.lngLat || !Number.isFinite(west) || !Number.isFinite(east) || !Number.isFinite(south) || !Number.isFinite(north)) continue;
        const [lng, lat] = event.lngLat.map(Number);
        const x = Math.max(0, Math.min(2, Math.floor(((lng - west) / Math.max(0.000001, east - west)) * 3)));
        const y = Math.max(0, Math.min(2, Math.floor(((lat - south) / Math.max(0.000001, north - south)) * 3)));
        cells.add(`${x}:${y}`);
      }
      return {
        renderedGuides,
        contextRows,
        canRenderGuide,
        guideFeatureCount: guideFeatures.length,
        invalidGuideCount,
        activeLens,
        activeAspect,
        visibleMapContract: Boolean(activeCoverageRow?.visible_map_contract),
        eventCount: Number(activeCoverageRow?.event_count || 0),
        detailFeatureCount: Number(activeCoverageRow?.detail_feature_count || 0),
        renderedSourceBackedDetail,
        renderedTransportYearRoads,
        transportRoadFeatureCount: atlas?.state?.transportRoadFeatureCount,
        utilityNetworkFeatureCount: atlas?.state?.utilityNetworkFeatures?.length || 0,
        utilityNetworkPath: atlas?.state?.utilityNetworkFeaturesPathLoaded || "",
        renderedUtilityContext,
        markerCount: atlas?.state?.markers?.size || 0,
        cityPins,
        markerCells: cells.size,
        chip: document.querySelector("#mapStudyChipText")?.textContent.trim() || "",
        legend: document.querySelector("#lensLegend")?.textContent || "",
      };
    });
    assert(/Citywide extent/i.test(citywideState.chip), `desktop citywide ${lens.id}: citywide chip is not visible.`);
    if (citywideState.canRenderGuide) {
      assert(citywideState.guideFeatureCount > 0, `desktop citywide ${lens.id}: guide cache is empty.`);
      assert(citywideState.invalidGuideCount === 0, `desktop citywide ${lens.id}: guide has ${citywideState.invalidGuideCount} feature(s) missing provenance fields.`);
      assert(citywideState.renderedGuides > 0, `desktop citywide ${lens.id}: guide did not render.`);
    } else {
      assert(citywideState.guideFeatureCount === 0, `desktop citywide ${lens.id}: unsupported guide cache has ${citywideState.guideFeatureCount} features.`);
      assert(citywideState.renderedGuides === 0, `desktop citywide ${lens.id}: unsupported guide layers rendered ${citywideState.renderedGuides} features.`);
    }
    assert(citywideState.contextRows === 0, `desktop citywide ${lens.id}: lens-year coverage still includes context filler rows.`);
    if (citywideState.activeLens === "utilities") {
      assert(citywideState.utilityNetworkPath.includes("/utility_network_2026.geojson"), `desktop citywide ${lens.id}: current utility context did not load (${citywideState.utilityNetworkPath}).`);
      assert(citywideState.utilityNetworkFeatureCount >= 5000, `desktop citywide ${lens.id}: too few current utility context features loaded (${citywideState.utilityNetworkFeatureCount}).`);
      assert(citywideState.renderedUtilityContext >= 8, `desktop citywide ${lens.id}: current utility context rendered too sparsely (${citywideState.renderedUtilityContext}).`);
      assert(/Current mapped OSM utility|current.*utility context|not.*capacity|not selected-year/i.test(citywideState.legend), `desktop citywide ${lens.id}: current utility context is not explicitly caveated.`);
    }
    if (citywideState.markerCount >= 3 && citywideState.renderedSourceBackedDetail === 0 && citywideState.renderedTransportYearRoads === 0) {
      assert(citywideState.markerCells >= 3, `desktop citywide ${lens.id}: map markers are clustered too tightly for a marker-driven citywide view.`);
    }
    assert(citywideState.markerCount <= 68, `desktop citywide ${lens.id}: citywide markers exceed visual budget (${citywideState.markerCount}).`);
    assert(citywideState.cityPins === citywideState.markerCount, `desktop citywide ${lens.id}: citywide markers were not scoped for quiet styling.`);
    if (citywideState.visibleMapContract && citywideState.detailFeatureCount > 0) {
      assert(citywideState.renderedSourceBackedDetail > 0, `desktop citywide ${lens.id}: source-backed lens detail exists but rendered no citywide features.`);
    }
    if (citywideState.visibleMapContract && citywideState.activeLens === "transport" && citywideState.eventCount > 0) {
      if (citywideState.renderedTransportYearRoads === 0) {
        assert(
          citywideState.transportRoadFeatureCount === 0
            && /No linework|no generated linework|no filler geometry|Current mapped road context|not measured|not selected-year/i.test(citywideState.legend),
          `desktop citywide ${lens.id}: source-backed transport records have no road features but the sparse/context state was not explicit.`,
        );
      } else {
        assert(citywideState.renderedTransportYearRoads > 0, `desktop citywide ${lens.id}: source-backed transport records exist but rendered no year-specific road features.`);
      }
    }
  }

  await chooseCity(page, "nyc");
  await page.evaluate(async () => {
    await window.BimsAtlas?.setAreaFilter?.("");
    await window.BimsAtlas?.setActiveAspect?.("planning-delta");
    await window.BimsAtlas?.setYear?.(2010);
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(
    () => Number(window.BimsAtlas?.state?.year) === 2010
      && window.BimsAtlas?.state?.activeAspect === "planning-delta"
      && (() => {
        const map = window.BimsAtlas?.state?.map;
        if (!map?.getSource?.("lens-detail-overlays")) return false;
        try {
          return map.isSourceLoaded?.("lens-detail-overlays") === true;
        } catch (_error) {
          return false;
        }
      })()
      && document.querySelector("#mapStudyChip")?.dataset.scope === "city",
    null,
    { timeout: 20000 }
  );
  await page.waitForTimeout(500);
  const historicPlanning = await atlasState(page);
  const historicPlanningDetailCount = await page.evaluate(() => {
    const atlas = window.BimsAtlas;
    const row = atlas?.state?.lensYearCoverageByKey?.get?.(`planning-delta:${Number(atlas?.state?.year)}`);
    return Number(row?.detail_feature_count || 0);
  });
  await page.evaluate(async () => {
    await window.BimsAtlas?.setYear?.(2024);
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(
    () => Number(window.BimsAtlas?.state?.year) === 2024
      && window.BimsAtlas?.state?.activeAspect === "planning-delta"
      && Number(window.BimsAtlas?.state?.lensDetailYearLoaded) === 2024
      && (() => {
        const map = window.BimsAtlas?.state?.map;
        if (!map?.getSource?.("lens-detail-overlays")) return false;
        try {
          return map.isSourceLoaded?.("lens-detail-overlays") === true;
        } catch (_error) {
          return false;
        }
      })(),
    null,
    { timeout: 20000 }
  );
  await page.waitForTimeout(700);
  const currentPlanning = await atlasState(page);
  const currentPlanningDetailCount = await page.evaluate(() => {
    const atlas = window.BimsAtlas;
    const row = atlas?.state?.lensYearCoverageByKey?.get?.(`planning-delta:${Number(atlas?.state?.year)}`);
    return Number(row?.detail_feature_count || 0);
  });
  assert(historicPlanning.lensPlanningCellsRendered > 0, "desktop citywide NYC planning-delta 2010: dated source-backed planning cells did not render.");
  assert(currentPlanning.lensPlanningCellsRendered > 0, "desktop citywide NYC planning-delta 2024: current source-backed planning cells did not render.");
  assert(currentPlanningDetailCount > historicPlanningDetailCount, `desktop citywide NYC planning-delta: 2024 detail feature count (${currentPlanningDetailCount}) did not increase from 2010 (${historicPlanningDetailCount}).`);
  assert(Number(currentPlanning.lensDetailYearLoaded) === 2024, "desktop citywide NYC planning-delta: building/planning source did not reload to the current timeline year.");
  await page.evaluate(async () => {
    const event = (window.BimsAtlas?.filteredEvents?.() || []).find((item) => item?.lngLat);
    if (event) await window.BimsAtlas?.selectEvent?.(event.id, { silent: true, keepCamera: true });
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(
    () => document.querySelector("#mapStudyChip")?.dataset.scope === "city"
      && (document.querySelector(".detail-title")?.textContent.trim() || "").length > 8,
    null,
    { timeout: 10000 }
  );

  const samples = await page.evaluate(() => {
    const atlas = window.BimsAtlas;
    const bounds = atlas?.state?.city?.bounds || [];
    const [west, south, east, north] = bounds.map(Number);
    if (![west, south, east, north].every(Number.isFinite)) return [];
    const cells = new Map();
    const events = (atlas.filteredEvents?.() || [])
      .filter((event) => event.lngLat && event.confidence !== "inferred");
    for (const event of events) {
      const [lng, lat] = event.lngLat.map(Number);
      if (![lng, lat].every(Number.isFinite)) continue;
      const x = Math.max(0, Math.min(3, Math.floor(((lng - west) / Math.max(0.000001, east - west)) * 4)));
      const y = Math.max(0, Math.min(3, Math.floor(((lat - south) / Math.max(0.000001, north - south)) * 4)));
      const key = `${x}:${y}`;
      const score = (Number(event.year || 0) * 0.01) + (String(event.title || "").length * 0.001);
      const current = cells.get(key);
      if (!current || score > current.score) cells.set(key, { label: event.area || event.title, lngLat: event.lngLat, score });
    }
    return [...cells.values()]
      .sort((a, b) => a.lngLat[0] - b.lngLat[0] || a.lngLat[1] - b.lngLat[1])
      .slice(0, 5)
      .map(({ label, lngLat }) => ({ label, lngLat }));
  });
  assert(samples.length >= 3, "desktop citywide: could not find enough non-central event clusters to pan-test the city.");

  for (const sample of samples) {
    await page.evaluate((target) => {
      const map = window.BimsAtlas?.state?.map;
      map?.jumpTo?.({ center: target.lngLat, zoom: 12.9, pitch: 0, bearing: 0 });
    }, sample);
    await page.waitForTimeout(500);
    const state = await assertResponsiveLayout(page, `desktop panned ${sample.label}`);
    assert(state.visiblePinCount > 0, `desktop panned ${sample.label}: no visible markers after panning away from the centre.`);
    const nearest = await page.evaluate((target) => {
      const atlas = window.BimsAtlas;
      let best = Infinity;
      for (const [id, marker] of atlas?.state?.markers || []) {
        const event = atlas?.state?.eventById?.get(id);
        const rect = marker.getElement().getBoundingClientRect();
        const inViewport = rect.right >= 0 && rect.left <= window.innerWidth && rect.bottom >= 0 && rect.top <= window.innerHeight;
        if (!inViewport || !event?.lngLat) continue;
        const dx = (event.lngLat[0] - target.lngLat[0]) * 111320 * Math.cos((target.lngLat[1] * Math.PI) / 180);
        const dy = (event.lngLat[1] - target.lngLat[1]) * 111320;
        best = Math.min(best, Math.hypot(dx, dy));
      }
      return best;
    }, sample);
    assert(Number.isFinite(nearest) && nearest < 4500, `desktop panned ${sample.label}: visible markers are not local to the panned area.`);
  }

  await page.locator("#recenterBtn").click();
  await page.waitForFunction(() => document.querySelector("#mapStudyChip")?.dataset.scope === "city", null, { timeout: 10000 });
}

async function directGuideState(page) {
  return page.evaluate(() => {
    const state = window.BimsAtlas?.state;
    const map = state?.map;
    const activeAspect = state?.activeAspect || "";
    const year = Number(state?.year);
    const row = state?.lensYearCoverageByKey?.get?.(`${activeAspect}:${year}`);
    const detailLayer = activeAspect === "planning-pressure"
      ? "planning_cell"
      : activeAspect === "economy-land-use"
      ? "economy_activity_cell"
      : activeAspect === "economy-vitality"
      ? "economy_frontage"
      : ["civic-access-gaps", "civic-catchment", "civic-demand"].includes(activeAspect)
      ? "civic_coverage_cell"
      : "";
    const matchingDetailCount = detailLayer
      ? (state?.lensDetailFeatures || []).filter((feature) => {
        const props = feature?.properties || {};
        return props.layer === detailLayer && Number(props.year || props.visible_year || 0) === year;
      }).length
      : 0;
    const guideLayers = ["lens-guide-flow", "lens-guide-citywide-cell-fill", "lens-guide-citywide-cell-line", "lens-guide-cell-fill", "lens-guide-area-line", "lens-guide-ring-line", "lens-guide-node"];
    let renderedGuides = 0;
    for (const layer of guideLayers) {
      if (!map?.getLayer?.(layer) || map.getLayoutProperty(layer, "visibility") === "none") continue;
      try {
        renderedGuides += map.queryRenderedFeatures({ layers: [layer] }).length;
      } catch (_error) {
        // Empty or settling guide layers are handled by assertions below.
      }
    }
    const guideFeatures = state?.lensGuideFeatureCache?.features || [];
    const splitIds = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
    const forbiddenContext = /mapped_context|current_context|road_infill|building_context|context_not_year_specific/i;
    const citywideScope = Boolean(state?.citywideLensMode) || document.querySelector("#mapStudyChip")?.dataset.scope === "city";
    const contextGuideFeatureCount = guideFeatures.filter((feature) => {
      const props = feature?.properties || {};
      return props.source_kind === "current_context" || props.evidence_role === "context_not_year_specific_change_evidence";
    }).length;
    const directGuideFeatureCount = Math.max(0, guideFeatures.length - contextGuideFeatureCount);
    const invalidGuideCount = guideFeatures.filter((feature) => {
      const props = feature?.properties || {};
      const eventIds = splitIds(props.event_ids || props.event_id);
      const sourceIds = splitIds(props.source_ids || props.source_id);
      const contextFeature = props.source_kind === "current_context"
        || props.evidence_role === "context_not_year_specific_change_evidence";
      if (contextFeature) {
        const objectIds = splitIds(props.source_object_ids || props.source_object_id);
        return !feature?.geometry
          || !props.kind
          || !props.surface_style
          || props.source_kind !== "current_context"
          || props.evidence_role !== "context_not_year_specific_change_evidence"
          || !props.context_year
          || !props.detail_layer
          || !props.generated_from
          || !props.source_urls
          || !props.confidence
          || !props.caveat
          || props.direct_evidence_counted !== false
          || props.headline_count_included !== false
          || eventIds.length > 0
          || !sourceIds.length
          || !objectIds.length
          || !sourceIds.every((id) => state?.sourceById?.has?.(id));
      }
      return !feature?.geometry
        || !props.kind
        || !props.surface_style
        || !props.source_kind
        || !props.evidence_role
        || !props.context_year
        || !props.detail_layer
        || !props.generated_from
        || !props.source_urls
        || !props.confidence
        || forbiddenContext.test(`${props.source_kind} ${props.evidence_role}`)
        || !eventIds.length
        || !sourceIds.length
        || !eventIds.every((id) => state?.eventById?.has?.(id))
        || !sourceIds.every((id) => state?.sourceById?.has?.(id));
    }).length;
    return {
      activeAspect,
      year,
      canRenderGuide: (["planning-pressure", "economy-land-use", "economy-vitality", "civic-access-gaps", "civic-catchment", "civic-demand"].includes(activeAspect)
        && row?.status === "source_backed_records"
        && row?.visible_map_contract !== false
        && matchingDetailCount > 0)
        || (["civic-access-gaps", "civic-catchment", "civic-demand"].includes(activeAspect)
          && Boolean(state?.activeLayers?.has?.("civic_services"))
          && (state?.civicServiceFeatures || []).length > 0
          && citywideScope
          && state?.showInferred !== false
          && !state?.search
          && !state?.areaFilter),
      guideFeatureCount: guideFeatures.length,
      directGuideFeatureCount,
      contextGuideFeatureCount,
      renderedGuides,
      invalidGuideCount,
    };
  });
}

async function assertDirectGuideSurface(page, label, { expected, allowContextGuide = false }) {
  if (expected) {
    await page.waitForFunction(() => {
      const state = window.BimsAtlas?.state;
      const map = state?.map;
      const guideFeatures = state?.lensGuideFeatureCache?.features || [];
      if (!guideFeatures.length) return false;
      const guideLayers = ["lens-guide-citywide-cell-fill", "lens-guide-citywide-cell-line", "lens-guide-cell-fill", "lens-guide-area-line", "lens-guide-flow", "lens-guide-node"];
      let rendered = 0;
      for (const layer of guideLayers) {
        if (!map?.getLayer?.(layer) || map.getLayoutProperty(layer, "visibility") === "none") continue;
        try {
          rendered += map.queryRenderedFeatures({ layers: [layer] }).length;
        } catch (_error) {
          // Wait for guide source/layer state to settle.
        }
      }
      return rendered > 0;
    }, null, { timeout: 12000 }).catch(() => {});
  }
  let state = await directGuideState(page);
  if (expected) {
    assert(state.canRenderGuide, `${label}: guide was not eligible for ${state.activeAspect} ${state.year}.`);
    assert(state.guideFeatureCount > 0, `${label}: guide cache is empty.`);
    assert(state.renderedGuides > 0, `${label}: guide did not render.`);
    assert(state.invalidGuideCount === 0, `${label}: guide has ${state.invalidGuideCount} invalid feature(s).`);
    return;
  }
  if (allowContextGuide) {
    if (state.renderedGuides === 0) {
      await page.evaluate(() => window.BimsAtlas?.recenterMap?.());
      await page.waitForFunction(
        () => document.querySelector("#mapStudyChip")?.dataset.scope === "city",
        null,
        { timeout: 10000 }
      );
      await page.waitForFunction(() => {
        const map = window.BimsAtlas?.state?.map;
        return ["lens-guide-citywide-cell-fill", "lens-guide-citywide-cell-line", "lens-guide-cell-fill", "lens-guide-area-line", "lens-guide-flow", "lens-guide-node"].some((layer) => {
          if (!map?.getLayer?.(layer) || map.getLayoutProperty(layer, "visibility") === "none") return false;
          try {
            return map.queryRenderedFeatures({ layers: [layer] }).length > 0;
          } catch (_error) {
            return false;
          }
        });
      }, null, { timeout: 12000 }).catch(() => {});
      state = await directGuideState(page);
    }
    assert(state.directGuideFeatureCount === 0, `${label}: direct guide cache has ${state.directGuideFeatureCount} feature(s); only context guide cells should be present.`);
    assert(state.contextGuideFeatureCount > 0, `${label}: expected current-context guide cells were not present.`);
    assert(state.invalidGuideCount === 0, `${label}: context guide has ${state.invalidGuideCount} invalid feature(s).`);
    assert(state.renderedGuides > 0, `${label}: context guide did not render.`);
    return;
  }
  assert(state.guideFeatureCount === 0, `${label}: non-eligible guide cache has ${state.guideFeatureCount} feature(s).`);
  assert(state.renderedGuides === 0, `${label}: non-eligible guide rendered ${state.renderedGuides} feature(s).`);
}

async function assertPlanningPressureCitywideContext(page, cityId, targetYear) {
  const minimumContextFlows = { belfast: 80, london: 260, nyc: 220 }[cityId] || 80;
  await page.waitForFunction(() => {
    const features = window.BimsAtlas?.state?.lensGuideFeatureCache?.features || [];
    return features.some((feature) => feature?.properties?.source_kind === "current_context"
      && feature?.properties?.detail_layer === "transport_roads_base"
      && feature?.properties?.flow_style === "planning_pressure_trace");
  }, null, { timeout: 20000 });
  await page.waitForFunction(() => {
    const map = window.BimsAtlas?.state?.map;
    if (!map?.getLayer?.("lens-guide-flow") || map.getLayoutProperty("lens-guide-flow", "visibility") === "none") return false;
    try {
      return map.queryRenderedFeatures({ layers: ["lens-guide-flow"] }).some((feature) => {
        const props = feature.properties || {};
        return props.source_kind === "current_context"
          && props.detail_layer === "transport_roads_base"
          && props.flow_style === "planning_pressure_trace";
      });
    } catch (_error) {
      return false;
    }
  }, null, { timeout: 20000 });
  const state = await page.evaluate(({ year }) => {
    const atlas = window.BimsAtlas;
    const map = atlas?.state?.map;
    const guide = atlas?.state?.lensGuideFeatureCache?.features || [];
    const split = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
    const row = atlas?.state?.lensYearCoverageByKey?.get?.(`planning-pressure:${Number(year)}`) || null;
    const detailCount = (atlas?.state?.lensDetailFeatures || []).filter((feature) => {
      const props = feature.properties || {};
      return props.layer === "planning_cell" && Number(props.year || props.visible_year || 0) === Number(year);
    }).length;
    const detailEventIds = new Set();
    for (const feature of atlas?.state?.lensDetailFeatures || []) {
      const props = feature.properties || {};
      if (props.layer !== "planning_cell" || Number(props.year || props.visible_year || 0) !== Number(year)) continue;
      for (const eventId of split(props.event_ids_all || props.event_ids || "")) detailEventIds.add(eventId);
    }
    const mapDirectCount = Number(row?.map_direct_event_count ?? row?.direct_event_count ?? 0);
    let renderedContextFlows = 0;
    try {
      renderedContextFlows = map?.getLayer?.("lens-guide-flow") && map.getLayoutProperty("lens-guide-flow", "visibility") !== "none"
        ? map.queryRenderedFeatures({ layers: ["lens-guide-flow"] }).filter((feature) => {
          const props = feature.properties || {};
          return props.source_kind === "current_context"
            && props.detail_layer === "transport_roads_base"
            && props.flow_style === "planning_pressure_trace";
        }).length
        : 0;
    } catch (_error) {
      renderedContextFlows = 0;
    }
    const contextFlows = guide.filter((feature) => {
      const props = feature.properties || {};
      return props.kind === "flow"
        && props.source_kind === "current_context"
        && props.evidence_role === "context_not_year_specific_change_evidence"
        && props.detail_layer === "transport_roads_base"
        && props.flow_style === "planning_pressure_trace";
    });
    const directAggregates = guide.filter((feature) => {
      const props = feature.properties || {};
      return props.kind === "surface_cell"
        && props.source_kind === "source_backed_event_aggregate"
        && props.evidence_role === "selected_year_direct_event_aggregate"
        && props.detail_layer === "event_point_aggregate";
    });
    const invalidContext = contextFlows.filter((feature) => {
      const props = feature.properties || {};
      return !feature.geometry
        || props.direct_evidence_counted !== false
        || props.headline_count_included !== false
        || split(props.event_ids || props.event_id).length > 0
        || !split(props.source_ids || props.source_id).every((sourceId) => atlas?.state?.sourceById?.has?.(sourceId))
        || !split(props.source_object_ids || props.source_object_id).length
        || !props.source_urls
        || !props.generated_from
        || !props.caveat;
    }).length;
    const invalidDirectAggregates = directAggregates.filter((feature) => {
      const props = feature.properties || {};
      const eventIds = split(props.event_ids || props.event_id);
      const sourceIds = split(props.source_ids || props.source_id);
      return !feature.geometry
        || props.direct_evidence_counted !== true
        || props.headline_count_included !== true
        || !eventIds.length
        || !sourceIds.length
        || !eventIds.every((eventId) => atlas?.state?.eventById?.has?.(eventId))
        || !sourceIds.every((sourceId) => atlas?.state?.sourceById?.has?.(sourceId))
        || !props.source_urls
        || !props.generated_from
        || /current_context|context_not_year_specific/i.test(`${props.source_kind} ${props.evidence_role}`);
    }).length;
    const duplicateDirectAggregateEventCount = directAggregates.reduce((sum, feature) => {
      const props = feature.properties || {};
      return sum + split(props.event_ids || props.event_id).filter((eventId) => detailEventIds.has(eventId)).length;
    }, 0);
    const aggregateExpected = mapDirectCount >= 6
      && mapDirectCount > detailEventIds.size
      && detailCount < Math.min(96, Math.max(24, Math.round(mapDirectCount * 0.92)));
    return {
      contextFlowCount: contextFlows.length,
      directAggregateCount: directAggregates.length,
      invalidContext,
      invalidDirectAggregates,
      duplicateDirectAggregateEventCount,
      renderedContextFlows,
      aggregateExpected,
      roadContextPath: atlas?.state?.planningRoadContextPathLoaded || "",
      roadContextSourceCount: atlas?.state?.planningRoadContextFeatures?.length || 0,
      detailCount,
      mapDirectCount,
    };
  }, { year: targetYear });
  assert(state.roadContextPath.includes("transport_roads_base.geojson"), `planning context ${cityId}: road context path did not load (${state.roadContextPath}).`);
  assert(state.roadContextSourceCount >= minimumContextFlows, `planning context ${cityId}: too few source road features loaded (${state.roadContextSourceCount}).`);
  assert(state.contextFlowCount >= minimumContextFlows, `planning context ${cityId}: too few citywide current-context road traces (${state.contextFlowCount}).`);
  assert(state.renderedContextFlows > 0, `planning context ${cityId}: current-context road traces did not render.`);
  assert(state.invalidContext === 0, `planning context ${cityId}: ${state.invalidContext} road-context guide feature(s) lack provenance/non-headline flags.`);
  assert(state.invalidDirectAggregates === 0, `planning context ${cityId}: ${state.invalidDirectAggregates} direct event aggregate(s) lack provenance.`);
  assert(state.duplicateDirectAggregateEventCount === 0, `planning context ${cityId}: ${state.duplicateDirectAggregateEventCount} direct event aggregate id(s) duplicate detail cells.`);
  if (state.aggregateExpected) {
    assert(state.directAggregateCount > 0, `planning context ${cityId}: sparse planning detail did not produce direct event aggregate cells.`);
  }
}

async function assertEconomyLandUseCitywideContext(page, cityId, targetYear) {
  await page.waitForFunction(() => {
    const features = window.BimsAtlas?.state?.lensGuideFeatureCache?.features || [];
    return features.some((feature) => {
      const props = feature?.properties || {};
      return props.lens_id === "economy-land-use"
        && props.source_kind === "current_context"
        && props.detail_layer === "economy_anchors_2026"
        && props.surface_style === "land_use_tile";
    });
  }, null, { timeout: 20000 });
  await page.waitForFunction(() => {
    const map = window.BimsAtlas?.state?.map;
    if (!map?.getLayer?.("lens-guide-citywide-cell-fill") || map.getLayoutProperty("lens-guide-citywide-cell-fill", "visibility") === "none") return false;
    try {
      return map.queryRenderedFeatures({ layers: ["lens-guide-citywide-cell-fill"] }).some((feature) => {
        const props = feature.properties || {};
        return props.lens_id === "economy-land-use"
          && props.source_kind === "current_context"
          && props.detail_layer === "economy_anchors_2026";
      });
    } catch (_error) {
      return false;
    }
  }, null, { timeout: 20000 });
  const state = await page.evaluate(({ year }) => {
    const atlas = window.BimsAtlas;
    const map = atlas?.state?.map;
    const features = (atlas?.state?.lensGuideFeatureCache?.features || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.lens_id === "economy-land-use"
          && props.source_kind === "current_context"
          && props.detail_layer === "economy_anchors_2026";
      });
    const split = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
    const invalid = features.filter((feature) => {
      const props = feature.properties || {};
      const eventIds = split(props.event_ids || props.event_id);
      const sourceIds = split(props.source_ids || props.source_id);
      const objectIds = split(props.source_object_ids || props.source_object_id);
      return !feature.geometry
        || props.kind !== "surface_cell"
        || props.surface_style !== "land_use_tile"
        || props.evidence_role !== "context_not_year_specific_change_evidence"
        || !props.context_year
        || !props.generated_from
        || !props.source_urls
        || !props.confidence
        || !props.caveat
        || props.direct_evidence_counted !== false
        || props.headline_count_included !== false
        || eventIds.length > 0
        || !sourceIds.length
        || !objectIds.length
        || !sourceIds.every((id) => atlas?.state?.sourceById?.has?.(id));
    }).length;
    let rendered = 0;
    if (map?.getLayer?.("lens-guide-citywide-cell-fill") && map.getLayoutProperty("lens-guide-citywide-cell-fill", "visibility") !== "none") {
      try {
        rendered = map.queryRenderedFeatures({ layers: ["lens-guide-citywide-cell-fill"] })
          .filter((feature) => {
            const props = feature.properties || {};
            return props.lens_id === "economy-land-use"
              && props.source_kind === "current_context"
              && props.detail_layer === "economy_anchors_2026";
          }).length;
      } catch (_error) {
        rendered = 0;
      }
    }
    const row = atlas?.state?.lensYearCoverageByKey?.get?.(`economy-land-use:${Number(year)}`);
    return {
      contextTileCount: features.length,
      invalid,
      rendered,
      sourcePath: atlas?.state?.economyAnchorFeaturesPathLoaded || "",
      sourceFeatureCount: atlas?.state?.economyAnchorFeatures?.length || 0,
      visible: Boolean(row?.visible_map_contract),
      directCount: Number(row?.direct_event_count || 0),
    };
  }, { year: targetYear });
  const minSourceFeatureCount = { belfast: 1200, london: 6000, nyc: 5000 }[cityId] || 1200;
  const minContextTileCount = { belfast: 420, london: 900, nyc: 800 }[cityId] || 420;
  assert(state.sourcePath.includes("economy_anchors_2026.geojson"), `economy land-use context ${cityId}: economy anchors did not load (${state.sourcePath}).`);
  assert(state.sourceFeatureCount >= minSourceFeatureCount, `economy land-use context ${cityId}: too few source economy anchors loaded (${state.sourceFeatureCount}).`);
  assert(state.visible && state.directCount > 0, `economy land-use context ${cityId}: current context rendered without selected-year direct economy evidence.`);
  assert(state.contextTileCount >= minContextTileCount, `economy land-use context ${cityId}: too few current-context land-use tiles (${state.contextTileCount}).`);
  assert(state.rendered > 0, `economy land-use context ${cityId}: current-context land-use tiles did not render.`);
  assert(state.invalid === 0, `economy land-use context ${cityId}: ${state.invalid} context tile(s) lack provenance/non-headline flags.`);
}

async function assertEconomyVitalityCitywideContext(page, cityId, targetYear) {
  await page.waitForFunction(() => {
    const features = window.BimsAtlas?.state?.lensGuideFeatureCache?.features || [];
    return features.some((feature) => {
      const props = feature?.properties || {};
      return props.lens_id === "economy-vitality"
        && props.source_kind === "current_context"
        && props.detail_layer === "economy_anchors_2026"
        && props.surface_style === "vitality_anchor_tile";
    });
  }, null, { timeout: 20000 });
  await page.waitForFunction(() => {
    const map = window.BimsAtlas?.state?.map;
    if (!map?.getLayer?.("lens-guide-citywide-cell-fill") || map.getLayoutProperty("lens-guide-citywide-cell-fill", "visibility") === "none") return false;
    try {
      return map.queryRenderedFeatures({ layers: ["lens-guide-citywide-cell-fill"] }).some((feature) => {
        const props = feature.properties || {};
        return props.lens_id === "economy-vitality"
          && props.source_kind === "current_context"
          && props.detail_layer === "economy_anchors_2026";
      });
    } catch (_error) {
      return false;
    }
  }, null, { timeout: 20000 });
  const state = await page.evaluate(({ year }) => {
    const atlas = window.BimsAtlas;
    const map = atlas?.state?.map;
    const features = (atlas?.state?.lensGuideFeatureCache?.features || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.lens_id === "economy-vitality"
          && props.source_kind === "current_context"
          && props.detail_layer === "economy_anchors_2026";
      });
    const split = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
    const invalid = features.filter((feature) => {
      const props = feature.properties || {};
      const eventIds = split(props.event_ids || props.event_id);
      const sourceIds = split(props.source_ids || props.source_id);
      const objectIds = split(props.source_object_ids || props.source_object_id);
      return !feature.geometry
        || props.kind !== "surface_cell"
        || props.surface_style !== "vitality_anchor_tile"
        || props.evidence_role !== "context_not_year_specific_change_evidence"
        || !props.context_year
        || !props.generated_from
        || !props.source_urls
        || !props.confidence
        || !props.caveat
        || props.direct_evidence_counted !== false
        || props.headline_count_included !== false
        || eventIds.length > 0
        || !sourceIds.length
        || !objectIds.length
        || !sourceIds.every((id) => atlas?.state?.sourceById?.has?.(id));
    }).length;
    let rendered = 0;
    if (map?.getLayer?.("lens-guide-citywide-cell-fill") && map.getLayoutProperty("lens-guide-citywide-cell-fill", "visibility") !== "none") {
      try {
        rendered = map.queryRenderedFeatures({ layers: ["lens-guide-citywide-cell-fill"] })
          .filter((feature) => {
            const props = feature.properties || {};
            return props.lens_id === "economy-vitality"
              && props.source_kind === "current_context"
              && props.detail_layer === "economy_anchors_2026";
          }).length;
      } catch (_error) {
        rendered = 0;
      }
    }
    const row = atlas?.state?.lensYearCoverageByKey?.get?.(`economy-vitality:${Number(year)}`);
    const directGuideCount = (atlas?.state?.lensGuideFeatureCache?.features || [])
      .filter((feature) => {
        const props = feature.properties || {};
        return props.lens_id === "economy-vitality"
          && props.source_kind === "source_backed_lens_detail_aggregate"
          && props.evidence_role === "selected_year_direct_lens_detail_aggregate";
      }).length;
    return {
      contextTileCount: features.length,
      directGuideCount,
      invalid,
      rendered,
      sourcePath: atlas?.state?.economyAnchorFeaturesPathLoaded || "",
      sourceFeatureCount: atlas?.state?.economyAnchorFeatures?.length || 0,
      visible: Boolean(row?.visible_map_contract),
      directCount: Number(row?.direct_event_count || 0),
    };
  }, { year: targetYear });
  const minSourceFeatureCount = { belfast: 1200, london: 6000, nyc: 5000 }[cityId] || 1200;
  const minContextTileCount = { belfast: 360, london: 760, nyc: 720 }[cityId] || 360;
  assert(state.sourcePath.includes("economy_anchors_2026.geojson"), `economy vitality context ${cityId}: economy anchors did not load (${state.sourcePath}).`);
  assert(state.sourceFeatureCount >= minSourceFeatureCount, `economy vitality context ${cityId}: too few source economy anchors loaded (${state.sourceFeatureCount}).`);
  assert(state.visible && state.directCount > 0, `economy vitality context ${cityId}: current context rendered without selected-year direct economy evidence.`);
  assert(state.directGuideCount > 0, `economy vitality context ${cityId}: source-backed direct citywide guide cells did not render alongside current context.`);
  assert(state.contextTileCount >= minContextTileCount, `economy vitality context ${cityId}: too few current-context vitality tiles (${state.contextTileCount}).`);
  assert(state.rendered > 0, `economy vitality context ${cityId}: current-context vitality tiles did not render.`);
  assert(state.invalid === 0, `economy vitality context ${cityId}: ${state.invalid} context tile(s) lack provenance/non-headline flags.`);
}

async function utilityNetworkContextRenderState(page) {
  return page.evaluate((layerIds) => {
    const atlas = window.BimsAtlas;
    const map = atlas?.state?.map;
    const layerCounts = {};
    let rendered = 0;
    for (const layerId of layerIds) {
      let count = 0;
      try {
        count = map?.getLayer?.(layerId) && map.getLayoutProperty(layerId, "visibility") !== "none"
          ? map.queryRenderedFeatures({ layers: [layerId] }).length
          : 0;
      } catch (_error) {
        count = 0;
      }
      layerCounts[layerId] = count;
      rendered += count;
    }
    let sourceLoaded = false;
    try {
      sourceLoaded = map?.isSourceLoaded?.("lens-utility-network-context") === true;
    } catch (_error) {
      sourceLoaded = false;
    }
    return {
      rendered,
      layerCounts,
      sourceLoaded,
      sourcePath: atlas?.state?.utilityNetworkPathLoaded || "",
      featurePath: atlas?.state?.utilityNetworkFeaturesPathLoaded || "",
      featureCount: (atlas?.state?.utilityNetworkFeatures || []).length,
      showInferred: Boolean(atlas?.state?.showInferred),
      areaFilter: atlas?.state?.areaFilter || "",
      legend: document.querySelector("#lensLegend")?.textContent || "",
    };
  }, UTILITY_NETWORK_CONTEXT_LAYER_IDS);
}

async function waitForUtilityNetworkContextRendered(page, minimumRendered) {
  await page.waitForFunction(
    ({ layerIds, minimum }) => {
      const map = window.BimsAtlas?.state?.map;
      if (!map?.getSource?.("lens-utility-network-context")) return false;
      try {
        if (map.isSourceLoaded?.("lens-utility-network-context") !== true) return false;
      } catch (_error) {
        return false;
      }
      try {
        return layerIds.reduce((sum, layerId) => {
          if (!map.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") return sum;
          return sum + map.queryRenderedFeatures({ layers: [layerId] }).length;
        }, 0) >= minimum;
      } catch (_error) {
        return false;
      }
    },
    { layerIds: UTILITY_NETWORK_CONTEXT_LAYER_IDS, minimum: minimumRendered },
    { timeout: 30000 }
  );
}

async function waitForUtilityNetworkContextHidden(page) {
  await page.waitForFunction(
    (layerIds) => {
      const atlas = window.BimsAtlas;
      const map = atlas?.state?.map;
      if ((atlas?.state?.utilityNetworkPathLoaded || "") !== "") return false;
      if ((atlas?.state?.utilityNetworkFeatures || []).length !== 0) return false;
      try {
        return layerIds.every((layerId) => !map?.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none");
      } catch (_error) {
        return false;
      }
    },
    UTILITY_NETWORK_CONTEXT_LAYER_IDS,
    { timeout: 15000 }
  );
}

async function assertUtilityNetworkContextGuards(page, cityId, minimumRendered) {
  const before = await utilityNetworkContextRenderState(page);
  assert(before.rendered >= minimumRendered, `utility network ${cityId}: guard check started before context rendered (${before.rendered}).`);

  await page.evaluate(() => {
    const toggle = document.querySelector("#showInferredToggle");
    if (toggle) {
      toggle.checked = false;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await page.waitForFunction(() => window.BimsAtlas?.state?.showInferred === false, null, { timeout: 10000 });
  await waitForUtilityNetworkContextHidden(page);
  const inferredOff = await utilityNetworkContextRenderState(page);
  assert(inferredOff.rendered === 0, `utility network ${cityId}: inferred-off guard still rendered ${inferredOff.rendered} current context feature(s).`);
  assert(!/Current mapped OSM utility network context may be shown/i.test(inferredOff.legend), `utility network ${cityId}: inferred-off guard still advertised current utility context.`);

  await page.evaluate(() => {
    const toggle = document.querySelector("#showInferredToggle");
    if (toggle) {
      toggle.checked = true;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await page.waitForFunction(() => window.BimsAtlas?.state?.showInferred === true, null, { timeout: 10000 });
  await waitForUtilityNetworkContextRendered(page, minimumRendered);

  await page.evaluate(async () => {
    await window.BimsAtlas?.setAreaFilter?.("Camden");
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(() => Boolean(window.BimsAtlas?.state?.areaFilter), null, { timeout: 10000 });
  await waitForUtilityNetworkContextHidden(page);
  const filtered = await utilityNetworkContextRenderState(page);
  assert(filtered.rendered === 0, `utility network ${cityId}: area-filter guard still rendered ${filtered.rendered} current context feature(s).`);
  assert(!/Current mapped OSM utility network context may be shown/i.test(filtered.legend), `utility network ${cityId}: area-filter guard still advertised current utility context.`);

  await page.evaluate(async () => {
    await window.BimsAtlas?.setAreaFilter?.("");
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(
    () => !window.BimsAtlas?.state?.areaFilter && document.querySelector("#mapStudyChip")?.dataset.scope === "city",
    null,
    { timeout: 15000 }
  );
  await waitForUtilityNetworkContextRendered(page, minimumRendered);
}

async function assertUtilityNetworkCitywideContext(page, cityId, options = {}) {
  const minimumFeatures = { belfast: 5000, london: 25000, nyc: 10000 }[cityId] || 1000;
  const minimumRendered = { belfast: 8, london: 20, nyc: 14 }[cityId] || 4;
  const maximumRenderedAssets = { belfast: 420, london: 2200, nyc: 180 }[cityId] || 1200;
  await page.evaluate(() => window.BimsAtlas?.recenterMap?.());
  await page.waitForFunction(
    () => document.querySelector("#mapStudyChip")?.dataset.scope === "city",
    null,
    { timeout: 15000 }
  );
  await page.waitForFunction(
    ({ cityId: expectedCityId, minimumFeatures: minimum }) => {
      const atlas = window.BimsAtlas;
      return (atlas?.state?.utilityNetworkFeaturesPathLoaded || "").includes(`/cities/${expectedCityId}/utility_network_2026.geojson`)
        && (atlas?.state?.utilityNetworkPathLoaded || "").includes(`/cities/${expectedCityId}/utility_network_2026.geojson`)
        && (atlas?.state?.utilityNetworkFeatures || []).length >= minimum;
    },
    { cityId, minimumFeatures },
    { timeout: 30000 }
  );
  await waitForUtilityNetworkContextRendered(page, minimumRendered);
  const state = await page.evaluate((expectedCityId) => {
    const atlas = window.BimsAtlas;
    const map = atlas?.state?.map;
    const features = atlas?.state?.utilityNetworkFeatures || [];
    const resourceNeedle = `/data/city-atlas/cities/${expectedCityId}/utility_network_2026.geojson`;
    let renderedAreaFills = 0;
    let renderedAreaLines = 0;
    let renderedLineCases = 0;
    let renderedLines = 0;
    let renderedAssets = 0;
    try {
      renderedAreaFills = map?.getLayer?.("lens-utility-network-area-fill") && map.getLayoutProperty("lens-utility-network-area-fill", "visibility") !== "none"
        ? map.queryRenderedFeatures({ layers: ["lens-utility-network-area-fill"] }).length
        : 0;
      renderedAreaLines = map?.getLayer?.("lens-utility-network-area-line") && map.getLayoutProperty("lens-utility-network-area-line", "visibility") !== "none"
        ? map.queryRenderedFeatures({ layers: ["lens-utility-network-area-line"] }).length
        : 0;
      renderedLineCases = map?.getLayer?.("lens-utility-network-case") && map.getLayoutProperty("lens-utility-network-case", "visibility") !== "none"
        ? map.queryRenderedFeatures({ layers: ["lens-utility-network-case"] }).length
        : 0;
      renderedLines = map?.getLayer?.("lens-utility-network") && map.getLayoutProperty("lens-utility-network", "visibility") !== "none"
        ? map.queryRenderedFeatures({ layers: ["lens-utility-network"] }).length
        : 0;
      renderedAssets = map?.getLayer?.("lens-utility-network-assets") && map.getLayoutProperty("lens-utility-network-assets", "visibility") !== "none"
        ? map.queryRenderedFeatures({ layers: ["lens-utility-network-assets"] }).length
        : 0;
    } catch (_error) {
      renderedAreaFills = 0;
      renderedAreaLines = 0;
      renderedLineCases = 0;
      renderedLines = 0;
      renderedAssets = 0;
    }
    const validTypes = new Set(["water", "electricity", "telecoms", "gas", "drainage", "district_energy"]);
    const validGeometries = new Set(["asset", "line", "area"]);
    const requiredFields = ["source_id", "source_registry_id", "source_object_id", "publisher", "source_url", "license", "accessed_at", "transformation_method", "geometry_source", "original_geometry_type", "context_year", "confidence", "caveat"];
    const invalidFeatureCount = features.filter((feature) => {
      const props = feature.properties || {};
      return !feature.geometry
        || props.layer !== "utility_network"
        || props.category !== "utilities"
        || !validTypes.has(props.utility_type)
        || !validGeometries.has(props.network_geometry)
        || requiredFields.some((field) => props[field] === undefined || String(props[field]).trim() === "")
        || props.source_registry_id !== "osm-overpass"
        || !/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+/.test(String(props.source_url || ""))
        || !/ODbL/i.test(String(props.license || ""))
        || !/capacity measurement/i.test(String(props.caveat || ""))
        || !/service[-\s]?availability/i.test(String(props.caveat || ""));
    }).length;
    return {
      featureCount: features.length,
      invalidFeatureCount,
      path: atlas?.state?.utilityNetworkFeaturesPathLoaded || "",
      sourcePath: atlas?.state?.utilityNetworkPathLoaded || "",
      resourceFetchCount: performance.getEntriesByType("resource")
        .filter((entry) => String(entry.name || "").includes(resourceNeedle))
        .length,
      renderedLines,
      renderedAssets,
      renderedAreaFills,
      renderedAreaLines,
      renderedLineCases,
      legend: document.querySelector("#lensLegend")?.textContent || "",
      selectedEventId: atlas?.state?.selectedEventId || "",
      zoom: Number(map?.getZoom?.() || 0),
      detailText: (document.querySelector("#detailInner:not([hidden])") || document.querySelector("#detailEmpty:not([hidden])") || document.querySelector("#detailPanel"))?.textContent.replace(/\s+/g, " ").trim() || "",
      detailInnerVisible: Boolean(document.querySelector("#detailInner:not([hidden])")),
      detailEmptyVisible: Boolean(document.querySelector("#detailEmpty:not([hidden])")),
    };
  }, cityId);
  assert(state.featureCount >= minimumFeatures, `utility network ${cityId}: too few current utility context features loaded (${state.featureCount}).`);
  assert(state.sourcePath.includes(`/cities/${cityId}/utility_network_2026.geojson`), `utility network ${cityId}: map source did not use the parsed utility payload (${state.sourcePath}).`);
  assert(state.resourceFetchCount <= 1, `utility network ${cityId}: utility GeoJSON was fetched ${state.resourceFetchCount} times.`);
  assert(state.invalidFeatureCount === 0, `utility network ${cityId}: ${state.invalidFeatureCount} feature(s) lack provenance/no-capacity caveats.`);
  assert(
    state.renderedAreaFills + state.renderedAreaLines + state.renderedLineCases + state.renderedLines + state.renderedAssets >= minimumRendered,
    `utility network ${cityId}: network context rendered too sparsely (${state.renderedAreaFills + state.renderedAreaLines + state.renderedLineCases + state.renderedLines + state.renderedAssets}).`
  );
  assert(state.renderedAssets <= maximumRenderedAssets, `utility network ${cityId}: citywide asset symbols overdraw the map (${state.renderedAssets} rendered at zoom ${state.zoom.toFixed(2)}).`);
  assert(/No capacity data is inferred|not.*capacity|not selected-year|non-headline|engineering capacity/i.test(state.legend), `utility network ${cityId}: legend does not caveat current utility context.`);
  assert(!/Pick a change on the map or in search/i.test(state.detailText), `utility network ${cityId}: context-only utility view still shows the generic empty detail prompt.`);
  assert(state.detailInnerVisible && !state.detailEmptyVisible, `utility network ${cityId}: utility context detail panel is not visible.`);
  if (!state.selectedEventId) {
    assert(/Current mapped utility context|OpenStreetMap|ODbL/i.test(state.detailText), `utility network ${cityId}: context-only detail panel does not identify OSM/ODbL utility context.`);
    assert(/not.*capacity|outage|service[-\s]?availability|non-headline/i.test(state.detailText), `utility network ${cityId}: context-only detail panel lacks capacity/outage/service caveats.`);
  }
  if (options.verifyGuards) await assertUtilityNetworkContextGuards(page, cityId, minimumRendered);
  return state;
}

function atlasCityLensUrl(cityId, year, aspect) {
  const url = new URL(atlasUrl);
  url.searchParams.set("city", cityId);
  url.searchParams.set("year", String(year));
  url.searchParams.set("lens", aspect);
  return url.href;
}

async function assertCitySourceBackedLensCoverage(page, cityId) {
  await page.evaluate(async () => {
    await window.BimsAtlas?.setAreaFilter?.("");
    await window.BimsAtlas?.setYear?.(2024);
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(
    () => Number(window.BimsAtlas?.state?.year) === 2024
      && document.querySelector("#mapStudyChip")?.dataset.scope === "city",
    null,
    { timeout: 20000 }
  );
  const checksByCity = {
    belfast: [
      { aspect: "planning-pressure", year: 2014, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], featureLayer: "planning_cell", label: "planning cells" },
      { aspect: "civic-access-gaps", year: 2008, rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], featureLayer: "civic_coverage_cell", label: "civic coverage cells", guideExpected: true },
      { aspect: "economy-land-use", year: 2015, rendered: ["lensEconomyCellsRendered"], renderedLayers: ["lens-economy-cells-fill"], featureLayer: "economy_activity_cell", label: "economy cells", allowAdjacent: true, landUseContextExpected: true },
      { aspect: "utilities-capacity", year: 2013, rendered: ["lensUtilityTraceRendered", "lensUtilityAssetsRendered"], renderedLayers: ["lens-utilities-trace", "lens-utility-asset-icons"], featureLayer: "utility_trace", label: "utility traces/assets" },
    ],
    london: [
      { aspect: "planning-pressure", year: 2026, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], featureLayer: "planning_cell", label: "planning cells", guideExpected: true },
      { aspect: "civic-access-gaps", year: 2009, rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], featureLayer: "civic_coverage_cell", label: "civic coverage cells", guideExpected: true },
      { aspect: "economy-land-use", year: 2026, rendered: ["lensEconomyCellsRendered"], renderedLayers: ["lens-economy-cells-fill"], featureLayer: "economy_activity_cell", label: "economy cells", guideExpected: true, landUseContextExpected: true },
      { aspect: "utilities-capacity", year: 2020, rendered: ["lensUtilityTraceRendered"], renderedLayers: ["lens-utilities-trace"], featureLayer: "utility_trace", label: "utility traces" },
    ],
    nyc: [
      { aspect: "planning-pressure", year: 2026, rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], featureLayer: "planning_cell", label: "planning cells", guideExpected: true },
      { aspect: "civic-access-gaps", rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], featureLayer: "civic_coverage_cell", label: "civic coverage cells", guideExpected: true },
      { aspect: "economy-land-use", year: 2024, rendered: ["lensEconomyCellsRendered"], renderedLayers: ["lens-economy-cells-fill"], featureLayer: "economy_activity_cell", label: "economy cells", guideExpected: true, landUseContextExpected: true },
      { aspect: "utilities-capacity", year: 2014, rendered: ["lensUtilityTraceRendered", "lensUtilityAssetsRendered"], renderedLayers: ["lens-utilities-trace", "lens-utility-asset-icons"], featureLayer: "utility_trace", label: "utility traces/assets" },
    ],
  };
  const checks = checksByCity[cityId] || checksByCity.belfast;
  for (const check of checks) {
    progress("city lens", cityId, check.aspect);
    const targetYear = check.year || 2024;
    await page.evaluate(
      async ({ aspect, year }) => {
        const atlas = window.BimsAtlas;
        await atlas?.setYear?.(year);
        await atlas?.setActiveAspect?.(aspect);
        atlas?.recenterMap?.();
      },
      { aspect: check.aspect, year: targetYear }
    );
    await page.waitForFunction(
      ({ aspect, year }) => window.BimsAtlas?.state?.activeAspect === aspect
        && Number(window.BimsAtlas?.state?.year) === Number(year)
        && document.querySelector("#mapStudyChip")?.dataset.scope === "city",
      { aspect: check.aspect, year: targetYear },
      { timeout: 20000 }
    );
    const coverage = await page.evaluate(() => {
      const atlas = window.BimsAtlas;
      const row = atlas?.state?.lensYearCoverageByKey?.get?.(`${atlas?.state?.activeAspect}:${Number(atlas?.state?.year)}`);
      return {
        status: row?.status || "",
        visible: Boolean(row?.visible_map_contract),
        eventCount: Number(row?.event_count || 0),
        directCount: Number(row?.direct_event_count || 0),
      };
    });
    if (!coverage.visible) {
      await assertActiveSelectionMatchesFilters(page, `city ${cityId}: ${check.aspect}`);
      assert(check.allowAdjacent === true, `city ${cityId}: ${check.aspect} unexpectedly became non-visible (${coverage.status || "unknown"}).`);
      await page.waitForFunction(
        () => /broad source-backed|No direct source-backed|No source-backed/i.test(document.querySelector("#lensLegend")?.textContent || ""),
        null,
        { timeout: 10000 }
      );
      const state = await atlasState(page);
      assert(state.pinCount === 0, `city ${cityId}: ${check.aspect} is ${coverage.status || "non-visible"} but rendered ${state.pinCount} pin(s).`);
      assert(coverage.directCount === 0, `city ${cityId}: ${check.aspect} is non-visible but reports ${coverage.directCount} direct record(s).`);
      if (check.guideExpected === false) await assertDirectGuideSurface(page, `city ${cityId}: ${check.aspect}`, { expected: false });
      continue;
    }
    await page.waitForFunction(
      (year) => Number(window.BimsAtlas?.state?.lensDetailYearLoaded) === Number(year),
      targetYear,
      { timeout: 20000 }
    );
    await page.waitForFunction(
      () => {
        const map = window.BimsAtlas?.state?.map;
        if (!map?.getSource?.("lens-detail-overlays")) return false;
        try {
          return map.isSourceLoaded?.("lens-detail-overlays") === true;
        } catch (_error) {
          return false;
        }
      },
      null,
      { timeout: 20000 }
    );
    await page.waitForFunction(
      (layers) => {
        const map = window.BimsAtlas?.state?.map;
        if (!map) return false;
        return layers.reduce((sum, layerId) => {
          if (!map.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") return sum;
          try {
            return sum + map.queryRenderedFeatures({ layers: [layerId] }).length;
          } catch (_error) {
            return sum;
          }
        }, 0) > 0;
      },
      check.renderedLayers,
      { timeout: 20000 }
    );
    await assertActiveSelectionMatchesFilters(page, `city ${cityId}: ${check.aspect}`, { required: true });
    const state = await atlasState(page);
    const rendered = check.rendered.reduce((sum, field) => sum + Number(state[field] || 0), 0);
    assert(rendered > 0, `city ${cityId}: ${check.label} did not render across the ${targetYear} citywide map.`);
    if (typeof check.guideExpected === "boolean") {
      await assertDirectGuideSurface(page, `city ${cityId}: ${check.aspect}`, { expected: check.guideExpected });
    }
    if (check.aspect === "planning-pressure") {
      await assertPlanningPressureCitywideContext(page, cityId, targetYear);
    }
    if (check.landUseContextExpected) {
      await assertEconomyLandUseCitywideContext(page, cityId, targetYear);
    }
    if (check.vitalityContextExpected) {
      await assertEconomyVitalityCitywideContext(page, cityId, targetYear);
    }
    if (check.aspect === "utilities-capacity") {
      await assertUtilityNetworkCitywideContext(page, cityId);
    }
    const citywidePng = await page.screenshot({
      path: path.join(outputDir, `paper-atlas-${cityId}-${check.aspect}-citywide.png`),
      fullPage: false,
    });
    assertDetailedPng(citywidePng, assert, `city ${cityId} ${check.aspect} citywide`);
    await assertPannedSourceBackedLensCoverage(page, cityId, check);
  }
  await assertSparseLensCoverageHonesty(page, cityId);
}

async function assertReferenceLensCitywideArtifacts(cityId, consoleMessages, pageErrors) {
  const checks = CITYWIDE_REFERENCE_LENS_CHECKS[cityId] || [];
  for (const check of checks) {
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await assertReferenceLensCitywideArtifactIsolated(cityId, check, consoleMessages, pageErrors);
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (!isClosedTargetError(error) || attempt === 3) throw error;
        progress("city reference lens retry", cityId, check.aspect, `attempt ${attempt + 1}`);
      }
    }
    if (lastError) throw lastError;
  }
}

function isClosedTargetError(error) {
  return /Target page, context or browser has been closed|Target closed|Browser has been closed/i.test(error?.message || "");
}

async function assertReferenceLensCitywideArtifactIsolated(cityId, check, consoleMessages, pageErrors) {
  const browser = await chromium.launch(chromiumLaunchOptions);
  const page = await browser.newPage({ viewport: REFERENCE_VIEWPORT, deviceScaleFactor: 1 });
  try {
    attachConsoleCapture(page, consoleMessages, pageErrors);
    await openAtlas(page, atlasCityLensUrl(cityId, check.year, check.aspect), {
      requirePins: Number(check.minDirectRecords || 0) > 0,
    });
    await page.waitForTimeout(cityId === "london" ? 1000 : 700);
    await assertReferenceLensCitywideArtifact(page, cityId, check);
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function assertReferenceLensCitywideArtifact(page, cityId, check) {
    progress("city reference lens", cityId, check.aspect, check.year);
    const requiresDetail = (check.detailLayers || []).length > 0;
    const requiresUtilityContext = check.contextArtifact === "utility_network";
    await page.evaluate(async ({ aspect, year }) => {
      const atlas = window.BimsAtlas;
      if (atlas?.state) atlas.state.showInferred = true;
      const inferredToggle = document.querySelector("#showInferredToggle");
      if (inferredToggle) inferredToggle.checked = true;
      await atlas?.setAreaFilter?.("");
      await atlas?.setYear?.(year);
      await atlas?.setActiveAspect?.(aspect);
      atlas?.recenterMap?.();
    }, { aspect: check.aspect, year: check.year });
    await page.waitForFunction(
      ({ aspect, year }) => window.BimsAtlas?.state?.activeAspect === aspect
        && Number(window.BimsAtlas?.state?.year) === Number(year)
        && document.querySelector("#mapStudyChip")?.dataset.scope === "city",
      { aspect: check.aspect, year: check.year },
      { timeout: 20000 }
    );
    if (requiresDetail) {
      await page.waitForFunction(
        (year) => Number(window.BimsAtlas?.state?.lensDetailYearLoaded) === Number(year),
        check.year,
        { timeout: 25000 }
      );
      await page.waitForFunction(
        () => {
          const map = window.BimsAtlas?.state?.map;
          if (!map?.getSource?.("lens-detail-overlays")) return false;
          try {
            return map.isSourceLoaded?.("lens-detail-overlays") === true;
          } catch (_error) {
            return false;
          }
        },
        null,
        { timeout: 25000 }
      );
    }
    await page.waitForFunction(
      (layers) => {
        const map = window.BimsAtlas?.state?.map;
        if (!map) return false;
        return layers.reduce((sum, layerId) => {
          if (!map.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") return sum;
          try {
            return sum + map.queryRenderedFeatures({ layers: [layerId] }).length;
          } catch (_error) {
            return sum;
          }
        }, 0) > 0;
      },
      check.renderedLayers,
      { timeout: 25000 }
    );
    if (requiresUtilityContext) {
      await assertUtilityNetworkCitywideContext(page, cityId, { verifyGuards: cityId === "london" && check.aspect === "utilities-capacity" });
    } else {
      await ensureActiveSourceBackedSelection(page, `city ${cityId}: reference ${check.aspect}`);
    }
    const layoutState = requiresUtilityContext
      ? await atlasState(page)
      : await assertResponsiveLayout(page, `city ${cityId} ${check.aspect}`);
    if (requiresUtilityContext) {
      assert(layoutState.scrollWidth <= layoutState.clientWidth + 4, `city ${cityId} ${check.aspect}: page overflows horizontally.`);
      assert(layoutState.mapCanvas === 1, `city ${cityId} ${check.aspect}: MapLibre canvas is missing.`);
      assert(layoutState.zoomButtons === 2, `city ${cityId} ${check.aspect}: zoom buttons are missing.`);
      assert(layoutState.citywideLensMode, `city ${cityId} ${check.aspect}: context capture left citywide mode.`);
    }
    await assertReferenceCitywideMapField(page, `city ${cityId} ${check.aspect}`);
    const rendered = check.rendered.reduce((sum, field) => sum + Number(layoutState[field] || 0), 0);
    if (!requiresUtilityContext) {
      assert(rendered > 0, `city ${cityId}: ${check.label} did not render on the ${check.year} citywide map.`);
    }
    const coverage = await page.evaluate(({ aspect, year, detailLayers }) => {
      const atlas = window.BimsAtlas;
      const row = atlas?.state?.lensYearCoverageByKey?.get?.(`${aspect}:${Number(year)}`);
      const splitIds = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
      const contextPattern = /mapped_context|current_context|road_infill|building_context|context_not_year_specific/i;
      const matchingDetails = (atlas?.state?.lensDetailFeatures || []).filter((feature) => {
        const props = feature?.properties || {};
        return detailLayers.includes(props.layer) && Number(props.year || props.visible_year || 0) === Number(year);
      });
      const invalidDetailCount = matchingDetails.filter((feature) => {
        const props = feature?.properties || {};
        return !feature?.geometry
          || !props.layer
          || !props.category
          || !props.confidence
          || !props.source_ids
          || !props.source_urls
          || !props.event_ids
          || !props.generated_from
          || !props.caveat
          || !splitIds(props.source_ids).length
          || !splitIds(props.event_ids).length
          || contextPattern.test(`${props.source_kind || ""} ${props.evidence_role || ""}`);
      }).length;
      return {
        status: row?.status || "",
        visible: Boolean(row?.visible_map_contract),
        eventCount: Number(row?.event_count || 0),
        directCount: Number(row?.direct_event_count || 0),
        mapDirectCount: Number(row?.map_direct_event_count ?? row?.direct_event_count ?? 0),
        detailFeatureCount: Number(row?.detail_feature_count || 0),
        sourceCount: Number(row?.source_count || 0),
        matchingDetailCount: matchingDetails.length,
        invalidDetailCount,
        chip: document.querySelector("#mapStudyChipText")?.textContent.trim() || "",
        contractText: document.querySelector(".lens-contract-strip")?.textContent.replace(/\s+/g, " ").trim() || "",
        legend: document.querySelector("#lensLegend")?.textContent || "",
      };
    }, { aspect: check.aspect, year: check.year, detailLayers: check.detailLayers });
    if (requiresUtilityContext) {
      assert(
        /Current mapped OSM utility|current.*utility context|not selected-year|non-headline|engineering capacity/i.test(`${coverage.legend} ${coverage.contractText}`),
        `city ${cityId}: ${check.aspect} ${check.year} current utility context is not explicitly caveated.`
      );
    } else {
      assert(coverage.status === "source_backed_records", `city ${cityId}: ${check.aspect} ${check.year} is ${coverage.status || "missing"}, not source-backed.`);
      assert(coverage.visible, `city ${cityId}: ${check.aspect} ${check.year} is not visible under the map contract.`);
      assert(coverage.directCount >= check.minDirectRecords, `city ${cityId}: ${check.aspect} ${check.year} direct count ${coverage.directCount} is below ${check.minDirectRecords}.`);
      if (requiresDetail) {
        assert(coverage.detailFeatureCount >= check.minDetailFeatures, `city ${cityId}: ${check.aspect} ${check.year} detail count ${coverage.detailFeatureCount} is below ${check.minDetailFeatures}.`);
        assert(coverage.matchingDetailCount >= check.minDetailFeatures, `city ${cityId}: ${check.aspect} ${check.year} loaded ${coverage.matchingDetailCount} matching detail features, below ${check.minDetailFeatures}.`);
      }
      assert(coverage.sourceCount > 0, `city ${cityId}: ${check.aspect} ${check.year} has no source count.`);
      assert(coverage.invalidDetailCount === 0, `city ${cityId}: ${check.aspect} ${check.year} has ${coverage.invalidDetailCount} detail feature(s) missing provenance fields.`);
    }
    assert(/Citywide extent/i.test(coverage.chip), `city ${cityId}: ${check.aspect} citywide chip is not visible.`);
    if (!requiresUtilityContext) {
      assert(!/No direct source-backed|No source-backed/i.test(coverage.legend), `city ${cityId}: ${check.aspect} ${check.year} still shows a no-records legend contradiction.`);
    }
    if (!requiresDetail && !requiresUtilityContext) {
      assert(
        /Current mapped|not measured|not selected-year|non-headline|no filler/i.test(`${coverage.legend} ${coverage.contractText}`),
        `city ${cityId}: ${check.aspect} ${check.year} context rendering is not explicitly caveated.`
      );
    }
    if (typeof check.guideExpected === "boolean") {
      await assertDirectGuideSurface(page, `city ${cityId}: reference ${check.aspect}`, { expected: check.guideExpected });
    }
    if (check.vitalityContextExpected) {
      await assertEconomyVitalityCitywideContext(page, cityId, check.year);
    }
    const sparseSelectedYear = (coverage.detailFeatureCount > 0 && coverage.detailFeatureCount <= 16)
      || (coverage.mapDirectCount > 0 && coverage.mapDirectCount <= 10)
      || (coverage.directCount > 0 && coverage.directCount <= 10);
    if (sparseSelectedYear) {
      assert(/mapped in \d{4}.*no filler/i.test(coverage.contractText), `city ${cityId}: ${check.aspect} ${check.year} sparse selected-year warning is not visible.`);
    }
    const png = await page.screenshot({
      path: path.join(outputDir, `paper-atlas-${cityId}-${check.aspect}-citywide.png`),
      fullPage: false,
    });
    assertReferenceViewportPng(png, `city ${cityId} ${check.aspect} citywide`);
    assertDetailedPng(png, assert, `city ${cityId} ${check.aspect} citywide`);
}

async function assertReferenceCitywideMapField(page, label) {
  const layout = await page.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element || element.hidden || element.getAttribute("data-open") === "false") return null;
      const styles = getComputedStyle(element);
      if (styles.display === "none" || styles.visibility === "hidden" || Number(styles.opacity || 1) === 0) return null;
      const bounds = element.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return null;
      return {
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height,
      };
    };
    const layers = rect("#layersPanel");
    const changelog = rect("#changelogPanel");
    const detail = rect("#detailPanel");
    const topbar = rect(".topbar");
    const timeline = rect(".timeline");
    const leftRailRight = Math.max(layers?.right || 0, changelog?.right || 0);
    const mapLeft = leftRailRight ? leftRailRight + 16 : 0;
    const mapRight = detail?.left ? detail.left - 16 : window.innerWidth;
    const mapTop = topbar?.bottom ? topbar.bottom + 16 : 0;
    const mapBottom = timeline?.top ? timeline.top - 16 : window.innerHeight;
    return {
      width: window.innerWidth,
      layers,
      changelog,
      detail,
      mapFieldWidth: mapRight - mapLeft,
      mapFieldHeight: mapBottom - mapTop,
      leftRailRight,
      leftPanelsStacked: Boolean(layers && changelog && changelog.left <= layers.left + 4 && changelog.right <= layers.right + 4),
    };
  });
  if (layout.width >= REFERENCE_VIEWPORT.width) {
    assert(layout.leftPanelsStacked, `${label}: reference citywide layout still places the changelog beside the layers rail.`);
    assert(layout.leftRailRight <= 324, `${label}: left rail consumes too much citywide map width (${Math.round(layout.leftRailRight)}px).`);
    assert(layout.mapFieldWidth >= 1080, `${label}: central citywide map field is too narrow (${Math.round(layout.mapFieldWidth)}px).`);
    assert(layout.mapFieldHeight >= 700, `${label}: central citywide map field is too short (${Math.round(layout.mapFieldHeight)}px).`);
  }
}

async function visibleCitywideMapClip(page, fallbackRatios = { x: 0.36, y: 0.08, width: 0.36, height: 0.7 }) {
  const viewport = page.viewportSize() || { width: 1440, height: 900 };
  const clip = await page.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element || element.hidden || element.getAttribute("data-open") === "false") return null;
      const styles = getComputedStyle(element);
      if (styles.display === "none" || styles.visibility === "hidden" || Number(styles.opacity || 1) === 0) return null;
      const bounds = element.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return null;
      return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom };
    };
    const layers = rect("#layersPanel");
    const changelog = rect("#changelogPanel");
    const detail = rect("#detailPanel");
    const topbar = rect(".topbar");
    const timeline = rect(".timeline");
    const left = Math.max(layers?.right || 0, changelog?.right || 0) + 16;
    const right = (detail?.left || window.innerWidth) - 16;
    const top = (topbar?.bottom || 0) + 16;
    const bottom = (timeline?.top || window.innerHeight) - 16;
    return {
      x: Math.max(0, left),
      y: Math.max(0, top),
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
  });
  const fallback = {
    x: Math.round(viewport.width * fallbackRatios.x),
    y: Math.round(viewport.height * fallbackRatios.y),
    width: Math.round(viewport.width * fallbackRatios.width),
    height: Math.round(viewport.height * fallbackRatios.height),
  };
  const raw = clip && clip.width >= 240 && clip.height >= 180 ? clip : fallback;
  const x = Math.max(0, Math.min(viewport.width - 1, Math.round(raw.x)));
  const y = Math.max(0, Math.min(viewport.height - 1, Math.round(raw.y)));
  return {
    x,
    y,
    width: Math.max(1, Math.min(viewport.width - x, Math.round(raw.width))),
    height: Math.max(1, Math.min(viewport.height - y, Math.round(raw.height))),
  };
}

async function assertSparseLensCoverageHonesty(page, cityId) {
  const checksByCity = {
    belfast: [
      {
        aspect: "planning-pressure",
        year: 2024,
        guideExpected: false,
        label: "Belfast withheld planning guide",
      },
      {
        aspect: "economy-land-use",
        year: 2024,
        guideExpected: false,
        label: "Belfast 2024 economy guide",
      },
      {
        aspect: "economy-land-use",
        year: 2026,
        guideExpected: false,
        label: "Belfast 2026 economy guide",
      },
    ],
    london: [
      {
        aspect: "civic-access-gaps",
        year: 2024,
        guideExpected: false,
        allowContextGuide: true,
        label: "London 2024 police-excluded civic access guide",
      },
    ],
    nyc: [
      {
        aspect: "economy-land-use",
        year: 2024,
        rendered: ["lensEconomyCellsRendered"],
        absentPattern: /No (?:direct )?source-backed land-use-specific economy records match 2024/i,
        label: "NYC economy PLUTO direct coverage",
      },
    ],
  };
  for (const check of checksByCity[cityId] || []) {
    await page.evaluate(async ({ aspect, year }) => {
      if (year) await window.BimsAtlas?.setYear?.(year);
      await window.BimsAtlas?.setActiveAspect?.(aspect);
    }, { aspect: check.aspect, year: check.year });
    await page.waitForFunction(
      ({ aspect, year }) => window.BimsAtlas?.state?.activeAspect === aspect
        && (!year || Number(window.BimsAtlas?.state?.year) === Number(year))
        && document.querySelector("#mapStudyChip")?.dataset.scope === "city",
      { aspect: check.aspect, year: check.year },
      { timeout: 20000 }
    );
    await page.waitForTimeout(900);
    const state = await atlasState(page);
    if (typeof check.guideExpected === "boolean") {
      await assertDirectGuideSurface(page, `city ${cityId}: ${check.label}`, { expected: check.guideExpected, allowContextGuide: check.allowContextGuide });
    }
    if (check.rendered) {
      const rendered = check.rendered.reduce((sum, field) => sum + Number(state[field] || 0), 0);
      assert(rendered > 0, `city ${cityId}: ${check.label} did not render source-backed sparse/detail marks.`);
    }
    if (check.emptyLayers) {
      const rendered = await page.evaluate((layers) => {
        const map = window.BimsAtlas?.state?.map;
        return layers.reduce((sum, layerId) => {
          if (!map?.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") return sum;
          try {
            return sum + map.queryRenderedFeatures({ layers: [layerId] }).length;
          } catch (_error) {
            return sum;
          }
        }, 0);
      }, check.emptyLayers);
      assert(rendered === 0, `city ${cityId}: ${check.label} rendered ${rendered} filler-like marks.`);
    }
    if (check.notePattern) assert(check.notePattern.test(state.bodyText), `city ${cityId}: ${check.label} note is missing.`);
    if (check.absentPattern) assert(!check.absentPattern.test(state.bodyText), `city ${cityId}: ${check.label} still shows a no-records contradiction.`);
  }
}

async function assertPannedSourceBackedLensCoverage(page, cityId, check) {
  progress("city lens pan samples", cityId, check.aspect);
  const samples = await page.evaluate(({ featureLayer }) => {
    const atlas = window.BimsAtlas;
    const bounds = atlas?.state?.city?.bounds || [];
    const [west, south, east, north] = bounds.map(Number);
    if (![west, south, east, north].every(Number.isFinite)) return [];
    const cityCenter = [(west + east) / 2, (south + north) / 2];
    const coordsFromGeometry = (geometry, acc = []) => {
      if (!geometry || acc.length > 160) return acc;
      const coords = geometry.coordinates;
      const visit = (value) => {
        if (acc.length > 160) return;
        if (Array.isArray(value?.[0]) && typeof value[0][0] !== "number") {
          value.forEach(visit);
        } else if (Array.isArray(value?.[0]) && typeof value[0][0] === "number") {
          value.forEach((point) => {
            if (Number.isFinite(Number(point?.[0])) && Number.isFinite(Number(point?.[1]))) acc.push([Number(point[0]), Number(point[1])]);
          });
        } else if (Number.isFinite(Number(value?.[0])) && Number.isFinite(Number(value?.[1]))) {
          acc.push([Number(value[0]), Number(value[1])]);
        }
      };
      visit(coords);
      return acc;
    };
    const featurePoint = (feature) => {
      const coords = coordsFromGeometry(feature.geometry);
      const inBounds = coords.filter(([lng, lat]) => lng >= west && lng <= east && lat >= south && lat <= north);
      if (!inBounds.length) return null;
      const lng = inBounds.reduce((sum, point) => sum + point[0], 0) / inBounds.length;
      const lat = inBounds.reduce((sum, point) => sum + point[1], 0) / inBounds.length;
      return [lng, lat];
    };
    const candidates = (atlas?.state?.lensDetailFeatures || [])
      .filter((feature) => feature?.properties?.layer === featureLayer)
      .map((feature) => {
        const lngLat = featurePoint(feature);
        if (!lngLat) return null;
        const [lng, lat] = lngLat;
        const x = Math.max(0, Math.min(4, Math.floor(((lng - west) / Math.max(0.000001, east - west)) * 5)));
        const y = Math.max(0, Math.min(4, Math.floor(((lat - south) / Math.max(0.000001, north - south)) * 5)));
        const dx = (lng - cityCenter[0]) * Math.cos((cityCenter[1] * Math.PI) / 180);
        const dy = lat - cityCenter[1];
        return {
          lngLat,
          cell: `${x}:${y}`,
          score: Math.hypot(dx, dy),
          label: feature.properties?.label || feature.properties?.title || feature.properties?.name || featureLayer,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    const byCell = new Map();
    for (const candidate of candidates) {
      if (!byCell.has(candidate.cell)) byCell.set(candidate.cell, candidate);
      if (byCell.size >= 4) break;
    }
    return [...byCell.values()].slice(0, 2);
  }, check);
  assert(samples.length > 0, `city ${cityId} ${check.aspect}: no source-backed ${check.featureLayer} samples available for panned coverage.`);

  for (const [index, sample] of samples.entries()) {
    progress("city lens pan", cityId, check.aspect, index + 1, sample.label);
    await page.evaluate((target) => {
      window.BimsAtlas?.state?.map?.jumpTo?.({ center: target.lngLat, zoom: 12.8, pitch: 0, bearing: 0 });
    }, sample);
    await page.waitForFunction(
      () => {
        const map = window.BimsAtlas?.state?.map;
        if (!map?.getSource?.("lens-detail-overlays")) return false;
        try {
          return map.isSourceLoaded?.("lens-detail-overlays") === true;
        } catch (_error) {
          return false;
        }
      },
      null,
      { timeout: 20000 }
    );
    await page.waitForTimeout(450);
    const rendered = await page.evaluate((layers) => {
      const map = window.BimsAtlas?.state?.map;
      return layers.reduce((sum, layerId) => {
        if (!map?.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") return sum;
        try {
          return sum + map.queryRenderedFeatures({ layers: [layerId] }).length;
        } catch (_error) {
          return sum;
        }
      }, 0);
    }, check.renderedLayers);
    assert(rendered > 0, `city ${cityId} ${check.aspect}: ${check.label} did not render after panning to ${sample.label}.`);
    await page.screenshot({
      path: path.join(outputDir, `paper-atlas-${cityId}-${check.aspect}-pan-${index + 1}.png`),
      fullPage: false,
    });
  }

  await page.evaluate(() => window.BimsAtlas?.recenterMap?.());
  await page.waitForFunction(() => document.querySelector("#mapStudyChip")?.dataset.scope === "city", null, { timeout: 10000 });
}

async function assertTransportAccessStopContext(page, city) {
  await page.waitForFunction(() => window.BimsAtlas?.state?.activeAspect === "transport-access", null, { timeout: 15000 });
  await page.waitForFunction(
    (minimum) => (window.BimsAtlas?.state?.transportStopFeatures || []).length >= minimum,
    city.minStops,
    { timeout: 20000 }
  );
  await page.waitForFunction(
    () => (window.BimsAtlas?.state?.lensGuideFeatureCache?.features || []).length > 0,
    null,
    { timeout: 20000 }
  );
  await page.waitForFunction(
    () => {
      const guide = window.BimsAtlas?.state?.lensGuideFeatureCache?.features || [];
      return guide.some((feature) => {
        const props = feature.properties || {};
        return props.lens_id === "transport-access"
          && props.kind === "flow"
          && props.flow_style === "access_network"
          && props.detail_layer === "transport_roads_base"
          && props.source_kind === "current_context";
      });
    },
    null,
    { timeout: 25000 }
  );
  await page.waitForFunction(
    () => {
      const map = window.BimsAtlas?.state?.map;
      return ["lens-guide-citywide-cell-fill", "lens-guide-citywide-cell-line", "lens-guide-node", "lens-guide-icon-node"].some((layerId) => {
        if (!map?.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") return false;
        try {
          return map.queryRenderedFeatures({ layers: [layerId] }).length > 0;
        } catch (_error) {
          return false;
        }
      });
    },
    null,
    { timeout: 20000 }
  );
  await page.waitForFunction(
    () => {
      const map = window.BimsAtlas?.state?.map;
      if (!map?.getLayer?.("lens-guide-flow") || map.getLayoutProperty("lens-guide-flow", "visibility") === "none") return false;
      try {
        return map.queryRenderedFeatures({ layers: ["lens-guide-flow"] }).some((feature) => {
          const props = feature.properties || {};
          return props.lens_id === "transport-access"
            && props.flow_style === "access_network"
            && props.detail_layer === "transport_roads_base"
            && props.source_kind === "current_context";
        });
      } catch (_error) {
        return false;
      }
    },
    null,
    { timeout: 20000 }
  );
  await page.waitForTimeout(700);
  const state = await page.evaluate(() => {
    const atlas = window.BimsAtlas;
    const map = atlas?.state?.map;
    const stops = atlas?.state?.transportStopFeatures || [];
    const guide = atlas?.state?.lensGuideFeatureCache?.features || [];
    const split = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
    const modes = stops.reduce((acc, feature) => {
      const mode = feature.properties?.mode || "unknown";
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {});
    const renderedGuide = ["lens-guide-citywide-cell-fill", "lens-guide-citywide-cell-line", "lens-guide-node", "lens-guide-icon-node"].reduce((count, layerId) => {
      if (!map?.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") return count;
      try {
        return count + map.queryRenderedFeatures({ layers: [layerId] }).length;
      } catch (_error) {
        return count;
      }
    }, 0);
    const roadContextFlows = guide.filter((feature) => {
      const props = feature.properties || {};
      return props.lens_id === "transport-access"
        && props.kind === "flow"
        && props.flow_style === "access_network"
        && props.detail_layer === "transport_roads_base"
        && props.source_kind === "current_context"
        && props.evidence_role === "context_not_year_specific_change_evidence";
    });
    let renderedAccessFlows = 0;
    try {
      renderedAccessFlows = map?.getLayer?.("lens-guide-flow") && map.getLayoutProperty("lens-guide-flow", "visibility") !== "none"
        ? map.queryRenderedFeatures({ layers: ["lens-guide-flow"] }).filter((feature) => {
          const props = feature.properties || {};
          return props.lens_id === "transport-access"
            && props.flow_style === "access_network"
            && props.detail_layer === "transport_roads_base"
            && props.source_kind === "current_context";
        }).length
        : 0;
    } catch (_error) {
      renderedAccessFlows = 0;
    }
    const invalidRoadContextFlows = roadContextFlows.filter((feature) => {
      const props = feature.properties || {};
      const sourceIds = split(props.source_ids || props.source_id);
      const objectIds = split(props.source_object_ids || props.source_object_id);
      const eventIds = split(props.event_ids || props.event_id);
      return !feature.geometry
        || props.direct_evidence_counted !== false
        || props.headline_count_included !== false
        || eventIds.length > 0
        || !sourceIds.length
        || !sourceIds.every((sourceId) => atlas?.state?.sourceById?.has?.(sourceId))
        || !objectIds.length
        || !props.source_urls
        || !props.generated_from
        || !props.caveat
        || !props.context_year
        || !props.detail_layer
        || props.detail_layer !== "transport_roads_base";
    }).length;
    return {
      city: document.querySelector("#cityNameLabel")?.textContent.trim() || "",
      activeAspect: atlas?.state?.activeAspect || "",
      stopPath: atlas?.state?.transportStopFeaturesPathLoaded || "",
      roadContextPath: atlas?.state?.transportAccessRoadContextPathLoaded || "",
      roadContextSourceCount: atlas?.state?.transportAccessRoadContextFeatures?.length || 0,
      stopCount: stops.length,
      modes,
      guideSublayers: guide.reduce((acc, feature) => {
        const sublayerId = feature.properties?.sublayer_id || "";
        if (sublayerId) acc[sublayerId] = (acc[sublayerId] || 0) + 1;
        return acc;
      }, {}),
      proxyCount: stops.filter((feature) => {
        const props = feature.properties || {};
        return props.osm_element_type && props.osm_element_type !== "node" && /Overpass center point/i.test(props.geometry_source || "");
      }).length,
      guideCount: guide.length,
      roadContextFlowCount: roadContextFlows.length,
      invalidRoadContextFlows,
      renderedGuide,
      renderedAccessFlows,
      appStatus: document.querySelector("#appStatus")?.textContent.trim() || "",
      bodyText: document.body?.innerText || "",
    };
  });
  assert(state.city === city.label, `transport context ${city.id}: loaded ${state.city} instead of ${city.label}.`);
  assert(state.activeAspect === "transport-access", `transport context ${city.id}: active aspect is ${state.activeAspect}.`);
  assert(state.stopPath.includes("transport_stops_2026.geojson"), `transport context ${city.id}: stop artifact path did not load.`);
  assert(state.stopCount >= city.minStops, `transport context ${city.id}: expected at least ${city.minStops} stops, got ${state.stopCount}.`);
  for (const mode of city.requiredModes) {
    assert((state.modes[mode] || 0) > 0, `transport context ${city.id}: missing ${mode} stops.`);
  }
  if (city.requiresCenterProxy) {
    assert(state.proxyCount > 0, `transport context ${city.id}: OSM center-proxy provenance was not available at runtime.`);
  }
  assert(state.guideCount >= city.minGuideFeatures, `transport context ${city.id}: too few guide features (${state.guideCount}).`);
  assert(state.roadContextPath.includes("transport_roads_base.geojson"), `transport context ${city.id}: road context path did not load (${state.roadContextPath}).`);
  assert(state.roadContextSourceCount >= city.minRoadContextSourceFeatures, `transport context ${city.id}: too few source road features loaded (${state.roadContextSourceCount}).`);
  assert(state.roadContextFlowCount >= city.minAccessRoadFlows, `transport context ${city.id}: too few citywide access-network road traces (${state.roadContextFlowCount}).`);
  assert(state.renderedAccessFlows > 0, `transport context ${city.id}: access-network road traces did not render.`);
  assert(state.invalidRoadContextFlows === 0, `transport context ${city.id}: ${state.invalidRoadContextFlows} access road-context guide feature(s) lack provenance/non-headline flags.`);
  for (const sublayerId of city.requiredSublayers) {
    assert((state.guideSublayers[sublayerId] || 0) > 0, `transport context ${city.id}: missing ${sublayerId} guide features.`);
  }
  assert(state.renderedGuide > 0, `transport context ${city.id}: guide features did not render.`);
  assert(!state.appStatus, `transport context ${city.id}: app status reported ${state.appStatus}.`);
  assert(!/No generated marks,\s*context surfaces,\s*or filler geometry are shown for this lens\/year/i.test(state.bodyText), `transport context ${city.id}: status copy contradicts rendered current context.`);
  if (city.expectsContextOnlyNote) {
    assert(/current mapped transport stop\/station context|current transport context/i.test(state.bodyText), `transport context ${city.id}: status copy does not identify current transport context.`);
  }
  const png = await page.screenshot({
    path: path.join(outputDir, `paper-atlas-${city.id}-transport-access-context.png`),
    clip: await visibleCitywideMapClip(page, { x: 0.47, y: 0.1, width: 0.26, height: 0.68 }),
  });
  assertDetailedPng(png, assert, `transport context ${city.id}`);

  await page.locator(".layer-row[data-sublayer='stations_stops']").click();
  await page.waitForFunction(
    () => (window.BimsAtlas?.state?.lensGuideFeatureCache?.features || []).length === 0,
    null,
    { timeout: 10000 }
  );
  await page.locator(".layer-row[data-sublayer='stations_stops']").click();
  await page.waitForFunction(
    (minimum) => (window.BimsAtlas?.state?.lensGuideFeatureCache?.features || []).length >= minimum,
    city.minGuideFeatures,
    { timeout: 10000 }
  );

  await page.locator(".layer-row[data-sublayer='bus_network']").click();
  await page.waitForFunction(
    () => !(window.BimsAtlas?.state?.lensGuideFeatureCache?.features || []).some((feature) => feature.properties?.sublayer_id === "bus_network"),
    null,
    { timeout: 10000 }
  );
  await page.locator(".layer-row[data-sublayer='bus_network']").click();
  await page.waitForFunction(
    () => (window.BimsAtlas?.state?.lensGuideFeatureCache?.features || []).some((feature) => feature.properties?.sublayer_id === "bus_network"),
    null,
    { timeout: 10000 }
  );
}

async function assertTransportNetworkCitywideContext(page, city) {
  await page.waitForFunction(
    (lensId) => window.BimsAtlas?.state?.activeAspect === lensId,
    city.lens,
    { timeout: 15000 }
  );
  await page.waitForFunction(
    () => (window.BimsAtlas?.state?.lensGuideFeatureCache?.features || []).some((feature) => {
      const props = feature.properties || {};
      return props.kind === "flow"
        && ["transport_backbone", "transport_thread"].includes(props.flow_style)
        && ["selected_year_transport_activity_context", "current_context"].includes(props.source_kind);
    }),
    null,
    { timeout: 30000 }
  );
  await page.waitForFunction(
    () => {
      const map = window.BimsAtlas?.state?.map;
      if (!map?.getLayer?.("lens-guide-flow") || map.getLayoutProperty("lens-guide-flow", "visibility") === "none") return false;
      try {
        return map.queryRenderedFeatures({ layers: ["lens-guide-flow"] }).some((feature) => {
          const props = feature.properties || {};
          return props.kind === "flow"
            && ["transport_backbone", "transport_thread"].includes(props.flow_style)
            && ["selected_year_transport_activity_context", "current_context"].includes(props.source_kind);
        });
      } catch (_error) {
        return false;
      }
    },
    null,
    { timeout: 20000 }
  );
  if (city.minCurrentContext) {
    await page.waitForFunction(
      ({ lensId, minCurrentContext }) => {
        const atlas = window.BimsAtlas;
        const guide = (atlas?.state?.lensGuideFeatureCache?.features || []).filter((feature) => feature.properties?.lens_id === lensId);
        const currentContextCount = guide.filter((feature) => {
          const props = feature.properties || {};
          return props.kind === "flow"
            && ["transport_backbone", "transport_thread"].includes(props.flow_style)
            && props.source_kind === "current_context";
        }).length;
        return /transport_roads_base\.geojson/i.test(atlas?.state?.transportAccessRoadContextPathLoaded || "")
          && (atlas?.state?.transportAccessRoadContextFeatures || []).length > 0
          && currentContextCount >= minCurrentContext;
      },
      { lensId: city.lens, minCurrentContext: city.minCurrentContext },
      { timeout: 45000 }
    );
  }
  await page.waitForTimeout(700);
  const state = await page.evaluate(({ lensId, year }) => {
    const atlas = window.BimsAtlas;
    const map = atlas?.state?.map;
    const guide = (atlas?.state?.lensGuideFeatureCache?.features || []).filter((feature) => feature.properties?.lens_id === lensId);
    const split = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
    const networkFlows = guide.filter((feature) => {
      const props = feature.properties || {};
      return props.kind === "flow"
        && ["transport_backbone", "transport_thread"].includes(props.flow_style)
        && ["transport_activity_context", "transport_current_context"].includes(props.flow_role);
    });
    let renderedGuideFlow = 0;
    let renderedRoads = 0;
    let renderedEventPoints = 0;
    try {
      renderedGuideFlow = map?.getLayer?.("lens-guide-flow") && map.getLayoutProperty("lens-guide-flow", "visibility") !== "none"
        ? map.queryRenderedFeatures({ layers: ["lens-guide-flow"] }).filter((feature) => {
          const props = feature.properties || {};
          return props.lens_id === lensId
            && ["transport_backbone", "transport_thread"].includes(props.flow_style)
            && ["selected_year_transport_activity_context", "current_context"].includes(props.source_kind);
        }).length
        : 0;
    } catch (_error) {
      renderedGuideFlow = 0;
    }
    try {
      renderedRoads = map?.getLayer?.("lens-transport-roads") && map.getLayoutProperty("lens-transport-roads", "visibility") !== "none"
        ? map.queryRenderedFeatures({ layers: ["lens-transport-roads"] }).length
        : 0;
    } catch (_error) {
      renderedRoads = 0;
    }
    try {
      renderedEventPoints = map?.getLayer?.("lens-transport-event-points")
        && map.getLayoutProperty("lens-transport-event-points", "visibility") !== "none"
        ? map.queryRenderedFeatures({ layers: ["lens-transport-event-points"] }).length
        : 0;
    } catch (_error) {
      renderedEventPoints = 0;
    }
    const invalidFlows = networkFlows.filter((feature) => {
      const props = feature.properties || {};
      const eventIds = split(props.event_ids || props.event_id);
      const sourceIds = split(props.source_ids || props.source_id);
      const objectIds = split(props.source_object_ids || props.source_object_id);
      const selectedYearContext = props.source_kind === "selected_year_transport_activity_context"
        && props.evidence_role === "selected_year_activity_surface_not_direct_change_evidence"
        && props.detail_layer === "transport_roads_year";
      const currentContext = props.source_kind === "current_context"
        && props.evidence_role === "context_not_year_specific_change_evidence"
        && props.detail_layer === "transport_roads_base";
      return !feature.geometry
        || props.direct_evidence_counted !== false
        || props.headline_count_included !== false
        || eventIds.length > 0
        || !sourceIds.length
        || !sourceIds.every((sourceId) => atlas?.state?.sourceById?.has?.(sourceId))
        || !objectIds.length
        || !props.source_urls
        || !props.generated_from
        || !props.caveat
        || !props.context_year
        || (!selectedYearContext && !currentContext);
    }).length;
    return {
      city: document.querySelector("#cityNameLabel")?.textContent.trim() || "",
      activeAspect: atlas?.state?.activeAspect || "",
      year: Number(atlas?.state?.year || 0),
      guideCount: guide.length,
      networkFlowCount: networkFlows.length,
      activityContextCount: networkFlows.filter((feature) => feature.properties?.source_kind === "selected_year_transport_activity_context").length,
      currentContextCount: networkFlows.filter((feature) => feature.properties?.source_kind === "current_context").length,
      backboneCount: networkFlows.filter((feature) => feature.properties?.flow_style === "transport_backbone").length,
      threadCount: networkFlows.filter((feature) => feature.properties?.flow_style === "transport_thread").length,
      invalidFlows,
      renderedGuideFlow,
      renderedEventPoints,
      renderedRoads,
      roadYearPath: atlas?.state?.transportRoadFeaturesPathLoaded || "",
      roadBasePath: atlas?.state?.transportAccessRoadContextPathLoaded || "",
      bodyText: document.body?.innerText || "",
      expectedYear: year,
    };
  }, { lensId: city.lens, year: city.year });
  assert(state.city === city.label, `transport ${city.id} ${city.lens}: loaded ${state.city} instead of ${city.label}.`);
  assert(state.activeAspect === city.lens, `transport ${city.id}: active aspect is ${state.activeAspect}, expected ${city.lens}.`);
  assert(state.year === city.year, `transport ${city.id} ${city.lens}: loaded year ${state.year}, expected ${city.year}.`);
  assert(state.networkFlowCount >= city.minFlows, `transport ${city.id} ${city.lens}: too few citywide network flows (${state.networkFlowCount}).`);
  assert(state.renderedGuideFlow >= city.minRenderedGuideFlows, `transport ${city.id} ${city.lens}: guide network flows did not render enough features (${state.renderedGuideFlow}).`);
  assert(state.renderedEventPoints > 0, `transport ${city.id} ${city.lens}: direct transport evidence points were hidden by context routes.`);
  assert(state.invalidFlows === 0, `transport ${city.id} ${city.lens}: ${state.invalidFlows} network guide feature(s) lack provenance/non-headline flags.`);
  assert(state.backboneCount > 0, `transport ${city.id} ${city.lens}: no backbone routes were present.`);
  if (city.minActivityContext) {
    assert(state.activityContextCount >= city.minActivityContext, `transport ${city.id} ${city.lens}: too few selected-year activity routes (${state.activityContextCount}).`);
    assert(state.roadYearPath.includes(`transport_roads_${city.year}.geojson`), `transport ${city.id} ${city.lens}: selected-year road artifact did not load (${state.roadYearPath}).`);
  }
  if (city.minCurrentContext) {
    assert(state.currentContextCount >= city.minCurrentContext, `transport ${city.id} ${city.lens}: too few current-context road routes (${state.currentContextCount}).`);
    assert(state.roadBasePath.includes("transport_roads_base.geojson"), `transport ${city.id} ${city.lens}: base road context did not load (${state.roadBasePath}).`);
  }
  const png = await page.screenshot({
    path: path.join(outputDir, `paper-atlas-${city.id}-${city.lens}-network-context-probe.png`),
    clip: await visibleCitywideMapClip(page, { x: 0.47, y: 0.1, width: 0.26, height: 0.68 }),
  });
  assertDetailedPng(png, assert, `transport ${city.id} ${city.lens} citywide`);
}

async function assertCivicAccessCitywideContext(page, city) {
  await page.waitForFunction(() => window.BimsAtlas?.state?.activeAspect === "civic-access-gaps", null, { timeout: 15000 });
  await page.waitForFunction(
    (minimum) => (window.BimsAtlas?.state?.civicServiceFeatures || []).length >= minimum,
    city.minAnchors,
    { timeout: 20000 }
  );
  await page.waitForFunction(
    (minimum) => (window.BimsAtlas?.state?.transportStopFeatures || []).length >= minimum,
    city.minStops,
    { timeout: 20000 }
  );
  await page.waitForFunction(
    () => {
      const guide = window.BimsAtlas?.state?.lensGuideFeatureCache?.features || [];
      return guide.some((feature) => feature.properties?.lens_id === "civic-access-gaps" && feature.properties?.kind === "flow" && feature.properties?.flow_role === "gap_seam")
        && guide.some((feature) => feature.properties?.lens_id === "civic-access-gaps" && feature.properties?.kind === "flow" && feature.properties?.flow_role === "coverage")
        && guide.some((feature) => feature.properties?.lens_id === "civic-access-gaps" && feature.properties?.node_style === "civic_anchor")
        && guide.some((feature) => feature.properties?.lens_id === "civic-access-gaps" && feature.properties?.node_style === "transport");
    },
    null,
    { timeout: 20000 }
  );
  await page.waitForFunction(
    () => {
      const map = window.BimsAtlas?.state?.map;
      return ["lens-guide-citywide-cell-fill", "lens-guide-coverage-flow", "lens-guide-flow", "lens-guide-icon-node"].some((layerId) => {
        if (!map?.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") return false;
        try {
          return map.queryRenderedFeatures({ layers: [layerId] }).length > 0;
        } catch (_error) {
          return false;
        }
      });
    },
    null,
    { timeout: 20000 }
  );
  await page.waitForTimeout(700);
  const guideState = await directGuideState(page);
  assert(guideState.contextGuideFeatureCount > 0, `civic context ${city.id}: expected current-context guide features.`);
  assert(guideState.invalidGuideCount === 0, `civic context ${city.id}: context guide has ${guideState.invalidGuideCount} invalid feature(s).`);
  assert(guideState.renderedGuides > 0, `civic context ${city.id}: context guide did not render.`);

  const state = await page.evaluate(() => {
    const atlas = window.BimsAtlas;
    const map = atlas?.state?.map;
    const services = atlas?.state?.civicServiceFeatures || [];
    const stops = atlas?.state?.transportStopFeatures || [];
    const guide = (atlas?.state?.lensGuideFeatureCache?.features || []).filter((feature) => feature.properties?.lens_id === "civic-access-gaps");
    const row = atlas?.state?.lensYearCoverageByKey?.get?.(`civic-access-gaps:${Number(atlas?.state?.year)}`);
    const count = (predicate) => guide.filter((feature) => predicate(feature.properties || {})).length;
    const renderedByLayer = ["lens-guide-citywide-cell-fill", "lens-guide-coverage-flow", "lens-guide-flow", "lens-guide-icon-node"].reduce((acc, layerId) => {
      if (!map?.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") {
        acc[layerId] = 0;
        return acc;
      }
      try {
        acc[layerId] = map.queryRenderedFeatures({ layers: [layerId] }).length;
      } catch (_error) {
        acc[layerId] = 0;
      }
      return acc;
    }, {});
    return {
      city: document.querySelector("#cityNameLabel")?.textContent.trim() || "",
      activeAspect: atlas?.state?.activeAspect || "",
      servicePath: atlas?.state?.civicServiceFeaturesPathLoaded || "",
      stopPath: atlas?.state?.transportStopFeaturesPathLoaded || "",
      serviceCount: services.length,
      stopCount: stops.length,
      guideCount: guide.length,
      cellCount: count((props) => props.kind === "surface_cell" && props.guide_scale === "citywide_summary"),
      coverageFlowCount: count((props) => props.kind === "flow" && props.flow_role === "coverage"),
      gapFlowCount: count((props) => props.kind === "flow" && props.flow_role === "gap_seam"),
      serviceNodeCount: count((props) => props.kind === "node" && props.node_style === "civic_anchor"),
      stopNodeCount: count((props) => props.kind === "node" && props.node_style === "transport"),
      directCount: Number(row?.direct_event_count || 0),
      coverageStatus: row?.status || "",
      renderedByLayer,
      appStatus: document.querySelector("#appStatus")?.textContent.trim() || "",
      bodyText: document.body?.innerText || "",
    };
  });
  assert(state.city === city.label, `civic context ${city.id}: loaded ${state.city} instead of ${city.label}.`);
  assert(state.activeAspect === "civic-access-gaps", `civic context ${city.id}: active aspect is ${state.activeAspect}.`);
  assert(state.servicePath.includes("civic_services_2026.geojson"), `civic context ${city.id}: civic service artifact path did not load.`);
  assert(state.stopPath.includes("transport_stops_2026.geojson"), `civic context ${city.id}: transport stop artifact path did not load.`);
  assert(state.serviceCount >= city.minAnchors, `civic context ${city.id}: expected at least ${city.minAnchors} service anchors, got ${state.serviceCount}.`);
  assert(state.stopCount >= city.minStops, `civic context ${city.id}: expected at least ${city.minStops} stop anchors, got ${state.stopCount}.`);
  assert(state.guideCount >= city.minGuideFeatures, `civic context ${city.id}: too few guide features (${state.guideCount}).`);
  assert(state.cellCount >= city.minCells, `civic context ${city.id}: too few citywide surface cells (${state.cellCount}).`);
  assert(state.coverageFlowCount >= city.minCoverageFlows, `civic context ${city.id}: too few coverage flows (${state.coverageFlowCount}).`);
  assert(state.gapFlowCount >= city.minGapFlows, `civic context ${city.id}: too few low-coverage seam flows (${state.gapFlowCount}).`);
  assert(state.serviceNodeCount >= city.minServiceNodes, `civic context ${city.id}: too few civic service nodes (${state.serviceNodeCount}).`);
  assert(state.stopNodeCount >= city.minStopNodes, `civic context ${city.id}: too few stop nodes (${state.stopNodeCount}).`);
  assert(Object.values(state.renderedByLayer).some((count) => count > 0), `civic context ${city.id}: no guide layer rendered.`);
  assert(!state.appStatus, `civic context ${city.id}: app status reported ${state.appStatus}.`);
  if (state.directCount <= 0 || state.coverageStatus !== "source_backed_records") {
    assert(/current mapped civic-service context|current context only/i.test(state.bodyText), `civic context ${city.id}: status copy does not identify current civic-service context.`);
  }
  const png = await page.screenshot({
    path: path.join(outputDir, `paper-atlas-${city.id}-civic-access-context.png`),
    clip: await visibleCitywideMapClip(page, { x: 0.36, y: 0.08, width: 0.36, height: 0.7 }),
  });
  assertDetailedPng(png, assert, `civic context ${city.id}`);

  await page.locator(".layer-row[data-sublayer='coverage']").click();
  await page.waitForFunction(
    () => {
      const atlas = window.BimsAtlas;
      const map = atlas?.state?.map;
      const guide = atlas?.state?.lensGuideFeatureCache?.features || [];
      const coverageOff = atlas?.state?.activeAspectLayers && !atlas.state.activeAspectLayers.has("coverage");
      const hasGapSeams = guide.some((feature) => feature.properties?.lens_id === "civic-access-gaps" && feature.properties?.flow_role === "gap_seam");
      let renderedGapSeams = 0;
      if (map?.getLayer?.("lens-guide-flow") && map.getLayoutProperty("lens-guide-flow", "visibility") !== "none") {
        try {
          renderedGapSeams = map.queryRenderedFeatures({ layers: ["lens-guide-flow"] }).filter((feature) => feature.properties?.flow_role === "gap_seam").length;
        } catch (_error) {
          renderedGapSeams = 0;
        }
      }
      return coverageOff && hasGapSeams && renderedGapSeams > 0;
    },
    null,
    { timeout: 12000 }
  );
  await page.locator(".layer-row[data-sublayer='coverage']").click();
}

let dashboardPrimaryBrowser = null;

async function closeDashboardPrimaryBrowser() {
  if (dashboardPrimaryBrowser) await dashboardPrimaryBrowser.close().catch(() => {});
  dashboardPrimaryBrowser = null;
}

async function runDashboardSmoke() {
  ensureOutputDir();
  dashboardPrimaryBrowser = await chromium.launch(chromiumLaunchOptions);
  const browser = dashboardPrimaryBrowser;
  const consoleMessages = [];
  const pageErrors = [];

  const desktop = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  attachConsoleCapture(desktop, consoleMessages, pageErrors);
  await openAtlas(desktop, atlasUrl);
  await desktop.waitForTimeout(1800);
  const desktopState = await assertResponsiveLayout(desktop, "desktop");
  assert(desktopState.scrollHeight <= desktopState.clientHeight + 4, "desktop: fixed atlas shell should not vertically overflow.");
  await assertDesktopCoreInteractions(desktop);
  await assertDesktopButtonsRespond(desktop);
  await assertDesktopCitywideCoverage(desktop);
  const desktopPng = await desktop.screenshot({ path: path.join(outputDir, "paper-atlas-desktop.png"), fullPage: false });
  assertDetailedPng(desktopPng, assert, "Paper atlas desktop");
  await desktop.close();

  const tablet = await browser.newPage({ viewport: { width: 900, height: 760 }, deviceScaleFactor: 1 });
  attachConsoleCapture(tablet, consoleMessages, pageErrors);
  await openAtlas(tablet, atlasUrl);
  await tablet.waitForTimeout(1200);
  const tabletState = await assertResponsiveLayout(tablet, "tablet");
  assert(tabletState.scrollWidth <= 904, "tablet: responsive shell exceeded viewport width.");
  await tablet.screenshot({ path: path.join(outputDir, "paper-atlas-tablet.png"), fullPage: false });
  await tablet.close();

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
  await assertMobileButtonsRespond(mobile);
  await mobile.close();
  await browser.close();
  dashboardPrimaryBrowser = null;

  const cityChecks = [
    { id: "belfast", label: "Belfast", placeholder: /Belfast/i, year: 2007, aspect: "transport-speed", minVisiblePins: 1 },
    { id: "london", label: "London", placeholder: /London/i, year: 2024, aspect: "civic-demand", minVisiblePins: 8 },
    { id: "nyc", label: "New York City", placeholder: /New York City/i, year: 2024, aspect: "planning-delta", minVisiblePins: 8 },
  ];
  for (const city of cityChecks) {
    const cityBrowser = await chromium.launch(chromiumLaunchOptions);
    const page = await cityBrowser.newPage({ viewport: REFERENCE_VIEWPORT, deviceScaleFactor: 1 });
    try {
      attachConsoleCapture(page, consoleMessages, pageErrors);
      await openAtlas(page, `${atlasUrl}?city=${city.id}&year=${city.year}&lens=${city.aspect}`);
      await page.waitForTimeout(city.id === "london" ? 2400 : 1400);
      const cityState = await assertResponsiveLayout(page, `city ${city.id}`);
      assert(cityState.city === city.label, `city ${city.id}: loaded ${cityState.city} instead of ${city.label}.`);
      assert(cityState.citywideLensMode, `city ${city.id}: atlas did not start in citywide lens mode.`);
      assert(cityState.mapZoom <= 11.7, `city ${city.id}: atlas opened at local/event zoom (${cityState.mapZoom}).`);
      assert(city.placeholder.test(cityState.searchPlaceholder), `city ${city.id}: search placeholder is not city-specific.`);
      assert(cityState.visiblePinCount >= city.minVisiblePins, `city ${city.id}: too few visible city records.`);
      await assertCitySourceBackedLensCoverage(page, city.id);
    } finally {
      await page.close().catch(() => {});
      await cityBrowser.close().catch(() => {});
    }
    await assertReferenceLensCitywideArtifacts(city.id, consoleMessages, pageErrors);
  }

  const transportContextChecks = [
    { id: "belfast", label: "Belfast", year: 2024, minStops: 1500, minGuideFeatures: 500, minRoadContextSourceFeatures: 1000, minAccessRoadFlows: 180, requiredModes: ["bus"], requiredSublayers: ["bus_network"], requiresCenterProxy: false, expectsContextOnlyNote: true },
    { id: "london", label: "London", year: 2024, minStops: 6500, minGuideFeatures: 1100, minRoadContextSourceFeatures: 5000, minAccessRoadFlows: 420, requiredModes: ["bus", "rail", "ferry"], requiredSublayers: ["bus_network", "rail_network", "ferry_routes"], requiresCenterProxy: true },
    { id: "nyc", label: "New York City", year: 2024, minStops: 6500, minGuideFeatures: 1100, minRoadContextSourceFeatures: 5000, minAccessRoadFlows: 340, requiredModes: ["bus", "rail", "ferry"], requiredSublayers: ["bus_network", "rail_network", "ferry_routes"], requiresCenterProxy: true },
  ];
  for (const city of transportContextChecks) {
    progress("transport access context", city.id);
    const cityBrowser = await chromium.launch(chromiumLaunchOptions);
    const page = await cityBrowser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    try {
      attachConsoleCapture(page, consoleMessages, pageErrors);
      await openAtlasShell(page, `${atlasUrl}?city=${city.id}&year=${city.year}&lens=transport-access`);
      await assertTransportAccessStopContext(page, city);
    } finally {
      await page.close().catch(() => {});
      await cityBrowser.close().catch(() => {});
    }
  }

  const transportNetworkChecks = [
    { id: "belfast", label: "Belfast", year: 2007, lens: "transport-speed", minFlows: 180, minRenderedGuideFlows: 80, minCurrentContext: 180 },
    { id: "belfast", label: "Belfast", year: 2007, lens: "transport-reliability", minFlows: 180, minRenderedGuideFlows: 80, minCurrentContext: 180 },
    { id: "london", label: "London", year: 2024, lens: "transport-speed", minFlows: 1200, minRenderedGuideFlows: 220, minActivityContext: 700, minCurrentContext: 300 },
    { id: "london", label: "London", year: 2024, lens: "transport-reliability", minFlows: 900, minRenderedGuideFlows: 180, minActivityContext: 550, minCurrentContext: 300 },
    { id: "nyc", label: "New York City", year: 2024, lens: "transport-speed", minFlows: 900, minRenderedGuideFlows: 300, minActivityContext: 520, minCurrentContext: 240 },
    { id: "nyc", label: "New York City", year: 2024, lens: "transport-reliability", minFlows: 760, minRenderedGuideFlows: 260, minActivityContext: 430, minCurrentContext: 240 },
  ];
  for (const city of transportNetworkChecks) {
    progress("transport network context", city.id, city.lens);
    const cityBrowser = await chromium.launch(chromiumLaunchOptions);
    const page = await cityBrowser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    try {
      attachConsoleCapture(page, consoleMessages, pageErrors);
      await openAtlasShell(page, `${atlasUrl}?city=${city.id}&year=${city.year}&lens=${city.lens}`);
      await assertTransportNetworkCitywideContext(page, city);
    } finally {
      await page.close().catch(() => {});
      await cityBrowser.close().catch(() => {});
    }
  }

  const civicContextChecks = [
    { id: "belfast", label: "Belfast", year: 2024, minAnchors: 3500, minStops: 1500, minGuideFeatures: 1350, minCells: 900, minCoverageFlows: 70, minGapFlows: 70, minServiceNodes: 28, minStopNodes: 26 },
    { id: "london", label: "London", year: 2024, minAnchors: 12000, minStops: 6500, minGuideFeatures: 3250, minCells: 2800, minCoverageFlows: 100, minGapFlows: 100, minServiceNodes: 32, minStopNodes: 30 },
    { id: "nyc", label: "New York City", year: 2024, minAnchors: 12000, minStops: 6500, minGuideFeatures: 3250, minCells: 2800, minCoverageFlows: 100, minGapFlows: 100, minServiceNodes: 32, minStopNodes: 30 },
  ];
  for (const city of civicContextChecks) {
    progress("civic access context", city.id);
    const cityBrowser = await chromium.launch(chromiumLaunchOptions);
    const page = await cityBrowser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    try {
      attachConsoleCapture(page, consoleMessages, pageErrors);
      await openAtlasShell(page, `${atlasUrl}?city=${city.id}&year=${city.year}&lens=civic-access-gaps`);
      await assertCivicAccessCitywideContext(page, city);
    } finally {
      await page.close().catch(() => {});
      await cityBrowser.close().catch(() => {});
    }
  }

  assertReferenceCitywideScreenshotsPersist();
  const actionable = actionableConsoleMessages(consoleMessages);
  assert(pageErrors.length === 0, `Dashboard page errors:\n${pageErrors.join("\n")}`);
  assert(actionable.length === 0, `Dashboard console warnings/errors:\n${actionable.map((message) => `${message.type}: ${message.text}`).join("\n")}`);
  console.log("OpenCityLog paper-atlas dashboard smoke OK: desktop, tablet, mobile, Belfast/London/NYC city checks, transport speed/reliability/access context, and civic-access context checks passed.");
}

async function main() {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await closeDashboardPrimaryBrowser();
      await runDashboardSmoke();
      return;
    } catch (error) {
      lastError = error;
      await closeDashboardPrimaryBrowser();
      if (!isClosedTargetError(error) || attempt === 3) break;
      progress("dashboard retry", `attempt ${attempt + 1}`);
    }
  }
  throw lastError;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
