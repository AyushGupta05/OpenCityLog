(function () {
  "use strict";

  const DEFAULT_CITY = "belfast";
  const DEFAULT_YEAR = 2024;
  const MAX_PANEL_EVENTS = 10;
  const EVENT_LIST_BATCH_SIZE = 24;
  const EVENT_LIST_SCROLL_THRESHOLD = 180;
  const MAX_MARKERS = 90;
  const CONTEXT_RADIUS_KM = 1.5;
  const CONTEXT_YEAR_WINDOW = 2;
  const MAX_NEARBY_CONTEXT = 8;
  const DETAIL_SOURCE_ID = "osm-detail";
  const DETAIL_LAYER_IDS = [
    "detail-roads-current",
    "detail-buildings-fill",
    "detail-buildings-extrusion",
    "detail-buildings-outline",
    "detail-roads-visible",
    "detail-roads-year",
    "detail-buildings-year-outline",
  ];
  const LENS_SOURCE_ID = "lens-overlays";
  const LENS_ROAD_BASE_SOURCE_ID = "lens-transport-road-base";
  const LENS_ROAD_SOURCE_ID = "lens-transport-road-year";
  const LENS_LAYER_IDS = [
    "lens-heatmap",
    "lens-current-points-glow",
    "lens-current-points",
    "lens-transport-base-case",
    "lens-transport-base",
    "lens-transport-roads-case",
    "lens-transport-roads",
    "lens-transport-hotspots",
  ];
  const TILE_PROVIDER = {
    name: "OpenStreetMap Standard",
    attribution: "OpenStreetMap contributors",
    template: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  };

  const CATEGORY_CONFIG = [
    { id: "all", label: "All types", lensLabel: "All changes", desc: "Observed, source-backed records", color: "#62d3d7", icon: "stack" },
    { id: "built_environment", label: "Planning", lensLabel: "Planning", desc: "Zoning, land use, projects", color: "#d8a64e", icon: "building" },
    { id: "transport", label: "Transport", lensLabel: "Transport", desc: "Road activity, transit, mobility", color: "#62d3d7", icon: "train" },
    { id: "environment", label: "Environment", lensLabel: "Environment", desc: "Air, water, green space", color: "#75c69b", icon: "leaf" },
    { id: "civic_services", label: "Public services", lensLabel: "Public Services", desc: "Schools, health, safety", color: "#74bddb", icon: "civic" },
    { id: "economy", label: "Economy", lensLabel: "Economy", desc: "Business, jobs, investment", color: "#a58bd4", icon: "economy" },
    { id: "utilities", label: "Utilities", lensLabel: "Utilities", desc: "Power, water, mapped assets", color: "#d28a8a", icon: "building" },
  ];

  const CITY_AREA_HINTS = {
    belfast: [
      { label: "City Centre", lngLat: [-5.9301, 54.5973], zoom: 14.2, terms: "centre downtown core grand central city hall lagan" },
      { label: "Cathedral Quarter", lngLat: [-5.927, 54.6028], zoom: 14.4, terms: "cathedral quarter york street university ulster" },
      { label: "Titanic Quarter", lngLat: [-5.9082, 54.6083], zoom: 14.1, terms: "titanic quarter queens island harbour waterfront" },
      { label: "Queen's Quarter", lngLat: [-5.9386, 54.5848], zoom: 14.2, terms: "queens quarter university botanic malone" },
      { label: "Falls Road / Gaeltacht Quarter", lngLat: [-5.9649, 54.595], zoom: 14, terms: "falls road west belfast gaeltacht" },
      { label: "Shankill / North Belfast", lngLat: [-5.9521, 54.6084], zoom: 13.8, terms: "shankill north belfast crumlin" },
      { label: "Ormeau / South Belfast", lngLat: [-5.9152, 54.5825], zoom: 14, terms: "ormeau south belfast ravenhill" },
      { label: "East Belfast / Connswater", lngLat: [-5.8837, 54.5977], zoom: 13.7, terms: "east belfast connswater cs lewis" },
    ],
    london: [
      { label: "Stratford / Olympic Park", lngLat: [-0.013, 51.543], zoom: 13.4, terms: "stratford olympic park lower lea valley" },
      { label: "City of London", lngLat: [-0.0922, 51.5155], zoom: 13.6, terms: "city square mile financial" },
      { label: "Canary Wharf / Docklands", lngLat: [-0.0195, 51.5048], zoom: 13.4, terms: "canary wharf docklands isle of dogs" },
      { label: "Westminster", lngLat: [-0.1372, 51.4975], zoom: 13.5, terms: "westminster central london" },
    ],
    nyc: [
      { label: "Hudson Yards / West Chelsea", lngLat: [-74.002, 40.755], zoom: 14, terms: "hudson yards west chelsea far west side" },
      { label: "Lower Manhattan", lngLat: [-74.006, 40.7128], zoom: 13.6, terms: "lower manhattan financial district" },
      { label: "Downtown Brooklyn", lngLat: [-73.9857, 40.6943], zoom: 13.6, terms: "downtown brooklyn" },
      { label: "Long Island City", lngLat: [-73.945, 40.7447], zoom: 13.7, terms: "long island city lic queens" },
    ],
  };

  const state = {
    index: null,
    cityId: DEFAULT_CITY,
    cityMeta: null,
    city: null,
    sources: [],
    sourceById: new Map(),
    eventsIndex: null,
    years: [],
    year: DEFAULT_YEAR,
    category: "all",
    confidenceFilter: "all",
    showInferred: true,
    search: "",
    loadedEvents: new Map(),
    loadingYears: new Map(),
    loadedEventList: [],
    eventById: new Map(),
    selectedEventId: null,
    selectedEvent: null,
    selectedCity: null,
    selectedYearRange: { start: DEFAULT_YEAR, end: DEFAULT_YEAR },
    overlayYearRange: { start: DEFAULT_YEAR, end: DEFAULT_YEAR },
    eventFilters: {
      category: "all",
      confidence: "all",
      showInferred: true,
      search: "",
    },
    activeLayers: {
      detail: false,
      lensHeatmap: false,
      lensPoints: false,
      transportRoads: false,
    },
    visibleOverlays: {
      detailRoads: false,
      detailBuildings: false,
      heatmap: false,
      lensPoints: false,
      transportBase: false,
      transportRoads: false,
    },
    visibleEventIds: [],
    visibleMarkerIds: [],
    visibleEventCount: 0,
    visibleMarkerCount: 0,
    eventListRenderLimit: MAX_PANEL_EVENTS,
    eventListRenderedCount: 0,
    eventListObserver: null,
    selectedEventState: null,
    allEventsLoaded: false,
    loadingAll: false,
    playTimer: null,
    yearRequestId: 0,
    map: null,
    markers: new Map(),
    mapReady: false,
    viewMode: "3d",
    contextRequestId: 0,
    searchLoadRequestId: 0,
    compareActive: false,
    compareBeforeYear: null,
    compareAfterYear: null,
    basemapYear: null,
    basemapError: null,
    detailLayerLoaded: false,
    detailLayerError: null,
    lensOverlayLoaded: false,
    lensOverlayError: null,
    lensOverlayPathLoaded: null,
    transportRoadBasePathLoaded: null,
    transportRoadYearPathLoaded: null,
    transportRoadYearLoaded: null,
    proposalResult: null,
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    collectElements();
    wireEvents();
    renderLensList();
    renderCategoryFilter();
    setAppStatus("Loading source-backed city atlas...");
    try {
      await loadIndex();
      await loadCity(initialCityId());
      document.querySelector(".atlas-app")?.setAttribute("data-loaded", "true");
      setAppStatus("");
      exposeTestApi();
    } catch (error) {
      renderError(error);
    }
  }

  function collectElements() {
    for (const id of [
      "eventSearch", "citySelect", "categoryFilter", "lensList", "projectCount", "changeCount",
      "yearCount", "coverageNote", "eventList", "selectedProject", "selectedTitle", "selectedYear",
      "selectedMeta", "selectedSummary", "selectedScan", "viewDetailsButton", "timelineTrack", "timelineLabels",
      "yearSlider", "currentYear", "playButton", "todayButton", "viewAllButton", "compareButton",
      "shareButton", "proposalButton", "insightsButton", "detailsDialog", "detailsTitle",
      "detailsFacts", "detailsObserved", "detailsConfidence", "detailsLimitations", "detailsSources",
      "placeScan", "nearbyContext", "nearbyContextNote", "detailsReviewerNotes", "copyBriefButton",
      "closeDialogButton", "toast", "cityMap", "mapStage", "mapAttribution", "zoomInButton",
      "zoomOutButton", "recenterButton", "view3dButton", "filterButton", "confidenceFilter",
      "showInferredToggle", "searchResults", "appStatus", "comparePanel", "compareStats",
      "compareNote", "compareBeforeMapLabel", "compareAfterMapLabel", "beforeYearSelect",
      "afterYearSelect", "closeCompareButton", "proposalDialog", "proposalForm", "proposalName",
      "proposalCategory", "proposalScale", "proposalRadius", "proposalStartYear", "proposalSiteBasis",
      "proposalDescription", "proposalOutput", "runProposalButton", "closeProposalButton",
    ]) {
      els[id] = document.getElementById(id);
    }
  }

  function wireEvents() {
    els.eventSearch?.addEventListener("input", () => {
      state.search = els.eventSearch.value.trim().toLowerCase();
      resetEventListRenderLimit();
      syncStateModel();
      renderOverview();
      renderEventList();
      renderTimeline();
      renderSearchResults();
      selectFirstVisibleIfNeeded();
      renderMapMarkers();
      maybeLoadAllEventsForSearch(state.search);
    });
    els.eventSearch?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const first = searchCandidates(state.search)[0];
        if (first) {
          event.preventDefault();
          selectSearchCandidate(first);
        }
      }
      if (event.key === "Escape") hideSearchResults();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "/" && document.activeElement !== els.eventSearch) {
        event.preventDefault();
        els.eventSearch?.focus();
      }
      if (event.key === "Escape" && els.detailsDialog?.open) closeDetails();
      if (event.key === "Escape" && els.proposalDialog?.open) closeProposal();
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".global-search")) hideSearchResults();
    });
    els.citySelect?.addEventListener("change", () => loadCity(els.citySelect.value));
    els.categoryFilter?.addEventListener("change", () => setCategory(els.categoryFilter.value));
    els.confidenceFilter?.addEventListener("change", () => setConfidenceFilter(els.confidenceFilter.value));
    els.showInferredToggle?.addEventListener("change", () => {
      state.showInferred = Boolean(els.showInferredToggle.checked);
      resetEventListRenderLimit();
      syncStateModel();
      renderAll();
      selectFirstVisibleIfNeeded();
      renderMapMarkers();
      updateLensOverlayFilters();
    });
    els.searchResults?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-search-index]");
      const candidate = searchCandidates(state.search)[Number(button?.dataset.searchIndex)];
      if (candidate) selectSearchCandidate(candidate);
    });
    els.lensList?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-lens]");
      if (button) setCategory(button.dataset.lens || "all");
    });
    els.eventList?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-event-id]");
      if (button) selectEvent(button.dataset.eventId, { openDetails: true });
    });
    els.eventList?.addEventListener("scroll", maybeExpandEventList);
    els.yearSlider?.addEventListener("input", () => setYear(Number(els.yearSlider.value)));
    els.todayButton?.addEventListener("click", () => setYear(latestYear()));
    els.playButton?.addEventListener("click", togglePlay);
    els.viewAllButton?.addEventListener("click", loadAllEventsForChangelog);
    els.viewDetailsButton?.addEventListener("click", openDetails);
    els.closeDialogButton?.addEventListener("click", closeDetails);
    els.copyBriefButton?.addEventListener("click", copyBrief);
    els.nearbyContext?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-nearby-event-id]");
      if (button) selectEvent(button.dataset.nearbyEventId, { openDetails: true });
    });
    els.compareButton?.addEventListener("click", toggleCompare);
    els.shareButton?.addEventListener("click", shareView);
    els.proposalButton?.addEventListener("click", openProposal);
    els.insightsButton?.addEventListener("click", openDetails);
    els.filterButton?.addEventListener("click", () => {
      els.categoryFilter?.focus();
    });
    document.querySelector(".panel-arrow")?.addEventListener("click", toggleLensPanel);
    document.querySelector(".overview-toggle")?.addEventListener("click", toggleOverview);
    document.querySelector(".top-nav .nav-item.active")?.addEventListener("click", () => {
      recenterMap();
    });
    els.zoomInButton?.addEventListener("click", () => state.map?.zoomIn({ duration: 220 }));
    els.zoomOutButton?.addEventListener("click", () => state.map?.zoomOut({ duration: 220 }));
    els.recenterButton?.addEventListener("click", () => recenterMap());
    els.view3dButton?.addEventListener("click", toggle3d);
    els.beforeYearSelect?.addEventListener("change", () => setCompareYears(Number(els.beforeYearSelect.value), state.compareAfterYear));
    els.afterYearSelect?.addEventListener("change", () => setCompareYears(state.compareBeforeYear, Number(els.afterYearSelect.value)));
    els.closeCompareButton?.addEventListener("click", closeCompare);
    els.closeProposalButton?.addEventListener("click", closeProposal);
    els.runProposalButton?.addEventListener("click", runProposal);
    els.proposalForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      runProposal();
    });
    els.proposalOutput?.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-proposal-event-id]");
      if (!button) return;
      const year = Number(button.dataset.proposalYear);
      if (Number.isFinite(year) && !state.loadedEvents.has(year)) {
        try {
          await loadYear(year);
        } catch (error) {
          toast(`Analogue evidence year could not load: ${error.message}`);
          return;
        }
      }
      closeProposal();
      selectEvent(button.dataset.proposalEventId, { openDetails: true });
    });
  }

  async function loadIndex() {
    state.index = await fetchJson("/data/city-atlas/index.json");
    renderCitySelect();
  }

  function initialCityId() {
    const params = new URL(window.location.href).searchParams;
    const requested = params.get("city");
    if (requested && cityMeta(requested)) return requested;
    return cityMeta(DEFAULT_CITY) ? DEFAULT_CITY : state.index?.default_city_id || state.index?.cities?.[0]?.city_id || DEFAULT_CITY;
  }

  async function loadCity(cityId) {
    stopPlay();
    state.cityId = cityId;
    state.cityMeta = cityMeta(cityId);
    if (!state.cityMeta) throw new Error(`City not found: ${cityId}`);

    const paths = state.cityMeta.artifact_paths || {};
    const [city, eventsIndex, sources] = await Promise.all([
      fetchJson(dataPathToUrl(paths.city)),
      fetchJson(dataPathToUrl(paths.events)),
      fetchJson(dataPathToUrl(paths.sources)),
    ]);

    state.city = city;
    state.eventsIndex = eventsIndex;
    state.sources = sources.sources || [];
    state.sourceById = new Map(state.sources.map((source) => [source.source_id, source]));
    state.years = (eventsIndex.event_years || eventsIndex.chunks?.map((chunk) => chunk.year) || [])
      .map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    state.year = state.years.includes(DEFAULT_YEAR) ? DEFAULT_YEAR : latestYear();
    state.category = "all";
    state.confidenceFilter = "all";
    state.showInferred = true;
    state.search = "";
    state.loadedEvents.clear();
    state.loadingYears.clear();
    state.loadedEventList = [];
    state.eventById.clear();
    state.selectedEventId = null;
    state.selectedEvent = null;
    state.allEventsLoaded = false;
    state.loadingAll = false;
    resetEventListRenderLimit();
    disconnectEventListObserver();
    state.compareBeforeYear = compareDefaultBeforeYear();
    state.compareAfterYear = state.year;
    state.basemapYear = null;
    state.basemapError = null;
    state.detailLayerLoaded = false;
    state.detailLayerError = null;
    state.lensOverlayLoaded = false;
    state.lensOverlayError = null;
    state.lensOverlayPathLoaded = null;
    state.transportRoadBasePathLoaded = null;
    state.transportRoadYearPathLoaded = null;
    state.transportRoadYearLoaded = null;
    state.proposalResult = null;
    syncStateModel();

    if (els.eventSearch) els.eventSearch.value = "";
    if (els.citySelect) els.citySelect.value = cityId;
    if (els.categoryFilter) els.categoryFilter.value = "all";
    if (els.confidenceFilter) els.confidenceFilter.value = "all";
    if (els.showInferredToggle) els.showInferredToggle.checked = true;

    renderOverview();
    renderCoverageNote();
    renderLensList();
    renderLayerControls();
    renderTimeline();
    syncYearControl();
    renderCompareYearOptions();
    renderCoverageNote();
    await loadYear(state.year);
    initOrUpdateMap();
    updateMapBasemapForYear(state.year, { force: true });
    updateTimeDependentMapState();
    selectInitialEvent();
    renderAll();
    renderMapMarkers();
    if (state.compareActive) updateComparePanel();
  }

  function initOrUpdateMap() {
    if (!els.cityMap || !window.maplibregl) return;
    const center = mapCenter();
    const zoom = Number(state.city?.default_zoom || 11.5);

    if (state.map) {
      state.map.jumpTo({ center, zoom, pitch: mapPitch(), bearing: mapBearing() });
      window.setTimeout(() => state.map.resize(), 60);
      updateMapBasemapForYear(state.year, { force: true });
      ensureDetailLayers();
      ensureLensOverlays();
      return;
    }

    state.basemapYear = state.year;

    state.map = new window.maplibregl.Map({
      container: els.cityMap,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: "raster",
            tiles: basemapTiles(),
            tileSize: 256,
            attribution: basemapAttributionText(),
          },
        },
        layers: [{ id: "basemap", type: "raster", source: "basemap", paint: { "raster-fade-duration": 180 } }],
      },
      center,
      zoom,
      minZoom: 3,
      maxZoom: 18,
      pitch: mapPitch(),
      bearing: mapBearing(),
      attributionControl: false,
      dragRotate: true,
      pitchWithRotate: true,
    });

    const handleMapReady = () => {
      if (state.mapReady) return;
      state.mapReady = true;
      state.map.resize();
      updateMapBasemapForYear(state.year, { force: true });
      ensureDetailLayers();
      ensureLensOverlays();
      renderMapMarkers();
      if (state.compareActive) updateComparePanel();
    };
    state.map.on("load", handleMapReady);
    state.map.once("idle", handleMapReady);
    // Suppress every-map-click toasts — markers and changelog items are clearly clickable, and
    // a repeated guidance toast becomes noise.
    // MapLibre v5 needs a render to be forced before `load`/`idle` fire reliably in some
    // browsers (notably when the basemap raster source resolves synchronously). A single
    // triggerRepaint kicks the render loop so the readiness handler fires on first mount.
    try { state.map.triggerRepaint(); } catch (_error) { /* MapLibre not yet attached */ }
  }

  function renderCitySelect() {
    if (!els.citySelect || !state.index) return;
    els.citySelect.innerHTML = (state.index.cities || [])
      .map((city) => `<option value="${escapeAttr(city.city_id)}">${escapeHtml(shortCityName(city.display_name))}</option>`)
      .join("");
  }

  function renderCategoryFilter() {
    if (!els.categoryFilter) return;
    els.categoryFilter.innerHTML = CATEGORY_CONFIG
      .filter((category) => category.id !== "utilities")
      .map((category) => `<option value="${escapeAttr(category.id)}">${escapeHtml(category.label)}</option>`)
      .join("");
  }

  function renderLensList() {
    if (!els.lensList) return;
    const lenses = CATEGORY_CONFIG.filter((category) => !["all", "utilities"].includes(category.id));
    els.lensList.innerHTML = lenses.map((lens) => `
      <button class="lens-row" type="button" data-lens="${escapeAttr(lens.id)}" aria-pressed="${state.category === lens.id}" style="--lens-color: ${escapeAttr(lens.color)}">
        <span class="lens-dot"><span class="pin-icon ${escapeAttr(lens.icon)}" aria-hidden="true"></span></span>
        <span class="lens-copy"><strong>${escapeHtml(lens.lensLabel)}</strong><span>${escapeHtml(lens.desc)}</span></span>
        <span class="eye-icon" aria-hidden="true"></span>
      </button>
    `).join("");
  }

  function renderLayerControls() {
    if (els.confidenceFilter) els.confidenceFilter.value = state.confidenceFilter;
    if (els.showInferredToggle) els.showInferredToggle.checked = state.showInferred;
  }

  function renderOverview() {
    const events = filteredEvents();
    const sourcedRecords = events.length;
    const majorCategories = new Set(["transport", "built_environment", "civic_services"]);
    const majorProjects = events.filter((event) => majorCategories.has(event.category)).length;
    setText(els.projectCount, compactNumber(Math.max(majorProjects, 0)));
    setText(els.changeCount, compactNumber(sourcedRecords));
    setText(els.yearCount, String(state.years.length || 0));
    state.visibleEventCount = sourcedRecords;
    state.visibleEventIds = events.map((event) => event.id);
    syncStateModel(events);
  }

  function renderCoverageNote() {
    const raw = state.city?.data_availability?.summary || "Coverage is partial and source-backed. Per-event evidence is in the details drawer.";
    // Keep the first sentence so the note doesn't end mid-word at a hard truncation.
    const firstSentence = raw.split(/(?<=[.!?])\s+/, 1)[0] || raw;
    setText(els.coverageNote, truncate(firstSentence, 220));
    updateMapAttribution();
  }

  async function loadYear(year) {
    const numericYear = Number(year);
    if (!Number.isFinite(numericYear)) return [];
    if (state.loadedEvents.has(numericYear)) return state.loadedEvents.get(numericYear);
    if (state.loadingYears.has(numericYear)) return state.loadingYears.get(numericYear);
    const chunk = chunkForYear(numericYear);
    if (!chunk?.json_path) {
      state.loadedEvents.set(numericYear, []);
      return [];
    }
    const promise = fetchJson(dataPathToUrl(chunk.json_path)).then((payload) => {
      const events = extractEvents(payload).map((event, index) => normalizeEvent(event, numericYear, index));
      state.loadedEvents.set(numericYear, events);
      indexLoadedEvents(events);
      return events;
    }).finally(() => {
      state.loadingYears.delete(numericYear);
    });
    state.loadingYears.set(numericYear, promise);
    return promise;
  }

  function indexLoadedEvents(events) {
    for (const event of events) {
      if (!event?.id || state.eventById.has(event.id)) continue;
      state.eventById.set(event.id, event);
      state.loadedEventList.push(event);
    }
  }

  async function loadAllEventsForChangelog() {
    if (state.loadingAll) return;
    state.loadingAll = true;
    setText(els.viewAllButton?.querySelector("span"), "Loading city changelog");
    try {
      await Promise.all(state.years.map((year) => loadYear(year)));
      state.allEventsLoaded = true;
      renderOverview();
      renderEventList({ limit: 24 });
      renderTimeline();
      selectFirstVisibleIfNeeded();
      renderMapMarkers();
      toast("Full city index loaded. Visible markers remain scoped to the selected year.");
    } finally {
      state.loadingAll = false;
      renderViewAllButton();
    }
  }

  async function maybeLoadAllEventsForSearch(query) {
    const text = String(query || "").trim();
    if (text.length < 3 || state.allEventsLoaded || state.loadingAll) return;
    const requestId = ++state.searchLoadRequestId;
    state.loadingAll = true;
    renderViewAllButton();
    setText(els.viewAllButton?.querySelector("span"), "Expanding search");
    try {
      await Promise.all(state.years.map((year) => loadYear(year)));
      if (requestId !== state.searchLoadRequestId || state.search !== text) return;
      state.allEventsLoaded = true;
      renderOverview();
      renderEventList({ limit: 24 });
      renderTimeline();
      renderSearchResults();
      selectFirstVisibleIfNeeded();
      renderMapMarkers();
      toast("Full city search loaded. Results stay scoped to the selected year.");
    } catch (error) {
      if (requestId === state.searchLoadRequestId) toast(`Full city search could not load: ${error.message}`);
    } finally {
      state.loadingAll = false;
      renderViewAllButton();
    }
  }

  function extractEvents(payload) {
    if (Array.isArray(payload?.events)) return payload.events;
    if (Array.isArray(payload?.features)) return payload.features;
    return [];
  }

  function normalizeEvent(raw, fallbackYear, index) {
    const properties = raw.properties || raw;
    const geometry = raw.geometry || properties.geometry || null;
    const sourceIds = properties.source_ids || properties.sources || [];
    const event = {
      id: String(properties.event_id || raw.id || properties.id || `${fallbackYear}-${index}`),
      title: cleanTitle(properties.title),
      year: Number(properties.year || fallbackYear),
      effectiveDate: properties.effective_date || "",
      effectiveRange: properties.effective_date_range || null,
      datePrecision: properties.date_precision || "",
      sourceDateField: properties.source_date_field || properties.provenance?.source_date_field || "",
      category: properties.category || properties.lens || "built_environment",
      lens: properties.lens || properties.category || "built_environment",
      confidence: properties.confidence || "documented",
      summary: cleanSummary(properties.explanation || properties.summary),
      area: properties.affected_area?.label || properties.affected_area_label || shortCityName(state.city?.display_name),
      sourceIds: Array.isArray(sourceIds) ? sourceIds.filter(Boolean) : [sourceIds].filter(Boolean),
      evidence: Array.isArray(properties.evidence) ? properties.evidence : [],
      signals: Array.isArray(properties.affected_signals) ? properties.affected_signals : [],
      caveats: Array.isArray(properties.caveats) ? properties.caveats : [],
      provenance: properties.provenance || {},
      geometry,
      raw: properties,
    };
    event.lngLat = eventLngLat(event);
    event.displayVerified = isDisplayVerified(event);
    return event;
  }

  function renderAll() {
    syncStateModel();
    renderLensList();
    renderLayerControls();
    renderOverview();
    renderEventList();
    renderSelected();
    renderTimeline();
    renderViewAllButton();
    renderComparePanel();
    syncStateModel();
  }

  function renderEventList(options = {}) {
    if (!els.eventList) return;
    const events = filteredEvents();
    state.visibleEventCount = events.length;
    state.visibleEventIds = events.map((event) => event.id);
    syncStateModel(events);
    const previousScrollTop = options.preserveScroll ? els.eventList.scrollTop : 0;
    const requestedLimit = Number(options.limit || state.eventListRenderLimit || MAX_PANEL_EVENTS);
    const selectedIndex = state.selectedEventId ? events.findIndex((event) => event.id === state.selectedEventId) : -1;
    const limit = Math.min(
      events.length,
      Math.max(MAX_PANEL_EVENTS, requestedLimit, selectedIndex >= 0 ? selectedIndex + 1 : 0)
    );
    state.eventListRenderLimit = limit || MAX_PANEL_EVENTS;
    const visible = events.slice(0, limit);
    state.eventListRenderedCount = visible.length;
    if (!visible.length) {
      els.eventList.innerHTML = `<div class="empty-state">No source-backed records with usable map geometry match the current lens and search.</div>`;
      disconnectEventListObserver();
      return;
    }
    const moreCount = Math.max(0, events.length - visible.length);
    const more = moreCount
      ? `<div class="event-list-more" data-event-list-more role="status">Showing ${visible.length} of ${events.length} records. Keep scrolling for ${moreCount} more.</div>`
      : "";
    els.eventList.innerHTML = `${visible.map((event) => renderEventCard(event)).join("")}${more}`;
    if (options.preserveScroll) els.eventList.scrollTop = previousScrollTop;
    observeEventListContinuation();
  }

  function maybeExpandEventList() {
    if (!els.eventList) return;
    const remaining = els.eventList.scrollHeight - els.eventList.scrollTop - els.eventList.clientHeight;
    if (remaining > EVENT_LIST_SCROLL_THRESHOLD) return;
    expandEventListPage();
  }

  function expandEventListPage() {
    const events = filteredEvents();
    const currentLimit = Number(state.eventListRenderLimit || MAX_PANEL_EVENTS);
    if (currentLimit >= events.length) return;
    state.eventListRenderLimit = Math.min(events.length, currentLimit + EVENT_LIST_BATCH_SIZE);
    renderEventList({ preserveScroll: true });
  }

  function observeEventListContinuation() {
    disconnectEventListObserver();
    const marker = els.eventList?.querySelector("[data-event-list-more]");
    if (!marker || !("IntersectionObserver" in window)) return;
    const root = eventListUsesOwnScroll() ? els.eventList : null;
    state.eventListObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) expandEventListPage();
    }, { root, rootMargin: `${EVENT_LIST_SCROLL_THRESHOLD}px` });
    state.eventListObserver.observe(marker);
  }

  function eventListUsesOwnScroll() {
    if (!els.eventList) return false;
    const style = window.getComputedStyle(els.eventList);
    return /(auto|scroll)/.test(style.overflowY) && els.eventList.scrollHeight > els.eventList.clientHeight + 4;
  }

  function disconnectEventListObserver() {
    if (!state.eventListObserver) return;
    state.eventListObserver.disconnect();
    state.eventListObserver = null;
  }

  function resetEventListRenderLimit() {
    state.eventListRenderLimit = MAX_PANEL_EVENTS;
    state.eventListRenderedCount = 0;
  }

  function renderEventCard(event) {
    const category = categoryConfig(event.category);
    const isSelected = event.id === state.selectedEventId;
    const source = primarySource(event);
    return `
      <button class="event-card" type="button" role="listitem" data-event-id="${escapeAttr(event.id)}" aria-selected="${isSelected}" style="--event-color: ${escapeAttr(category.color)}">
        <span class="event-thumb real-record-thumb" aria-hidden="true">
          <span class="pin-icon ${escapeAttr(category.icon)}"></span>
          <small>${escapeHtml(category.label)}</small>
        </span>
        <span class="event-copy">
          <span class="event-year">${escapeHtml(String(event.year))}</span>
          <strong>${escapeHtml(event.title)}</strong>
          <p>${escapeHtml(truncate(event.summary, 104))}</p>
          <span class="event-status">${escapeHtml(confidenceStatus(event))} - ${escapeHtml(source?.provider || source?.title || "Public source")}</span>
        </span>
        <span class="card-glyph"><span class="pin-icon ${escapeAttr(category.icon)}" aria-hidden="true"></span></span>
      </button>
    `;
  }

  function renderSelected() {
    const event = state.selectedEvent;
    if (!event) {
      setText(els.selectedTitle, "Select a change");
      setText(els.selectedYear, String(state.year || ""));
      setText(els.selectedMeta, "");
      setText(els.selectedSummary, "Choose a marker or changelog item to inspect the cited evidence.");
      renderSelectedScan(null);
      return;
    }
    const category = categoryConfig(event.category);
    document.documentElement.style.setProperty("--event-color", category.color);
    els.selectedProject?.style.setProperty("--event-color", category.color);
    setText(els.selectedTitle, event.title);
    setText(els.selectedYear, String(event.year));
    setText(els.selectedMeta, `${category.label.replace("All types", "Change")} - ${event.area}`);
    setText(els.selectedSummary, truncate(event.summary, 132));
    renderSelectedScan(event);
    renderDetails(event);
    updateMarkerState();
    refreshEventContext(event);
  }

  function renderTimeline() {
    if (!els.timelineTrack || !state.years.length) return;
    const min = earliestYear();
    const max = latestYear();
    const profile = timelineProfile();
    els.timelineTrack.innerHTML = state.years.map((year) => {
      const left = yearPosition(year, min, max);
      const count = profile.counts.get(year) || 0;
      const ratio = Math.sqrt(count / Math.max(profile.maxCount, 1));
      const size = Math.round(7 + (14 * ratio));
      const color = timelineYearColor(year, profile.categoryId);
      const className = [
        "timeline-event",
        count > 0 ? "has-card" : "is-empty",
        count >= profile.maxCount * 0.75 && count > 0 ? "is-peak" : "",
        year === state.year ? "active" : "",
      ].filter(Boolean).join(" ");
      const label = timelineYearLabel(year, count, profile);
      return `<button class="${className}" type="button" data-year="${year}" title="${escapeAttr(label)}" style="left: ${left}%; --dot-color: ${escapeAttr(color)}; --dot-size: ${size}px; --dot-opacity: ${count > 0 ? 0.72 + (0.28 * ratio) : 0.32}" aria-label="${escapeAttr(label)}"></button>`;
    }).join("");
    els.timelineTrack.querySelectorAll("[data-year]").forEach((button) => {
      button.addEventListener("click", () => setYear(Number(button.dataset.year)));
    });
    if (els.timelineLabels) {
      const labels = timelineLabelYears(min, max);
      els.timelineLabels.innerHTML = labels
        .map((year) => `<span style="left: ${yearPosition(year, min, max)}%">${year}</span>`)
        .join("");
    }
    els.timelineTrack.style.setProperty("--timeline-progress", `${yearPosition(state.year, min, max)}%`);
    syncYearControl();
  }

  function timelineProfile() {
    const categoryId = state.category === "all" ? "all" : state.category;
    const counts = new Map(state.years.map((year) => [year, timelineCountForYear(year, categoryId)]));
    return {
      categoryId,
      counts,
      maxCount: Math.max(1, ...counts.values()),
      confidenceFilter: state.confidenceFilter,
      showInferred: state.showInferred,
      search: state.search,
      exactSearch: Boolean(state.search && state.allEventsLoaded),
    };
  }

  function timelineCountForYear(year, categoryId) {
    const exact = exactTimelineEventsForYear(year, categoryId);
    if (state.search) return exact ? exact.length : 0;
    if (exact) return exact.length;

    const chunk = chunkForYear(year) || {};
    if (!chunk.event_count) return 0;

    const confidenceKeys = timelineConfidenceKeys();
    const needsConfidenceCount = state.confidenceFilter !== "all" || !state.showInferred;
    if (categoryId === "all" && !needsConfidenceCount) return Number(chunk.event_count || 0);
    if (categoryId !== "all" && !needsConfidenceCount) return Number(chunk.counts_by_category?.[categoryId] || 0);

    if (categoryId === "all") {
      return confidenceKeys.reduce((total, key) => total + Number(chunk.counts_by_confidence?.[key] || 0), 0);
    }

    const categoryConfidence = chunk.counts_by_category_confidence?.[categoryId] || {};
    return confidenceKeys.reduce((total, key) => total + Number(categoryConfidence[key] || 0), 0);
  }

  function exactTimelineEventsForYear(year, categoryId) {
    if (!state.search && state.confidenceFilter === "all" && state.showInferred) return null;
    if (!state.loadedEvents.has(year)) return null;
    const search = state.search;
    return (state.loadedEvents.get(year) || [])
      .filter((event) => event.displayVerified)
      .filter((event) => categoryId === "all" || event.category === categoryId)
      .filter((event) => confidenceMatches(event))
      .filter((event) => state.showInferred || event.confidence !== "inferred")
      .filter((event) => !search || eventSearchText(event).includes(search));
  }

  function timelineConfidenceKeys() {
    const allKeys = ["corroborated", "documented", "disputed", "inferred"];
    if (state.confidenceFilter === "documented") return ["corroborated", "documented"];
    if (state.confidenceFilter === "inferred") return ["inferred"];
    if (state.confidenceFilter === "disputed") return ["disputed"];
    return state.showInferred ? allKeys : allKeys.filter((key) => key !== "inferred");
  }

  function timelineYearColor(year, categoryId) {
    if (categoryId !== "all") return categoryConfig(categoryId).color;
    return dominantYearColor(year);
  }

  function timelineYearLabel(year, count, profile) {
    const categoryLabel = profile.categoryId === "all" ? "source-backed" : categoryConfig(profile.categoryId).label.toLowerCase();
    const confidenceText = profile.confidenceFilter === "all"
      ? profile.showInferred ? "" : ", excluding inferred"
      : `, ${profile.confidenceFilter} confidence`;
    const searchText = profile.search
      ? profile.exactSearch ? ` matching "${profile.search}"` : ` matching "${profile.search}" in loaded years`
      : "";
    return `${year}: ${compactNumber(count)} ${categoryLabel} record${count === 1 ? "" : "s"}${confidenceText}${searchText}`;
  }

  function timelineLabelYears(min, max) {
    if (max <= min) return [min];
    const labelCount = Math.min(6, Math.max(2, state.years.length));
    const labels = new Set();
    for (let index = 0; index < labelCount; index += 1) {
      const target = min + ((max - min) * (index / Math.max(1, labelCount - 1)));
      labels.add(clampToYears(target) || Math.round(target));
    }
    labels.add(state.year);
    return Array.from(labels).filter((year) => year >= min && year <= max).sort((a, b) => a - b);
  }

  function renderMapMarkers() {
    if (!state.map) return;
    // DOM markers can be attached as soon as the map container exists.
    // Style-dependent overlays (detail roads/buildings, lens heatmap) are only added once
    // the raster style has finished loading — `ensureDetailLayers`/`ensureLensOverlays`
    // check `state.mapReady` internally and no-op until then.
    ensureDetailLayers();
    updateDetailLayerFilters();
    ensureLensOverlays();
    updateLensOverlayFilters();
    const visibleEvents = filteredEvents();
    const mappableEvents = visibleEvents.filter((event) => event.lngLat);
    const markerEvents = mappableEvents.slice(0, MAX_MARKERS);
    const selectedMarkerEvent = state.selectedEventId
      ? mappableEvents.find((event) => event.id === state.selectedEventId)
      : null;
    if (selectedMarkerEvent && !markerEvents.some((event) => event.id === selectedMarkerEvent.id)) {
      markerEvents.push(selectedMarkerEvent);
    }
    const nextIds = new Set(markerEvents.map((event) => event.id));

    for (const [id, marker] of state.markers) {
      if (!nextIds.has(id)) {
        marker.remove();
        state.markers.delete(id);
      }
    }

    for (const event of markerEvents) {
      if (state.markers.has(event.id)) continue;
      const category = categoryConfig(event.category);
      const element = document.createElement("button");
      element.type = "button";
      element.className = "map-marker";
      element.dataset.eventId = event.id;
      element.style.setProperty("--marker-color", category.color);
      element.setAttribute("aria-label", `${event.year}: ${event.title}`);
      element.innerHTML = `<span class="pin-icon ${category.icon}" aria-hidden="true"></span>`;
      element.addEventListener("click", (clickEvent) => {
        clickEvent.stopPropagation();
        selectEvent(event.id, { openDetails: true });
      });
      const marker = new window.maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat(event.lngLat)
        .addTo(state.map);
      state.markers.set(event.id, marker);
    }
    state.visibleMarkerCount = markerEvents.length;
    state.visibleMarkerIds = markerEvents.map((event) => event.id);
    state.visibleEventCount = visibleEvents.length;
    state.visibleEventIds = visibleEvents.map((event) => event.id);
    syncStateModel();
    updateMarkerState();
  }

  function updateMarkerState() {
    document.querySelectorAll(".map-marker").forEach((marker) => {
      marker.classList.toggle("active", marker.dataset.eventId === state.selectedEventId);
    });
  }

  function renderViewAllButton() {
    if (!els.viewAllButton) return;
    const span = els.viewAllButton.querySelector("span");
    if (span) span.textContent = state.allEventsLoaded ? "City index loaded" : "View all changes";
    els.viewAllButton.disabled = state.loadingAll;
  }

  function renderDetails(event) {
    if (!event) return;
    const context = buildEventContext(event);
    const rows = sourceRows(event, context.sources);
    setText(els.detailsTitle, event.title);
    renderDetailsFacts(event, context);
    setText(els.detailsObserved, `${event.summary} Effective date/range: ${formatEventDate(event)} (${event.datePrecision || "date precision not stated"}). Marker coordinates come from the event geometry in the atlas record.`);
    setText(els.detailsConfidence, `${confidenceStatus(event)}. ${confidenceExplanation(event)} Source coverage: ${context.sources.length} registry source${context.sources.length === 1 ? "" : "s"}, ${event.evidence.length} event evidence row${event.evidence.length === 1 ? "" : "s"}.`);
    renderPlaceScan(event, context);
    renderNearbyContext(event, context);
    if (els.detailsLimitations) {
      const caveats = [
        "This record documents an observed or administrative change; causation is not claimed.",
        /osm/i.test(event.id) || event.confidence === "inferred"
          ? "OSM edit dates are mapped-visibility dates, not real-world construction or opening dates."
          : "Public source pages can change; cite retrieval dates in formal reuse.",
        "Coverage is partial and only records with source ids plus usable geometry are shown as map markers.",
        ...event.caveats,
      ];
      els.detailsLimitations.innerHTML = uniqueStrings(caveats).slice(0, 7).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    }
    renderReviewerNotes(event, context);
    if (els.detailsSources) {
      els.detailsSources.innerHTML = rows.length
        ? rows.join("")
        : `<article class="source-row"><span>Source id was present in the event but not found in the city source registry.</span></article>`;
    }
  }

  function renderDetailsFacts(event, context) {
    if (!els.detailsFacts) return;
    const category = categoryConfig(event.category);
    const facts = [
      ["City", shortCityName(state.city?.display_name || state.cityMeta?.display_name || state.cityId)],
      ["Date/range", `${formatEventDate(event)} (${event.datePrecision || "precision not stated"})`],
      ["Category/layer", `${category.label} / ${event.lens || event.category}`],
      ["Area", event.area || "Area not stated"],
      ["Primary source", primarySourceLabel(event, context.sources)],
      ["Method", methodText(event)],
    ];
    els.detailsFacts.innerHTML = facts.map(([label, value]) => `
      <div>
        <dt>${escapeHtml(label)}</dt>
        <dd>${escapeHtml(value)}</dd>
      </div>
    `).join("");
  }

  function renderSelectedScan(event) {
    if (!els.selectedScan) return;
    if (!event) {
      els.selectedScan.innerHTML = "";
      return;
    }
    const sourceCount = event.sourceIds.length;
    const dateLabel = formatEventDate(event);
    const datePrecision = event.datePrecision ? event.datePrecision.replace(/_/g, " ") : "precision not stated";
    const source = primarySource(event);
    const sourceLabel = source?.provider || source?.title || (event.sourceIds[0] || "Source");
    els.selectedScan.innerHTML = [
      scanPill("Evidence", confidenceStatus(event), `${sourceCount} source${sourceCount === 1 ? "" : "s"}`),
      scanPill("Date", dateLabel, datePrecision),
      scanPill("Source", sourceLabel, source?.source_family || "Public record"),
    ].join("");
  }

  function scanPill(label, value, detail) {
    return `<span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(value)} - ${escapeHtml(truncate(detail, 42))}</small></span>`;
  }

  async function refreshEventContext(event) {
    if (!event) return;
    const requestId = ++state.contextRequestId;
    if (els.nearbyContextNote && state.selectedEventId === event.id) {
      els.nearbyContextNote.textContent = `Checking source-backed records within ${CONTEXT_RADIUS_KM} km and +/-${CONTEXT_YEAR_WINDOW} years.`;
    }
    try {
      await loadContextForEvent(event);
    } catch (error) {
      if (requestId === state.contextRequestId && state.selectedEventId === event.id && els.nearbyContextNote) {
        els.nearbyContextNote.textContent = `Nearby context could not be loaded: ${error.message}`;
      }
      return;
    }
    if (requestId !== state.contextRequestId || state.selectedEventId !== event.id) return;
    renderSelectedScan(event);
    if (els.detailsDialog?.open) renderDetails(event);
  }

  async function loadContextForEvent(event) {
    const years = contextYears(event.year);
    await Promise.all(years.map((year) => loadYear(year)));
  }

  function contextYears(year) {
    const numericYear = Number(year);
    return state.years.filter((item) => Math.abs(item - numericYear) <= CONTEXT_YEAR_WINDOW);
  }

  function buildEventContext(event) {
    const sources = event.sourceIds.map((id) => state.sourceById.get(id)).filter(Boolean);
    const nearby = nearbyEvents(event);
    const counts = nearby.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    return {
      sources,
      nearby,
      counts,
      mobilityNearby: nearby.filter((item) => item.category === "transport" || item.signals.includes("mobility")).length,
      builtNearby: nearby.filter((item) => item.category === "built_environment").length,
      civicNearby: nearby.filter((item) => item.category === "civic_services").length,
      utilityNearby: nearby.filter((item) => item.category === "utilities").length,
      environmentNearby: nearby.filter((item) => item.category === "environment").length,
      loadedYears: contextYears(event.year).filter((year) => state.loadedEvents.has(year)),
    };
  }

  function nearbyEvents(event) {
    if (!event?.lngLat) return [];
    return allLoadedEvents()
      .filter((item) => item.id !== event.id && item.displayVerified && item.lngLat)
      .map((item) => ({ ...item, distanceKm: distanceKm(event.lngLat, item.lngLat) }))
      .filter((item) => item.distanceKm <= CONTEXT_RADIUS_KM && Math.abs(item.year - event.year) <= CONTEXT_YEAR_WINDOW)
      .sort((a, b) => a.distanceKm - b.distanceKm || Math.abs(a.year - event.year) - Math.abs(b.year - event.year))
      .slice(0, MAX_NEARBY_CONTEXT);
  }

  function renderPlaceScan(event, context) {
    if (!els.placeScan) return;
    const cards = [
      {
        label: "Appearance",
        status: appearanceStatus(event),
        body: appearanceBody(event, context),
      },
      {
        label: "Traffic and movement",
        status: mobilityStatus(event, context),
        body: mobilityBody(event, context),
      },
      {
        label: "More place context",
        status: context.nearby.length ? `${context.nearby.length} nearby records` : "No nearby records loaded",
        body: `Nearby source-backed records in the same period: ${categoryCountText(context.counts)}. These are associated context only.`,
      },
      {
        label: "Evidence quality",
        status: confidenceStatus(event),
        body: `${sourceFamilyText(context.sources)} Date basis: ${event.sourceDateField || event.provenance.source_date_field || "not stated"}.`,
      },
    ];
    els.placeScan.innerHTML = cards.map((card) => `
      <article class="scan-card">
        <strong>${escapeHtml(card.label)}</strong>
        <span>${escapeHtml(card.status)}</span>
        <p>${escapeHtml(card.body)}</p>
      </article>
    `).join("");
  }

  function renderNearbyContext(event, context) {
    if (els.nearbyContextNote) {
      els.nearbyContextNote.textContent = context.nearby.length
        ? `Showing source-backed records within ${CONTEXT_RADIUS_KM} km and +/-${CONTEXT_YEAR_WINDOW} years. These are context and do not establish causation.`
        : `No source-backed nearby records are loaded within ${CONTEXT_RADIUS_KM} km and +/-${CONTEXT_YEAR_WINDOW} years.`;
    }
    if (!els.nearbyContext) return;
    els.nearbyContext.innerHTML = context.nearby.length
      ? context.nearby.map((item) => {
        const category = categoryConfig(item.category);
        return `
          <button class="nearby-row" type="button" data-nearby-event-id="${escapeAttr(item.id)}" style="--event-color: ${escapeAttr(category.color)}">
            <span>${escapeHtml(String(item.year))}</span>
            <strong>${escapeHtml(truncate(item.title, 74))}</strong>
            <small>${escapeHtml(category.label)} - ${escapeHtml(item.distanceKm.toFixed(2))} km</small>
          </button>
        `;
      }).join("")
      : `<div class="nearby-empty">Load more years or choose another record to inspect nearby source-backed context.</div>`;
  }

  function renderReviewerNotes(event, context) {
    if (!els.detailsReviewerNotes) return;
    const notes = [
      `Geometry: ${event.geometry?.type || "unknown"} coordinates are used for map placement; geometry precision is not a measured outcome boundary.`,
      event.provenance?.source_retrieved_at
        ? `Source retrieved: ${event.provenance.source_retrieved_at}.`
        : "Source retrieval date is not present on this event; cite publisher pages before formal reuse.",
      event.provenance?.transform ? `Transform: ${event.provenance.transform}.` : "Transform script is not stated on this event.",
      context.sources.some((source) => /usable_with_caveats|risky/i.test(source.reliability || ""))
        ? "At least one source is usable with caveats; review licence and coverage before reuse."
        : "Source registry rows are available for review.",
    ];
    els.detailsReviewerNotes.innerHTML = notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
  }

  function sourceRows(event, sources) {
    const evidenceRows = event.evidence.map((item) => {
      const href = item.url || "";
      const pathText = item.file_path ? ` file: ${item.file_path}` : "";
      const label = item.label || item.source_id || "Event evidence row";
      return `
        <article class="source-row evidence-row" data-source-link-state="${href ? "linked" : "unlinked"}">
          ${linkedSourceLabel(label, href)}
          <span>${escapeHtml(item.kind || "source_record")} - record ${escapeHtml(item.record_id || "not stated")}${escapeHtml(pathText)}</span>
        </article>
      `;
    });
    const registryRows = sources.map((source) => {
      const href = source.url || source.licence_url || "";
      const label = source.title || source.source_id;
      return `
        <article class="source-row" data-source-link-state="${href ? "linked" : "unlinked"}">
          ${linkedSourceLabel(label, href)}
          <span>${escapeHtml(source.provider || "Public source")} - ${escapeHtml(source.licence || "Licence requires review")}</span>
          <small>${escapeHtml(truncate(source.attribution_text || source.provenance_notes || "No attribution note in registry.", 170))}</small>
        </article>
      `;
    });
    return [...evidenceRows, ...registryRows];
  }

  function linkedSourceLabel(label, href) {
    return href
      ? `<a href="${escapeAttr(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`
      : `<span class="source-label">${escapeHtml(label)}</span>`;
  }

  function renderSearchResults() {
    if (!els.searchResults || !els.eventSearch) return;
    const query = state.search;
    if (query.length < 2) {
      hideSearchResults();
      return;
    }
    const candidates = searchCandidates(query).slice(0, 6);
    if (!candidates.length) {
      els.searchResults.innerHTML = `<div class="search-empty">No loaded area or event match.</div>`;
      els.searchResults.hidden = false;
      els.eventSearch.setAttribute("aria-expanded", "true");
      return;
    }
    els.searchResults.innerHTML = candidates.map((candidate, index) => `
      <button type="button" role="option" data-search-index="${index}">
        <span>${escapeHtml(candidate.kind === "event" ? String(candidate.year) : "Area")}</span>
        <strong>${escapeHtml(candidate.label)}</strong>
        <small>${escapeHtml(candidate.detail)}</small>
      </button>
    `).join("");
    els.searchResults.hidden = false;
    els.eventSearch.setAttribute("aria-expanded", "true");
  }

  function hideSearchResults() {
    if (els.searchResults) els.searchResults.hidden = true;
    els.eventSearch?.setAttribute("aria-expanded", "false");
  }

  function searchCandidates(query) {
    const q = String(query || "").trim().toLowerCase();
    if (q.length < 2) return [];
    const candidates = [];
    for (const area of CITY_AREA_HINTS[state.cityId] || []) {
      const haystack = `${area.label} ${area.terms || ""}`.toLowerCase();
      if (haystack.includes(q)) {
        candidates.push({
          kind: "area",
          label: area.label,
          detail: `${shortCityName(state.city?.display_name)} area`,
          lngLat: area.lngLat,
          zoom: area.zoom || 13.5,
          score: 120,
        });
      }
    }

    const areaGroups = new Map();
    for (const event of allLoadedEvents().filter((item) => item.displayVerified && item.lngLat)) {
      const label = String(event.area || "").trim();
      if (!label || !label.toLowerCase().includes(q)) continue;
      const key = label.toLowerCase();
      if (!areaGroups.has(key)) areaGroups.set(key, { label, events: [], lng: 0, lat: 0 });
      const group = areaGroups.get(key);
      group.events.push(event);
      group.lng += event.lngLat[0];
      group.lat += event.lngLat[1];
    }
    for (const group of areaGroups.values()) {
      const count = group.events.length;
      candidates.push({
        kind: "area",
        label: group.label,
        detail: `${count} loaded source-backed record${count === 1 ? "" : "s"}`,
        lngLat: [group.lng / count, group.lat / count],
        zoom: 13.7,
        score: 100 + Math.min(count, 20),
      });
    }

    for (const event of allLoadedEvents().filter((item) => item.displayVerified)) {
      if (!eventSearchText(event).includes(q)) continue;
      candidates.push({
        kind: "event",
        label: event.title,
        detail: `${categoryConfig(event.category).label} - ${event.area}`,
        eventId: event.id,
        year: event.year,
        lngLat: event.lngLat,
        score: scoreEvent(event) + (event.title.toLowerCase().includes(q) ? 40 : 0),
      });
    }
    const seen = new Set();
    return candidates
      .sort((a, b) => b.score - a.score || String(a.label).localeCompare(String(b.label)))
      .filter((candidate) => {
        const key = `${candidate.kind}:${candidate.label}:${candidate.eventId || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  function selectSearchCandidate(candidate) {
    if (!candidate) return;
    if (els.eventSearch) {
      els.eventSearch.value = candidate.label;
      state.search = candidate.label.toLowerCase();
    }
    hideSearchResults();
    renderEventList();
    if (candidate.kind === "event" && candidate.eventId) {
      selectEvent(candidate.eventId, { openDetails: true });
      return;
    }
    if (candidate.lngLat && state.map) {
      state.map.easeTo({ center: candidate.lngLat, zoom: candidate.zoom || 13.5, pitch: mapPitch(), bearing: mapBearing(), duration: 520 });
      toast(`Area search: ${candidate.label}`);
    }
    selectFirstVisibleIfNeeded();
    renderMapMarkers();
  }

  function setYear(year) {
    const nextYear = clampToYears(year);
    if (!nextYear) return Promise.resolve();
    const requestId = ++state.yearRequestId;
    state.year = nextYear;
    resetEventListRenderLimit();
    if (state.compareActive) state.compareAfterYear = nextYear;
    syncStateModel();
    syncYearControl();
    renderTimeline();
    updateMapBasemapForYear(nextYear);
    updateTimeDependentMapState();
    return loadYear(nextYear).then(() => {
      if (requestId !== state.yearRequestId || state.year !== nextYear) return;
      selectInitialEvent({ keepYear: true });
      renderAll();
      renderMapMarkers();
      if (state.compareActive) updateComparePanel();
      syncStateModel();
    });
  }

  function syncYearControl() {
    const min = earliestYear();
    const max = latestYear();
    if (els.yearSlider) {
      els.yearSlider.min = String(min);
      els.yearSlider.max = String(max);
      els.yearSlider.value = String(state.year);
    }
    setText(els.currentYear, String(state.year));
  }

  function setCategory(categoryId) {
    state.category = categoryConfig(categoryId).id;
    if (els.categoryFilter) els.categoryFilter.value = state.category === "utilities" ? "all" : state.category;
    resetEventListRenderLimit();
    syncStateModel();
    renderLensList();
    renderOverview();
    renderEventList();
    renderTimeline();
    updateLensOverlayFilters();
    selectFirstVisibleIfNeeded();
    renderMapMarkers();
  }

  function setConfidenceFilter(value) {
    state.confidenceFilter = ["all", "documented", "inferred", "disputed"].includes(value) ? value : "all";
    resetEventListRenderLimit();
    syncStateModel();
    renderLayerControls();
    renderOverview();
    renderEventList();
    renderTimeline();
    updateLensOverlayFilters();
    selectFirstVisibleIfNeeded();
    renderMapMarkers();
  }

  function selectInitialEvent(options = {}) {
    const candidates = filteredEvents();
    const sameYearEvent = candidates.find((event) => event.year === state.year);
    const best = sameYearEvent || (options.keepYear ? null : candidates[0] || displayEvents()[0] || null);
    if (best) {
      selectEvent(best.id, { quiet: true, keepCamera: true });
      return;
    }
    if (options.keepYear) {
      state.selectedEventId = null;
      state.selectedEvent = null;
      renderSelected();
      renderEventList();
    }
  }

  function selectFirstVisibleIfNeeded() {
    const events = filteredEvents();
    if (!events.length) {
      state.selectedEventId = null;
      state.selectedEvent = null;
      renderSelected();
      return;
    }
    if (!events.some((event) => event.id === state.selectedEventId)) selectEvent(events[0].id);
    else renderEventList();
  }

  function selectEvent(eventId, options = {}) {
    const event = state.eventById.get(eventId) || allLoadedEvents().find((item) => item.id === eventId);
    if (!event) return;
    const yearChanged = state.year !== event.year;
    state.selectedEventId = event.id;
    state.selectedEvent = event;
    state.yearRequestId += 1;
    state.year = event.year;
    if (state.compareActive) state.compareAfterYear = event.year;
    syncStateModel();
    syncYearControl();
    updateMapBasemapForYear(event.year);
    if (yearChanged) updateTimeDependentMapState();
    if (!state.loadedEvents.has(event.year)) loadYear(event.year).catch((error) => toast(`Event year could not load: ${error.message}`));
    renderOverview();
    renderEventList();
    renderSelected();
    renderTimeline();
    renderMapMarkers();
    updateMarkerState();
    if (event.lngLat && state.map && !options.keepCamera) {
      focusMapOnEvent(event, { duration: options.cameraDuration || 560 });
    }
    if (!options.quiet) toast(`${event.year}: ${event.title}`);
    if (options.openDetails) openDetails();
  }

  function focusMapOnEvent(event, options = {}) {
    if (!event?.lngLat || !state.map) return;
    const padding = eventFocusPadding();
    const bounds = eventGeometryBounds(event);
    const duration = Number(options.duration || 560);

    if (bounds && !isPointBounds(bounds)) {
      state.map.fitBounds(
        [[bounds.west, bounds.south], [bounds.east, bounds.north]],
        {
          padding,
          maxZoom: 15.2,
          duration,
        }
      );
      return;
    }

    state.map.easeTo({
      center: event.lngLat,
      zoom: eventPointFocusZoom(),
      padding,
      pitch: mapPitch(),
      bearing: mapBearing(),
      duration,
    });
  }

  function eventPointFocusZoom() {
    const currentZoom = Number(state.map?.getZoom?.() || 0);
    if (!Number.isFinite(currentZoom) || currentZoom < 14.2) return 14.2;
    return Math.min(currentZoom, 15.6);
  }

  function eventFocusPadding() {
    const width = Math.max(0, window.innerWidth || 0);
    const height = Math.max(0, window.innerHeight || 0);
    if (width <= 980) {
      return normalizePadding({
        top: 90,
        right: 28,
        bottom: Math.max(120, Math.min(190, height * 0.24)),
        left: 28,
      }, width, height);
    }

    const changePanelWidth = document.querySelector(".change-panel")?.getBoundingClientRect().width || 342;
    const lensPanelWidth = document.querySelector(".lens-panel")?.getBoundingClientRect().width || 286;
    const timelineHeight = document.querySelector(".timeline-dock")?.getBoundingClientRect().height || 78;

    return normalizePadding({
      top: 108,
      right: Math.max(84, changePanelWidth + 48),
      bottom: Math.max(150, timelineHeight + 112),
      left: Math.max(84, lensPanelWidth + 48),
    }, width, height);
  }

  function normalizePadding(padding, width, height) {
    const result = {
      top: Math.max(0, Number(padding.top) || 0),
      right: Math.max(0, Number(padding.right) || 0),
      bottom: Math.max(0, Number(padding.bottom) || 0),
      left: Math.max(0, Number(padding.left) || 0),
    };
    const maxHorizontal = Math.max(80, width - 160);
    const horizontal = result.left + result.right;
    if (horizontal > maxHorizontal) {
      const scale = maxHorizontal / horizontal;
      result.left *= scale;
      result.right *= scale;
    }
    const maxVertical = Math.max(80, height - 160);
    const vertical = result.top + result.bottom;
    if (vertical > maxVertical) {
      const scale = maxVertical / vertical;
      result.top *= scale;
      result.bottom *= scale;
    }
    return {
      top: Math.round(result.top),
      right: Math.round(result.right),
      bottom: Math.round(result.bottom),
      left: Math.round(result.left),
    };
  }

  function eventGeometryBounds(event) {
    const pairs = [];
    collectCoordinatePairs(event.geometry?.coordinates, pairs);
    if (!pairs.length && event.lngLat) pairs.push(event.lngLat);

    let west = Infinity;
    let south = Infinity;
    let east = -Infinity;
    let north = -Infinity;
    for (const pair of pairs) {
      const lng = Number(pair?.[0]);
      const lat = Number(pair?.[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) continue;
      west = Math.min(west, lng);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      north = Math.max(north, lat);
    }

    if (![west, south, east, north].every(Number.isFinite)) return null;
    return { west, south, east, north };
  }

  function collectCoordinatePairs(value, pairs) {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]))) {
      pairs.push([Number(value[0]), Number(value[1])]);
      return;
    }
    value.forEach((item) => collectCoordinatePairs(item, pairs));
  }

  function isPointBounds(bounds) {
    if (!bounds) return true;
    return Math.abs(bounds.east - bounds.west) < 0.00015 && Math.abs(bounds.north - bounds.south) < 0.00015;
  }

  function filteredEvents() {
    const search = state.search;
    return displayEvents()
      .filter((event) => state.category === "all" || event.category === state.category)
      .filter((event) => confidenceMatches(event))
      .filter((event) => state.showInferred || event.confidence !== "inferred")
      .filter((event) => !search || eventSearchText(event).includes(search))
      .sort(eventSort);
  }

  function displayEvents() {
    return selectedTimeEvents().filter((event) => event.displayVerified);
  }

  function yearEvents() {
    return state.loadedEvents.get(state.year) || [];
  }

  function selectedTimeEvents() {
    return selectedYears().flatMap((year) => state.loadedEvents.get(year) || []);
  }

  function selectedYears() {
    const range = selectedTimeRange();
    return state.years.filter((year) => year >= range.start && year <= range.end);
  }

  function selectedTimeRange() {
    const year = Number(state.year || latestYear());
    return { start: year, end: year };
  }

  function allLoadedEvents() {
    return state.loadedEventList;
  }

  function eventSearchText(event) {
    const sources = event.sourceIds.map((id) => state.sourceById.get(id)).filter(Boolean);
    const sourceText = sources.map((source) => [
      source.source_id,
      source.title,
      source.provider,
      source.source_family,
      source.licence,
      source.attribution_text,
    ].filter(Boolean).join(" ")).join(" ");
    const evidenceText = event.evidence.map((item) => [item.source_id, item.label, item.kind, item.url, item.file_path, item.record_id].filter(Boolean).join(" ")).join(" ");
    const provenance = event.provenance || {};
    const provenanceText = [
      provenance.source_record_id,
      provenance.source_url,
      provenance.source_dataset_id,
      provenance.source_date_field,
      provenance.geometry_source,
      provenance.geometry_precision,
      provenance.transform,
    ].filter(Boolean).join(" ");
    return [
      state.cityId,
      state.city?.display_name,
      state.city?.country,
      event.title,
      event.summary,
      event.area,
      event.category,
      categoryConfig(event.category).label,
      event.lens,
      event.confidence,
      event.year,
      event.effectiveDate,
      formatEventDate(event),
      event.sourceDateField,
      event.sourceIds.join(" "),
      sourceText,
      evidenceText,
      provenanceText,
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function confidenceMatches(event) {
    if (state.confidenceFilter === "all") return true;
    if (state.confidenceFilter === "documented") return event.confidence === "documented" || event.confidence === "corroborated";
    return event.confidence === state.confidenceFilter;
  }

  function eventSort(a, b) {
    return scoreEvent(b) - scoreEvent(a) || b.year - a.year || a.title.localeCompare(b.title);
  }

  function scoreEvent(event) {
    let score = 0;
    if (/official/i.test(event.id)) score += 120;
    if (event.confidence === "corroborated") score += 80;
    if (event.confidence === "documented") score += 60;
    if (/opened|station|public|park|housing|project|development|route|service/i.test(event.title)) score += 34;
    if (/mapped in osm|power asset/i.test(event.title)) score -= 18;
    if (event.year === state.year) score += 12;
    return score;
  }

  function openDetails() {
    if (!state.selectedEvent) return;
    renderDetails(state.selectedEvent);
    if (els.detailsDialog?.open) return;
    if (els.detailsDialog?.showModal) els.detailsDialog.showModal();
    else els.detailsDialog?.setAttribute("open", "");
  }

  function closeDetails() {
    if (els.detailsDialog?.close) els.detailsDialog.close();
    else els.detailsDialog?.removeAttribute("open");
  }

  function openProposal() {
    fillProposalFromSelection();
    renderProposalOutput();
    if (els.proposalDialog?.showModal) els.proposalDialog.showModal();
    else els.proposalDialog?.setAttribute("open", "");
  }

  function closeProposal() {
    if (els.proposalDialog?.close) els.proposalDialog.close();
    else els.proposalDialog?.removeAttribute("open");
  }

  function fillProposalFromSelection() {
    const event = state.selectedEvent;
    if (els.proposalName) els.proposalName.value = event ? `Review near ${event.title}` : `${shortCityName(state.city?.display_name)} proposal`;
    if (els.proposalCategory) els.proposalCategory.value = proposalCategoryForEvent(event);
    if (els.proposalScale) els.proposalScale.value = "medium";
    if (els.proposalStartYear) els.proposalStartYear.value = String(state.year || latestYear());
    if (els.proposalSiteBasis) els.proposalSiteBasis.value = event ? "selected_event" : "typed_point";
    if (els.proposalDescription) {
      els.proposalDescription.value = event
        ? `Use ${event.title} as the selected precedent/site context. Screen nearby historical analogues, source caveats, and evidence gaps.`
        : "Screen a proposed city change against historical analogues and local source-backed context.";
    }
  }

  function proposalCategoryForEvent(event) {
    if (!event) return "building_development";
    if (event.category === "transport") return "road_transport_change";
    if (event.category === "utilities") return "energy_infrastructure";
    if (event.category === "environment") return "green_public_space";
    if (event.category === "civic_services") return "service_civic_infrastructure";
    return "building_development";
  }

  async function runProposal() {
    if (!els.proposalOutput) return;
    const event = state.selectedEvent;
    const location = event?.lngLat
      ? { lng: event.lngLat[0], lat: event.lngLat[1], label: event.area || event.title }
      : { lng: mapCenter()[0], lat: mapCenter()[1], label: shortCityName(state.city?.display_name) };
    const payload = {
      proposal: {
        city_id: state.cityId,
        title: els.proposalName?.value || "Untitled proposal",
        description: els.proposalDescription?.value || "",
        category: els.proposalCategory?.value || "building_development",
        scale: els.proposalScale?.value || "unknown",
        location,
        timeframe: proposalTimeframe(),
        details: {
          site_basis: els.proposalSiteBasis?.value || (event ? "selected_event" : "typed_point"),
          selected_event_id: event?.id || null,
          selected_event_title: event?.title || null,
        },
      },
      radius_m: Number(els.proposalRadius?.value || 1500),
    };
    els.proposalOutput.innerHTML = `<div class="loading-state">Finding source-backed historical analogues, observed record windows, and local caveats...</div>`;
    try {
      const result = await fetchJsonPost("/api/proposal-impact", payload);
      state.proposalResult = result;
      renderProposalOutput();
    } catch (error) {
      state.proposalResult = null;
      els.proposalOutput.innerHTML = `<div class="empty-state">Proposal screen could not run: ${escapeHtml(error.message)}</div>`;
    }
  }

  function proposalTimeframe() {
    const startYear = Number(els.proposalStartYear?.value || "");
    return Number.isInteger(startYear) ? { start_year: startYear } : null;
  }

  function renderProposalOutput() {
    if (!els.proposalOutput) return;
    const result = state.proposalResult;
    if (!result) {
      els.proposalOutput.innerHTML = `<div class="empty-state">Choose a selected event or enter a proposal, then find historical analogues. Results are descriptive and source-backed; they are not a forecast.</div>`;
      return;
    }
    const signals = (result.affected_signals || []).slice(0, 5);
    const analogues = (result.similar_events || []).slice(0, 5);
    const observedPatterns = (result.observed_patterns || []).slice(0, 3);
    const readiness = result.proposal_brief?.evidence_readiness || [];
    const design = result.design_review_basis || [];
    els.proposalOutput.innerHTML = `
      <section class="proposal-summary">
        <div class="proposal-badge-row">
          <span class="proposal-badge">${escapeHtml(result.framing?.label || "Historical analogue")}</span>
          <span class="proposal-badge muted">Not a forecast</span>
          <span class="proposal-badge">${escapeHtml(result.confidence?.label || "unknown")} evidence strength</span>
        </div>
        <p>${escapeHtml(result.summary || "No summary returned.")}</p>
        <small>${escapeHtml(result.method?.method || "Deterministic historical analogue lookup.")}</small>
      </section>
      <section>
        <h3>Evidence themes to review</h3>
        <div class="signal-grid">
          ${signals.map((signal) => `
            <article>
              <strong>${escapeHtml(signal.label || signal.signal)}</strong>
              <span>${escapeHtml(signal.direction)} / ${escapeHtml(signal.strength)} / ${escapeHtml(signal.confidence)}</span>
              <p>${escapeHtml(truncate(signal.reason || signal.investigate || "Review source evidence before making a claim.", 150))}</p>
            </article>
          `).join("") || `<div class="empty-state">No signal rows returned.</div>`}
        </div>
      </section>
      <section>
        <h3>Observed before/after records</h3>
        <div class="pattern-list">
          ${observedPatterns.map((pattern) => `
            <article>
              <strong>${escapeHtml(pattern.title || "Historical analogue")}</strong>
              <span>${escapeHtml(pattern.evidence_strength_label || "Evidence strength not stated")}</span>
              <p>${escapeHtml(pattern.observed_pattern || "No observed record window returned.")}</p>
              <small>${escapeHtml(pattern.caveat || "Causation is not claimed.")}</small>
            </article>
          `).join("") || `<div class="empty-state">No before/after record windows returned.</div>`}
        </div>
      </section>
      <section>
        <h3>Closest analogues</h3>
        <div class="analogue-list">
          ${analogues.map((item) => `
            <button type="button" data-proposal-event-id="${escapeAttr(item.event_id)}" data-proposal-year="${escapeAttr(item.year || "")}" aria-label="Open evidence for ${escapeAttr(item.title || item.event_id)}">
              <span>${escapeHtml(String(item.year || ""))}</span>
              <strong>${escapeHtml(item.title || item.event_id)}</strong>
              <small>${escapeHtml(analogueDetail(item))} - open evidence</small>
            </button>
          `).join("") || `<div class="empty-state">No analogues returned for this proposal.</div>`}
        </div>
      </section>
      <section>
        <h3>Evidence readiness</h3>
        <div class="readiness-list">
          ${readiness.slice(0, 5).map((row) => `
            <span><b>${escapeHtml(row.label || row.theme)}</b><i>${escapeHtml(row.status_label || row.status)}</i></span>
          `).join("")}
        </div>
      </section>
      <section>
        <h3>Design review prompts</h3>
        <ul>${design.slice(0, 4).map((row) => `<li>${escapeHtml(row.review_prompt || row.description || row.label)}</li>`).join("")}</ul>
      </section>
      <section>
        <h3>Caveats</h3>
        <ul>${(result.caveats || []).slice(0, 5).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    `;
  }

  function analogueDetail(item) {
    const factors = (item.match_factors || []).slice(0, 3).map((factor) => factor.factor).join(", ");
    const distance = Number.isFinite(Number(item.distance_m)) ? `${Math.round(Number(item.distance_m))} m` : "distance not available";
    return `${distance}; match factors: ${factors || "source-backed category/context"}`;
  }

  function toggleCompare() {
    const pressed = els.compareButton?.getAttribute("aria-pressed") === "true";
    if (pressed) closeCompare();
    else openCompare();
  }

  function openCompare() {
    state.compareActive = true;
    state.compareAfterYear = state.year;
    state.compareBeforeYear = state.compareBeforeYear || compareDefaultBeforeYear();
    els.compareButton?.setAttribute("aria-pressed", "true");
    els.compareButton?.classList.add("active");
    document.querySelector(".atlas-app")?.classList.add("is-comparing");
    if (els.comparePanel) els.comparePanel.hidden = false;
    renderCompareYearOptions();
    updateComparePanel();
  }

  function closeCompare() {
    state.compareActive = false;
    els.compareButton?.setAttribute("aria-pressed", "false");
    els.compareButton?.classList.remove("active");
    document.querySelector(".atlas-app")?.classList.remove("is-comparing");
    if (els.comparePanel) els.comparePanel.hidden = true;
    removeCompareImagery();
  }

  function compareDefaultBeforeYear() {
    if (!state.years.length) return DEFAULT_YEAR;
    const target = (state.year || DEFAULT_YEAR) - 5;
    return clampToYears(target) || state.years[0];
  }

  function renderCompareYearOptions() {
    if (!state.years.length) return;
    const options = state.years.map((year) => `<option value="${year}">${year}</option>`).join("");
    if (els.beforeYearSelect) {
      els.beforeYearSelect.innerHTML = options;
      els.beforeYearSelect.value = String(state.compareBeforeYear || compareDefaultBeforeYear());
    }
    if (els.afterYearSelect) {
      els.afterYearSelect.innerHTML = options;
      els.afterYearSelect.value = String(state.compareAfterYear || state.year);
    }
  }

  function setCompareYears(beforeYear, afterYear) {
    state.compareBeforeYear = clampToYears(beforeYear) || state.compareBeforeYear || earliestYear();
    state.compareAfterYear = clampToYears(afterYear) || state.compareAfterYear || latestYear();
    renderCompareYearOptions();
    updateComparePanel();
  }

  async function updateComparePanel() {
    if (!state.compareActive) return;
    const beforeYear = state.compareBeforeYear || compareDefaultBeforeYear();
    const afterYear = state.compareAfterYear || state.year;
    state.compareBeforeYear = beforeYear;
    state.compareAfterYear = afterYear;
    renderComparePanel();
    try {
      await Promise.all([loadYear(beforeYear), loadYear(afterYear)]);
      renderComparePanel();
      updateCompareImagery();
    } catch (error) {
      setText(els.compareNote, `Compare data could not be fully loaded: ${error.message}`);
    }
  }

  function renderComparePanel() {
    if (!els.comparePanel || !state.compareActive) return;
    const beforeYear = state.compareBeforeYear || compareDefaultBeforeYear();
    const afterYear = state.compareAfterYear || state.year;
    if (els.beforeYearSelect && els.beforeYearSelect.options.length) els.beforeYearSelect.value = String(beforeYear);
    if (els.afterYearSelect && els.afterYearSelect.options.length) els.afterYearSelect.value = String(afterYear);

    const beforeChunk = chunkForYear(beforeYear) || {};
    const afterChunk = chunkForYear(afterYear) || {};
    const beforeEvents = state.loadedEvents.get(beforeYear) || [];
    const afterEvents = state.loadedEvents.get(afterYear) || [];
    const beforeCount = Number(beforeChunk.event_count || beforeEvents.length || 0);
    const afterCount = Number(afterChunk.event_count || afterEvents.length || 0);
    const delta = afterCount - beforeCount;
    const beforeCats = beforeChunk.counts_by_category || categoryCounts(beforeEvents);
    const afterCats = afterChunk.counts_by_category || categoryCounts(afterEvents);
    const topDeltas = CATEGORY_CONFIG
      .filter((category) => !["all"].includes(category.id))
      .map((category) => ({
        category,
        before: Number(beforeCats[category.id] || 0),
        after: Number(afterCats[category.id] || 0),
      }))
      .filter((row) => row.before || row.after)
      .sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before))
      .slice(0, 4);

    if (els.compareStats) {
      els.compareStats.innerHTML = `
        <article><span>${beforeYear}</span><strong>${compactNumber(beforeCount)}</strong><small>records logged</small></article>
        <article><span>${afterYear}</span><strong>${compactNumber(afterCount)}</strong><small>records logged</small></article>
        <article><span>Change</span><strong>${delta >= 0 ? "+" : ""}${compactNumber(delta)}</strong><small>record count delta</small></article>
        <div class="compare-deltas">
          ${topDeltas.map((row) => `
            <span style="--event-color: ${escapeAttr(row.category.color)}">
              <b>${escapeHtml(row.category.label)}</b>
              <i>${row.after - row.before >= 0 ? "+" : ""}${compactNumber(row.after - row.before)}</i>
            </span>
          `).join("")}
        </div>
      `;
    }
    setText(els.compareNote, "OpenStreetMap provides current orientation context only. Event counts are logged source-backed records, not proof of net physical additions, removals, congestion, or causation.");
    setText(els.compareBeforeMapLabel, `${beforeYear}`);
    setText(els.compareAfterMapLabel, `${afterYear}`);
  }

  function categoryCounts(events) {
    return events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {});
  }

  function basemapTiles() {
    return [TILE_PROVIDER.template];
  }

  function basemapAttributionText() {
    const base = `${TILE_PROVIDER.attribution}. Basemap is orientation context; event timing comes from cited sources.`;
    const detailStatus = state.detailLayerError ? ` Detail layer: ${state.detailLayerError}.` : "";
    const lensStatus = state.lensOverlayError ? ` Lens overlay: ${state.lensOverlayError}.` : "";
    const basemapStatus = state.basemapError ? ` Basemap: ${state.basemapError}.` : "";
    return `${base}${detailStatus}${lensStatus}${basemapStatus}`;
  }

  function imageryLayerForYear(year) {
    const numericYear = Number(year);
    return {
      provider: TILE_PROVIDER.name,
      year: Number.isFinite(numericYear) ? numericYear : state.year,
      tile_template: TILE_PROVIDER.template,
    };
  }

  function updateMapAttribution() {
    setText(els.mapAttribution, basemapAttributionText());
  }

  function updateMapBasemapForYear(year, options = {}) {
    const numericYear = Number(year);
    state.basemapYear = Number.isFinite(numericYear) ? numericYear : state.year;
    state.basemapError = null;
    updateMapAttribution();

    if (!state.mapReady || !state.map) return imageryLayerForYear(state.basemapYear);

    const tiles = basemapTiles();
    const currentTiles = state.map.getStyle()?.sources?.basemap?.tiles || [];
    if (options.force || currentTiles[0] !== tiles[0] || !state.map.getLayer("basemap")) {
      replaceMainBasemapLayer(tiles);
    }
    ensureDetailLayers();
    updateDetailLayerFilters();
    ensureLensOverlays();
    updateLensOverlayFilters();
    if (state.compareActive) updateCompareImagery();
    return imageryLayerForYear(state.basemapYear);
  }

  function updateMapImageryForYear(year, options = {}) {
    return Promise.resolve(updateMapBasemapForYear(year, options));
  }

  function replaceMainBasemapLayer(tiles) {
    if (!state.map) return;
    try {
      removeCompareImagery();
      addCanonicalBasemapLayer(tiles);
      if (state.compareActive) updateCompareImagery();
    } catch (error) {
      state.basemapError = error.message;
      updateMapAttribution();
      toast("OpenStreetMap basemap could not be refreshed. Event records still changed by year.");
    }
  }

  function addCanonicalBasemapLayer(tiles) {
    removeLayerAndSource("basemap", "basemap");
    state.map.addSource("basemap", {
      type: "raster",
      tiles,
      tileSize: 256,
      attribution: basemapAttributionText(),
    });
    const beforeLayer = state.map.getStyle()?.layers?.find((layer) => layer.id !== "basemap")?.id;
    state.map.addLayer({
      id: "basemap",
      type: "raster",
      source: "basemap",
      paint: { "raster-opacity": 1, "raster-fade-duration": 180 },
    }, beforeLayer);
  }

  function removeLayerAndSource(layerId, sourceId) {
    if (!state.map) return;
    if (state.map.getLayer(layerId)) state.map.removeLayer(layerId);
    if (state.map.getSource(sourceId)) state.map.removeSource(sourceId);
  }

  function detailLayerPath() {
    const configured = state.cityMeta?.artifact_paths?.detail_layers || state.city?.artifact_paths?.detail_layers;
    return configured ? dataPathToUrl(configured) : "";
  }

  function ensureDetailLayers() {
    if (!state.map || !state.mapReady) return;
    const path = detailLayerPath();
    if (!path) {
      removeDetailLayers();
      return;
    }
    if (state.map.getSource(DETAIL_SOURCE_ID)) {
      updateDetailLayerFilters();
      return;
    }
    try {
      state.map.addSource(DETAIL_SOURCE_ID, { type: "geojson", data: path, generateId: true });
      addDetailLayers();
      state.detailLayerLoaded = true;
      state.detailLayerError = null;
      updateDetailLayerFilters();
      updateMapAttribution();
    } catch (error) {
      state.detailLayerLoaded = false;
      state.detailLayerError = error.message;
      updateMapAttribution();
    }
  }

  function addDetailLayers() {
    state.map.addLayer({
      id: "detail-roads-current",
      type: "line",
      source: DETAIL_SOURCE_ID,
      filter: ["==", ["get", "layer"], "road"],
      paint: {
        "line-color": "#e8f2ec",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.08, 14, 0.18, 17, 0.25],
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.35, 14, 1.1, 17, 2.6],
      },
    });
    state.map.addLayer({
      id: "detail-buildings-fill",
      type: "fill",
      source: DETAIL_SOURCE_ID,
      minzoom: 10,
      filter: detailVisibilityFilter("building"),
      paint: {
        "fill-color": ["case", ["==", ["to-number", ["get", "visible_year"], 0], state.year], "#f0c45c", "#7fb799"],
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.16, 14, 0.28, 17, 0.38],
      },
    });
    state.map.addLayer({
      id: "detail-buildings-extrusion",
      type: "fill-extrusion",
      source: DETAIL_SOURCE_ID,
      minzoom: 13,
      filter: detailVisibilityFilter("building"),
      paint: {
        "fill-extrusion-color": ["case", ["==", ["to-number", ["get", "visible_year"], 0], state.year], "#f5c85d", "#8ab59b"],
        "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13, 0, 15, ["to-number", ["get", "height_m"], 8]],
        "fill-extrusion-opacity": 0.5,
      },
    });
    state.map.addLayer({
      id: "detail-buildings-outline",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 12,
      filter: detailVisibilityFilter("building"),
      paint: {
        "line-color": "#e7f6e9",
        "line-opacity": 0.32,
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.35, 16, 1],
      },
    });
    state.map.addLayer({
      id: "detail-roads-visible",
      type: "line",
      source: DETAIL_SOURCE_ID,
      filter: detailVisibilityFilter("road"),
      paint: {
        "line-color": ["case", [">=", ["to-number", ["get", "rank"], 1], 3], "#f0c45c", "#68d6df"],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.24, 14, 0.46, 17, 0.62],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, ["*", ["to-number", ["get", "rank"], 1], 0.28],
          14, ["*", ["to-number", ["get", "rank"], 1], 0.72],
          17, ["*", ["to-number", ["get", "rank"], 1], 1.25],
        ],
      },
    });
    state.map.addLayer({
      id: "detail-roads-year",
      type: "line",
      source: DETAIL_SOURCE_ID,
      filter: detailYearFilter("road"),
      paint: {
        "line-color": "#f7df7a",
        "line-opacity": 0.8,
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, ["*", ["to-number", ["get", "rank"], 1], 0.5],
          14, ["*", ["to-number", ["get", "rank"], 1], 1.1],
          17, ["*", ["to-number", ["get", "rank"], 1], 1.8],
        ],
      },
    });
    state.map.addLayer({
      id: "detail-buildings-year-outline",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 11,
      filter: detailYearFilter("building"),
      paint: {
        "line-color": "#ffe48b",
        "line-opacity": 0.85,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.8, 16, 1.8],
      },
    });
  }

  function removeDetailLayers() {
    if (!state.map) return;
    for (const layerId of DETAIL_LAYER_IDS) {
      if (state.map.getLayer(layerId)) state.map.removeLayer(layerId);
    }
    if (state.map.getSource(DETAIL_SOURCE_ID)) state.map.removeSource(DETAIL_SOURCE_ID);
    state.detailLayerLoaded = false;
  }

  function updateDetailLayerFilters() {
    if (!state.map?.getSource(DETAIL_SOURCE_ID)) return;
    for (const layerId of ["detail-buildings-fill", "detail-buildings-extrusion", "detail-buildings-outline"]) {
      if (state.map.getLayer(layerId)) state.map.setFilter(layerId, detailVisibilityFilter("building"));
    }
    for (const layerId of ["detail-roads-visible"]) {
      if (state.map.getLayer(layerId)) state.map.setFilter(layerId, detailVisibilityFilter("road"));
    }
    if (state.map.getLayer("detail-roads-year")) state.map.setFilter("detail-roads-year", detailYearFilter("road"));
    if (state.map.getLayer("detail-buildings-year-outline")) state.map.setFilter("detail-buildings-year-outline", detailYearFilter("building"));
    syncStateModel();
  }

  function updateTimeDependentMapState() {
    updateDetailLayerFilters();
    updateLensOverlayFilters();
    updateMapAttribution();
    syncStateModel();
  }

  function syncStateModel(visibleEvents = null) {
    const range = selectedTimeRange();
    const overlayRange = overlayTimeRange();
    const events = visibleEvents || null;
    state.selectedCity = {
      id: state.cityId,
      name: shortCityName(state.city?.display_name || state.cityMeta?.display_name || state.cityId),
    };
    state.selectedYearRange = range;
    state.overlayYearRange = overlayRange;
    state.eventFilters = {
      category: state.category,
      confidence: state.confidenceFilter,
      showInferred: state.showInferred,
      search: state.search,
    };
    state.activeLayers = {
      detail: Boolean(detailLayerPath()),
      lensHeatmap: Boolean(lensOverlayPath()),
      lensPoints: Boolean(lensOverlayPath()),
      transportRoads: state.category === "transport" && Boolean(transportRoadYearPath()),
    };
    state.visibleOverlays = {
      detailRoads: isLayerVisible("detail-roads-visible") || isLayerVisible("detail-roads-year"),
      detailBuildings: isLayerVisible("detail-buildings-fill") || isLayerVisible("detail-buildings-extrusion"),
      heatmap: isLayerVisible("lens-heatmap"),
      lensPoints: isLayerVisible("lens-current-points"),
      transportBase: isLayerVisible("lens-transport-base"),
      transportRoads: isLayerVisible("lens-transport-roads"),
    };
    if (events) {
      state.visibleEventCount = events.length;
      state.visibleEventIds = events.map((event) => event.id);
    }
    state.selectedEventState = state.selectedEvent
      ? {
          id: state.selectedEvent.id,
          year: state.selectedEvent.year,
          visibleInSelectedTime: eventInSelectedTime(state.selectedEvent),
          visibleInCurrentFilter: Boolean((events || filteredEvents()).some((event) => event.id === state.selectedEventId)),
        }
      : null;
  }

  function isLayerVisible(layerId) {
    if (!state.map?.getLayer(layerId)) return false;
    return state.map.getLayoutProperty(layerId, "visibility") !== "none";
  }

  function overlayTimeRange() {
    const year = Number(state.year || latestYear());
    return { start: Math.max(earliestYear(), year - 2), end: year };
  }

  function eventInSelectedTime(event) {
    if (!event) return false;
    const range = selectedTimeRange();
    return Number(event.year) >= range.start && Number(event.year) <= range.end;
  }

  function detailVisibilityFilter(layer) {
    return ["all", ["==", ["get", "layer"], layer], ["<=", ["to-number", ["get", "visible_year"], 9999], Number(state.year || latestYear())]];
  }

  function detailYearFilter(layer) {
    return ["all", ["==", ["get", "layer"], layer], ["==", ["to-number", ["get", "visible_year"], 0], Number(state.year || latestYear())]];
  }

  function lensOverlayPath() {
    const configured = state.cityMeta?.artifact_paths?.lens_overlays || state.city?.artifact_paths?.lens_overlays;
    return configured ? dataPathToUrl(configured) : "";
  }

  function transportRoadBasePath() {
    const configured = state.cityMeta?.artifact_paths?.transport_roads_base || state.city?.artifact_paths?.transport_roads_base;
    return configured ? dataPathToUrl(configured) : "";
  }

  function transportRoadYearPath(year = state.year) {
    const template = state.cityMeta?.artifact_paths?.transport_roads_template || state.city?.artifact_paths?.transport_roads_template;
    const numericYear = Number(year || latestYear());
    return template ? dataPathToUrl(String(template).replace("{year}", String(numericYear))) : "";
  }

  function ensureLensOverlays() {
    if (!state.map || !state.mapReady) return;
    const path = lensOverlayPath();
    const basePath = transportRoadBasePath();
    const yearPath = transportRoadYearPath(state.year);
    const missing = [
      ["lens overlays", path],
      ["transport base roads", basePath],
      ["transport year roads", yearPath],
    ].filter(([, value]) => !value).map(([label]) => label);
    if (missing.length) {
      state.lensOverlayError = `Missing required generated artifact(s): ${missing.join(", ")}`;
      removeLensOverlays();
      updateMapAttribution();
      return;
    }

    try {
      const lensSource = state.map.getSource(LENS_SOURCE_ID);
      if (lensSource?.setData) {
        if (state.lensOverlayPathLoaded !== path) lensSource.setData(path);
      } else {
        state.map.addSource(LENS_SOURCE_ID, { type: "geojson", data: path, generateId: true });
      }
      state.lensOverlayPathLoaded = path;

      const baseSource = state.map.getSource(LENS_ROAD_BASE_SOURCE_ID);
      if (baseSource?.setData) {
        if (state.transportRoadBasePathLoaded !== basePath) baseSource.setData(basePath);
      } else {
        state.map.addSource(LENS_ROAD_BASE_SOURCE_ID, { type: "geojson", data: basePath, generateId: true });
      }
      state.transportRoadBasePathLoaded = basePath;

      const roadSource = state.map.getSource(LENS_ROAD_SOURCE_ID);
      if (roadSource?.setData) {
        if (state.transportRoadYearPathLoaded !== yearPath) roadSource.setData(yearPath);
      } else {
        state.map.addSource(LENS_ROAD_SOURCE_ID, { type: "geojson", data: yearPath, generateId: true });
      }
      state.transportRoadYearPathLoaded = yearPath;
      state.transportRoadYearLoaded = Number(state.year || latestYear());

      if (!state.map.getLayer("lens-heatmap")) addLensOverlayLayers();
      state.lensOverlayLoaded = true;
      state.lensOverlayError = null;
      updateLensOverlayFilters();
      updateMapAttribution();
    } catch (error) {
      state.lensOverlayLoaded = false;
      state.lensOverlayError = error.message;
      updateMapAttribution();
    }
  }

  function updateTransportRoadYearSource() {
    if (!state.map?.getSource(LENS_ROAD_SOURCE_ID)) return;
    const path = transportRoadYearPath(state.year);
    if (!path || state.transportRoadYearPathLoaded === path) return;
    const source = state.map.getSource(LENS_ROAD_SOURCE_ID);
    if (source?.setData) {
      source.setData(path);
      state.transportRoadYearPathLoaded = path;
      state.transportRoadYearLoaded = Number(state.year || latestYear());
    }
  }

  function addLensOverlayLayers() {
    state.map.addLayer({
      id: "lens-heatmap",
      type: "heatmap",
      source: LENS_SOURCE_ID,
      filter: lensEventFilter(false),
      paint: {
        "heatmap-weight": ["to-number", ["get", "heat_weight"], 1],
        "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 0.48, 12, 0.85, 15, 1.25, 17, 1.65],
        "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 14, 12, 28, 15, 58, 17, 92],
        "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.5, 12, 0.72, 16, 0.86],
        "heatmap-color": lensHeatmapColor(),
      },
    });
    state.map.addLayer({
      id: "lens-current-points-glow",
      type: "circle",
      source: LENS_SOURCE_ID,
      filter: lensEventFilter(true),
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 12, 13, 22, 16, 38],
        "circle-color": ["get", "category_color"],
        "circle-opacity": 0.18,
        "circle-blur": 0.72,
      },
    });
    state.map.addLayer({
      id: "lens-current-points",
      type: "circle",
      source: LENS_SOURCE_ID,
      filter: lensEventFilter(true),
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 3, 13, 5.4, 16, 8],
        "circle-color": ["get", "category_color"],
        "circle-opacity": 0.82,
        "circle-stroke-color": "#101f26",
        "circle-stroke-opacity": 0.82,
        "circle-stroke-width": 1,
      },
    });
    state.map.addLayer({
      id: "lens-transport-base-case",
      type: "line",
      source: LENS_ROAD_BASE_SOURCE_ID,
      filter: transportBaseRoadFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#0b1b1e",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.08, 12, 0.16, 16, 0.28],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          8, ["*", ["to-number", ["get", "rank"], 1], 0.32],
          12, ["*", ["to-number", ["get", "rank"], 1], 0.62],
          16, ["*", ["to-number", ["get", "rank"], 1], 1.15],
        ],
        "line-blur": 0.25,
      },
    });
    state.map.addLayer({
      id: "lens-transport-base",
      type: "line",
      source: LENS_ROAD_BASE_SOURCE_ID,
      filter: transportBaseRoadFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#58d3c8",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.06, 12, 0.18, 16, 0.36],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          8, ["*", ["to-number", ["get", "rank"], 1], 0.16],
          12, ["*", ["to-number", ["get", "rank"], 1], 0.34],
          16, ["*", ["to-number", ["get", "rank"], 1], 0.78],
        ],
      },
    });
    state.map.addLayer({
      id: "lens-transport-roads-case",
      type: "line",
      source: LENS_ROAD_SOURCE_ID,
      filter: transportRoadFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#102024",
        "line-opacity": 0.42,
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.3, 13, 3.2, 16, 7.5],
        "line-blur": 0.4,
      },
    });
    state.map.addLayer({
      id: "lens-transport-roads",
      type: "line",
      source: LENS_ROAD_SOURCE_ID,
      filter: transportRoadFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: transportRoadPaint(),
    });
    state.map.addLayer({
      id: "lens-transport-hotspots",
      type: "line",
      source: LENS_ROAD_SOURCE_ID,
      filter: transportRoadFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#ef4444",
        "line-opacity": ["interpolate", ["linear"], transportActivityExpression(), 0, 0, 0.45, 0.16, 1, 0.42],
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 4, 13, 11, 16, 22],
        "line-blur": 3,
      },
    });
  }

  function removeLensOverlays() {
    if (!state.map) return;
    for (const layerId of LENS_LAYER_IDS) {
      if (state.map.getLayer(layerId)) state.map.removeLayer(layerId);
    }
    for (const sourceId of [LENS_ROAD_SOURCE_ID, LENS_ROAD_BASE_SOURCE_ID, LENS_SOURCE_ID]) {
      if (state.map.getSource(sourceId)) state.map.removeSource(sourceId);
    }
    state.lensOverlayLoaded = false;
    state.lensOverlayPathLoaded = null;
    state.transportRoadBasePathLoaded = null;
    state.transportRoadYearPathLoaded = null;
    state.transportRoadYearLoaded = null;
  }

  function updateLensOverlayFilters() {
    if (!state.map) return;
    updateTransportRoadYearSource();
    if (!state.map.getSource(LENS_SOURCE_ID)) return;
    if (state.map.getLayer("lens-heatmap")) {
      state.map.setFilter("lens-heatmap", lensEventFilter(false));
      state.map.setPaintProperty("lens-heatmap", "heatmap-color", lensHeatmapColor());
      state.map.setLayoutProperty("lens-heatmap", "visibility", "visible");
    }
    for (const layerId of ["lens-current-points-glow", "lens-current-points"]) {
      if (state.map.getLayer(layerId)) {
        state.map.setFilter(layerId, lensEventFilter(true));
        state.map.setLayoutProperty(layerId, "visibility", "visible");
      }
    }
    const showTransportRoads = state.category === "transport";
    for (const layerId of ["lens-transport-base-case", "lens-transport-base"]) {
      if (!state.map.getLayer(layerId)) continue;
      state.map.setFilter(layerId, transportBaseRoadFilter());
      state.map.setLayoutProperty(layerId, "visibility", showTransportRoads ? "visible" : "none");
    }
    for (const layerId of ["lens-transport-roads-case", "lens-transport-roads", "lens-transport-hotspots"]) {
      if (!state.map.getLayer(layerId)) continue;
      state.map.setFilter(layerId, transportRoadFilter());
      state.map.setLayoutProperty(layerId, "visibility", showTransportRoads ? "visible" : "none");
    }
    if (state.map.getLayer("lens-transport-roads")) {
      const paint = transportRoadPaint();
      Object.entries(paint).forEach(([key, value]) => state.map.setPaintProperty("lens-transport-roads", key, value));
    }
    if (state.map.getLayer("lens-transport-hotspots")) {
      state.map.setPaintProperty("lens-transport-hotspots", "line-opacity", ["interpolate", ["linear"], transportActivityExpression(), 0, 0, 0.45, 0.16, 1, 0.42]);
    }
    syncStateModel();
  }

  function lensEventFilter(exactYear) {
    const year = Number(state.year || latestYear());
    const fromYear = overlayTimeRange().start;
    const conditions = [
      ["==", ["get", "layer"], "lens_event"],
      exactYear
        ? ["==", ["to-number", ["get", "year"], 0], year]
        : ["all", [">=", ["to-number", ["get", "year"], 0], fromYear], ["<=", ["to-number", ["get", "year"], 0], year]],
    ];
    if (state.category !== "all") conditions.push(["==", ["get", "category"], state.category]);
    if (!state.showInferred) conditions.push(["!=", ["get", "confidence"], "inferred"]);
    if (state.confidenceFilter === "documented") {
      conditions.push(["match", ["get", "confidence"], ["documented", "corroborated"], true, false]);
    } else if (state.confidenceFilter !== "all") {
      conditions.push(["==", ["get", "confidence"], state.confidenceFilter]);
    }
    return ["all", ...conditions];
  }

  function transportBaseRoadFilter() {
    return ["==", ["get", "layer"], "traffic_road_base"];
  }

  function transportRoadFilter() {
    return [
      "all",
      ["==", ["get", "layer"], "traffic_road"],
      [">", transportActivityExpression(), 0],
    ];
  }

  function transportActivityExpression() {
    return ["to-number", ["get", "transport_activity"], 0];
  }

  function transportRoadPaint() {
    const activity = transportActivityExpression();
    return {
      "line-color": [
        "interpolate", ["linear"], activity,
        0, "#2f9e44",
        0.2, "#84cc16",
        0.42, "#facc15",
        0.68, "#f97316",
        1, "#ef4444",
      ],
      "line-opacity": ["interpolate", ["linear"], activity, 0, 0.12, 0.2, 0.45, 1, 0.92],
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        9, ["*", ["+", 0.35, ["*", activity, 2.2]], ["to-number", ["get", "rank"], 1]],
        13, ["*", ["+", 0.7, ["*", activity, 3.2]], ["to-number", ["get", "rank"], 1]],
        16, ["*", ["+", 1.2, ["*", activity, 5.2]], ["to-number", ["get", "rank"], 1]],
      ],
    };
  }

  function lensHeatmapColor() {
    const ramps = {
      built_environment: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.08, "rgba(216,166,78,0.30)",
        0.35, "rgba(245,196,92,0.62)",
        0.68, "rgba(249,115,22,0.82)",
        1, "rgba(239,68,68,0.94)",
      ],
      transport: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.08, "rgba(47,158,68,0.36)",
        0.35, "rgba(250,204,21,0.68)",
        0.68, "rgba(249,115,22,0.86)",
        1, "rgba(239,68,68,0.96)",
      ],
      environment: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.12, "rgba(117,198,155,0.36)",
        0.45, "rgba(34,197,94,0.72)",
        0.78, "rgba(132,204,22,0.86)",
        1, "rgba(250,204,21,0.95)",
      ],
      civic_services: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.12, "rgba(116,189,219,0.34)",
        0.45, "rgba(56,189,248,0.70)",
        0.78, "rgba(45,212,191,0.86)",
        1, "rgba(250,204,21,0.94)",
      ],
      economy: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.12, "rgba(165,139,212,0.34)",
        0.45, "rgba(168,85,247,0.72)",
        0.78, "rgba(217,70,239,0.86)",
        1, "rgba(250,204,21,0.94)",
      ],
      all: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.08, "rgba(98,211,215,0.30)",
        0.35, "rgba(245,196,92,0.62)",
        0.68, "rgba(249,115,22,0.82)",
        1, "rgba(239,68,68,0.94)",
      ],
    };
    return ramps[state.category] || ramps.all;
  }

  function motionDuration(ms) {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? 0 : ms;
  }

  function updateCompareImagery() {
    removeCompareImagery();
  }

  function removeCompareImagery() {
    if (!state.map) return;
    try {
      if (state.map.getLayer("compare-before-layer")) state.map.removeLayer("compare-before-layer");
      if (state.map.getSource("compare-before")) state.map.removeSource("compare-before");
    } catch (_error) {
      // Ignore stale MapLibre source cleanup during fast city or style switches.
    }
  }

  function toggleLensPanel() {
    const panel = document.querySelector(".lens-panel");
    const button = document.querySelector(".panel-arrow");
    const collapsed = !panel?.classList.contains("is-collapsed");
    panel?.classList.toggle("is-collapsed", collapsed);
    button?.setAttribute("aria-label", collapsed ? "Expand lenses" : "Collapse lenses");
    button?.setAttribute("aria-expanded", String(!collapsed));
  }

  function toggleOverview() {
    const panel = document.querySelector(".overview-card");
    const button = document.querySelector(".overview-toggle");
    const collapsed = !panel?.classList.contains("is-collapsed");
    panel?.classList.toggle("is-collapsed", collapsed);
    button?.setAttribute("aria-label", collapsed ? "Expand city overview" : "Collapse city overview");
    button?.setAttribute("aria-expanded", String(!collapsed));
  }

  function toggle3d() {
    state.viewMode = state.viewMode === "3d" ? "2d" : "3d";
    els.view3dButton?.classList.toggle("active", state.viewMode === "3d");
    els.view3dButton?.setAttribute("aria-pressed", String(state.viewMode === "3d"));
    if (els.view3dButton) els.view3dButton.textContent = state.viewMode === "3d" ? "3D" : "2D";
    state.map?.easeTo({ pitch: mapPitch(), bearing: mapBearing(), duration: 420 });
  }

  function togglePlay() {
    if (state.playTimer) {
      stopPlay();
      return;
    }
    els.playButton?.setAttribute("aria-label", "Pause timeline");
    const advance = () => {
      if (!state.playTimer) return;
      const index = state.years.indexOf(state.year);
      Promise.resolve(setYear(state.years[(index + 1) % state.years.length])).finally(() => {
        if (state.playTimer) state.playTimer = window.setTimeout(advance, 1450);
      });
    };
    state.playTimer = window.setTimeout(advance, 250);
  }

  function stopPlay() {
    if (state.playTimer) window.clearTimeout(state.playTimer);
    state.playTimer = null;
    els.playButton?.setAttribute("aria-label", "Play timeline");
  }

  function recenterMap() {
    const event = state.selectedEvent;
    if (event?.lngLat) {
      focusMapOnEvent(event, { duration: 480 });
      return;
    }
    state.map?.easeTo({
      center: mapCenter(),
      zoom: Number(state.city?.default_zoom || 11.5),
      pitch: mapPitch(),
      bearing: mapBearing(),
      duration: 480,
    });
  }

  async function shareView() {
    const url = new URL(window.location.href);
    url.searchParams.set("city", state.cityId);
    url.searchParams.set("year", String(state.year));
    if (state.selectedEventId) url.searchParams.set("event", state.selectedEventId);
    try {
      await navigator.clipboard?.writeText(url.toString());
      toast("Current OpenCityLog view copied.");
    } catch (_error) {
      toast(url.toString());
    }
  }

  async function copyBrief() {
    if (!state.selectedEvent) return;
    const text = buildBriefText(state.selectedEvent, buildEventContext(state.selectedEvent));
    try {
      await navigator.clipboard?.writeText(text);
      toast("Evidence brief copied.");
    } catch (_error) {
      toast("Copy unavailable; evidence brief remains visible.");
    }
  }

  function buildBriefText(event, context) {
    const sourceLines = sourceRowsText(event, context.sources);
    const nearbyLines = context.nearby.map((item) => `- ${item.year}: ${item.title} (${item.distanceKm.toFixed(2)} km)`);
    return [
      `OpenCityLog evidence brief: ${event.title}`,
      `City: ${shortCityName(state.city?.display_name)} | Year: ${event.year} | Area: ${event.area}`,
      `Date basis: ${formatEventDate(event)} (${event.sourceDateField || event.provenance.source_date_field || "not stated"})`,
      `Confidence: ${confidenceStatus(event)} - ${confidenceExplanation(event)}`,
      "",
      "Observed record",
      event.summary,
      "",
      "Place and movement scan",
      `Appearance: ${appearanceBody(event, context)}`,
      `Traffic and movement: ${mobilityBody(event, context)}`,
      "",
      "Nearby source-backed context",
      nearbyLines.length ? nearbyLines.join("\n") : "- No nearby source-backed records loaded in the current context window.",
      "",
      "Sources",
      sourceLines.length ? sourceLines.join("\n") : "- Source rows unavailable in current registry.",
      "",
      "Limitations",
      "- This is descriptive evidence, not a causal or predictive model.",
      ...uniqueStrings(event.caveats).map((item) => `- ${item}`),
    ].join("\n");
  }

  function sourceRowsText(event, sources) {
    const evidence = event.evidence.map((item) => `- ${item.label || item.source_id || "Evidence row"} (${item.kind || "source"}): ${item.url || item.file_path || item.record_id || "no link"}`);
    const registry = sources.map((source) => `- ${source.title || source.source_id}: ${source.provider || "Public source"}; licence: ${source.licence || "requires review"}`);
    return [...evidence, ...registry];
  }

  function primarySourceLabel(event, sources = []) {
    const source = sources[0] || primarySource(event);
    if (source) {
      return `${source.provider || source.title || "Public source"} (${source.source_id || event.sourceIds[0] || "source id not stated"})`;
    }
    return event.sourceIds.length ? event.sourceIds.join(", ") : "Source id not stated";
  }

  function methodText(event) {
    const provenance = event.provenance || {};
    const basis = provenance.source_basis || provenance.source_dataset_id || provenance.source_record_id || "";
    const dateField = event.sourceDateField || provenance.source_date_field || "";
    return [
      provenance.transform || "atlas event normalization",
      basis ? `basis: ${basis}` : "",
      dateField ? `date field: ${dateField}` : "",
    ].filter(Boolean).join(" | ");
  }

  function appearanceStatus(event) {
    if (event.category === "built_environment") return "Place record";
    if (event.category === "transport") return "Street/route record";
    if (event.category === "environment") return "Environment record";
    if (/osm/i.test(event.id)) return "Mapped asset";
    return "Context record";
  }

  function appearanceShortText(event, context) {
    if (event.category === "built_environment") return "Planning/building evidence";
    if (context.builtNearby) return `${context.builtNearby} nearby planning records`;
    return "Use current basemap";
  }

  function appearanceBody(event, context) {
    const sourceFamily = sourceFamilyText(context.sources);
    if (event.category === "built_environment") {
      return `This record can support an administrative or built-environment review. ${sourceFamily} It does not include event-specific before/after imagery.`;
    }
    if (/osm/i.test(event.id) || event.confidence === "inferred") {
      return `This is mapped-visibility evidence. The current basemap helps orient the place, but the record does not prove when the physical feature first appeared.`;
    }
    return `The map gives current visual context around the event geometry. Event-linked before/after imagery is not attached, so appearance change should be checked from source links or imagery archives.`;
  }

  function mobilityStatus(event, context) {
    if (event.category === "transport" || event.signals.includes("mobility")) return "Direct mobility signal";
    if (context.mobilityNearby) return `${context.mobilityNearby} nearby mobility records`;
    return "No attached traffic series";
  }

  function mobilityShortText(event, context) {
    if (event.category === "transport") return "Transport event";
    if (context.mobilityNearby) return `${context.mobilityNearby} nearby records`;
    return "No measured series";
  }

  function mobilityBody(event, context) {
    if (event.category === "transport" || event.signals.includes("mobility")) {
      return `The event itself is tagged with mobility context. Nearby transport records in the same period: ${context.mobilityNearby}. Traffic volume changes are not measured here.`;
    }
    if (context.mobilityNearby) {
      return `There are ${context.mobilityNearby} nearby transport or mobility records in the same period. Treat them as context for review, not as evidence of this event's effect.`;
    }
    return "No measured traffic or transit time series is attached to this event. This screen avoids estimating traffic effects without a source.";
  }

  function categoryCountText(counts) {
    const entries = Object.entries(counts).filter(([, count]) => count > 0);
    if (!entries.length) return "none loaded";
    return entries.map(([category, count]) => `${count} ${categoryConfig(category).label.toLowerCase()}`).join(", ");
  }

  function sourceFamilyText(sources) {
    const families = uniqueStrings(sources.map((source) => source.source_family || source.provider || source.title).filter(Boolean));
    return families.length ? `Source families: ${families.join(", ")}.` : "Source family not stated.";
  }

  function distanceKm(a, b) {
    const toRad = (degrees) => degrees * Math.PI / 180;
    const [lng1, lat1] = a;
    const [lng2, lat2] = b;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function uniqueStrings(items) {
    const seen = new Set();
    const result = [];
    for (const item of items) {
      const text = String(item || "").trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      result.push(text);
    }
    return result;
  }

  function isDisplayVerified(event) {
    return Boolean(event.id && event.title && Number.isFinite(event.year) && event.lngLat && event.sourceIds.some((id) => state.sourceById.has(id)));
  }

  function eventLngLat(event) {
    const geometry = event.geometry;
    if (!geometry || typeof geometry !== "object") return null;
    const coords = geometry.coordinates;
    let point = null;
    if (geometry.type === "Point") point = coords;
    else if (geometry.type === "LineString") point = coords[Math.floor(coords.length / 2)];
    else if (geometry.type === "Polygon") point = centroid(coords[0]);
    else if (geometry.type === "MultiPoint") point = coords[0];
    else if (geometry.type === "MultiLineString") point = coords[0]?.[Math.floor(coords[0].length / 2)];
    else if (geometry.type === "MultiPolygon") point = centroid(coords[0]?.[0]);
    if (!Array.isArray(point) || point.length < 2) return null;
    const lng = Number(point[0]);
    const lat = Number(point[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;
    return [lng, lat];
  }

  function centroid(points) {
    if (!Array.isArray(points) || !points.length) return null;
    const total = points.reduce((acc, point) => {
      acc.lng += Number(point[0]) || 0;
      acc.lat += Number(point[1]) || 0;
      acc.count += 1;
      return acc;
    }, { lng: 0, lat: 0, count: 0 });
    return total.count ? [total.lng / total.count, total.lat / total.count] : null;
  }

  function primarySource(event) {
    return event.sourceIds.map((id) => state.sourceById.get(id)).find(Boolean);
  }

  function cityMeta(cityId) {
    return (state.index?.cities || []).find((city) => city.city_id === cityId);
  }

  function chunkForYear(year) {
    return (state.eventsIndex?.chunks || []).find((chunk) => Number(chunk.year) === Number(year));
  }

  function categoryConfig(id) {
    return CATEGORY_CONFIG.find((category) => category.id === id) || CATEGORY_CONFIG[0];
  }

  function dominantYearColor(year) {
    const counts = chunkForYear(year)?.counts_by_category || {};
    const pairs = Object.entries(counts).filter(([, count]) => Number(count) > 0).sort((a, b) => Number(b[1]) - Number(a[1]));
    return categoryConfig(pairs[0]?.[0] || "transport").color;
  }

  function confidenceStatus(event) {
    if (event.confidence === "corroborated") return "Corroborated";
    if (event.confidence === "documented") return "Documented";
    if (event.confidence === "inferred") return "Inferred";
    if (event.confidence === "disputed") return "Disputed";
    return "Source-backed";
  }

  function confidenceExplanation(event) {
    if (event.confidence === "corroborated") return "At least two independent organizations support the record.";
    if (event.confidence === "documented") return "Public documentary evidence supports the observed change.";
    if (event.confidence === "inferred") return "Mapped or derived evidence needs explicit date caveats.";
    if (event.confidence === "disputed") return "Evidence is incomplete or contested.";
    return "Evidence strength has not been classified.";
  }

  function formatEventDate(event) {
    if (event.effectiveRange) return `${event.effectiveRange.start || "unknown"} to ${event.effectiveRange.end || "unknown"}`;
    return event.effectiveDate || String(event.year);
  }

  function earliestYear() {
    return state.years[0] || DEFAULT_YEAR;
  }

  function latestYear() {
    return state.years[state.years.length - 1] || DEFAULT_YEAR;
  }

  function clampToYears(year) {
    const numeric = Number(year);
    if (!state.years.length || !Number.isFinite(numeric)) return null;
    return state.years.reduce((best, item) => Math.abs(item - numeric) < Math.abs(best - numeric) ? item : best, state.years[0]);
  }

  function yearPosition(year, min, max) {
    return max <= min ? 0 : ((year - min) / (max - min)) * 100;
  }

  function mapCenter() {
    const center = state.city?.default_center || [-5.9301, 54.5973];
    return [Number(center[0]) || -5.9301, Number(center[1]) || 54.5973];
  }

  function mapPitch() {
    return state.viewMode === "3d" ? 58 : 0;
  }

  function mapBearing() {
    return state.viewMode === "3d" ? -18 : 0;
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
    return response.json();
  }

  async function fetchJsonPost(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.detail || data.error || `${response.status} ${response.statusText} for ${url}`);
    return data;
  }

  function dataPathToUrl(filePath) {
    return "/" + String(filePath || "").replace(/\\/g, "/").replace(/^web\//, "").replace(/^\//, "");
  }

  function shortCityName(name) {
    return String(name || "City").split(",")[0];
  }

  // Titles arrive from upstream catalogs with redundant prefixes that repeat the category
  // (e.g. "311 service request: <type>", "Change of Use planning approval: <description>").
  // Strip those prefixes — the category chip and source provider already convey that context —
  // and cap the remaining text so cards stay scannable.
  const TITLE_PREFIX_PATTERNS = [
    /^Current data layer:\s*/i,
    // Belfast NI Planning record families
    /^(Residential|Other|Change of Use|Mixed Use|Civic|Commercial|Industrial|Agricultural) planning approval:\s*/i,
    // London Open Data record families
    /^Police\.uk (stop-and-search|street-level) record:\s*/i,
    /^London Fire Brigade incident:\s*/i,
    /^Planning (application validated|decision recorded):\s*/i,
    /^HMLR property transaction:\s*/i,
    /^Listed building outline:\s*/i,
    /^UK HPI monthly housing-market record:\s*/i,
    /^Brownfield development site:\s*/i,
    /^Heritage at risk record:\s*/i,
    /^Tree preservation zone:\s*/i,
    /^Historic district designated:\s*/i,
    /^Conservation area record:\s*/i,
    /^Planning\/development evidence record:\s*/i,
    /^Food hygiene rating record:\s*/i,
    // NYC Open Data record families
    /^311 service request:\s*/i,
    /^Capital project (tracker|status):\s*/i,
    /^Street construction permit:\s*/i,
    /^Motor vehicle collision:\s*/i,
    /^HPD affordable housing building:\s*/i,
    /^DOB NOW (job filing|permit issued):\s*/i,
    /^DOB permit issued:\s*/i,
    /^Housing database project:\s*/i,
    /^Certificate of occupancy issued:\s*/i,
    /^FDNY dispatch incident:\s*/i,
    /^LPC permit issued:\s*/i,
    /^Construction street closure:\s*/i,
    /^Permitted civic event:\s*/i,
    /^Street network change:\s*/i,
    /^Individual landmark designated:\s*/i,
    /^Parks property acquisition:\s*/i,
  ];
  const TITLE_MAX_LENGTH = 92;

  function cleanTitle(title) {
    let cleaned = String(title || "Untitled change");
    for (const pattern of TITLE_PREFIX_PATTERNS) cleaned = cleaned.replace(pattern, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    if (!cleaned) cleaned = "Untitled change";
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    if (cleaned.length > TITLE_MAX_LENGTH) {
      cleaned = cleaned.slice(0, TITLE_MAX_LENGTH - 1).replace(/[,;:\s-]+$/, "") + "…";
    }
    return cleaned;
  }

  // Upstream catalogs prepend dense disclaimer language to almost every summary
  // ("Public source material documents this event near …. Related local changes
  // should be treated as associated context, not causal proof.") — informative once,
  // but pure repetition across thousands of cards. Strip the boilerplate filler so
  // the summary line carries only the per-event substance; the same disclaimer is
  // shown once at the evidence drawer, not per card.
  const SUMMARY_BOILERPLATE_PATTERNS = [
    /^Public source material documents this event[^.]*\.\s*/i,
    /Related local changes should be treated as associated context[^.]*\.\s*/i,
    /This is an observed mapped-change record, not a confirmed real-world opening or construction date\.\s*/i,
    /^The planning statistics record documents a planning decision associated with [^.]*\.\s*/i,
    /^OpenStreetMap metadata records this feature as publicly mapped near [^.]*\.\s*/i,
  ];

  function cleanSummary(summary) {
    let cleaned = String(summary || "").trim();
    if (!cleaned) return "Source-backed record. Open details for cited evidence.";
    for (const pattern of SUMMARY_BOILERPLATE_PATTERNS) cleaned = cleaned.replace(pattern, "");
    cleaned = cleaned.replace(/\s+/g, " ").trim();
    return cleaned || "Source-backed record. Open details for cited evidence.";
  }

  function compactNumber(value) {
    const number = Number(value) || 0;
    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
    if (number >= 10000) return `${Math.round(number / 1000)}k`;
    return new Intl.NumberFormat("en-GB").format(number);
  }

  function truncate(value, length) {
    const text = String(value || "");
    return text.length > length ? `${text.slice(0, Math.max(0, length - 3)).trim()}...` : text;
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function renderError(error) {
    const message = `OpenCityLog could not load: ${error.message}`;
    if (els.eventList) els.eventList.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
    setText(els.selectedTitle, "Unable to load atlas");
    setText(els.selectedSummary, message);
    setAppStatus(message);
    console.error(error);
  }

  function setAppStatus(message) {
    if (!els.appStatus) return;
    const text = String(message || "").trim();
    els.appStatus.textContent = text;
    els.appStatus.hidden = !text;
  }

  function toast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.hidden = false;
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 2500);
  }

  function exposeTestApi() {
    window.BimsAtlas = {
      state,
      filteredEvents,
      displayEvents,
      setYear,
      setCategory,
      loadAllEventsForChangelog,
      selectEvent,
      openDetails,
      openProposal,
      runProposal,
      openCompare,
      focusMapOnEvent,
      imageryLayerForYear,
      updateMapImageryForYear,
      recenterMap,
      timelineProfile,
      timelineCountForYear,
      selectedTimeRange,
      selectedTimeEvents,
      eventInSelectedTime,
      syncStateModel,
    };
  }
})();
