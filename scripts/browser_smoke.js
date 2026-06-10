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
  closeWelcome,
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

async function guideSignalState(page) {
  return page.evaluate(() => {
    const state = window.BimsAtlas?.state;
    const map = state?.map;
    const guideLayers = [
      "lens-guide-flow",
      "lens-guide-citywide-cell-fill",
      "lens-guide-citywide-cell-line",
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
    const activeAspect = state?.activeAspect || "";
    const year = Number(state?.year);
    const row = state?.lensYearCoverageByKey?.get?.(`${activeAspect}:${year}`);
    const detailLayer = activeAspect === "planning-pressure"
      ? "planning_cell"
      : activeAspect === "economy-land-use"
      ? "economy_activity_cell"
      : ["economy-vitality", "economy-gravity"].includes(activeAspect)
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
    const features = state?.lensGuideFeatureCache?.features || [];
    const splitIds = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
    const forbiddenContext = /mapped_context|current_context|road_infill|building_context|context_not_year_specific/i;
    const citywideScope = Boolean(state?.citywideLensMode) || document.querySelector("#mapStudyChip")?.dataset.scope === "city";
    const civicContextCanRender = ["civic-access-gaps", "civic-catchment", "civic-demand"].includes(activeAspect)
      && Boolean(state?.activeLayers?.has?.("civic_services"))
      && (state?.civicServiceFeatures || []).length > 0
      && citywideScope
      && state?.showInferred !== false
      && !state?.search
      && !state?.areaFilter;
    const transportNetworkContextCanRender = ["transport-speed", "transport-reliability"].includes(activeAspect)
      && Boolean(state?.activeLayers?.has?.("transport"))
      && citywideScope
      && state?.showInferred !== false
      && !state?.search
      && !state?.areaFilter
      && row?.status === "source_backed_records"
      && row?.visible_map_contract !== false
      && Number(row?.direct_event_count || 0) > 0;
    const economyContextCanRender = ["economy-land-use", "economy-vitality", "economy-gravity"].includes(activeAspect)
      && Boolean(state?.activeLayers?.has?.("economy"))
      && (state?.economyAnchorFeatures || []).length > 0
      && citywideScope
      && state?.showInferred !== false
      && !state?.search
      && !state?.areaFilter
      && row?.status === "source_backed_records"
      && row?.visible_map_contract !== false
      && Number(row?.direct_event_count || 0) > 0;
    const directCanRender = ["planning-pressure", "economy-land-use", "economy-vitality", "economy-gravity", "civic-access-gaps", "civic-catchment", "civic-demand"].includes(activeAspect)
      && row?.status === "source_backed_records"
      && row?.visible_map_contract !== false
      && matchingDetailCount > 0;
    return {
      activeAspect,
      canRenderGuide: directCanRender || civicContextCanRender || economyContextCanRender || transportNetworkContextCanRender,
      guideFeatureCount: features.length,
      rendered,
      invalidFeatureCount: features.filter((feature) => {
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
            || !sourceIds.every((id) => state?.sourceById?.has?.(id));
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
      }).length,
    };
  });
}

async function assertGeneratedGuideSignal(page, label) {
  await page.waitForFunction(() => {
    const state = window.BimsAtlas?.state;
    const map = state?.map;
    const guideLayers = [
      "lens-guide-flow",
      "lens-guide-citywide-cell-fill",
      "lens-guide-citywide-cell-line",
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
        // Wait for the source/layer to settle.
      }
    }
    const activeAspect = state?.activeAspect || "";
    const year = Number(state?.year);
    const row = state?.lensYearCoverageByKey?.get?.(`${activeAspect}:${year}`);
    const detailLayer = activeAspect === "planning-pressure"
      ? "planning_cell"
      : activeAspect === "economy-land-use"
      ? "economy_activity_cell"
      : ["economy-vitality", "economy-gravity"].includes(activeAspect)
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
    const features = state?.lensGuideFeatureCache?.features || [];
    const splitIds = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
    const forbiddenContext = /mapped_context|current_context|road_infill|building_context|context_not_year_specific/i;
    const citywideScope = Boolean(state?.citywideLensMode) || document.querySelector("#mapStudyChip")?.dataset.scope === "city";
    const civicContextCanRender = ["civic-access-gaps", "civic-catchment", "civic-demand"].includes(activeAspect)
      && Boolean(state?.activeLayers?.has?.("civic_services"))
      && (state?.civicServiceFeatures || []).length > 0
      && citywideScope
      && state?.showInferred !== false
      && !state?.search
      && !state?.areaFilter;
    const transportNetworkContextCanRender = ["transport-speed", "transport-reliability"].includes(activeAspect)
      && Boolean(state?.activeLayers?.has?.("transport"))
      && citywideScope
      && state?.showInferred !== false
      && !state?.search
      && !state?.areaFilter
      && row?.status === "source_backed_records"
      && row?.visible_map_contract !== false
      && Number(row?.direct_event_count || 0) > 0;
    const economyContextCanRender = ["economy-land-use", "economy-vitality", "economy-gravity"].includes(activeAspect)
      && Boolean(state?.activeLayers?.has?.("economy"))
      && (state?.economyAnchorFeatures || []).length > 0
      && citywideScope
      && state?.showInferred !== false
      && !state?.search
      && !state?.areaFilter
      && row?.status === "source_backed_records"
      && row?.visible_map_contract !== false
      && Number(row?.direct_event_count || 0) > 0;
    const directCanRender = ["planning-pressure", "economy-land-use", "economy-vitality", "economy-gravity", "civic-access-gaps", "civic-catchment", "civic-demand"].includes(activeAspect)
      && row?.status === "source_backed_records"
      && row?.visible_map_contract !== false
      && matchingDetailCount > 0;
    const canRenderGuide = directCanRender || civicContextCanRender || economyContextCanRender || transportNetworkContextCanRender;
    const invalidFeatureCount = features.filter((feature) => {
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
          || !sourceIds.every((id) => state?.sourceById?.has?.(id));
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
    if (canRenderGuide) return features.length > 0 && invalidFeatureCount === 0 && rendered > 0;
    return features.length === 0 && rendered === 0;
  }, null, { timeout: 8000 }).catch(() => {});
  const guideState = await guideSignalState(page);
  if (guideState.canRenderGuide) {
    assert(guideState.guideFeatureCount > 0, `${label}: guide cache is empty for ${guideState.activeAspect}.`);
    assert(guideState.invalidFeatureCount === 0, `${label}: ${guideState.invalidFeatureCount} guide feature(s) lack provenance fields.`);
    assert(guideState.rendered > 0, `${label}: guide features did not render for ${guideState.activeAspect}.`);
    return;
  }
  assert(guideState.guideFeatureCount === 0, `${label}: unsupported guide feature cache is not empty (${guideState.guideFeatureCount}).`);
  assert(guideState.rendered === 0, `${label}: unsupported guide layers rendered ${guideState.rendered} features.`);
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

async function assertAdjacentSourceOnlyForAspect(page, { year, aspect, patterns = [] }) {
  await page.evaluate(async ({ targetYear, targetAspect }) => {
    await window.BimsAtlas?.setYear?.(targetYear);
    await window.BimsAtlas?.setActiveAspect?.(targetAspect);
  }, { targetYear: year, targetAspect: aspect });
  await page.waitForFunction(
    ({ targetYear, targetAspect }) => Number(window.BimsAtlas?.state?.year) === targetYear
      && window.BimsAtlas?.state?.activeAspect === targetAspect
      && /broad source-backed|No direct source-backed/i.test(document.querySelector("#lensLegend")?.textContent || ""),
    { targetYear: year, targetAspect: aspect },
    { timeout: 20000 }
  );
  const state = await atlasState(page);
  const legendText = state.lensLegendText.replace(/\s+/g, " ");
  assert(state.lensYearCoverageLoaded && !state.lensYearCoverageError, `Lens-year coverage metadata did not load: ${state.lensYearCoverageError}`);
  assert(state.lensYearCoverageStatus === "adjacent_source_backed_records", `${aspect} ${year} should be adjacent evidence only, got ${state.lensYearCoverageStatus || "missing"}.`);
  assert(!state.lensYearCoverageVisible, `${aspect} ${year} must not stay visible without direct same-category records.`);
  assert(state.lensYearCoverageEventCount > 0, `${aspect} ${year} should retain broad source-backed matches for audit.`);
  assert(state.lensYearCoverageDirectCount === 0, `${aspect} ${year} should have zero direct same-category records.`);
  assert(state.lensYearCoverageContextCount === 0, `${aspect} ${year} must not expose generated filler features.`);
  assert(/^0\b/.test(state.visibleText), `${aspect} ${year} should expose zero visible direct records, got ${state.visibleText}.`);
  assert(state.eventRows === 0, `${aspect} ${year} should not list broad-only records as visible events.`);
  assert(/broad source-backed|No direct source-backed/i.test(legendText), `${aspect} ${year} did not expose an adjacent-evidence warning: ${legendText}`);
  assert(/No direct map marks|No generated marks|no filler geometry/i.test(legendText), `${aspect} ${year} warning did not state that direct/filler geometry is absent: ${legendText}`);
  for (const pattern of patterns) {
    assert(pattern.test(legendText), `${aspect} ${year} warning did not match ${pattern}: ${legendText}`);
  }
}

async function assertMapWithheldRecordsStayListVisible(page, { city, year, aspect }) {
  await page.goto(`${atlasUrl}?city=${city}&year=${year}&lens=${aspect}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#map .maplibregl-canvas", { timeout: 45000 });
  await page.waitForSelector("#activeLensCard", { timeout: 45000 });
  await page.waitForSelector("#layersList .layer-row", { state: "attached", timeout: 45000 });
  await page.waitForFunction(
    () => document.querySelector("#appStatus")?.textContent.trim() === "",
    null,
    { timeout: 45000 }
  );
  await closeWelcome(page);
  await page.waitForFunction(
    ({ targetYear, targetAspect }) => Number(window.BimsAtlas?.state?.year) === targetYear
      && window.BimsAtlas?.state?.activeAspect === targetAspect
      && window.BimsAtlas?.state?.lensYearCoverageByKey?.has?.(`${targetAspect}:${targetYear}`)
      && document.querySelector("#eventList .event-row"),
    { targetYear: year, targetAspect: aspect },
    { timeout: 45000 }
  );
  const state = await atlasState(page);
  const legendText = state.lensLegendText.replace(/\s+/g, " ");
  assert(state.lensYearCoverageStatus === "source_backed_records", `${city} ${aspect} ${year} should retain direct source-backed records, got ${state.lensYearCoverageStatus || "missing"}.`);
  assert(!state.lensYearCoverageVisible, `${city} ${aspect} ${year} must not expose withheld source coordinates as map-visible geometry.`);
  assert(state.lensYearCoverageDirectCount > 0, `${city} ${aspect} ${year} should expose direct records for list/evidence review.`);
  assert(state.lensYearCoverageMapDirectCount === 0, `${city} ${aspect} ${year} should expose no direct map geometry.`);
  assert(state.lensYearCoverageWithheldCount >= state.lensYearCoverageDirectCount, `${city} ${aspect} ${year} should disclose withheld direct geometry counts.`);
  assert(state.eventRows > 0, `${city} ${aspect} ${year} withheld-geometry records disappeared from the changelog list.`);
  assert(state.pinCount === 0, `${city} ${aspect} ${year} withheld-geometry records should not render map pins.`);
  assert(!/^0\b/.test(state.visibleText), `${city} ${aspect} ${year} visible record count should include list-visible withheld records, got ${state.visibleText}.`);
  assert(/withheld|rights/i.test(legendText), `${city} ${aspect} ${year} legend did not explain withheld map geometry: ${legendText}`);
  assert(/changelog|evidence|exports/i.test(legendText), `${city} ${aspect} ${year} legend did not preserve a non-map evidence path: ${legendText}`);
  await page.locator("#eventList .event-row").first().click();
  await page.waitForFunction(
    () => /Map geometry is withheld|Spatial\/radius lens metrics are not generated/i.test(document.querySelector("#detailInner")?.textContent || ""),
    null,
    { timeout: 10000 }
  );
  const detailState = await page.evaluate(() => ({
    hasCrossLens: Boolean(document.querySelector("#detailInner .detail-cross-lens-card")),
    hasLensControls: Boolean(document.querySelector("#detailInner #detailRadius")),
    text: document.querySelector("#detailInner")?.textContent.replace(/\s+/g, " ").trim() || "",
  }));
  assert(!detailState.hasCrossLens, `${city} ${aspect} ${year} withheld-geometry detail rendered cross-lens spatial context.`);
  assert(!detailState.hasLensControls, `${city} ${aspect} ${year} withheld-geometry detail rendered radius controls.`);
  assert(/evidence-only|map geometry is withheld/i.test(detailState.text), `${city} ${aspect} ${year} withheld detail did not explain evidence-only handling: ${detailState.text.slice(0, 240)}`);
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

async function assertVisibleControlsHitTargets(page, label) {
  const issues = await page.evaluate(() => {
    const selectors = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "[role='button']:not([aria-disabled='true'])",
      "[role='tab']:not([aria-disabled='true'])",
    ].join(",");
    const isVisible = (element) => {
      if (!element || element.hidden || element.closest("[hidden]")) return false;
      if (element.closest("details:not([open])")) return false;
      if (element.closest("[data-open='false'], [aria-hidden='true']")) return false;
      if (element.closest(".maplibregl-ctrl-attrib")) return false;
      if (element.closest(".maplibregl-marker")) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity || 1) === 0) return false;
      return rect.width > 0 && rect.height > 0;
    };
    const clippedCenter = (element, centerX, centerY) => {
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (!/(auto|scroll|hidden|clip)/.test(`${style.overflow} ${style.overflowX} ${style.overflowY}`)) continue;
        const rect = parent.getBoundingClientRect();
        if (centerX < rect.left || centerX > rect.right || centerY < rect.top || centerY > rect.bottom) return true;
      }
      return false;
    };
    const labelledHitArea = (element) => {
      if (!element.matches("input[type='checkbox'], input[type='radio']")) return { element, rect: element.getBoundingClientRect() };
      const label = element.closest("label") || (element.id ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`) : null);
      if (label && isVisible(label)) return { element: label, rect: label.getBoundingClientRect() };
      return { element, rect: element.getBoundingClientRect() };
    };
    const nameFor = (element) => {
      const text = element.innerText || element.value || element.getAttribute("aria-label") || element.getAttribute("title") || element.id || element.className || element.tagName;
      return String(text).replace(/\s+/g, " ").trim().slice(0, 90);
    };
    return [...document.querySelectorAll(selectors)].flatMap((element) => {
      if (!isVisible(element)) return [];
      if (element.classList.contains("skip-link") && element.getBoundingClientRect().bottom < 0) return [];
      const hitArea = labelledHitArea(element);
      const rect = hitArea.rect;
      const centerX = Math.round(rect.left + rect.width / 2);
      const centerY = Math.round(rect.top + rect.height / 2);
      if (centerX < 0 || centerY < 0 || centerX > innerWidth || centerY > innerHeight) return [];
      if (clippedCenter(hitArea.element, centerX, centerY)) return [];
      const issuesForElement = [];
      const targetName = nameFor(element);
      if (rect.width < 24 || rect.height < 24) {
        issuesForElement.push(`${targetName}: touch target ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
      }
      if (rect.left < -1 || rect.top < -1 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1) {
        issuesForElement.push(`${targetName}: clipped in viewport`);
      }
      const hit = document.elementFromPoint(centerX, centerY);
      const hitTarget = hit?.closest?.(selectors);
      if (!hit || (hit !== element && !element.contains(hit) && hitTarget !== element && hit !== hitArea.element && !hitArea.element.contains(hit))) {
        issuesForElement.push(`${targetName}: center is covered by ${nameFor(hit || document.body)}`);
      }
      const hasAccessibleName = Boolean(
        String(element.innerText || "").trim()
        || element.getAttribute("aria-label")
        || element.getAttribute("title")
        || element.getAttribute("aria-labelledby")
      );
      if (["BUTTON", "A"].includes(element.tagName) && !hasAccessibleName) {
        issuesForElement.push(`${element.id || element.className || element.tagName}: missing accessible name`);
      }
      return issuesForElement;
    });
  });
  assert(issues.length === 0, `${label} has non-clickable or clipped visible controls:\n${issues.join("\n")}`);
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
  assert(initial.activeLens && initial.activeAspect, "Atlas did not choose an active source-backed map lens.");
  assert(initial.lensChoiceCount === 15, "The desktop lens switcher should expose all 15 atlas lenses.");
  assert(initial.lensYearCoverageLoaded && !initial.lensYearCoverageError, `Lens-year coverage metadata did not load: ${initial.lensYearCoverageError}`);
  assert(initial.lensYearCoverageVisible, "The active 15-lens/year contract row is not marked visible.");
  assert(initial.lensYearCoverageStatus === "source_backed_records", `The startup lens should use direct source-backed records, got ${initial.lensYearCoverageStatus || "missing"}.`);
  assert(initial.lensYearCoverageDirectCount > 0, "The startup lens should expose direct same-category records.");
  const lensYearAudit = await page.evaluate(() => {
    const state = window.BimsAtlas?.state;
    const aspects = [...document.querySelectorAll(".lens-choice")].map((button) => button.getAttribute("data-aspect")).filter(Boolean);
    const years = Array.from({ length: 20 }, (_, index) => 2007 + index);
      const missing = [];
      const adjacent = [];
      const zeroMissing = [];
      const mapWithheld = [];
      const contextRows = [];
      const visibleWithoutDirect = [];
      const unexpectedNonVisible = [];
      for (const aspect of aspects) {
        for (const year of years) {
          const row = state?.lensYearCoverageByKey?.get?.(`${aspect}:${year}`);
          if (!row?.visible_map_contract) missing.push(`${aspect}:${year}:${row?.status || "missing"}`);
          if (row?.status === "adjacent_source_backed_records") adjacent.push(`${aspect}:${year}`);
          if (row?.status === "missing_source_backed_view") zeroMissing.push(`${aspect}:${year}`);
          if (row?.status === "source_backed_records" && Number(row?.withheld_geometry_event_count || 0) > 0 && Number(row?.map_direct_event_count || 0) === 0) mapWithheld.push(`${aspect}:${year}`);
          if (!row?.visible_map_contract
            && row?.status !== "missing_source_backed_view"
            && row?.status !== "adjacent_source_backed_records"
            && !(row?.status === "source_backed_records" && Number(row?.withheld_geometry_event_count || 0) > 0 && Number(row?.map_direct_event_count || 0) === 0)) {
            unexpectedNonVisible.push(`${aspect}:${year}:${row?.status || "missing"}`);
          }
          if (/context/i.test(row?.status || "") || Number(row?.coverage_context_feature_count || 0) > 0) contextRows.push(`${aspect}:${year}`);
          if (row?.visible_map_contract && Number(row?.direct_event_count || 0) <= 0) visibleWithoutDirect.push(`${aspect}:${year}`);
        }
      }
      return {
        aspectCount: aspects.length,
        rowCount: state?.lensYearCoverage?.row_count || state?.lensYearCoverage?.rows?.length || 0,
        missing,
        adjacent,
        zeroMissing,
        mapWithheld,
        contextRows,
        visibleWithoutDirect,
        unexpectedNonVisible,
      };
    });
  assert(lensYearAudit.aspectCount === 15, "Lens switcher did not expose the 15 mandatory lens aspects.");
  assert(lensYearAudit.rowCount === 300, `Lens-year coverage should expose 300 city rows, got ${lensYearAudit.rowCount}.`);
  assert(lensYearAudit.contextRows.length === 0, `Lens-year coverage still exposes context filler rows: ${lensYearAudit.contextRows.slice(0, 8).join(", ")}`);
  assert(lensYearAudit.visibleWithoutDirect.length === 0, `Lens-year coverage still exposes broad-only rows as visible: ${lensYearAudit.visibleWithoutDirect.slice(0, 8).join(", ")}`);
  assert(lensYearAudit.unexpectedNonVisible.length === 0, `Non-visible lens rows should be missing, adjacent-evidence, or disclosed map-withheld records only, got ${lensYearAudit.unexpectedNonVisible.slice(0, 8).join(", ")}`);
  assert(lensYearAudit.missing.length === lensYearAudit.zeroMissing.length + lensYearAudit.adjacent.length + lensYearAudit.mapWithheld.length, `Non-visible lens rows should be fully classified, got ${lensYearAudit.missing.slice(0, 8).join(", ")}`);
  assert(initial.compareOpen === "false", "Compare panel should start closed.");
  assert(initial.layersCount === "6/6 on", "All paper-atlas layers should be active on first load.");
  assert(initial.detailOpen && initial.detailTitle.length > 8, "Selected event detail panel did not render.");
  assert(initial.detailLensEvidenceRows === 6 && initial.detailEvidenceButtons > 0, "Detail panel did not render before/after evidence across lenses.");
  await assertVisibleControlsHitTargets(page, "Desktop atlas");
  const crossLensSnapshot = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".cross-lens-row[data-aspect]")].map((row) => {
      const values = [...row.querySelectorAll(":scope > span:not(.cross-lens-name), :scope > strong")]
        .map((cell) => cell.textContent.trim());
      return {
        aspect: row.getAttribute("data-aspect"),
        active: row.getAttribute("data-active") === "true",
        values,
        hasCount: values.some((value) => !/^(0|\.\.\.)$/.test(value)),
      };
    });
    return {
      rowCount: rows.length,
      nonActiveRowsWithCounts: rows.filter((row) => !row.active && row.hasCount).length,
      hasPlanningButton: rows.some((row) => row.aspect === "planning-pressure"),
    };
  });
  assert(crossLensSnapshot.rowCount >= 6, "Detail cross-lens source-count card did not render all lens rows.");
  assert(crossLensSnapshot.hasPlanningButton, "Detail cross-lens card did not expose a Planning Activity button.");
  await page.evaluate(() => document.querySelector(".cross-lens-row[data-aspect='planning-pressure']")?.click());
  await page.waitForFunction(() => window.BimsAtlas?.state?.activeAspect === "planning-pressure", null, { timeout: 10000 });
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
  const defaultPinLabel = await page.evaluate(() => {
    const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const pin = [...document.querySelectorAll(".pin")].find((item) => {
      const rect = item.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    return normalize(pin?.textContent || "");
  });
  assert(defaultPinLabel.length > 4, "Default source-compatible view did not expose an interactable map pin.");
  await clickPin(page, defaultPinLabel);
  await page.waitForFunction(
    () => document.querySelector(".pin[data-active='true']"),
    null,
    { timeout: 10000 }
  );
  const afterPinClick = await atlasState(page);
  assert(afterPinClick.detailTitle.length > 4, "Clicking a map pin did not update the evidence detail panel.");
  assert(afterPinClick.activePin?.text.includes(defaultPinLabel), "Clicked map pin did not become the active event.");
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
  await page.evaluate(() => window.BimsAtlas?.setActiveAspect?.("planning-pressure"));
  await page.waitForFunction(() => window.BimsAtlas?.state?.activeAspect === "planning-pressure", null, { timeout: 10000 });

  const currentListTitle = await page.evaluate(() => {
    const row = document.querySelector("#eventList .event-row");
    const title = row?.querySelector(".event-title")?.textContent || row?.querySelector("strong")?.textContent || row?.textContent || "";
    return String(title).replace(/\s+/g, " ").trim();
  });
  assert(currentListTitle.length > 4, "Current source-compatible view did not expose a selectable changelog event.");
  await page.locator("#searchInput").fill(currentListTitle);
  await page.waitForFunction(
    (title) => [...document.querySelectorAll("#eventList .event-row")].some((row) => row.textContent.includes(title)),
    currentListTitle,
    { timeout: 10000 }
  );
  await page.locator("#eventList .event-row").filter({ hasText: currentListTitle }).first().click();
  await page.waitForFunction(
    (title) => document.querySelector(".detail-title")?.textContent.includes(title),
    currentListTitle,
    { timeout: 10000 }
  );
  const afterListClick = await atlasState(page);
  assert(afterListClick.detailTitle.includes(currentListTitle), "Clicking the changelog list did not select the event detail.");
  assert(afterListClick.activePin?.text, "Changelog selection did not activate a map pin.");

  await assertMapWithheldRecordsStayListVisible(page, {
    city: "belfast",
    year: 2024,
    aspect: "planning-pressure",
  });

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

  const currentSearchTitle = await page.evaluate(() => {
    const row = document.querySelector("#eventList .event-row");
    const title = row?.querySelector(".event-title")?.textContent || row?.querySelector("strong")?.textContent || row?.textContent || "";
    return String(title).replace(/\s+/g, " ").trim();
  });
  assert(currentSearchTitle.length > 4, "Current source-compatible view did not expose a search target.");
  await page.locator("#searchInput").fill(currentSearchTitle);
  await page.waitForSelector("#searchResults .search-row", { timeout: 10000 });
  await page.keyboard.press("Tab");
  const searchFocus = await page.evaluate(() => ({
    activeClass: document.activeElement?.className || "",
    resultsOpen: !document.querySelector("#searchResults")?.hasAttribute("hidden"),
  }));
  assert(searchFocus.resultsOpen && /\bsearch-row\b/.test(searchFocus.activeClass), "Search results did not stay open and receive keyboard focus after Tab.");
  const searchResultTitle = await page.locator("#searchResults .search-row").first().textContent();
  await page.locator("#searchResults .search-row").first().click();
  await page.waitForFunction(
    (title) => document.querySelector(".detail-title")?.textContent
      && String(title || "").trim().length > 0
      && document.querySelector("#searchResults")?.hasAttribute("hidden"),
    searchResultTitle,
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
    await assertGeneratedGuideSignal(page, check.id);
  }

  const provenanceCopyChecks = [
    {
      id: "transport-speed",
      required: [/Flow-proxy|Road flow proxy/i],
      forbidden: [/Speed colors/i],
    },
    {
      id: "transport-access",
      required: [/Access-proxy/i, /current mapped transport|not selected-year|non-headline|No generated marks|no generated linework|filler geometry/i],
      forbidden: [/Isochrone/i, /Door-to-door/i, /\b15 min\b/i],
    },
    {
      id: "civic-access-gaps",
      required: [/Access-proxy/i, /Current mapped civic-service context|No generated marks|filler geometry|not measured travel[- ]time/i],
      forbidden: [/\b15 min\b/i, /<=\s*\d+\s*min/i],
    },
    {
      id: "transport-reliability",
      required: [/Lower disruption signal/i, /Planned \/ record/i, /Current mapped road context|selected-year transport activity|not measured|non-headline|No generated marks|no generated linework|filler geometry/i],
      forbidden: [/Reliable \(on-time\)/i, /Unreliable \(delayed\)/i],
    },
    {
      id: "utilities-capacity",
      required: [/Utility context/i, /only aggregate or non-site geometry is available|No generated marks|filler geometry/i],
      forbidden: [/load-risk/i],
    },
  ];
  for (const check of provenanceCopyChecks) {
    await assertAspectCopy(page, check.id, check);
  }

  const coveredWarningChecks = [
    { year: 2007, aspect: "planning-delta" },
    { year: 2014, aspect: "planning-delta" },
    { year: 2007, aspect: "civic-demand" },
    { year: 2008, aspect: "civic-demand" },
    { year: 2015, aspect: "economy-gravity" },
    { year: 2013, aspect: "utilities-capacity" },
  ];
  for (const check of coveredWarningChecks) {
    await assertNoGapWarningForAspect(page, check.year, check.aspect);
  }
  const closedTransportGapChecks = [
    { year: 2007, aspect: "transport-speed" },
    { year: 2007, aspect: "transport-access" },
    { year: 2007, aspect: "transport-reliability" },
  ];
  for (const check of closedTransportGapChecks) {
    await assertNoGapWarningForAspect(page, check.year, check.aspect);
  }
  const transport2007LensEvents = await page.evaluate(async () => {
    const expectedIds = [
      "belfast_colin_public_transport_access_context_2007",
      "belfast_m1_blacks_stockmans_road_scheme_delay_2007",
      "belfast_metro_punctuality_assembly_2007",
    ];
    const byLens = {};
    await window.BimsAtlas?.setAreaFilter?.("");
    await window.BimsAtlas?.setYear?.(2007);
    for (const aspect of ["transport-access", "transport-speed", "transport-reliability"]) {
      await window.BimsAtlas?.setActiveAspect?.(aspect);
      byLens[aspect] = (window.BimsAtlas?.filteredEvents?.() || [])
        .map((event) => event.id)
        .filter((id) => expectedIds.includes(id))
        .sort();
    }
    return byLens;
  });
  assert(
    JSON.stringify(transport2007LensEvents["transport-access"]) === JSON.stringify(["belfast_colin_public_transport_access_context_2007"]),
    `2007 transport access included the wrong supplemental transport events: ${JSON.stringify(transport2007LensEvents["transport-access"])}`,
  );
  assert(
    JSON.stringify(transport2007LensEvents["transport-speed"]) === JSON.stringify(["belfast_m1_blacks_stockmans_road_scheme_delay_2007"]),
    `2007 transport activity included the wrong supplemental transport events: ${JSON.stringify(transport2007LensEvents["transport-speed"])}`,
  );
  assert(
    JSON.stringify(transport2007LensEvents["transport-reliability"]) === JSON.stringify(["belfast_metro_punctuality_assembly_2007"]),
    `2007 transport reliability included the wrong supplemental transport events: ${JSON.stringify(transport2007LensEvents["transport-reliability"])}`,
  );
  await assertAdjacentSourceOnlyForAspect(page, { year: 2010, aspect: "civic-access-gaps" });

  const lensChecks = [
    { id: "built_environment", year: 2014, aspect: "planning-delta", layer: "lens-planning-cells-fill", visible: "lensPlanningCellsVisible", rendered: "lensPlanningCellsRendered", legend: /Planning & Built|Cells/i },
    { id: "civic_services", year: 2008, aspect: "civic-demand", layer: "lens-civic-coverage-fill", visible: "lensCivicCoverageVisible", rendered: "lensCivicCoverageRendered", legend: /Civic Services|facility|Coverage/i },
    { id: "economy", year: 2015, aspect: "economy-gravity", layer: "lens-economy-frontage", visible: "lensEconomyFrontageVisible", rendered: "lensEconomyFrontageRendered", legend: /Economy|frontage|activity/i },
    { id: "utilities", year: 2013, aspect: "utilities-capacity", layer: "lens-utilities-trace", visible: "lensUtilityTraceVisible", rendered: "lensUtilityTraceRendered", legend: /Utilities|trace|asset/i },
  ];
  for (const check of lensChecks) {
    await page.evaluate(async ({ year, aspect }) => {
      await window.BimsAtlas?.setYear?.(year);
      await window.BimsAtlas?.setActiveAspect?.(aspect);
      window.BimsAtlas?.recenterMap?.();
    }, check);
    await page.waitForFunction(
      ({ id, year, aspect }) => Number(window.BimsAtlas?.state?.year) === year
        && window.BimsAtlas?.state?.activeLens === id
        && window.BimsAtlas?.state?.activeAspect === aspect
        && document.querySelector("#mapStudyChip")?.dataset.scope === "city",
      check,
      { timeout: 20000 }
    );
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
    await assertGeneratedGuideSignal(page, `${check.id} ${check.year}`);
    const lensState = await atlasState(page);
    assert(lensState.activeLens === check.id, `Map lens did not switch to ${check.id}.`);
    assert(Number(lensState.year) === check.year, `${check.id} map lens did not switch to source-compatible year ${check.year}.`);
    assert(lensState.activeAspect === check.aspect, `${check.id} map lens did not switch to ${check.aspect}.`);
    assert(lensState[check.visible], `${check.id} map lens did not show its expected overlay layer.`);
    assert(lensState[check.rendered] > 0, `${check.id} map lens did not render inspectable lens features in the viewport.`);
    assert(check.legend.test(lensState.lensLegendText), `${check.id} legend did not update: ${lensState.lensLegendText}`);
    assert(lensState.lensDetailYearLoaded === Number(lensState.year), `${check.id} detail lens did not load the current timeline year.`);
    const lensScreenshot = await page.screenshot({ path: path.join(outputDir, `atlas-lens-${check.id}-${check.year}.png`), fullPage: false });
    assertDetailedPng(lensScreenshot, assert, `${check.id} lens screenshot`);
  }

  await page.evaluate(async () => {
    await window.BimsAtlas?.setYear?.(2007);
    await window.BimsAtlas?.setActiveAspect?.("transport-speed");
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(
    () => Number(window.BimsAtlas?.state?.year) === 2007
      && window.BimsAtlas?.state?.activeLens === "transport"
      && window.BimsAtlas?.state?.activeAspect === "transport-speed"
      && document.querySelector("#mapStudyChip")?.dataset.scope === "city",
    null,
    { timeout: 20000 }
  );
  await page.waitForFunction(
    () => {
      const state = window.BimsAtlas?.state;
      const guide = state?.lensGuideFeatureCache?.features || [];
      return state?.transportRoadFeatureCountYearLoaded === 2007
        && state?.transportRoadFeatureCount === 0
        && guide.some((feature) => feature.properties?.lens_id === "transport-speed"
          && feature.properties?.source_kind === "current_context"
          && feature.properties?.detail_layer === "transport_roads_base")
        && /Current mapped road context|not measured speed|not selected-year/i.test(document.querySelector("#lensLegend")?.textContent || "");
    },
    null,
    { timeout: 25000 }
  );
  await assertGeneratedGuideSignal(page, "transport 2007");
  const transportLensState = await atlasState(page);
  const transportFilteredIds = await page.evaluate(() => (window.BimsAtlas?.filteredEvents?.() || []).map((event) => event.id));
  assert(transportFilteredIds.includes("belfast_m1_blacks_stockmans_road_scheme_delay_2007"), "2007 transport-speed did not retain the source-backed road-scheme evidence event.");
  assert(transportLensState.transportRoadVisible, "Transport no-linework lens should keep the transport layer slot visible for status/provenance.");
  assert(transportLensState.transportRoadFeatureCount === 0, "Transport no-linework lens should not load generated or incompatible road features.");
  assert(/Current mapped road context|not measured speed|not selected-year/i.test(transportLensState.lensLegendText), `Transport sparse legend did not explain the current-context-only state: ${transportLensState.lensLegendText}`);
  assert(transportLensState.lensDetailYearLoaded === null, "Transport lens should unload non-transport lens detail overlays.");
  const transportLensScreenshot = await page.screenshot({ path: path.join(outputDir, "atlas-lens-transport-2007.png"), fullPage: false });
  assertDetailedPng(transportLensScreenshot, assert, "transport lens screenshot");

  await page.evaluate(async () => {
    await window.BimsAtlas?.setYear?.(2008);
    await window.BimsAtlas?.setActiveAspect?.("transport-speed");
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(
    () => Number(window.BimsAtlas?.state?.year) === 2008
      && window.BimsAtlas?.state?.activeAspect === "transport-speed"
      && (window.BimsAtlas?.state?.lensGuideFeatureCache?.features || []).length === 0,
    null,
    { timeout: 20000 }
  );
  await assertGeneratedGuideSignal(page, "transport 2008 missing source");

  await page.evaluate(async () => {
    await window.BimsAtlas?.setYear?.(2007);
    await window.BimsAtlas?.setActiveAspect?.("transport-speed");
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(
    () => Number(window.BimsAtlas?.state?.year) === 2007
      && window.BimsAtlas?.state?.activeAspect === "transport-speed"
      && (window.BimsAtlas?.state?.lensGuideFeatureCache?.features || []).some((feature) => feature.properties?.source_kind === "current_context"),
    null,
    { timeout: 20000 }
  );

  await page.locator(".layer-row[data-layer='transport']").click();
  await page.waitForFunction(
    () => document.querySelector(".layer-row[data-layer='transport']")?.getAttribute("data-on") === "false",
    null,
    { timeout: 10000 }
  );
  await page.waitForFunction(
    () => {
      const atlas = window.BimsAtlas;
      for (const [id] of atlas?.state?.markers || []) {
        if (atlas?.state?.eventById?.get(id)?.category === "transport") return false;
      }
      return true;
    },
    null,
    { timeout: 10000 }
  );
  const afterFilterOff = await atlasState(page);
  assert(afterFilterOff.layersCount === "5/6 on", "Layer click did not update the active layer count.");
  assert(afterFilterOff.transportOn === "false", "Transport layer did not toggle off.");
  assert(!afterFilterOff.transportRoadVisible && /Layer off/i.test(afterFilterOff.lensLegendText), "Layer filter did not hide the transport lens and update the legend.");
  assert(afterFilterOff.transportPinCount === 0, "Transport layer filter did not remove transport map pins.");

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

  await page.evaluate(() => {
    const atlas = window.BimsAtlas;
    if (!atlas?.state?.map) return;
    atlas.state.map.stop?.();
    atlas.state.mapTilted = false;
    atlas.state.map.jumpTo({ pitch: 0, bearing: 0 });
    document.querySelector("#tiltBtn")?.setAttribute("aria-pressed", "false");
  });
  await page.waitForFunction(
    () => window.BimsAtlas?.state?.map?.getPitch?.() < 2
      && window.BimsAtlas?.state?.mapTilted === false
      && document.querySelector("#tiltBtn")?.getAttribute("aria-pressed") === "false",
    null,
    { timeout: 10000 }
  );
  await page.locator("#tiltBtn").click();
  await page.waitForFunction(
    () => window.BimsAtlas?.state?.map?.getPitch?.() > 10
      && window.BimsAtlas?.state?.mapTilted === true
      && document.querySelector("#tiltBtn")?.getAttribute("aria-pressed") === "true",
    null,
    { timeout: 10000 }
  );
  const afterTilt = await atlasState(page);
  assert(afterTilt.tiltPressed === "true", "Tilt map tool did not stay active after changing map pitch.");
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

  await page.evaluate(async () => {
    await window.BimsAtlas?.setYear?.(2007);
    await window.BimsAtlas?.setActiveAspect?.("planning-delta");
    window.BimsAtlas?.recenterMap?.();
  });
  await page.waitForFunction(
    () => Number(window.BimsAtlas?.state?.year) === 2007
      && window.BimsAtlas?.state?.activeAspect === "planning-delta"
      && window.BimsAtlas?.state?.activeLens === "built_environment"
      && window.BimsAtlas?.state?.lensDetailYearLoaded === 2007,
    null,
    { timeout: 20000 }
  );

  const scrubRect = await page.locator("#tlScrub").boundingBox();
  assert(scrubRect, "Timeline scrub target is missing.");
  const beforeTimeline = await atlasState(page);
  await page.mouse.click(scrubRect.x + scrubRect.width * 0.35, scrubRect.y + scrubRect.height / 2);
  await page.waitForFunction(
    (oldYear) => {
      const state = window.BimsAtlas?.state;
      return state && String(state.year) !== oldYear && state.lensDetailYearLoaded === state.year;
    },
    beforeTimeline.year,
    { timeout: 10000 }
  );
  await page.waitForTimeout(400);
  const afterTimeline = await atlasState(page);
  assert(afterTimeline.year !== beforeTimeline.year, "Timeline scrub did not change the selected year.");
  assert(afterTimeline.pinCount > 0 && afterTimeline.visiblePinCount > 0, "Timeline scrub did not keep map events visible.");
  assert(cameraMatches(beforeTimeline, afterTimeline), "Timeline scrub moved the map camera instead of preserving the current viewport.");
  assert(afterTimeline.activeAspect === "planning-delta" && afterTimeline.activeLens === "built_environment", "Timeline scrub changed the active planning lens.");
  assert(afterTimeline.lensPlanningCellsVisible, "Timeline scrub hid the active planning lens overlay.");
  assert(afterTimeline.lensDetailYearLoaded === Number(afterTimeline.year), "Timeline scrub did not load source-backed planning detail for the selected year.");

  const screenshot = await page.screenshot({ path: path.join(outputDir, "paper-atlas-browser-smoke.png"), fullPage: false });
  assertDetailedPng(screenshot, assert, "Paper atlas browser smoke");

  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2, acceptDownloads: true });
  attachConsoleCapture(mobilePage, consoleMessages, pageErrors);
  await openAtlas(mobilePage, `${atlasUrl}?city=belfast`);
  await mobilePage.waitForFunction(
    () => window.BimsAtlas?.state?.detailLayerLoaded && window.BimsAtlas?.state?.lensOverlayLoaded,
    null,
    { timeout: 45000 }
  );
  await mobilePage.waitForTimeout(800);
  const mobileInitial = await atlasState(mobilePage);
  assert(mobileInitial.panelOverlaps.length === 0, `Mobile atlas panels overlap: ${mobileInitial.panelOverlaps.join(", ")}`);
  assert(mobileInitial.scrollWidth <= mobileInitial.clientWidth + 1, `Mobile atlas has horizontal page overflow: ${mobileInitial.scrollWidth} > ${mobileInitial.clientWidth}.`);
  await assertVisibleControlsHitTargets(mobilePage, "Mobile atlas");
  await mobilePage.locator("#changelogToggle").click();
  await mobilePage.waitForFunction(
    () => document.querySelector("#changelogPanel")?.getAttribute("data-open") === "true"
      && document.querySelector("#detailPanel")?.getAttribute("data-open") === "false",
    null,
    { timeout: 10000 }
  );
  await mobilePage.waitForFunction(
    () => {
      const changelog = document.querySelector("#changelogPanel");
      if (!changelog || changelog.getAttribute("data-open") !== "true") return false;
      const rect = changelog.getBoundingClientRect();
      const style = getComputedStyle(changelog);
      return Number(style.opacity || 0) > 0.9 && rect.top < innerHeight && rect.bottom <= innerHeight + 1;
    },
    null,
    { timeout: 10000 }
  );
  const mobileSheetState = await mobilePage.evaluate(() => {
    const detail = document.querySelector("#detailPanel");
    const changelog = document.querySelector("#changelogPanel");
    const detailRect = detail?.getBoundingClientRect();
    const changelogRect = changelog?.getBoundingClientRect();
    const detailStyle = detail ? getComputedStyle(detail) : null;
    const changelogStyle = changelog ? getComputedStyle(changelog) : null;
    return {
      detailOpen: detail?.getAttribute("data-open") || "",
      detailOpacity: Number(detailStyle?.opacity || 1),
      detailVisibleTop: Math.round(detailRect?.top ?? 0),
      detailVisibleBottom: Math.round(detailRect?.bottom ?? 0),
      changelogOpen: changelog?.getAttribute("data-open") || "",
      changelogOpacity: Number(changelogStyle?.opacity || 1),
      changelogTop: Math.round(changelogRect?.top ?? 0),
      changelogBottom: Math.round(changelogRect?.bottom ?? 0),
      viewportHeight: innerHeight,
    };
  });
  assert(
    mobileSheetState.detailOpacity === 0 || mobileSheetState.detailVisibleTop >= mobileSheetState.viewportHeight,
    `Mobile closed detail sheet is still visible: ${JSON.stringify(mobileSheetState)}`
  );
  assert(
    mobileSheetState.changelogOpen === "true" && mobileSheetState.changelogOpacity > 0 && mobileSheetState.changelogBottom <= mobileSheetState.viewportHeight,
    `Mobile changelog sheet is not cleanly visible: ${JSON.stringify(mobileSheetState)}`
  );
  await assertVisibleControlsHitTargets(mobilePage, "Mobile changelog sheet");
  await mobilePage.screenshot({ path: path.join(outputDir, "paper-atlas-browser-smoke-mobile.png"), fullPage: false });
  await mobilePage.close();

  fs.writeFileSync(path.join(outputDir, "paper-atlas-browser-smoke-state.json"), JSON.stringify({
    initial,
    mobileInitial,
    defaultPinLabel,
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
