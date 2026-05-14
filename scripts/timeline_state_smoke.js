const { chromium } = require("playwright");

const url = process.env.URL || "http://127.0.0.1:5173";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForAtlas(page) {
  await page.waitForFunction(
    () => Boolean(
      window.BimsAtlas?.state?.city
      && window.BimsAtlas?.filteredEvents
      && window.BimsAtlas.state.mapReady
      && document.querySelector(".maplibregl-canvas")
    ),
    null,
    { timeout: 45000 }
  );
  await page.waitForSelector("#eventList .event-card", { timeout: 45000 });
}

async function setTimelineYear(page, year) {
  await page.evaluate(async (nextYear) => {
    await window.BimsAtlas.setYear(nextYear);
  }, year);
  await page.waitForFunction(
    (expectedYear) => Boolean(
      window.BimsAtlas?.state?.year === expectedYear
      && window.BimsAtlas.state.selectedYearRange?.start === expectedYear
      && window.BimsAtlas.state.selectedYearRange?.end === expectedYear
      && document.querySelector("#currentYear")?.textContent === String(expectedYear)
    ),
    year,
    { timeout: 30000 }
  );
}

async function waitForTransportRoads(page, year) {
  await page.waitForFunction(
    (expectedYear) => {
      const state = window.BimsAtlas?.state;
      const map = state?.map;
      if (!map?.getLayer("lens-transport-roads")) return false;
      const features = map.queryRenderedFeatures({ layers: ["lens-transport-roads"] });
      return state.transportRoadYearLoaded === expectedYear
        && features.length > 0
        && features.every((feature) => Number(feature.properties.year) === expectedYear);
    },
    year,
    { timeout: 30000 }
  );
}

async function stateSnapshot(page) {
  return page.evaluate(() => {
    const events = window.BimsAtlas.filteredEvents();
    const markerIds = Array.from(document.querySelectorAll(".map-marker")).map((marker) => marker.dataset.eventId);
    const markerYears = markerIds
      .map((id) => window.BimsAtlas.state.eventById.get(id)?.year)
      .filter(Boolean);
    const roadFeatures = window.BimsAtlas.state.map.queryRenderedFeatures({ layers: ["lens-transport-roads"] });
    return {
      city: window.BimsAtlas.state.cityId,
      year: window.BimsAtlas.state.year,
      selectedRange: window.BimsAtlas.state.selectedYearRange,
      overlayRange: window.BimsAtlas.state.overlayYearRange,
      filters: window.BimsAtlas.state.eventFilters,
      activeLayers: window.BimsAtlas.state.activeLayers,
      visibleOverlays: window.BimsAtlas.state.visibleOverlays,
      visibleEventCount: window.BimsAtlas.state.visibleEventCount,
      visibleEventIds: window.BimsAtlas.state.visibleEventIds,
      visibleMarkerCount: window.BimsAtlas.state.visibleMarkerCount,
      selectedEventState: window.BimsAtlas.state.selectedEventState,
      allEventsLoaded: window.BimsAtlas.state.allEventsLoaded,
      loadedEventCount: window.BimsAtlas.state.loadedEventList.length,
      filteredCount: events.length,
      eventYears: [...new Set(events.map((event) => event.year))],
      markerIds,
      markerYears: [...new Set(markerYears)],
      cards: document.querySelectorAll("#eventList .event-card").length,
      markers: document.querySelectorAll(".map-marker").length,
      changeCount: document.querySelector("#changeCount")?.textContent || "",
      selectedTitle: document.querySelector("#selectedTitle")?.textContent || "",
      transportRoadYearLoaded: window.BimsAtlas.state.transportRoadYearLoaded,
      transportRoadYearPathLoaded: window.BimsAtlas.state.transportRoadYearPathLoaded,
      roadFeatureCount: roadFeatures.length,
      roadActivitySum: roadFeatures.reduce((total, feature) => total + Number(feature.properties.transport_activity || 0), 0),
    };
  });
}

