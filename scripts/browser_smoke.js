const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { assertDetailedPng } = require("./image_detail");

const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const url = process.env.URL || "http://127.0.0.1:5173";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForAtlas(page) {
  await page.waitForFunction(
    () => Boolean(window.BimsAtlas?.state?.city && window.BimsAtlas?.state?.eventsIndex),
    null,
    { timeout: 30000 }
  );
  await page.waitForSelector("#eventList .event-card", { timeout: 30000 });
  await page.waitForFunction(
    () => Boolean(window.BimsAtlas?.state?.mapSceneReady && document.querySelectorAll(".maplibregl-canvas").length >= 2),
    null,
    { timeout: 30000 }
  );
}

async function waitForRenderedImagery(page) {
  await page.waitForFunction(
    () => {
      const mapTiles = Array.from(document.querySelectorAll(".tile-layer img"));
      const eventThumbs = Array.from(document.querySelectorAll(".event-thumb img"));
      const loadedMapTiles = mapTiles.filter((img) => img.complete && img.naturalWidth >= 128).length;
      const loadedThumbTiles = eventThumbs.filter((img) => img.complete && img.naturalWidth >= 128).length;
      return mapTiles.length >= 24 && loadedMapTiles >= 12 && loadedThumbTiles >= 4;
    },
    null,
    { timeout: 30000 }
  );
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const notFoundUrls = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() === 404) notFoundUrls.push(response.url());
  });
  page.on("pageerror", (error) => consoleErrors.push("pageerror: " + error.message));

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForAtlas(page);
  await waitForRenderedImagery(page);
  await page.waitForFunction(
    () => Boolean(
      window.BimsAtlas?.state?.selectedEvent &&
      !window.BimsAtlas.state.plannerAssessmentLoading &&
      document.querySelector("#plannerWorkbench .planner-matrix-row")
    ),
    null,
    { timeout: 30000 }
  );
  await page.waitForTimeout(500);

  const health = await (await page.request.get(`${url}/api/health`)).json();
  assert(health.ok === true && health.mode === "city-change-atlas" && health.atlasIndex === true, "Health endpoint did not report the active city atlas.");
  assert(!("legacyReplayManifest" in health), "Health endpoint still exposes legacy replay manifest state.");
  const retiredManifest = await page.request.get(`${url}/api/manifest`);
  assert(retiredManifest.status() === 404, "Retired /api/manifest path is still served.");
  const retiredReplayManifest = await page.request.get(`${url}/api/replay-manifest.json`);
  assert(retiredReplayManifest.status() === 404, "Retired /api/replay-manifest.json path is still served.");
  const retiredModeA = await page.request.get(`${url}/data/mode-a/summary.json`);
  assert(retiredModeA.status() === 410, "Retired /data/mode-a path is not explicitly quarantined.");
  const encodedModeA = await page.request.get(`${url}/data/mode-a%2Fsummary.json`);
  assert(encodedModeA.status() === 410, "Retired encoded /data/mode-a path is not explicitly quarantined.");
  const encodedModeARoot = await page.request.get(`${url}/data%2Fmode-a%2Fsummary.json`);
  assert(encodedModeARoot.status() === 410, "Retired encoded root /data/mode-a path is not explicitly quarantined.");
  const encodedModeABackslash = await page.request.get(`${url}/data%5Cmode-a%5Csummary.json`);
  assert(encodedModeABackslash.status() === 410, "Retired encoded backslash /data/mode-a path is not explicitly quarantined.");
  const dotSegmentModeA = await page.request.get(`${url}/x/..%2Fdata/mode-a/summary.json`);
  assert(dotSegmentModeA.status() === 410, "Retired dot-segment encoded /data/mode-a path is not explicitly quarantined.");
  const dotSegmentBackslashModeA = await page.request.get(`${url}/x/..%5Cdata%5Cmode-a%5Csummary.json`);
  assert(dotSegmentBackslashModeA.status() === 410, "Retired dot-segment encoded backslash /data/mode-a path is not explicitly quarantined.");
  const encodedDotSegmentRootModeA = await page.request.get(`${url}/data%2F..%2Fdata%2Fmode-a%2Fsummary.json`);
  assert(encodedDotSegmentRootModeA.status() === 410, "Retired encoded dot-segment root /data/mode-a path is not explicitly quarantined.");
  const encodedCurrentDirModeA = await page.request.get(`${url}/.%2Fdata%2Fmode-a%2Fsummary.json`);
  assert(encodedCurrentDirModeA.status() === 410, "Retired encoded current-dir /data/mode-a path is not explicitly quarantined.");

  const initial = await page.evaluate(() => ({
    title: document.title,
    cityOptions: Array.from(document.querySelectorAll("#citySelect option")).map((option) => option.value),
    layerLabels: Array.from(document.querySelectorAll(".layer-button")).map((button) => button.textContent.trim()),
    visibleText: document.body.innerText,
    eventCount: window.BimsAtlas.filteredEvents().length,
    mapEventCount: window.BimsAtlas.filteredMapEvents().length,
    markers: document.querySelectorAll(".map-marker").length,
    selectionFramePaths: document.querySelectorAll(".overlay-focus path").length,
    tiles: document.querySelectorAll(".tile-layer img").length,
    mapCanvases: document.querySelectorAll(".maplibregl-canvas").length,
    mapSceneReady: window.BimsAtlas.state.mapSceneReady,
    tileSrc: document.querySelector(".tile-layer img")?.getAttribute("src") || "",
    imageryProvider: window.BimsAtlas.state.imageryArchive?.provider || "",
    eventThumbs: document.querySelectorAll(".event-thumb").length,
    eventThumbImages: document.querySelectorAll(".event-thumb img").length,
    evidenceFrames: document.querySelectorAll(".mini-frame").length,
    impactModes: Array.from(document.querySelectorAll("[data-impact-mode]")).map((button) => button.textContent.trim()),
    impactCards: document.querySelectorAll(".impact-card").length,
    impactText: document.querySelector("#impactPanel")?.textContent || "",
    plannerText: document.querySelector("#plannerWorkbench")?.textContent || "",
    plannerStatusCards: document.querySelectorAll("#plannerWorkbench .planner-status").length,
    plannerMatrixRows: document.querySelectorAll("#plannerWorkbench .planner-matrix-row").length,
    plannerTasks: document.querySelectorAll("#plannerWorkbench .planner-task").length,
    plannerApiAnalogues: document.querySelectorAll("#plannerWorkbench .planner-api-analogues .planner-analogue").length,
    plannerOpenButtons: document.querySelectorAll("#plannerWorkbench [data-planner-open-event]").length,
    plannerFirstApiAnalogue: document.querySelector("#plannerWorkbench .planner-api-analogues .planner-analogue")?.textContent || "",
    plannerContextCards: document.querySelectorAll("#plannerWorkbench .planner-context-grid article").length,
    plannerDesignBasisRows: document.querySelectorAll("#plannerWorkbench .planner-design-basis article").length,
    plannerMatchFactorRows: document.querySelectorAll("#plannerWorkbench .planner-match-factors span").length,
    architectText: document.querySelector("#plannerWorkbench .city-architect-block")?.textContent || "",
    architectLedgerRows: document.querySelectorAll("#plannerWorkbench .impact-learning-ledger article").length,
    plannerControls: Array.from(document.querySelectorAll(".planner-controls select")).map((select) => select.id),
    planningReport: window.BimsAtlas.planningReportPayload(window.BimsAtlas.state.selectedEvent),
    causalClaimText: document.querySelector("#causalClaimText")?.textContent || "",
    selectedTitle: document.querySelector("#detailTitle")?.textContent || "",
    changeLogTitle: document.querySelector("#changeLogTitle")?.textContent || "",
    changeLogSubtitle: document.querySelector("#changeLogSubtitle")?.textContent || "",
    filterGridDisplay: getComputedStyle(document.querySelector(".filter-grid")).display,
    filterToggleExpanded: document.querySelector("#clearFiltersButton")?.getAttribute("aria-expanded"),
    confidencePillDisplay: getComputedStyle(document.querySelector(".confidence-pill")).display,
    coverageDisplay: getComputedStyle(document.querySelector("#coverageNotice")).display,
    briefCoverageDisplay: getComputedStyle(document.querySelector("#briefCoverageStatus")).display,
    sourceText: document.querySelector("#sourceList")?.textContent || "",
    changelogButton: document.querySelector("#viewChangelogButton")?.textContent || "",
  }));

  assert(initial.title.includes("Open Citylog"), "Open Citylog title did not render.");
  for (const cityId of ["uk", "belfast", "london", "nyc"]) {
    assert(initial.cityOptions.includes(cityId), `Missing city selector option ${cityId}.`);
  }
  for (const label of ["All layers", "Planning", "Transport", "Environment", "Public services", "Economy"]) {
    assert(initial.layerLabels.some((text) => text.includes(label)), `Missing layer ${label}.`);
  }
  assert(initial.eventCount > 0, "Change log did not load events.");
  assert(initial.mapEventCount > 0, "Timeline/map year did not expose events.");
  assert(initial.markers === 0, "Map should not render event-circle markers; selection happens from filters/list.");
  assert(initial.selectionFramePaths >= 4, "Map did not render the selected-record frame.");
  assert(initial.mapSceneReady && initial.mapCanvases >= 2, "Native MapLibre before/after map scenes did not initialize.");
  assert(initial.tiles >= 24, "Imagery basemap tiles did not render.");
  assert(/Esri World Imagery Wayback/i.test(initial.imageryProvider), "Wayback imagery manifest did not load.");
  assert(/wayback\.maptiles\.arcgis\.com/.test(initial.tileSrc), "Map is not using dated Wayback imagery tiles.");
  assert(initial.eventThumbs > 0, "Change log thumbnails did not render.");
  assert(initial.eventThumbImages > 0, "Event thumbnails did not load imagery tiles.");
  assert(initial.evidenceFrames === 3, "Reference evidence frame triptych did not render.");
  assert(initial.impactModes.some((text) => /Place change/i.test(text)) && initial.impactModes.some((text) => /Traffic/i.test(text)) && initial.impactModes.some((text) => /Components/i.test(text)), "Impact mode controls did not render.");
  assert(initial.impactCards > 0, "Impact/component cards did not render for the selected event.");
  assert(/not causal|observed place|affected/i.test(initial.impactText), "Impact panel is missing descriptive, caveated copy.");
  assert(initial.plannerStatusCards >= 4, "Planning workbench readiness cards did not render.");
  assert(initial.plannerMatrixRows >= 5 && initial.plannerTasks >= 4, "Planning workbench matrix or task queue did not render.");
  assert(initial.plannerControls.includes("proposalTypeSelect") && initial.plannerControls.includes("proposalScaleSelect") && initial.plannerControls.includes("proposalStageSelect") && initial.plannerControls.includes("proposalRadiusSelect"), "Planning workbench controls are missing.");
  assert(/Before\/after diff|Traffic evidence|Full-city analogue lookup|Evidence matrix|does not estimate/i.test(initial.plannerText), "Planning workbench is missing before/after, traffic, full-city analogue, matrix, or outcome-limit language.");
  assert(initial.planningReport?.proposal?.type === "housing" && initial.planningReport?.proposal_lens?.ok === true && initial.planningReport?.traffic && initial.planningReport?.before_after, "Planning report payload did not include proposal lens, traffic, and before/after sections.");
  assert(initial.plannerApiAnalogues > 0, "Full-city proposal lens did not render analogue rows.");
  assert(initial.plannerOpenButtons > 0, "Full-city analogue rows are not openable from the workbench.");
  assert(/Planning|development|housing|brownfield|Waterfront|International Quarter/i.test(initial.plannerFirstApiAnalogue), "Housing proposal analogue ranking did not prioritize planning/development records.");
  assert(initial.plannerContextCards > 0, "Proposal lens did not render source-backed local context signals.");
  assert(initial.plannerDesignBasisRows >= 4, "Proposal lens did not render the city-architect design review basis.");
  assert(initial.plannerMatchFactorRows > 0, "Analogue rows did not expose why each match was returned.");
  assert(initial.planningReport?.proposal_lens?.design_review_basis?.length >= 4, "Planning report is missing design review basis rows.");
  assert(/nearby[_ ]historical[_ ]event[_ ]density|grid[_ ]and[_ ]nearby[_ ]historical[_ ]events|current[_ ]context/i.test(initial.planningReport?.proposal_lens?.local_context?.context_basis || ""), "Proposal lens did not report the local-context basis.");
  assert(initial.architectLedgerRows >= 4 && /Public life baseline|Design tests|Learning aim/i.test(initial.architectText), "City architect review brief did not render useful public-life guidance.");
  assert(initial.planningReport?.city_architect_brief?.public_life_plan?.length >= 4, "Planning report is missing the city architect public-life measurement plan.");
  assert(/do(?:es)? not establish|does not justify|causal claim/i.test(initial.causalClaimText), "Evidence brief is missing an explicit causal-claim caveat.");
  assert(initial.selectedTitle.length > 5, "Evidence brief did not select an initial event.");
  assert(/Stratford|Olympic Park|Lower Lea Valley/i.test(initial.changeLogTitle), "London focus heading did not render.");
  assert(/London focus area/i.test(initial.changeLogSubtitle), "London focus subtitle did not render.");
  assert(initial.filterGridDisplay === "none" && initial.filterToggleExpanded === "false", "Filter panel should start collapsed behind the left-rail control.");
  await page.locator("#clearFiltersButton").click();
  await page.waitForFunction(() => getComputedStyle(document.querySelector(".filter-grid")).display !== "none", null, { timeout: 5000 });
  const filterPanelState = await page.evaluate(() => ({
    expanded: document.querySelector("#clearFiltersButton")?.getAttribute("aria-expanded"),
    ariaHidden: document.querySelector("#filterGrid")?.getAttribute("aria-hidden"),
    categoryVisible: getComputedStyle(document.querySelector("#categoryFilter")).display !== "none",
  }));
  assert(filterPanelState.expanded === "true" && filterPanelState.ariaHidden === "false" && filterPanelState.categoryVisible, "Filter panel did not open accessibly from the left-rail control.");
  await page.locator("#clearFiltersButton").click();
  await page.waitForFunction(() => getComputedStyle(document.querySelector(".filter-grid")).display === "none", null, { timeout: 5000 });
  assert(initial.confidencePillDisplay !== "none", "Confidence pills are hidden from the event list.");
  assert(initial.coverageDisplay !== "none" && initial.briefCoverageDisplay !== "none", "Coverage/trust status is hidden.");
  assert(/Date basis|Accessed|Technical trace/i.test(initial.sourceText), "Evidence source list is missing reviewer date/access/trace fields.");
  assert(/Load full city changelog/i.test(initial.changelogButton), "Full changelog control is missing or mislabeled.");

  const initialMapPng = await page.locator("#mapViewport").screenshot();
  assertDetailedPng(initialMapPng, assert, "Initial map viewport");
  fs.writeFileSync(path.join(outputDir, "open-citylog-browser-map.png"), initialMapPng);

  await page.locator('[data-impact-mode="traffic"]').click();
  await page.waitForFunction(() => window.BimsAtlas.state.impactMode === "traffic", null, { timeout: 5000 });
  const trafficImpact = await page.evaluate(() => ({
    active: document.querySelector('[data-impact-mode="traffic"]')?.getAttribute("aria-pressed"),
    text: document.querySelector("#impactPanel")?.textContent || "",
    meters: document.querySelectorAll("#impactPanel .impact-meter").length,
    mode: document.querySelector("#mapStage")?.dataset.impactView || "",
  }));
  assert(trafficImpact.active === "true" && trafficImpact.mode === "traffic", "Traffic impact mode did not become active.");
  assert(/traffic|mobility|not causal|no measured traffic metric/i.test(trafficImpact.text), "Traffic impact mode did not render caveated traffic context.");
  assert(trafficImpact.meters === 0 || /observed traffic context/i.test(trafficImpact.text), "Traffic mode rendered metric bars without observed traffic context.");

  await page.locator('[data-impact-mode="components"]').click();
  await page.waitForFunction(() => window.BimsAtlas.state.impactMode === "components", null, { timeout: 5000 });
  const componentImpact = await page.evaluate(() => ({
    active: document.querySelector('[data-impact-mode="components"]')?.getAttribute("aria-pressed"),
    text: document.querySelector("#impactPanel")?.textContent || "",
    cards: document.querySelectorAll("#impactPanel .component-card").length,
    activeCards: document.querySelectorAll("#impactPanel .component-card.active").length,
    mode: document.querySelector("#mapStage")?.dataset.impactView || "",
  }));
  assert(componentImpact.active === "true" && componentImpact.mode === "components", "Components impact mode did not become active.");
  assert(componentImpact.cards >= 2 && componentImpact.activeCards >= 1 && /Components come from|Affected/i.test(componentImpact.text), "Components impact mode did not render affected/current-state component cards.");

  await page.locator('[data-impact-mode="place"]').click();
  await page.waitForFunction(() => window.BimsAtlas.state.impactMode === "place", null, { timeout: 5000 });
  assert(/Open-source city-change atlas|Historical evidence map/i.test(initial.visibleText), "Evidence-backed product caveat is not visible.");
  assert(!/Run Simulation|Solana|Scenario Studio|2036 Scenario|Branch Workspace/i.test(initial.visibleText), "Legacy simulator UI copy is still visible.");

  await page.locator("#citySelect").selectOption("nyc");
  await page.waitForFunction(() => window.BimsAtlas.state.cityId === "nyc" && window.BimsAtlas.state.city?.city_id === "nyc", null, { timeout: 10000 });
  await page.waitForSelector("#eventList .event-card", { timeout: 10000 });
  const nycState = await page.evaluate(() => ({
    area: document.querySelector("#areaTitle")?.textContent || "",
    selected: window.BimsAtlas.state.selectedEvent?.title || "",
    markers: document.querySelectorAll(".map-marker").length,
    selectionFramePaths: document.querySelectorAll(".overlay-focus path").length,
  }));
  assert(/New York City/i.test(nycState.area), "City selector did not switch to NYC.");
  assert(nycState.markers === 0 && nycState.selectionFramePaths >= 4, "NYC map should use list selection frame rather than event markers.");
  const nycHeading = await page.evaluate(() => ({
    title: document.querySelector("#changeLogTitle")?.textContent || "",
    subtitle: document.querySelector("#changeLogSubtitle")?.textContent || "",
  }));
  assert(/New York City/i.test(nycHeading.title) && !/Stratford|Olympic Park|Lower Lea/i.test(nycHeading.title), "Primary heading stayed on the London focus after switching to NYC.");
  assert(/citywide atlas|source-backed/i.test(nycHeading.subtitle), "NYC heading did not explain the current source-backed scope.");

  await page.locator('[data-category="transport"]').click();
  await page.waitForFunction(() => window.BimsAtlas.state.category === "transport", null, { timeout: 10000 });
  const transportState = await page.evaluate(() => ({
    category: window.BimsAtlas.state.category,
    count: window.BimsAtlas.filteredEvents().length,
    listMeta: document.querySelector("#listMeta")?.textContent || "",
  }));
  assert(transportState.category === "transport", "Transport layer did not activate.");
  assert(transportState.count > 0, "Transport filter should show records.");
  assert(/records/i.test(transportState.listMeta), "Filter result count did not update.");

  const loadedBeforeFull = await page.evaluate(() => window.BimsAtlas.state.loadedEvents.size);
  await page.evaluate(async () => window.BimsAtlas.loadAllEventsForChangelog());
  await page.waitForFunction(() => window.BimsAtlas.state.allEventsLoaded === true, null, { timeout: 30000 });
  const fullChangelogState = await page.evaluate((loadedBefore) => ({
    loadedBefore,
    loadedAfter: window.BimsAtlas.state.loadedEvents.size,
    total: window.BimsAtlas.state.eventsIndex.event_count,
    buttonText: document.querySelector("#viewChangelogButton")?.textContent || "",
    listMeta: document.querySelector("#listMeta")?.textContent || "",
  }), loadedBeforeFull);
  assert(fullChangelogState.loadedAfter > fullChangelogState.loadedBefore && fullChangelogState.loadedAfter === fullChangelogState.total, "Full changelog did not load all city records.");
  assert(/Show|All matching records shown/i.test(fullChangelogState.buttonText), "Full changelog control did not switch to paging mode.");
  assert(/Showing/i.test(fullChangelogState.listMeta), "List metadata did not report the loaded full changelog state.");

  await page.locator("#compareButton").click();
  await page.waitForFunction(() => window.BimsAtlas.state.compareEnabled === true, null, { timeout: 5000 });
  const compareState = await page.evaluate(() => ({
    pressed: document.querySelector("#compareButton")?.getAttribute("aria-pressed"),
    classed: document.querySelector("#mapStage")?.classList.contains("is-comparing"),
    scrubberDisplay: getComputedStyle(document.querySelector(".compare-scrubber")).display,
    note: document.querySelector("#compareNote")?.textContent || "",
  }));
  assert(compareState.pressed === "true" && compareState.classed, "Compare button did not enable the before/after split.");
  assert(compareState.scrubberDisplay !== "none" && /years compared/i.test(compareState.note), "Compare scrubber/status did not become usable.");

  await page.locator("#view3dButton").click();
  const mode3d = await page.locator("#mapStage").evaluate((node) => node.classList.contains("mode-3d"));
  assert(mode3d, "3D view toggle did not activate.");

  const mapBox = await page.locator("#mapViewport").boundingBox();
  assert(mapBox && mapBox.width > 100 && mapBox.height > 100, "Map viewport bounds are unavailable.");
  const visibleMapBox = await page.evaluate(() => {
    const map = document.querySelector("#mapViewport")?.getBoundingClientRect();
    const brief = document.querySelector(".evidence-brief")?.getBoundingClientRect();
    if (!map) return null;
    const right = brief && brief.left > map.left ? Math.min(map.right, brief.left - 24) : map.right;
    return {
      left: map.left,
      top: map.top,
      width: Math.max(120, right - map.left),
      height: map.height,
    };
  });
  assert(visibleMapBox && visibleMapBox.width > 120, "Visible map area is unavailable for drag testing.");
  const centerBeforeDrag = await page.evaluate(() => [...window.BimsAtlas.state.mapCenter]);
  const dragStartX = visibleMapBox.left + visibleMapBox.width * 0.35;
  const dragStartY = visibleMapBox.top + visibleMapBox.height * 0.28;
  await page.mouse.move(dragStartX, dragStartY);
  await page.mouse.down();
  await page.mouse.move(visibleMapBox.left + visibleMapBox.width * 0.10, visibleMapBox.top + visibleMapBox.height * 0.50, { steps: 12 });
  await page.mouse.up();
  await page.waitForFunction(
    (center) => Math.abs(window.BimsAtlas.state.mapCenter[0] - center[0]) > 0.0001
      || Math.abs(window.BimsAtlas.state.mapCenter[1] - center[1]) > 0.0001,
    centerBeforeDrag,
    { timeout: 5000 }
  ).catch(() => {});
  const centerAfterDrag = await page.evaluate(() => [...window.BimsAtlas.state.mapCenter]);
  assert(
    Math.abs(centerAfterDrag[0] - centerBeforeDrag[0]) > 0.0001 || Math.abs(centerAfterDrag[1] - centerBeforeDrag[1]) > 0.0001,
    "Dragging the 3D map did not move the map center."
  );
  const zoomBeforeWheel = await page.evaluate(() => window.BimsAtlas.state.mapZoom);
  await page.mouse.move(visibleMapBox.left + visibleMapBox.width * 0.35, visibleMapBox.top + visibleMapBox.height * 0.28);
  await page.mouse.wheel(0, -700);
  await page.waitForFunction((zoom) => window.BimsAtlas.state.mapZoom !== zoom, zoomBeforeWheel, { timeout: 5000 });
  const zoomAfterWheel = await page.evaluate(() => window.BimsAtlas.state.mapZoom);
  assert(zoomAfterWheel > zoomBeforeWheel, "Wheel zoom did not zoom into the 3D map.");

  const timelineBefore = await page.evaluate(() => ({
    selectedId: window.BimsAtlas.state.selectedEventId,
    selectedTitle: document.querySelector("#detailTitle")?.textContent || "",
    selectedYear: Number(window.BimsAtlas.state.selectedEvent?.year || 0),
    firstCardId: document.querySelector("#eventList [data-event-id]")?.dataset.eventId || "",
    year: window.BimsAtlas.state.year,
    afterImageryId: window.BimsAtlas.state.afterImagery?.id || "",
  }));
  const timelineTarget = await page.evaluate(() => {
    const current = window.BimsAtlas.state.year;
    return window.BimsAtlas.state.years.filter((year) => year >= 2014 && year !== current)[0]
      || window.BimsAtlas.state.years.filter((year) => year >= 2000 && year !== current)[0]
      || current;
  });
  await page.evaluate(async (year) => window.BimsAtlas.setYear(year), timelineTarget);
  await page.waitForFunction((year) => window.BimsAtlas.state.year === year, timelineTarget, { timeout: 10000 });
  await page.waitForFunction((year) => Number(window.BimsAtlas.state.selectedEvent?.year || 0) === year, timelineTarget, { timeout: 10000 });
  const timelineAfter = await page.evaluate(() => ({
    selectedId: window.BimsAtlas.state.selectedEventId,
    selectedTitle: document.querySelector("#detailTitle")?.textContent || "",
    selectedYear: Number(window.BimsAtlas.state.selectedEvent?.year || 0),
    markers: document.querySelectorAll(".map-marker").length,
    selectionFramePaths: document.querySelectorAll(".overlay-focus path").length,
    firstCardId: document.querySelector("#eventList [data-event-id]")?.dataset.eventId || "",
    timelineText: document.querySelector("#timelineSummary")?.textContent || "",
    timeBadgeText: document.querySelector("#mapTimeBadge")?.textContent || "",
    afterImageryId: window.BimsAtlas.state.afterImagery?.id || "",
  }));
  assert(timelineAfter.selectedId !== timelineBefore.selectedId || timelineAfter.selectedYear !== timelineBefore.selectedYear, "Timeline scrub did not move selection to the target year.");
  assert(timelineAfter.selectedYear === timelineTarget, "Timeline scrub did not select a record from the target year.");
  assert(timelineAfter.firstCardId !== timelineBefore.firstCardId || timelineAfter.selectedTitle !== timelineBefore.selectedTitle, "Timeline scrub did not update the visible record set.");
  assert(timelineAfter.markers === 0 && timelineAfter.selectionFramePaths >= 4, "Timeline view reintroduced event-circle markers or lost the selection frame.");
  assert(new RegExp(String(timelineTarget)).test(timelineAfter.timelineText), "Timeline summary did not announce the target year.");
  assert(new RegExp(String(timelineTarget)).test(timelineAfter.timeBadgeText), "Map time badge did not announce the target year.");
  assert(timelineAfter.afterImageryId !== timelineBefore.afterImageryId, "Timeline scrub did not switch the dated imagery layer.");

  await page.locator("#eventSearch").fill("congestion");
  await page.waitForFunction(() => /congestion/i.test(window.BimsAtlas.state.search), null, { timeout: 10000 });
  const searchState = await page.evaluate(() => ({
    count: window.BimsAtlas.filteredEvents().length,
    title: document.querySelector("#detailTitle")?.textContent || "",
  }));
  assert(searchState.count > 0, "Search should find congestion records in NYC.");

  await page.locator("#citySelect").selectOption("belfast");
  await page.waitForFunction(() => window.BimsAtlas.state.cityId === "belfast" && window.BimsAtlas.state.city?.city_id === "belfast", null, { timeout: 10000 });
  await page.waitForSelector("#eventList .event-card", { timeout: 10000 });
  const belfastState = await page.evaluate(() => ({
    area: document.querySelector("#areaTitle")?.textContent || "",
    records: window.BimsAtlas.filteredEvents().length,
    sourcesText: document.querySelector("#sourceList")?.textContent || "",
    limitations: document.querySelector("#limitationsList")?.textContent || "",
  }));
  assert(/Belfast/i.test(belfastState.area), "City selector did not switch to Belfast.");
  assert(belfastState.records > 0, "Belfast records did not load.");
  assert(/Causal claim is not made|source limitations/i.test(belfastState.limitations), "Limitations do not show the causal caveat.");
  assert(belfastState.sourcesText.length > 20, "Evidence sources did not render.");

  await page.locator(".section-toggle").first().click();
  const collapsed = await page.locator(".section-toggle").first().evaluate((button) => ({
    expanded: button.getAttribute("aria-expanded"),
    classed: button.closest(".brief-section")?.classList.contains("is-collapsed"),
  }));
  assert(collapsed.expanded === "false" && collapsed.classed, "Evidence section toggle did not collapse with ARIA state.");
  await page.locator(".section-toggle").first().click();
  const expandedAgain = await page.locator(".section-toggle").first().evaluate((button) => ({
    expanded: button.getAttribute("aria-expanded"),
    classed: button.closest(".brief-section")?.classList.contains("is-collapsed"),
  }));
  assert(expandedAgain.expanded === "true" && !expandedAgain.classed, "Evidence section toggle did not expand with ARIA state.");

  await page.locator("#closeBriefButton").click();
  const closed = await page.evaluate(() => ({
    selected: window.BimsAtlas.state.selectedEventId,
    title: document.querySelector("#detailTitle")?.textContent || "",
  }));
  assert(closed.selected === null && /Select a record/i.test(closed.title), "Close evidence brief did not clear the selected record.");
  await page.evaluate(() => window.BimsAtlas.selectFirstEvent());
  await page.waitForFunction(() => Boolean(window.BimsAtlas.state.selectedEventId), null, { timeout: 5000 });

  await page.setViewportSize({ width: 390, height: 840 });
  await page.waitForTimeout(250);
  const mobileTrust = await page.evaluate(() => ({
    attributionDisplay: getComputedStyle(document.querySelector("#mapAttribution")).display,
    attributionText: document.querySelector("#mapAttribution")?.textContent || "",
    trustDisplay: getComputedStyle(document.querySelector(".trust-note")).display,
    trustText: document.querySelector(".trust-note")?.textContent || "",
  }));
  assert(mobileTrust.attributionDisplay !== "none" && /Imagery|OpenStreetMap|source/i.test(mobileTrust.attributionText), "Mobile map attribution/trust chip is hidden.");
  assert(mobileTrust.trustDisplay !== "none" && /not an outcome/i.test(mobileTrust.trustText), "Mobile product trust note is hidden.");
  await page.setViewportSize({ width: 1440, height: 920 });

  await page.screenshot({ path: path.join(outputDir, "open-citylog-browser-smoke.png"), fullPage: false });
  await browser.close();

  const filteredErrors = consoleErrors.filter((error) => {
    if (/favicon/i.test(error)) return false;
    if (/Failed to load resource: the server responded with a status of 404/i.test(error)) {
      return !notFoundUrls.some((item) => /\/api\/imagery\/wayback\/|wayback\.maptiles\.arcgis\.com|World_Imagery/i.test(item));
    }
    return true;
  });
  assert(filteredErrors.length === 0, `Browser console errors:\n${filteredErrors.join("\n")}`);
  console.log("Open Citylog browser smoke OK: city switching, filters, map overlay, timeline, evidence brief, and legacy-copy guard.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
