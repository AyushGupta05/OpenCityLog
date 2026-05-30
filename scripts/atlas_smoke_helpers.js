const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { assertDetailedPng } = require("./image_detail");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const baseUrl = (process.env.URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const atlasUrl = (process.env.ATLAS_URL || `${baseUrl}/atlas`).replace(/\/$/, "");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function ensureOutputDir() {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function waitForPaperAtlas(page) {
  await page.waitForSelector("#map .maplibregl-canvas", { timeout: 45000 });
  await page.waitForSelector("#activeLensCard", { timeout: 45000 });
  await page.waitForSelector("#layersList .layer-row", { state: "attached", timeout: 45000 });
  await page.waitForSelector(".pin", { timeout: 45000 });
  await page.waitForFunction(
    () => document.querySelector("#appStatus")?.textContent.trim() === "",
    null,
    { timeout: 45000 }
  );
}

async function closeWelcome(page) {
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

async function openAtlas(page, targetUrl = atlasUrl) {
  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForPaperAtlas(page);
  await closeWelcome(page);
}

async function atlasState(page) {
  return page.evaluate(() => {
    const atlas = window.BimsAtlas;
    const map = atlas?.state?.map;
    const center = map?.getCenter?.();
    const layerVisible = (id) => Boolean(map?.getLayer?.(id)) && map.getLayoutProperty(id, "visibility") !== "none";
    const renderedLayerCount = (id) => {
      if (!map?.getLayer?.(id)) return 0;
      try {
        return map.queryRenderedFeatures({ layers: [id] }).length;
      } catch {
        return 0;
      }
    };
    const markerStats = { transportPinCount: 0, visibleTransportPinCount: 0 };
    const activeCoverageRow = atlas?.state?.lensYearCoverageByKey?.get?.(`${atlas?.state?.activeAspect}:${Number(atlas?.state?.year)}`) || null;
    for (const [id, marker] of atlas?.state?.markers || []) {
      const event = atlas?.state?.eventById?.get(id);
      if (event?.category !== "transport") continue;
      markerStats.transportPinCount += 1;
      const rect = marker.getElement().getBoundingClientRect();
      if (rect.right >= 0 && rect.left <= window.innerWidth && rect.bottom >= 0 && rect.top <= window.innerHeight) {
        markerStats.visibleTransportPinCount += 1;
      }
    }
    const pins = [...document.querySelectorAll(".pin")].map((pin) => {
      const rect = pin.getBoundingClientRect();
      return {
        text: pin.textContent.trim(),
        active: pin.getAttribute("data-active") === "true",
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
        inViewport: rect.right >= 0 && rect.left <= window.innerWidth && rect.bottom >= 0 && rect.top <= window.innerHeight,
      };
    });
    const visibleRect = (selector) => {
      const el = document.querySelector(selector);
      if (!el || el.hidden || el.getAttribute("data-open") === "false") return null;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity || 1) === 0) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return {
        selector,
        el,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    const panelRects = [
      ["topbar", ".topbar"],
      ["layers", ".layers"],
      ["mapLens", ".map-lens"],
      ["detail", "#detailPanel"],
      ["changelog", "#changelogPanel"],
      ["timeline", ".timeline"],
      ["mapTools", ".map-tools"],
    ].map(([name, selector]) => ({ name, ...visibleRect(selector) })).filter((item) => item.el);
    const panelOverlaps = [];
    for (let i = 0; i < panelRects.length; i += 1) {
      for (let j = i + 1; j < panelRects.length; j += 1) {
        const a = panelRects[i];
        const b = panelRects[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const horizontal = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const vertical = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (horizontal > 4 && vertical > 4) {
          panelOverlaps.push(`${a.name}/${b.name} ${Math.round(horizontal)}x${Math.round(vertical)}`);
        }
      }
    }
    return {
      title: document.title,
      url: location.href,
      appStatus: document.querySelector("#appStatus")?.textContent.trim() || "",
      city: document.querySelector("#cityNameLabel")?.textContent.trim() || "",
      year: document.querySelector("#tlYear")?.textContent.trim() || "",
      visibleText: document.querySelector("#tlVisible")?.textContent.trim() || "",
      totalText: document.querySelector("#tlTotal")?.textContent.trim() || "",
      layersCount: document.querySelector("#layersCount")?.textContent.trim() || "",
      activeLens: atlas?.state?.activeLens || document.querySelector(".lens-choice[data-active='true']")?.getAttribute("data-lens") || "",
      activeAspect: atlas?.state?.activeAspect || document.querySelector(".lens-choice[data-active='true']")?.getAttribute("data-aspect") || "",
      lensChoiceCount: document.querySelectorAll(".lens-choice").length,
      lensDataState: document.querySelector("#lensDataState")?.textContent.trim() || "",
      lensLegendText: document.querySelector("#lensLegend")?.textContent.trim() || "",
      lensYearCoverageLoaded: Boolean(atlas?.state?.lensYearCoverage?.rows?.length),
      lensYearCoverageError: atlas?.state?.lensYearCoverageError || "",
      lensYearCoverageStatus: activeCoverageRow?.status || "",
      lensYearCoverageEventCount: Number(activeCoverageRow?.event_count || 0),
      lensYearCoverageContextCount: Number(activeCoverageRow?.coverage_context_feature_count || 0),
      lensYearCoverageVisible: Boolean(activeCoverageRow?.visible_map_contract),
      areaFilterValue: document.querySelector("#areaFilterInput")?.value || "",
      searchPlaceholder: document.querySelector("#searchInput")?.getAttribute("placeholder") || "",
      areaPlaceholder: document.querySelector("#areaFilterInput")?.getAttribute("placeholder") || "",
      areaFilterOptionCount: document.querySelectorAll("#areaFilterOptions option").length,
      eventListMeta: document.querySelector("#eventListMeta")?.textContent.trim() || "",
      transportOn: document.querySelector(".layer-row[data-layer='transport']")?.getAttribute("data-on") || "",
      detailTitle: document.querySelector(".detail-title")?.textContent.trim() || "",
      detailOpen: !document.querySelector("#detailInner")?.hasAttribute("hidden"),
      detailLensEvidenceRows: document.querySelectorAll("#detailInner .lens-evidence-row").length,
      detailEvidenceButtons: document.querySelectorAll("#detailInner .evidence-event").length,
      eventRows: document.querySelectorAll("#eventList .event-row").length,
      changelogOpen: document.querySelector("#changelogPanel")?.getAttribute("data-open") || "",
      compareOpen: document.querySelector("#comparePanel")?.getAttribute("data-open") || "",
      compareStats: document.querySelector("#compareStats")?.textContent.trim() || "",
      compareLensEvidenceRows: document.querySelectorAll("#compareStats .lens-evidence-row").length,
      compareEvidenceButtons: document.querySelectorAll("#compareStats .evidence-event").length,
      mapTools: document.querySelectorAll(".map-tools button").length,
      tiltPressed: document.querySelector("#tiltBtn")?.getAttribute("aria-pressed") || "",
      bimsAtlasApi: typeof window.BimsAtlas === "object",
      mapPitch: Math.round(map?.getPitch?.() || 0),
      mapBearing: Number((map?.getBearing?.() || 0).toFixed(3)),
      mapZoom: Number((map?.getZoom?.() || 0).toFixed(3)),
      mapCenter: center ? { lng: Number(center.lng.toFixed(6)), lat: Number(center.lat.toFixed(6)) } : null,
      detailLayerLoaded: Boolean(atlas?.state?.detailLayerLoaded),
      detailLayerError: atlas?.state?.detailLayerError || "",
      lensOverlayLoaded: Boolean(atlas?.state?.lensOverlayLoaded),
      lensOverlayError: atlas?.state?.lensOverlayError || "",
      lensEventFeatureCount: atlas?.state?.lensEventFeatureCount || 0,
      lensHeatmapVisible: layerVisible("lens-heatmap"),
      lensPointsVisible: layerVisible("lens-current-points"),
      lensBuiltFootprintsVisible: layerVisible("lens-built-footprints-fill"),
      lensBuiltSitesVisible: layerVisible("lens-built-site-icons"),
      lensCivicIconsVisible: layerVisible("lens-civic-icons"),
      lensEconomyIconsVisible: layerVisible("lens-economy-icons"),
      lensUtilitiesIconsVisible: layerVisible("lens-utilities-icons"),
      lensPlanningCellsVisible: layerVisible("lens-planning-cells-fill"),
      lensCivicCoverageVisible: layerVisible("lens-civic-coverage-fill"),
      lensCivicFacilitiesVisible: layerVisible("lens-civic-facility-icons"),
      lensEconomyCellsVisible: layerVisible("lens-economy-cells-fill"),
      lensEconomyFrontageVisible: layerVisible("lens-economy-frontage"),
      lensUtilityTraceVisible: layerVisible("lens-utilities-trace"),
      lensUtilityAssetsVisible: layerVisible("lens-utility-asset-icons"),
      lensPlanningCellsRendered: renderedLayerCount("lens-planning-cells-fill"),
      lensCivicCoverageRendered: renderedLayerCount("lens-civic-coverage-fill"),
      lensEconomyCellsRendered: renderedLayerCount("lens-economy-cells-fill"),
      lensEconomyFrontageRendered: renderedLayerCount("lens-economy-frontage"),
      lensUtilityTraceRendered: renderedLayerCount("lens-utilities-trace"),
      lensDetailYearLoaded: atlas?.state?.lensDetailYearLoaded || null,
      transportRoadVisible: layerVisible("lens-transport-roads"),
      transportRoadRendered: renderedLayerCount("lens-transport-roads"),
      transportRoadYearLoaded: atlas?.state?.transportRoadYearLoaded || null,
      transportRoadFeatureCount: atlas?.state?.transportRoadFeatureCount ?? null,
      pinCount: pins.length,
      visiblePinCount: pins.filter((pin) => pin.inViewport).length,
      panelOverlaps,
      transportPinCount: markerStats.transportPinCount,
      visibleTransportPinCount: markerStats.visibleTransportPinCount,
      activePin: pins.find((pin) => pin.active) || null,
      mapCanvas: document.querySelectorAll(".maplibregl-canvas").length,
      zoomButtons: document.querySelectorAll(".maplibregl-ctrl-zoom-in, .maplibregl-ctrl-zoom-out").length,
      attribution: document.querySelector(".maplibregl-ctrl-attrib")?.textContent.trim() || "",
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      welcomeOpen: document.querySelector("#welcome")?.getAttribute("data-open"),
      welcomeVisibility: getComputedStyle(document.querySelector("#welcome")).visibility,
      bodyText: document.body.innerText,
    };
  });
}

async function pinPosition(page, text) {
  return page.evaluate((needle) => {
    const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const target = normalize(needle).toLowerCase();
    const candidates = [...document.querySelectorAll(".pin")].map((pin) => {
      const text = normalize(pin.textContent);
      const rect = pin.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width / 2);
      const y = Math.round(rect.top + rect.height / 2);
      const top = document.elementFromPoint(x, y);
      const hit = top === pin || pin.contains(top) || top?.closest?.(".pin") === pin;
      const inViewport = rect.right >= 0 && rect.left <= window.innerWidth && rect.bottom >= 0 && rect.top <= window.innerHeight;
      return {
        text,
        exact: text.toLowerCase().startsWith(target),
        includes: text.toLowerCase().includes(target),
        hit,
        inViewport,
        x,
        y,
      };
    });
    return candidates.find((pin) => pin.hit && pin.exact)
      || candidates.find((pin) => pin.hit && pin.includes)
      || candidates.find((pin) => pin.inViewport && pin.exact)
      || candidates.find((pin) => pin.inViewport && pin.includes)
      || candidates.find((pin) => pin.includes)
      || null;
  }, text);
}

async function clickPin(page, text) {
  await page.waitForFunction((needle) => {
    const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const target = normalize(needle).toLowerCase();
    return [...document.querySelectorAll(".pin")].some((pin) => {
      const text = normalize(pin.textContent).toLowerCase();
      if (!text.includes(target)) return false;
      const rect = pin.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width / 2);
      const y = Math.round(rect.top + rect.height / 2);
      const top = document.elementFromPoint(x, y);
      return top === pin || pin.contains(top) || top?.closest?.(".pin") === pin;
    });
  }, text, { timeout: 12000 }).catch(() => {});
  const pin = await pinPosition(page, text);
  assert(pin, `Could not find map pin containing "${text}".`);
  await page.mouse.click(pin.x, pin.y);
  return pin;
}

function attachConsoleCapture(page, consoleMessages, pageErrors) {
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleMessages.push({ type: message.type(), text: message.text() });
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
}

function actionableConsoleMessages(messages) {
  return messages.filter((message) => !/WebGL.*GPU stall|ReadPixels|favicon|ERR_CACHE_WRITE_FAILURE/i.test(message.text));
}

module.exports = {
  assert,
  assertDetailedPng,
  atlasState,
  atlasUrl,
  attachConsoleCapture,
  actionableConsoleMessages,
  baseUrl,
  chromium,
  clickPin,
  closeWelcome,
  ensureOutputDir,
  openAtlas,
  outputDir,
  pinPosition,
  waitForPaperAtlas,
};
