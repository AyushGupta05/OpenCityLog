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
    () => Boolean(window.BimsAtlas?.state?.city && window.BimsAtlas?.filteredEvents),
    null,
    { timeout: 30000 }
  );
  await page.waitForSelector("#eventList .event-card", { timeout: 30000 });
  await page.waitForFunction(
    () => Boolean(
      window.BimsAtlas?.state?.mapReady
      && document.querySelector(".maplibregl-canvas")
      && document.querySelectorAll(".map-marker").length > 0
    ),
    null,
    { timeout: 45000 }
  );
}

async function appState(page) {
  return page.evaluate(() => {
    const events = window.BimsAtlas.filteredEvents();
    const displayEvents = window.BimsAtlas.displayEvents();
    const state = window.BimsAtlas.state;
    const staleSelectors = [".scene-image", ".territory-layer", ".map-pin", ".place-label", ".cloud"];
    return {
      title: document.title,
      city: state.cityId,
      year: state.year,
      cards: document.querySelectorAll("#eventList .event-card").length,
      lenses: document.querySelectorAll("#lensList .lens-row").length,
      markers: document.querySelectorAll(".map-marker").length,
      mapCanvas: document.querySelectorAll(".maplibregl-canvas").length,
      staleVisuals: staleSelectors.reduce((total, selector) => total + document.querySelectorAll(selector).length, 0),
      timelineDots: document.querySelectorAll(".timeline-event").length,
    selectedTitle: document.querySelector("#selectedTitle")?.textContent || "",
    selectedSummary: document.querySelector("#selectedSummary")?.textContent || "",
    selectedScan: document.querySelector("#selectedScan")?.textContent || "",
    currentYear: document.querySelector("#currentYear")?.textContent || "",
      overviewProjects: document.querySelector("#projectCount")?.textContent || "",
      overviewChanges: document.querySelector("#changeCount")?.textContent || "",
      coverage: document.querySelector("#coverageNote")?.textContent || "",
      attribution: document.querySelector("#mapAttribution")?.textContent || "",
      bodyText: document.body.innerText,
      visibleRecords: events.length,
      displayRecords: displayEvents.length,
      invalidVisible: events.filter((event) => !(
        event.displayVerified
        && Array.isArray(event.lngLat)
        && event.sourceIds.some((id) => state.sourceById.has(id))
      )).map((event) => event.id),
      markerIds: Array.from(document.querySelectorAll(".map-marker")).map((marker) => marker.dataset.eventId),
    };
  });
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push("pageerror: " + error.message));

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForAtlas(page);
  await page.waitForTimeout(1200);

  const health = await (await page.request.get(`${url}/api/health`)).json();
  assert(health.ok === true && health.mode === "city-change-atlas", "Health endpoint did not report the city atlas.");
  assert((await page.request.get(`${url}/api/manifest`)).status() === 404, "Retired /api/manifest path is still served.");
  assert((await page.request.get(`${url}/data/mode-a/summary.json`)).status() === 410, "Retired /data/mode-a path is not quarantined.");

  const initial = await appState(page);
  assert(initial.title === "OpenCityLog", "Document title did not update to OpenCityLog.");
  assert(initial.city === "belfast", "Default city should be the Belfast pilot.");
  assert(initial.year === 2024 && initial.currentYear === "2024", "Default timeline year should be 2024.");
  assert(initial.cards === 3, "Changelog should show three primary cards.");
  assert(initial.lenses === 5, "Lens rail should show the five visible lenses.");
  assert(initial.mapCanvas === 1, "Real MapLibre map canvas did not render.");
  assert(initial.markers > 0, "Source-backed map markers did not render.");
  assert(initial.markers === Math.min(initial.visibleRecords, 90), "Marker count does not match visible source-backed records capped for performance.");
  assert(initial.staleVisuals === 0, "Stale fake map visual primitives are still in the DOM.");
  assert(initial.timelineDots >= 10, "Timeline dots did not render.");
  assert(initial.invalidVisible.length === 0, `Visible records without source-backed geometry: ${initial.invalidVisible.join(", ")}`);
  assert(initial.markerIds.every((id) => id), "A map marker is missing its event id.");
  assert(/Esri World Imagery|OpenStreetMap|source-backed/i.test(initial.attribution), "Basemap/source attribution is missing.");
  assert(/source ids and map geometry/i.test(initial.coverage), "Coverage copy is missing the source-backed geometry rule.");
  assert(/belfast|station|opened|mapped|planning/i.test(initial.selectedTitle + initial.selectedSummary), "Selected card did not render source-backed city content.");
  assert(/Looks|Traffic|Evidence/i.test(initial.selectedScan), "Selected evidence scan did not render.");
  assert(/\d/.test(initial.overviewProjects) && /\d|k/i.test(initial.overviewChanges), "City overview counts did not render.");
  assert(/OpenCityLog|Changelog|Lenses|City Overview|View details/i.test(initial.bodyText), "Primary atlas UI copy is missing.");
  assert(!/CivicReplay|Proposal Lens|Evidence screen for a proposal|PDF-integrated|Run Simulation|Scenario Studio|Solana|2036 Scenario/i.test(initial.bodyText), "Stale legacy UI copy is visible.");

  await page.locator("#filterButton").click();
  await page.waitForFunction(() => /type menu/i.test(document.querySelector("#toast")?.textContent || ""), null, { timeout: 5000 });
  await page.locator(".panel-arrow").click();
  await page.waitForFunction(() => document.querySelector(".lens-panel")?.classList.contains("is-collapsed"), null, { timeout: 5000 });
  assert((await page.locator(".panel-arrow").getAttribute("aria-expanded")) === "false", "Lens collapse did not update aria-expanded.");
  await page.locator(".panel-arrow").click();
  await page.waitForFunction(() => !document.querySelector(".lens-panel")?.classList.contains("is-collapsed"), null, { timeout: 5000 });
  await page.locator(".overview-toggle").click();
  await page.waitForFunction(() => document.querySelector(".overview-card")?.classList.contains("is-collapsed"), null, { timeout: 5000 });
  assert((await page.locator(".overview-toggle").getAttribute("aria-expanded")) === "false", "Overview collapse did not update aria-expanded.");
  await page.locator(".overview-toggle").click();
  await page.waitForFunction(() => !document.querySelector(".overview-card")?.classList.contains("is-collapsed"), null, { timeout: 5000 });
  await page.locator(".add-lens").click();
  await page.waitForFunction(() => /Custom lenses/i.test(document.querySelector("#toast")?.textContent || ""), null, { timeout: 5000 });
  await page.locator(".top-nav .nav-item.active").click();
  await page.locator(".avatar-button").click();

  await page.keyboard.press("/");
  assert(await page.locator("#eventSearch").evaluate((node) => document.activeElement === node), "Slash shortcut did not focus search.");

  const firstCardId = await page.locator("#eventList .event-card").first().getAttribute("data-event-id");
  await page.locator("#eventList .event-card").first().click();
  await page.waitForFunction(
    (id) => window.BimsAtlas.state.selectedEventId === id && document.querySelector(".event-card[aria-selected='true']")?.dataset.eventId === id,
    firstCardId,
    { timeout: 5000 }
  );
  const listSelection = await page.evaluate(() => ({
    selectedId: window.BimsAtlas.state.selectedEventId,
    activeMarker: document.querySelector(".map-marker.active")?.dataset.eventId || "",
    selectedTitle: document.querySelector("#selectedTitle")?.textContent || "",
  }));
  assert(listSelection.selectedId === firstCardId && listSelection.activeMarker === firstCardId && listSelection.selectedTitle.length > 4, "List selection did not sync card, marker, and selected inspector.");

  const firstMarkerId = await page.locator(".map-marker").first().getAttribute("data-event-id");
  await page.locator(".map-marker").first().click();
  await page.waitForFunction(
    (id) => window.BimsAtlas.state.selectedEventId === id,
    firstMarkerId,
    { timeout: 5000 }
  );
  const markerSelection = await page.evaluate(() => ({
    selectedId: window.BimsAtlas.state.selectedEventId,
    activeMarker: document.querySelector(".map-marker.active")?.dataset.eventId || "",
    selectedHasSources: window.BimsAtlas.state.selectedEvent.sourceIds.some((id) => window.BimsAtlas.state.sourceById.has(id)),
    selectedHasGeometry: Array.isArray(window.BimsAtlas.state.selectedEvent.lngLat),
  }));
  assert(markerSelection.selectedId === firstMarkerId && markerSelection.activeMarker === firstMarkerId, "Clicking a real map marker did not select it.");
  assert(markerSelection.selectedHasSources && markerSelection.selectedHasGeometry, "Selected marker record is not source-backed with geometry.");

  await page.locator('[data-lens="transport"]').click();
  await page.waitForFunction(() => window.BimsAtlas.state.category === "transport", null, { timeout: 5000 });
  const transportState = await page.evaluate(() => ({
    category: window.BimsAtlas.state.category,
    cards: document.querySelectorAll("#eventList .event-card").length,
    markers: document.querySelectorAll(".map-marker").length,
    selectedMeta: document.querySelector("#selectedMeta")?.textContent || "",
    timelineLabel: document.querySelector(".timeline-event.active")?.getAttribute("aria-label") || "",
    timelineCount: window.BimsAtlas.timelineCountForYear(window.BimsAtlas.state.year, "transport"),
    manifestCount: Number(window.BimsAtlas.state.eventsIndex.chunks.find((chunk) => chunk.year === window.BimsAtlas.state.year)?.counts_by_category?.transport || 0),
    invalidVisible: window.BimsAtlas.filteredEvents().filter((event) => !event.displayVerified).length,
  }));
  assert(transportState.category === "transport" && transportState.cards > 0, "Transport lens did not activate.");
  assert(transportState.markers > 0, "Transport lens removed all real map markers.");
  assert(transportState.invalidVisible === 0, "Transport lens exposed an unverified record.");
  assert(/Transport/i.test(transportState.selectedMeta), "Selected metadata did not reflect the active transport lens.");
  assert(/transport records?/i.test(transportState.timelineLabel), "Timeline did not label the active transport filter.");
  assert(transportState.timelineCount === transportState.manifestCount, "Timeline transport count did not come from the events manifest.");

  await page.locator("#categoryFilter").selectOption("all");
  await page.waitForFunction(() => window.BimsAtlas.state.category === "all", null, { timeout: 5000 });
  await page.locator("#confidenceFilter").selectOption("documented");
  await page.waitForFunction(() => window.BimsAtlas.state.confidenceFilter === "documented", null, { timeout: 5000 });
  const confidenceTimeline = await page.evaluate(() => {
    const chunk = window.BimsAtlas.state.eventsIndex.chunks.find((item) => item.year === window.BimsAtlas.state.year) || {};
    const expected = Number(chunk.counts_by_confidence?.documented || 0) + Number(chunk.counts_by_confidence?.corroborated || 0);
    return {
      label: document.querySelector(".timeline-event.active")?.getAttribute("aria-label") || "",
      count: window.BimsAtlas.timelineCountForYear(window.BimsAtlas.state.year, "all"),
      expected,
    };
  });
  assert(/documented confidence/i.test(confidenceTimeline.label), "Timeline did not label the active confidence filter.");
  assert(confidenceTimeline.count === confidenceTimeline.expected, "Timeline confidence count did not come from real manifest confidence counts.");
  await page.locator("#confidenceFilter").selectOption("all");
  await page.waitForFunction(() => window.BimsAtlas.state.confidenceFilter === "all", null, { timeout: 5000 });
  await page.locator(".timeline-event[data-year='2023']").click();
  await page.waitForFunction(
    () => window.BimsAtlas.state.year === 2023 && window.BimsAtlas.state.selectedEvent?.year === 2023,
    null,
    { timeout: 10000 }
  );
  const yearState = await page.evaluate(() => ({
    currentYear: document.querySelector("#currentYear")?.textContent || "",
    selectedYear: window.BimsAtlas.state.selectedEvent?.year,
    timelineActive: document.querySelector(".timeline-event.active")?.dataset.year || "",
    invalidVisible: window.BimsAtlas.filteredEvents().filter((event) => !event.displayVerified).length,
  }));
  assert(yearState.currentYear === "2023" && yearState.selectedYear === 2023 && yearState.timelineActive === "2023", "Timeline year did not update selection.");
  assert(yearState.invalidVisible === 0, "Timeline exposed an unverified record.");

  await page.locator("#eventSearch").fill("station");
  await page.waitForFunction(() => /station/.test(window.BimsAtlas.state.search), null, { timeout: 5000 });
  await page.waitForFunction(() => window.BimsAtlas.filteredEvents().length > 0, null, { timeout: 30000 });
  await page.waitForFunction(() => window.BimsAtlas.state.allEventsLoaded === true, null, { timeout: 30000 });
  const searchState = await page.evaluate(() => ({
    count: window.BimsAtlas.filteredEvents().length,
    text: document.querySelector("#eventList")?.textContent || "",
    markers: document.querySelectorAll(".map-marker").length,
    expectedMarkers: Math.min(window.BimsAtlas.filteredEvents().length, 90),
    searchResults: document.querySelectorAll("#searchResults button").length,
    timelineLabel: document.querySelector(".timeline-event.active")?.getAttribute("aria-label") || "",
    timelineCount: window.BimsAtlas.timelineCountForYear(window.BimsAtlas.state.year, "all"),
    exactYearCount: window.BimsAtlas.state.loadedEvents.get(window.BimsAtlas.state.year).filter((event) => event.displayVerified && window.BimsAtlas.filteredEvents().some((item) => item.id === event.id)).length,
  }));
  assert(searchState.count > 0 && /station/i.test(searchState.text), "Search did not filter changelog records.");
  assert(searchState.markers > 0 && searchState.markers === searchState.expectedMarkers, "Search did not keep matching real map markers.");
  assert(searchState.searchResults > 0, "Area/project search did not show selectable suggestions.");
  assert(/matching "station"/i.test(searchState.timelineLabel), "Timeline did not label the active search filter.");
  assert(searchState.timelineCount === searchState.exactYearCount, "Timeline search count was not based on loaded matching records.");

  await page.locator("#viewDetailsButton").click();
  await page.waitForSelector("#detailsDialog[open]", { timeout: 5000 });
  await page.waitForSelector("#placeScan .scan-card", { timeout: 10000 });
  const details = await page.evaluate(() => ({
    title: document.querySelector("#detailsTitle")?.textContent || "",
    observed: document.querySelector("#detailsObserved")?.textContent || "",
    scan: document.querySelector("#placeScan")?.textContent || "",
    nearby: document.querySelector("#nearbyContext")?.textContent || "",
    nearbyNote: document.querySelector("#nearbyContextNote")?.textContent || "",
    limitations: document.querySelector("#detailsLimitations")?.textContent || "",
    reviewerNotes: document.querySelector("#detailsReviewerNotes")?.textContent || "",
    sources: document.querySelector("#detailsSources")?.textContent || "",
    sourceLinks: document.querySelectorAll("#detailsSources a[href]").length,
    evidenceRows: document.querySelectorAll("#detailsSources .evidence-row").length,
    fallback: /not found in the city source registry/i.test(document.querySelector("#detailsSources")?.textContent || ""),
    staleCopy: /simulation|forecast|scenario|impact score/i.test(document.querySelector("#detailsDialog")?.innerText || ""),
  }));
  assert(details.title.length > 4, "Evidence dialog title is empty.");
  assert(/Effective date basis/i.test(details.observed), "Evidence dialog is missing date-basis copy.");
  assert(/Appearance|Traffic and movement|Evidence quality/i.test(details.scan), "Evidence dialog is missing place/movement scan.");
  assert(/source-backed records|No source-backed nearby records/i.test(details.nearbyNote), "Evidence dialog is missing nearby context note.");
  assert(/causation is not claimed|OSM edit dates|Coverage is partial/i.test(details.limitations), "Evidence dialog is missing limitations.");
  assert(/Geometry|Source retrieved|Transform/i.test(details.reviewerNotes), "Evidence dialog is missing reviewer notes.");
  assert(details.sources.length > 10 && details.sourceLinks > 0 && details.evidenceRows > 0, "Evidence dialog is missing evidence/source rows.");
  assert(!details.fallback, "Default evidence path fell back to unresolved source registry copy.");
  assert(!details.staleCopy, "Evidence dialog contains stale simulation/forecast copy.");
  await page.locator("#copyBriefButton").click();
  await page.waitForFunction(() => /brief|Copy unavailable/i.test(document.querySelector("#toast")?.textContent || ""), null, { timeout: 5000 });
  await page.locator("#closeDialogButton").click();

  await page.locator("#proposalButton").click();
  await page.waitForSelector("#proposalDialog[open]", { timeout: 5000 });
  await page.locator("#runProposalButton").click();
  await page.waitForFunction(() => Boolean(window.BimsAtlas.state.proposalResult?.ok), null, { timeout: 30000 });
  const proposal = await page.evaluate(() => ({
    summary: document.querySelector("#proposalOutput .proposal-summary")?.textContent || "",
    analogues: document.querySelectorAll("#proposalOutput [data-proposal-event-id]").length,
    readiness: document.querySelectorAll("#proposalOutput .readiness-list span").length,
    staleCopy: /will (increase|decrease|reduce|improve|worsen|cause)|forecast|simulation result|impact score/i.test(document.querySelector("#proposalOutput")?.innerText || ""),
  }));
  assert(/may affect|confidence|analogue/i.test(proposal.summary), "Proposal analogue lens did not render a descriptive summary.");
  assert(proposal.analogues > 0, "Proposal analogue lens did not render historical analogues.");
  assert(proposal.readiness >= 3, "Proposal analogue lens did not render evidence readiness.");
  assert(!proposal.staleCopy, "Proposal analogue lens contains overclaiming copy.");
  await page.locator("#closeProposalButton").click();

  await page.locator("#eventSearch").fill("zzzz-no-source-backed-match");
  await page.waitForFunction(() => window.BimsAtlas.filteredEvents().length === 0, null, { timeout: 5000 });
  const emptyState = await page.evaluate(() => ({
    text: document.querySelector("#eventList")?.textContent || "",
    markers: document.querySelectorAll(".map-marker").length,
  }));
  assert(/No source-backed records with usable map geometry/i.test(emptyState.text) && emptyState.markers === 0, "Zero-results state did not explain source-backed geometry filtering.");
  await page.locator("#eventSearch").fill("");
  await page.waitForFunction(() => window.BimsAtlas.filteredEvents().length > 0, null, { timeout: 5000 });

  await page.locator("#compareButton").click();
  await page.waitForSelector("#comparePanel:not([hidden])", { timeout: 5000 });
  const compareOn = await page.locator(".atlas-app").evaluate((node) => node.classList.contains("is-comparing"));
  assert(compareOn, "Compare control did not toggle compare state.");
  const compareToast = await page.locator("#toast").textContent();
  const compareState = await page.evaluate(() => ({
    stats: document.querySelectorAll("#compareStats article").length,
    deltas: document.querySelectorAll("#compareStats .compare-deltas span").length,
    note: document.querySelector("#compareNote")?.textContent || "",
    band: document.querySelector("#compareMapBand") && getComputedStyle(document.querySelector("#compareMapBand")).display !== "none",
  }));
  assert(!/simulation|forecast|scenario|impact score/i.test(compareToast || ""), "Compare toast contains stale simulation/forecast copy.");
  assert(compareState.stats === 3 && compareState.deltas > 0, "Compare panel did not render before/after counts and category deltas.");
  assert(/Publication dates|Event counts/i.test(compareState.note), "Compare panel does not explain imagery/count limitations.");
  assert(compareState.band, "Compare map band did not become visible.");

  await page.locator("#zoomInButton").click();
  await page.locator("#zoomOutButton").click();
  await page.locator("#recenterButton").click();
  await page.locator("#view3dButton").click();
  await page.locator("#view3dButton").click();
  const mapControls = await page.evaluate(() => ({
    zoom: window.BimsAtlas.state.map.getZoom(),
    viewMode: window.BimsAtlas.state.viewMode,
  }));
  assert(Number.isFinite(mapControls.zoom) && mapControls.viewMode === "3d", "Map controls did not remain usable.");

  await page.evaluate(() => {
    window.BimsAtlas.setCategory("all");
    return window.BimsAtlas.loadAllEventsForChangelog();
  });
  await page.waitForFunction(() => window.BimsAtlas.state.allEventsLoaded === true, null, { timeout: 30000 });
  const fullState = await appState(page);
  assert(fullState.displayRecords >= initial.displayRecords, "Full changelog lost display-verified records.");
  assert(fullState.invalidVisible.length === 0, `Full changelog exposed unverified records: ${fullState.invalidVisible.join(", ")}`);
  assert(fullState.cards >= 6, "Full changelog did not load expanded records.");

  const cityMapPng = await page.locator("#cityMap").screenshot();
  assertDetailedPng(cityMapPng, assert, "Real city basemap");
  fs.writeFileSync(path.join(outputDir, "open-citylog-real-map-canvas.png"), cityMapPng);
  const mapStagePng = await page.locator("#mapStage").screenshot();
  assertDetailedPng(mapStagePng, assert, "OpenCityLog real map stage");
  fs.writeFileSync(path.join(outputDir, "open-citylog-real-map-stage.png"), mapStagePng);
  await page.screenshot({ path: path.join(outputDir, "open-citylog-real-map-smoke.png"), fullPage: false });
  await browser.close();

  const filteredErrors = consoleErrors.filter((error) => !/favicon|ERR_CACHE_WRITE_FAILURE/i.test(error));
  assert(filteredErrors.length === 0, `Browser console errors:\n${filteredErrors.join("\n")}`);
  console.log("OpenCityLog real-map browser smoke OK: source-backed markers, changelog, timeline, evidence dialog, and stale-visual guards.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
