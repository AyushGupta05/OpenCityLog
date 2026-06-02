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

  await chooseLens(page, "transport-speed");
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

  await page.evaluate(async () => {
    await window.BimsAtlas?.setAreaFilter?.("");
    await window.BimsAtlas?.setYear?.(2024);
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(() => !document.querySelector("#eventListMore")?.hidden, null, { timeout: 10000 });
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

async function assertDesktopCitywideCoverage(page) {
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

  const lensButtons = await page.locator("#lensSwitcher .lens-choice").evaluateAll((buttons) =>
    buttons.map((button) => ({
      id: button.getAttribute("data-aspect"),
      label: button.textContent.trim(),
    })).filter((button) => button.id)
  );
  assert(lensButtons.length === 15, `desktop citywide: expected 15 lens buttons, got ${lensButtons.length}.`);

  for (const lens of lensButtons) {
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
    const state = await atlasState(page);
    assert(state.scrollWidth <= state.clientWidth + 4, `desktop citywide ${lens.id}: page overflows horizontally.`);
    assert(state.mapCanvas === 1, `desktop citywide ${lens.id}: MapLibre canvas is missing.`);
    assert(state.citywideLensMode, `desktop citywide ${lens.id}: lens switch left citywide camera mode.`);
    assert(state.mapZoom <= 11.7, `desktop citywide ${lens.id}: lens switch zoomed into a local study area (${state.mapZoom}).`);
    assert(state.pinCount > 0 && state.visiblePinCount > 0, `desktop citywide ${lens.id}: map event pins are missing.`);
    assert(state.zoomButtons === 2, `desktop citywide ${lens.id}: zoom buttons are missing.`);
    assert(state.panelOverlaps.length === 0, `desktop citywide ${lens.id}: panels overlap (${state.panelOverlaps.join(", ")}).`);
    assert(state.contentOverflows.length === 0, `desktop citywide ${lens.id}: key content clips horizontally (${state.contentOverflows.join(", ")}).`);
    assert(state.lensLegendText.length > 24, `desktop citywide ${lens.id}: legend did not render.`);
    const citywideState = await page.evaluate(() => {
      const atlas = window.BimsAtlas;
      const map = atlas?.state?.map;
      const guideLayers = [
        "lens-guide-flow",
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
      const renderedLayerCount = (layerId) => {
        if (!map?.getLayer?.(layerId) || map.getLayoutProperty(layerId, "visibility") === "none") return 0;
        try {
          return map.queryRenderedFeatures({ layers: [layerId] }).length;
        } catch (_error) {
          return 0;
        }
      };
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
        activeLens,
        activeAspect,
        visibleMapContract: Boolean(activeCoverageRow?.visible_map_contract),
        eventCount: Number(activeCoverageRow?.event_count || 0),
        detailFeatureCount: Number(activeCoverageRow?.detail_feature_count || 0),
        renderedSourceBackedDetail,
        renderedTransportYearRoads,
        markerCells: cells.size,
        chip: document.querySelector("#mapStudyChipText")?.textContent.trim() || "",
      };
    });
    assert(/Citywide extent/i.test(citywideState.chip), `desktop citywide ${lens.id}: citywide chip is not visible.`);
    assert(citywideState.renderedGuides === 0, `desktop citywide ${lens.id}: generated guide layers rendered ${citywideState.renderedGuides} features.`);
    assert(citywideState.contextRows === 0, `desktop citywide ${lens.id}: lens-year coverage still includes context filler rows.`);
    assert(citywideState.markerCells >= 3, `desktop citywide ${lens.id}: map markers are clustered too tightly for a citywide view.`);
    if (citywideState.visibleMapContract && citywideState.detailFeatureCount > 0) {
      assert(citywideState.renderedSourceBackedDetail > 0, `desktop citywide ${lens.id}: source-backed lens detail exists but rendered no citywide features.`);
    }
    if (citywideState.visibleMapContract && citywideState.activeLens === "transport" && citywideState.eventCount > 0) {
      assert(citywideState.renderedTransportYearRoads > 0, `desktop citywide ${lens.id}: source-backed transport records exist but rendered no year-specific road features.`);
    }
  }

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
  assert(historicPlanning.lensPlanningCellsRendered > 0, "desktop citywide planning-delta 2010: dated source-backed planning cells did not render.");
  assert(currentPlanning.lensPlanningCellsRendered > historicPlanning.lensPlanningCellsRendered, `desktop citywide planning-delta: 2024 rendered cells (${currentPlanning.lensPlanningCellsRendered}) did not increase from 2010 (${historicPlanning.lensPlanningCellsRendered}).`);
  assert(Number(currentPlanning.lensDetailYearLoaded) === 2024, "desktop citywide planning-delta: building/planning source did not reload to the current timeline year.");
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
      { aspect: "planning-pressure", rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], featureLayer: "planning_cell", label: "planning cells" },
      { aspect: "civic-access-gaps", rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], featureLayer: "civic_coverage_cell", label: "civic coverage cells" },
      { aspect: "economy-land-use", rendered: ["lensEconomyCellsRendered"], renderedLayers: ["lens-economy-cells-fill"], featureLayer: "economy_activity_cell", label: "economy cells" },
      { aspect: "utilities-capacity", rendered: ["lensUtilityTraceRendered", "lensUtilityAssetsRendered"], renderedLayers: ["lens-utilities-trace", "lens-utility-asset-icons"], featureLayer: "utility_trace", label: "utility traces/assets" },
    ],
    london: [
      { aspect: "planning-pressure", rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], featureLayer: "planning_cell", label: "planning cells" },
      { aspect: "civic-access-gaps", rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], featureLayer: "civic_coverage_cell", label: "civic coverage cells" },
      { aspect: "utilities-capacity", rendered: ["lensUtilityTraceRendered"], renderedLayers: ["lens-utilities-trace"], featureLayer: "utility_trace", label: "utility traces" },
    ],
    nyc: [
      { aspect: "planning-pressure", rendered: ["lensPlanningCellsRendered"], renderedLayers: ["lens-planning-cells-fill"], featureLayer: "planning_cell", label: "planning cells" },
      { aspect: "civic-access-gaps", rendered: ["lensCivicCoverageRendered"], renderedLayers: ["lens-civic-coverage-fill"], featureLayer: "civic_coverage_cell", label: "civic coverage cells" },
      { aspect: "economy-land-use", rendered: ["lensEconomyCellsRendered"], renderedLayers: ["lens-economy-cells-fill"], featureLayer: "economy_activity_cell", label: "economy cells" },
    ],
  };
  const checks = checksByCity[cityId] || checksByCity.belfast;
  for (const check of checks) {
    await page.evaluate((aspect) => window.BimsAtlas?.setActiveAspect?.(aspect), check.aspect);
    await page.waitForFunction(
      (aspect) => window.BimsAtlas?.state?.activeAspect === aspect
        && Number(window.BimsAtlas?.state?.lensDetailYearLoaded) === 2024,
      check.aspect,
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
    const state = await atlasState(page);
    const rendered = check.rendered.reduce((sum, field) => sum + Number(state[field] || 0), 0);
    assert(rendered > 0, `city ${cityId}: ${check.label} did not render across the 2024 citywide map.`);
    const citywidePng = await page.screenshot({
      path: path.join(outputDir, `paper-atlas-${cityId}-${check.aspect}-citywide.png`),
      fullPage: false,
    });
    assertDetailedPng(citywidePng, assert, `city ${cityId} ${check.aspect} citywide`);
    await assertPannedSourceBackedLensCoverage(page, cityId, check);
  }
}

async function assertPannedSourceBackedLensCoverage(page, cityId, check) {
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
    assert(cityState.citywideLensMode, `city ${city.id}: atlas did not start in citywide lens mode.`);
    assert(cityState.mapZoom <= 11.7, `city ${city.id}: atlas opened at local/event zoom (${cityState.mapZoom}).`);
    assert(city.placeholder.test(cityState.searchPlaceholder), `city ${city.id}: search placeholder is not city-specific.`);
    assert(cityState.visiblePinCount >= 8, `city ${city.id}: too few visible city records.`);
    await assertCitySourceBackedLensCoverage(page, city.id);
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