function assertYearScoped(snapshot, expectedYear, label) {
  assert(snapshot.year === expectedYear, `${label}: expected state year ${expectedYear}, got ${snapshot.year}.`);
  assert(snapshot.selectedRange.start === expectedYear && snapshot.selectedRange.end === expectedYear, `${label}: selected range is stale.`);
  assert(snapshot.eventYears.length === 1 && snapshot.eventYears[0] === expectedYear, `${label}: filtered events span years ${snapshot.eventYears.join(", ")}.`);
  assert(snapshot.markerYears.length <= 1 && (!snapshot.markerYears.length || snapshot.markerYears[0] === expectedYear), `${label}: marker years span ${snapshot.markerYears.join(", ")}.`);
  assert(snapshot.visibleEventCount === snapshot.filteredCount, `${label}: explicit visible count does not match filtered events.`);
  assert(snapshot.visibleEventIds.length === snapshot.filteredCount, `${label}: visible event id list does not match filtered events.`);
  assert(snapshot.visibleMarkerCount === snapshot.markers, `${label}: explicit marker count does not match DOM markers.`);
  assert(snapshot.selectedEventState === null || snapshot.selectedEventState.visibleInSelectedTime === true, `${label}: selected event is outside the selected time.`);
  assert(snapshot.cards > 0 && snapshot.markers > 0, `${label}: event cards or markers vanished.`);
  assert(snapshot.changeCount && snapshot.changeCount !== "0", `${label}: visible count text did not update.`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1360, height: 820 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

  await page.goto(`${url}/?city=belfast`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForAtlas(page);

  const initial = await stateSnapshot(page);
  assertYearScoped(initial, 2024, "initial Belfast");
  assert(initial.activeLayers.detail && initial.activeLayers.lensHeatmap && initial.activeLayers.lensPoints, "initial Belfast: explicit active layer model is incomplete.");

  await page.evaluate(() => window.BimsAtlas.loadAllEventsForChangelog());
  await page.waitForFunction(() => window.BimsAtlas.state.allEventsLoaded === true, null, { timeout: 60000 });
  const loaded = await stateSnapshot(page);
  assert(loaded.allEventsLoaded && loaded.loadedEventCount > loaded.filteredCount, "full index load did not stay separate from selected-year rendering.");
  assertYearScoped(loaded, 2024, "loaded-index Belfast");

  await setTimelineYear(page, 2016);
  const before = await stateSnapshot(page);
  assertYearScoped(before, 2016, "Belfast 2016");

  const oldSelectedId = before.selectedEventState?.id || before.visibleEventIds[0];
  await setTimelineYear(page, 2026);
  const after = await stateSnapshot(page);
  assertYearScoped(after, 2026, "Belfast 2026");
  assert(after.visibleEventCount !== before.visibleEventCount || after.markerIds.join("|") !== before.markerIds.join("|"), "timeline 2016 -> 2026 did not change visible event state.");
  assert(after.selectedEventState === null || after.selectedEventState.id !== oldSelectedId, "selected event remained pinned to an out-of-time record.");

  await page.evaluate(() => window.BimsAtlas.setCategory("transport"));
  await page.waitForFunction(() => window.BimsAtlas.state.category === "transport", null, { timeout: 5000 });
  await setTimelineYear(page, 2016);
  await waitForTransportRoads(page, 2016);
  const transport2016 = await stateSnapshot(page);
  await setTimelineYear(page, 2026);
  await waitForTransportRoads(page, 2026);
  const transport2026 = await stateSnapshot(page);
  assert(transport2026.filters.category === "transport", "transport filter was not represented in the explicit state model.");
  assert(transport2026.activeLayers.transportRoads === true && transport2026.visibleOverlays.transportRoads === true, "transport overlay state was not explicit while transport lens was active.");
  assert(transport2016.transportRoadYearLoaded === 2016 && transport2026.transportRoadYearLoaded === 2026, "transport road source did not follow the timeline.");
  assert(String(transport2026.transportRoadYearPathLoaded || "").includes("transport_roads_2026.geojson"), "transport road source path did not update to 2026.");
  assert(transport2016.roadFeatureCount > 0 && transport2026.roadFeatureCount > 0, "transport road overlays did not render in both years.");
  assert(Math.abs(transport2016.roadActivitySum - transport2026.roadActivitySum) > 0.1, "transport road activity did not change between 2016 and 2026.");

  const filteredErrors = consoleErrors.filter((error) => !/favicon|ERR_CACHE_WRITE_FAILURE/i.test(error));
  await browser.close();
  assert(filteredErrors.length === 0, `Browser console errors:\n${filteredErrors.join("\n")}`);
  console.log("Timeline state smoke OK: year/range, visible events, counts, selected event state, and transport overlays update from 2016 to 2026.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
