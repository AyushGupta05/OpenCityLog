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
  chromiumLaunchOptions,
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

async function downloadTextFromClick(page, selector) {
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 10000 }),
    page.locator(selector).first().click(),
  ]);
  const filePath = await download.path();
  assert(filePath, `Download for ${selector} did not produce a readable file.`);
  return fs.readFileSync(filePath, "utf8");
}

async function assertNoGeneratedGuideSignal(page, label) {
  const guideState = await page.evaluate(() => {
    const state = window.BimsAtlas?.state;
    const map = state?.map;
    const guideLayers = [
      "lens-guide-flow",
      "lens-guide-cell-fill",
      "lens-guide-area-line",
      "lens-guide-ring-line",
      "lens-guide-node",
      "lens-guide-icon-node",
    ];
    let rendered = 0;
    for (const layerId of guideLayers) {
      if (!map?.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") continue;
      try {
        rendered += map.queryRenderedFeatures({ layers: [layerId] }).length;
      } catch {
        // Empty guide layers are acceptable in strict source-only mode.
      }
    }
    return {
      activeAspect: state?.activeAspect || "",
      guideFeatureCount: state?.lensGuideFeatureCache?.features?.length || 0,
      rendered,
    };
  });
  assert(guideState.guideFeatureCount === 0, `${label}: generated guide feature cache is not empty (${guideState.guideFeatureCount}).`);
  assert(guideState.rendered === 0, `${label}: generated guide layers rendered ${guideState.rendered} features.`);
}

async function assertAspectCopy(page, aspectId, { required = [], forbidden = [] } = {}) {
  await page.evaluate((id) => window.BimsAtlas?.setActiveAspect?.(id), aspectId);
  await page.waitForFunction(
    (id) => window.BimsAtlas?.state?.activeAspect === id,
    aspectId,
    { timeout: 10000 }
  );
  const state = await atlasState(page);
  const visibleCopy = `${state.lensLegendText}\n${state.bodyText}`;
  for (const pattern of required) {
    assert(pattern.test(visibleCopy), `${aspectId} did not expose expected provenance-safe copy: ${pattern}`);
  }
  for (const pattern of forbidden) {
    assert(!pattern.test(visibleCopy), `${aspectId} exposed overclaiming or stale copy: ${pattern}`);
  }
}

async function assertMissingSourceOnlyForAspect(page, { year, aspect, patterns = [] }) {
  await page.evaluate(async ({ targetYear, targetAspect }) => {
    await window.BimsAtlas?.setYear?.(targetYear);
    await window.BimsAtlas?.setActiveAspect?.(targetAspect);
  }, { targetYear: year, targetAspect: aspect });
  await page.waitForFunction(
    ({ targetYear, targetAspect }) => Number(window.BimsAtlas?.state?.year) === targetYear
      && window.BimsAtlas?.state?.activeAspect === targetAspect
      && /No source-backed/i.test(document.querySelector("#lensLegend")?.textContent || ""),
    { targetYear: year, targetAspect: aspect },
    { timeout: 20000 }
  );
  const state = await atlasState(page);
  const legendText = state.lensLegendText.replace(/\s+/g, " ");
  assert(state.lensYearCoverageLoaded && !state.lensYearCoverageError, `Lens-year coverage metadata did not load: ${state.lensYearCoverageError}`);
  assert(state.lensYearCoverageStatus === "missing_source_backed_view", `${aspect} ${year} should be explicitly missing, got ${state.lensYearCoverageStatus || "missing"}.`);
  assert(!state.lensYearCoverageVisible, `${aspect} ${year} must not stay visible without real source-backed records.`);
  assert(state.lensYearCoverageContextCount === 0, `${aspect} ${year} must not expose generated filler features.`);
  assert(/No source-backed/i.test(legendText), `${aspect} ${year} did not expose a no-source-backed warning in the lens legend.`);
  assert(/No coverage surface|no filler geometry/i.test(legendText), `${aspect} ${year} warning did not state that filler geometry is absent: ${legendText}`);
  assert(new RegExp(String(year)).test(legendText), `${aspect} warning did not name the selected year ${year}: ${legendText}`);
  for (const pattern of patterns) {
    assert(pattern.test(legendText), `${aspect} ${year} warning did not match ${pattern}: ${legendText}`);
  }
}

async function assertNoGapWarningForAspect(page, year, aspectId) {
  await page.evaluate(async ({ targetYear, targetAspect }) => {
    await window.BimsAtlas?.setYear?.(targetYear);
    await window.BimsAtlas?.setActiveAspect?.(targetAspect);
  }, { targetYear: year, targetAspect: aspectId });
  await page.waitForFunction(
    ({ targetYear, targetAspect }) => Number(window.BimsAtlas?.state?.year) === targetYear
      && window.BimsAtlas?.state?.activeAspect === targetAspect
      && !/No source-backed/i.test(document.querySelector("#lensLegend")?.textContent || ""),
    { targetYear: year, targetAspect: aspectId },
    { timeout: 20000 }
  );
  const state = await atlasState(page);
  assert(state.lensYearCoverageStatus === "source_backed_records", `${aspectId} ${year} should have source-backed records, got ${state.lensYearCoverageStatus || "missing"}.`);
  assert(!/No source-backed/i.test(state.lensLegendText), `${aspectId} ${year} retained a stale no-source-backed warning.`);
}

let browser;

async function runSmoke() {
  ensureOutputDir();
  browser = await chromium.launch(chromiumLaunchOptions);
  let page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, acceptDownloads: true });
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
  assert(initial.activeLens === "transport", "Transport should be the default active map lens.");
  assert(initial.activeAspect === "transport-speed", "Transport Activity should be the default 15-lens view.");
  assert(initial.lensChoiceCount === 15, "The desktop lens switcher should expose all 15 atlas lenses.");
  assert(initial.lensYearCoverageLoaded && !initial.lensYearCoverageError, `Lens-year coverage metadata did not load: ${initial.lensYearCoverageError}`);
  assert(initial.lensYearCoverageVisible, "The active 15-lens/year contract row is not marked visible.");
  const lensYearAudit = await page.evaluate(() => {
    const state = window.BimsAtlas?.state;
    const aspects = [...document.querySelectorAll(".lens-choice")].map((button) => button.getAttribute("data-aspect")).filter(Boolean);
    const years = Array.from({ length: 20 }, (_, index) => 2007 + index);
      const missing = [];
      const contextRows = [];
      for (const aspect of aspects) {
        for (const year of years) {
          const row = state?.lensYearCoverageByKey?.get?.(`${aspect}:${year}`);
          if (!row?.visible_map_contract) missing.push(`${aspect}:${year}:${row?.status || "missing"}`);
          if (/context/i.test(row?.status || "") || Number(row?.coverage_context_feature_count || 0) > 0) contextRows.push(`${aspect}:${year}`);
        }
      }
      return {
        aspectCount: aspects.length,
        rowCount: state?.lensYearCoverage?.row_count || state?.lensYearCoverage?.rows?.length || 0,
        missing,
        contextRows,
      };
    });
  assert(lensYearAudit.aspectCount === 15, "Lens switcher did not expose the 15 mandatory lens aspects.");
  assert(lensYearAudit.rowCount === 300, `Lens-year coverage should expose 300 city rows, got ${lensYearAudit.rowCount}.`);
  assert(lensYearAudit.contextRows.length === 0, `Lens-year coverage still exposes context filler rows: ${lensYearAudit.contextRows.slice(0, 8).join(", ")}`);
  assert(lensYearAudit.missing.length === 3, `Belfast should expose exactly the three real missing 2007 transport lens-years, got ${lensYearAudit.missing.slice(0, 8).join(", ")}`);
  assert(/Flow-proxy|Road flow proxy/i.test(initial.lensLegendText), "Transport lens legend did not render the source-derived flow copy.");
  assert(initial.transportRoadVisible, "Transport road lens should be visible while the transport layer is enabled.");
  assert(initial.transportRoadYearLoaded === Number(initial.year), "Transport road lens did not load the current timeline year.");
  assert(initial.compareOpen === "false", "Compare panel should start closed.");
  assert(initial.layersCount === "6/6 on", "All paper-atlas layers should be active on first load.");
  assert(initial.detailOpen && initial.detailTitle.length > 8, "Selected event detail panel did not render.");
  assert(initial.detailLensEvidenceRows === 6 && initial.detailEvidenceButtons > 0, "Detail panel did not render before/after evidence across lenses.");
  assert(initial.welcomeOpen === "false" && initial.welcomeVisibility === "hidden", "Welcome card did not close cleanly.");
  assert(!/CivicReplay|Run Simulation|Scenario Studio|10-year/i.test(initial.bodyText), "Legacy simulator copy is visible.");

  await page.locator("#methodBtn").click();
  await page.waitForFunction(
    () => document.querySelector("#methodOverlay")?.getAttribute("data-open") === "true"
      && document.activeElement?.id === "methodClose"
      && document.querySelector(".topbar")?.hasAttribute("inert"),
    null,
    { timeout: 10000 }
  );
  await page.keyboard.press("Tab");
  const methodTabState = await page.evaluate(() => ({
    insideDialog: Boolean(document.querySelector("#methodOverlay")?.contains(document.activeElement)),
    activeId: document.activeElement?.id || "",
  }));
  assert(methodTabState.insideDialog, `Methodology dialog did not trap Tab focus, active=${methodTabState.activeId}.`);
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => document.querySelector("#methodOverlay")?.getAttribute("data-open") === "false"
      && document.activeElement?.id === "methodBtn"
      && !document.querySelector(".topbar")?.hasAttribute("inert"),
    null,
    { timeout: 10000 }
  );

  await page.evaluate(() => window.BimsAtlas?.recenterMap?.());
  await page.waitForTimeout(800);
  const yorkPin = await clickPin(page, "York Street");
  await page.waitForFunction(
    () => document.querySelector(".detail-title")?.textContent.includes("York Street"),
    null,
    { timeout: 10000 }
  );
  const afterPinClick = await atlasState(page);
  assert(afterPinClick.detailTitle.includes("York Street"), "Clicking a York Street map pin did not update the evidence detail panel.");
  assert(afterPinClick.activePin?.text.includes("York Street"), "Clicked map pin did not become the active event.");
  await page.waitForFunction(
    () => document.querySelector("#mapStudyChip")?.dataset.scope !== "city"
      && Number(window.BimsAtlas?.state?.map?.getZoom?.() || 0) >= 12.5,
    null,
    { timeout: 10000 }
  );
  await page.evaluate(() => window.BimsAtlas?.setActiveAspect?.("civic-access-gaps"));
  await page.waitForFunction(
    () => window.BimsAtlas?.state?.activeAspect === "civic-access-gaps"
      && document.querySelector("#mapStudyChip")?.dataset.scope !== "city",
    null,
    { timeout: 10000 }
  );
  const afterLocalLensSwitch = await atlasState(page);
  assert(afterLocalLensSwitch.mapZoom >= 12.5, "Switching lenses from an event-focused view unexpectedly reset to the citywide camera.");
  await page.evaluate(() => window.BimsAtlas?.setActiveAspect?.("transport-speed"));
  await page.waitForFunction(() => window.BimsAtlas?.state?.activeAspect === "transport-speed", null, { timeout: 10000 });

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

  await page.close();
  page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, acceptDownloads: true });
  attachConsoleCapture(page, consoleMessages, pageErrors);
  await openAtlas(page, atlasUrl);
  await page.waitForFunction(
    () => window.BimsAtlas?.state?.detailLayerLoaded && window.BimsAtlas?.state?.lensOverlayLoaded,
    null,
    { timeout: 45000 }
  );
  await page.waitForTimeout(1200);

  await page.locator("#searchInput").fill("Grand Central");
  await page.waitForSelector("#searchResults .search-row", { timeout: 10000 });
  await page.keyboard.press("Tab");
  const searchFocus = await page.evaluate(() => ({
    activeClass: document.activeElement?.className || "",
    resultsOpen: !document.querySelector("#searchResults")?.hasAttribute("hidden"),
  }));
  assert(searchFocus.resultsOpen && /\bsearch-row\b/.test(searchFocus.activeClass), "Search results did not stay open and receive keyboard focus after Tab.");
  await page.locator("#searchResults .search-row").filter({ hasText: grandCentralTitle }).first().click();
  await page.waitForFunction(
    () => /Grand Central Station/i.test(document.querySelector(".detail-title")?.textContent || "")
      && document.querySelector("#searchResults")?.hasAttribute("hidden"),
    null,
    { timeout: 10000 }
  );
  await page.locator("#searchInput").fill("");
  await page.waitForFunction(() => !window.BimsAtlas?.state?.search, null, { timeout: 10000 });

  const csvExport = await downloadTextFromClick(page, "#exportCsvBtn");
  assert(csvExport.includes("event_id,title,city_id") && csvExport.includes("source_urls") && csvExport.includes("licenses"), "Filtered CSV export omitted provenance columns.");
  const geojsonExport = JSON.parse(await downloadTextFromClick(page, "#exportGeojsonBtn"));
  assert(geojsonExport.type === "FeatureCollection" && geojsonExport.features.length > 0, "Filtered GeoJSON export did not contain features.");
  assert(Array.isArray(geojsonExport.features[0].properties.source_urls) && "provenance" in geojsonExport.features[0].properties, "Filtered GeoJSON export omitted source/provenance properties.");
  const markdownExport = await downloadTextFromClick(page, "#detailExportMarkdown, #detailExportMarkdownAction");
  assert(markdownExport.includes("## Provenance") && markdownExport.includes("## Sources"), "Selected-record Markdown export omitted provenance/source sections.");
  const selectedGeojson = JSON.parse(await downloadTextFromClick(page, "#detailExportGeojson"));
  assert(selectedGeojson.type === "FeatureCollection" && selectedGeojson.features.length === 1, "Selected-record GeoJSON export should contain exactly one feature.");
  assert("provenance" in selectedGeojson.features[0].properties, "Selected-record GeoJSON export omitted provenance.");

  await page.close();
  page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, acceptDownloads: true });
  attachConsoleCapture(page, consoleMessages, pageErrors);
  await openAtlas(page, atlasUrl);
  await page.waitForFunction(
    () => window.BimsAtlas?.state?.detailLayerLoaded && window.BimsAtlas?.state?.lensOverlayLoaded,
    null,
    { timeout: 45000 }
  );
  await page.waitForTimeout(1200);

  await page.locator("#searchInput").fill("");
  await page.waitForFunction(() => !window.BimsAtlas?.state?.search, null, { timeout: 10000 });

  const areaCandidate = await page.evaluate(() => {
    const wholeCity = new Set(["belfast", "london", "new york", "new york city", "nyc"]);
    return (window.BimsAtlas?.filteredEvents?.() || [])
      .map((event) => event.area || "")
      .find((area) => area.length > 3 && !wholeCity.has(area.toLowerCase().trim())) || "";
  });
  assert(areaCandidate, "Could not find a source-backed area label to exercise the area filter.");
  const beforeAreaFilter = await atlasState(page);
  assert(beforeAreaFilter.areaFilterOptionCount > 0, "Area filter suggestions did not render.");
  await page.evaluate((area) => window.BimsAtlas?.setAreaFilter?.(area), areaCandidate);
  await page.waitForFunction(
    (area) => window.BimsAtlas?.state?.areaFilter === area
      && document.querySelector("#areaFilterInput")?.value === area
      && Number(document.querySelector("#tlVisible")?.textContent || 0) > 0,
    areaCandidate,
    { timeout: 10000 }
  );
  const afterAreaFilter = await atlasState(page);
  assert(afterAreaFilter.areaFilterValue === areaCandidate, "Area filter input did not stay synced with atlas state.");
  assert(/Area:/i.test(afterAreaFilter.eventListMeta), "Changelog metadata does not expose the active area filter.");
  assert(Number(afterAreaFilter.visibleText) <= Number(beforeAreaFilter.visibleText), "Area filter increased the visible record count.");
  await page.evaluate(() => window.BimsAtlas?.setActiveAspect?.("transport-access"));
  await page.waitForFunction(() => window.BimsAtlas?.state?.activeAspect === "transport-access", null, { timeout: 10000 });
  const afterAreaLensSwitch = await atlasState(page);
  assert(afterAreaLensSwitch.areaFilterValue === areaCandidate, "Lens switching should preserve the active area filter.");
  await page.evaluate(async () => {
    await window.BimsAtlas?.setActiveAspect?.("transport-speed");
    await window.BimsAtlas?.setAreaFilter?.("");
  });
  await page.waitForFunction(
    () => window.BimsAtlas?.state?.activeAspect === "transport-speed" && !window.BimsAtlas?.state?.areaFilter,
    null,
    { timeout: 10000 }
  );

  const beforeLensSwitch = await atlasState(page);
  assert(beforeLensSwitch.activeLens === "transport", "Atlas should start on the transport map lens.");
  assert(beforeLensSwitch.lensDetailYearLoaded === null, "Transport lens should not eagerly load non-transport lens detail overlays.");

  const aspectChecks = [
    { id: "transport-speed" },
    { id: "transport-access" },
    { id: "transport-reliability" },
    { id: "planning-pressure" },
    { id: "planning-delta" },
    { id: "planning-parcels" },
    { id: "civic-access-gaps" },
    { id: "civic-catchment" },
    { id: "civic-demand" },
    { id: "economy-vitality" },
    { id: "economy-land-use" },
    { id: "economy-gravity" },
    { id: "utilities-capacity" },
    { id: "utilities-resilience" },
    { id: "utilities-works" },
  ];
  for (const check of aspectChecks) {
    const activeAspect = await page.evaluate((id) => {
      window.BimsAtlas?.setActiveAspect?.(id);
      return window.BimsAtlas?.state?.activeAspect || "";
    }, check.id);
    assert(activeAspect === check.id, `Atlas did not activate ${check.id}; active aspect is ${activeAspect || "missing"}.`);
    await page.waitForTimeout(250);
    await assertNoGeneratedGuideSignal(page, check.id);
  }

  const provenanceCopyChecks = [
    {
      id: "transport-speed",
      required: [/Flow-proxy|Road flow proxy/i],
      forbidden: [/Speed colors/i],
    },
    {
      id: "transport-access",
      required: [/Access-proxy/i, /not measured trip times/i],
      forbidden: [/Isochrone/i, /Door-to-door/i, /\b15 min\b/i],
    },
    {
      id: "civic-access-gaps",
      required: [/Access-proxy/i, /not measured travel time/i],
      forbidden: [/\b15 min\b/i, /<=\s*\d+\s*min/i],
    },
    {
      id: "transport-reliability",
      required: [/Lower disruption signal/i, /record\/context signals/i],
      forbidden: [/Reliable \(on-time\)/i, /Unreliable \(delayed\)/i],
    },
    {
      id: "utilities-capacity",
      required: [/Utility context/i, /not engineering capacity data/i],
      forbidden: [/load-risk/i],
    },
  ];
  for (const check of provenanceCopyChecks) {
    await assertAspectCopy(page, check.id, check);
  }

  const coveredWarningChecks = [
    { year: 2007, aspect: "planning-delta" },
    { year: 2007, aspect: "civic-demand" },
    { year: 2015, aspect: "economy-gravity" },
    { year: 2013, aspect: "utilities-capacity" },
    { year: 2024, aspect: "planning-delta" },
    { year: 2024, aspect: "civic-demand" },
    { year: 2024, aspect: "economy-gravity" },
    { year: 2024, aspect: "utilities-capacity" },
  ];
  for (const check of coveredWarningChecks) {
    await assertNoGapWarningForAspect(page, check.year, check.aspect);
  }
  const missingWarningChecks = [
    { year: 2007, aspect: "transport-speed" },
    { year: 2007, aspect: "transport-access" },
    { year: 2007, aspect: "transport-reliability" },
  ];
  for (const check of missingWarningChecks) {
    await assertMissingSourceOnlyForAspect(page, check);
  }
  await page.evaluate(async () => {
    await window.BimsAtlas?.setYear?.(2024);
    await window.BimsAtlas?.setActiveAspect?.("transport-speed");
  });
  await page.waitForFunction(
    () => Number(window.BimsAtlas?.state?.year) === 2024
      && window.BimsAtlas?.state?.activeAspect === "transport-speed",
    null,
    { timeout: 20000 }
  );

  const lensChecks = [
    { id: "built_environment", layer: "lens-planning-cells-fill", visible: "lensPlanningCellsVisible", rendered: "lensPlanningCellsRendered", legend: /Planning & Built|Cells/i },
    { id: "civic_services", layer: "lens-civic-coverage-fill", visible: "lensCivicCoverageVisible", rendered: "lensCivicCoverageRendered", legend: /Civic Services|facility|Coverage/i },
    { id: "economy", layer: "lens-economy-frontage", visible: "lensEconomyCellsVisible", rendered: "lensEconomyFrontageRendered", legend: /Economy|frontage|activity/i },
    { id: "utilities", layer: "lens-utilities-trace", visible: "lensUtilityTraceVisible", rendered: "lensUtilityTraceRendered", legend: /Utilities|trace|asset/i },
    {
      id: "transport",
      layer: "lens-transport-roads",
      visible: "transportRoadVisible",
      count: "transportRoadFeatureCount",
      legend: /Transport|activity/i,
    },
  ];
  for (const check of lensChecks) {
    await page.evaluate((id) => window.BimsAtlas?.setActiveLens?.(id), check.id);
    await page.waitForFunction(
      (id) => window.BimsAtlas?.state?.activeLens === id,
      check.id,
      { timeout: 10000 }
    );
    if (check.count) {
      await page.waitForFunction(
        (field) => Number(window.BimsAtlas?.state?.[field] || 0) > 0,
        check.count,
        { timeout: 15000 }
      );
    } else {
      await page.waitForFunction(
        (layerId) => {
          const map = window.BimsAtlas?.state?.map;
          if (!map?.getLayer(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") return false;
          try {
            return map.queryRenderedFeatures({ layers: [layerId] }).length > 0;
          } catch {
            return false;
          }
        },
        check.layer,
        { timeout: 15000 }
      );
    }
    await assertNoGeneratedGuideSignal(page, check.id);
    const lensState = await atlasState(page);
    assert(lensState.activeLens === check.id, `Map lens did not switch to ${check.id}.`);
    assert(lensState[check.visible], `${check.id} map lens did not show its expected overlay layer.`);
    if (check.count) {
      assert(lensState[check.count] > 0, `${check.id} map lens did not load inspectable lens features.`);
    } else {
      assert(lensState[check.rendered] > 0, `${check.id} map lens did not render inspectable lens features in the viewport.`);
    }
    assert(check.legend.test(lensState.lensLegendText), `${check.id} legend did not update: ${lensState.lensLegendText}`);
    if (check.id !== "transport") {
      assert(lensState.lensDetailYearLoaded === Number(lensState.year), `${check.id} detail lens did not load the current timeline year.`);
    } else {
      assert(lensState.lensDetailYearLoaded === null, "Transport lens should unload non-transport lens detail overlays.");
    }
    const lensScreenshot = await page.screenshot({ path: path.join(outputDir, `atlas-lens-${check.id}.png`), fullPage: false });
    assertDetailedPng(lensScreenshot, assert, `${check.id} lens screenshot`);
  }

  await page.locator(".layer-row[data-layer='transport']").click();
  await page.waitForFunction(
    () => document.querySelector(".layer-row[data-layer='transport']")?.getAttribute("data-on") === "false",
    null,
    { timeout: 10000 }
  );
  const afterFilterOff = await atlasState(page);
  assert(afterFilterOff.layersCount === "5/6 on", "Layer click did not update the active layer count.");
  assert(afterFilterOff.transportOn === "false", "Transport layer did not toggle off.");
  assert(!afterFilterOff.transportRoadVisible && /Layer off/i.test(afterFilterOff.lensLegendText), "Layer filter did not hide the transport lens and update the legend.");
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
  assert(afterTimeline.transportRoadVisible, "Timeline scrub hid the active transport lens overlay.");
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
  browser = null;
  const actionable = actionableConsoleMessages(consoleMessages);
  assert(pageErrors.length === 0, `Browser page errors:\n${pageErrors.join("\n")}`);
  assert(actionable.length === 0, `Browser console warnings/errors:\n${actionable.map((message) => `${message.type}: ${message.text}`).join("\n")}`);
  console.log("OpenCityLog paper-atlas browser smoke OK: load, pins, changelog, area filter, lenses, compare, map tools, filter, zoom, scroll, timeline, camera, and screenshot checks passed.");
}

async function closeBrowser() {
  if (browser) await browser.close().catch(() => {});
  browser = null;
}

async function main() {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await runSmoke();
      return;
    } catch (error) {
      lastError = error;
      await closeBrowser();
      if (!/Target page, context or browser has been closed|Target closed|Browser has been closed/i.test(error.message || "")) break;
      console.warn(`Browser smoke attempt ${attempt} hit a closed headless target; retrying with a fresh browser.`);
    }
  }
  throw lastError;
}

main().catch(async (error) => {
  await closeBrowser();
  console.error(error);
  process.exit(1);
});
