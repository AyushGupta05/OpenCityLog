(function () {
  "use strict";

  const CURRENT_YEAR = 2026;
  const TILE_SIZE = 256;
  const MIN_ZOOM = 3;
  const MAX_ZOOM = 15;
  const DETAIL_ZOOM = 15;
  const FOCUS_ZOOM = 14;
  const MAX_LIST_EVENTS = 90;
  const MAX_MARKERS = 70;

  const TILE_PROVIDER = {
    name: "Esri World Imagery",
    template: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri World Imagery Wayback / World Imagery, source-backed event overlays",
  };

  const CATEGORY_CONFIG = [
    { id: "all", label: "All layers", color: "#1268db" },
    { id: "built_environment", label: "Planning", color: "#e9781a" },
    { id: "transport", label: "Transport", color: "#7c5cff" },
    { id: "environment", label: "Environment", color: "#2e9b58" },
    { id: "civic_services", label: "Public services", color: "#0b95b7" },
    { id: "economy", label: "Economy & Demographics", color: "#b7791f" },
  ];

  const CONFIDENCE_LABELS = {
    corroborated: "Corroborated",
    documented: "Documented",
    inferred: "Inferred",
    disputed: "Disputed",
  };

  const CONFIDENCE_SCORE = {
    corroborated: 4,
    documented: 3,
    inferred: 2,
    disputed: 1,
  };

  const FEATURED_YEAR = {
    london: 2026,
    nyc: 2025,
    belfast: 2024,
  };

  const FEATURED_CONTEXT_YEARS = {
    london: [2007, 2008, 2012, 2014, 2020, 2022, 2026],
    nyc: [2004, 2012, 2020, 2025, 2026],
    belfast: [2016, 2020, 2022, 2024],
  };

  const LONDON_FOCUS_TERMS = [
    "olympic",
    "stratford",
    "hackney wick",
    "fish island",
    "three mills",
    "sugar house",
    "elizabeth line",
  ];

  const PLACE_LABELS = {
    london: [
      { label: "Stratford", lng: -0.003, lat: 51.541 },
      { label: "Hackney Wick", lng: -0.024, lat: 51.543 },
      { label: "Queen Elizabeth Olympic Park", lng: -0.014, lat: 51.546 },
      { label: "East Bank", lng: -0.009, lat: 51.548 },
      { label: "Pudding Mill Lane", lng: -0.013, lat: 51.535 },
    ],
    nyc: [
      { label: "Lower Manhattan", lng: -74.006, lat: 40.713 },
      { label: "Brooklyn", lng: -73.95, lat: 40.68 },
      { label: "Queens", lng: -73.87, lat: 40.73 },
    ],
    belfast: [
      { label: "City Centre", lng: -5.93, lat: 54.597 },
      { label: "Titanic Quarter", lng: -5.9, lat: 54.61 },
      { label: "Queen's Quarter", lng: -5.936, lat: 54.584 },
    ],
  };

  const PROPOSAL_PROFILES = {
    housing: {
      label: "Housing or mixed-use",
      categories: ["built_environment", "transport", "civic_services", "economy"],
      signals: ["planning", "housing", "transport", "schools", "health", "retail", "jobs"],
      questions: [
        "Which planning conditions, tenure records, heritage constraints, and delivery dates need checking?",
        "What transport, servicing, public-realm, and civic-service evidence changed around comparable records?",
        "Which source rows distinguish permission, construction, completion, and occupancy?",
      ],
    },
    transport: {
      label: "Street or transit change",
      categories: ["transport", "built_environment", "environment", "civic_services"],
      signals: ["traffic", "transit", "collisions", "bus", "rail", "cycle", "public realm"],
      questions: [
        "Which observed traffic, collision, disruption, and mode-share sources cover the corridor?",
        "Are construction-period disruptions separated from permanent network changes?",
        "Which accessibility, loading, emergency access, and public-realm records should be reviewed?",
      ],
    },
    public_realm: {
      label: "Public realm",
      categories: ["built_environment", "transport", "environment", "economy"],
      signals: ["public realm", "green space", "walking", "cycle", "retail", "heritage"],
      questions: [
        "What changed in footway, open-space, tree, heritage, and frontage evidence before and after comparable schemes?",
        "Are temporary street measures separated from permanent public-realm works?",
        "Which maintenance, accessibility, safety, and local-business records should be added to the brief?",
      ],
    },
    civic_services: {
      label: "Civic or social infrastructure",
      categories: ["civic_services", "built_environment", "transport", "economy"],
      signals: ["schools", "health", "community", "access", "jobs", "transport"],
      questions: [
        "Which service-capacity, accessibility, equalities, and land-use records are available for the area?",
        "Do comparable records show documented opening dates, funding milestones, or only planning approvals?",
        "Which community consultation and statutory-consultee evidence should be attached?",
      ],
    },
    climate: {
      label: "Climate or resilience",
      categories: ["environment", "built_environment", "transport", "civic_services"],
      signals: ["flood", "green infrastructure", "air quality", "heat", "utilities", "active travel"],
      questions: [
        "Which flood, heat, air-quality, tree, drainage, and utility records are source-backed for the site?",
        "Are environmental records direct measurements, policy designations, or inferred mapped layers?",
        "Which monitoring gaps should be closed before design claims are made?",
      ],
    },
  };

  const state = {
    index: null,
    cityId: "",
    cityMeta: null,
    city: null,
    imageryArchive: null,
    beforeImagery: null,
    afterImagery: null,
    beforeMap: null,
    afterMap: null,
    beforeMapLoaded: false,
    afterMapLoaded: false,
    mapSceneReady: false,
    mapSyncing: false,
    eventsIndex: null,
    sources: null,
    availability: null,
    currentState: null,
    evidenceCatalog: null,
    sourceById: new Map(),
    years: [],
    year: CURRENT_YEAR,
    beforeYear: CURRENT_YEAR - 1,
    loadedEvents: new Map(),
    eventsByYear: new Map(),
    category: "all",
    confidence: "all",
    source: "all",
    search: "",
    sort: "relevance",
    selectedEventId: null,
    selectedEvent: null,
    mapCenter: null,
    mapZoom: 12,
    cameraCenter: null,
    cameraZoom: 12,
    cameraFrame: null,
    mapRenderFrame: null,
    mapView: null,
    mapDrag: null,
    compareX: 50,
    compareEnabled: false,
    viewMode: "2d",
    impactMode: "place",
    proposalType: "housing",
    proposalScale: "site",
    proposalStage: "early",
    replayTimer: null,
    timeScrubTimer: null,
    yearRequest: 0,
    listLimit: MAX_LIST_EVENTS,
    allEventsLoaded: false,
    isLoadingAllEvents: false,
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    collectElements();
    wireEvents();
    renderLayerBar();
    renderStaticFilters();
    await loadIndex();
    await loadImageryArchive();
    await loadEvidenceCatalog();
    await loadCity(state.cityId);
    exposeTestApi();
  }

  function collectElements() {
    for (const id of [
      "eventSearch",
      "citySelect",
      "categoryFilter",
      "confidenceFilter",
      "sourceFilter",
      "sortSelect",
      "clearFiltersButton",
      "resetFiltersButton",
      "viewChangelogButton",
      "changeLogTitle",
      "changeLogSubtitle",
      "areaTitle",
      "listMeta",
      "coverageNotice",
      "eventList",
      "layerBar",
      "mapStage",
      "mapViewport",
      "mapPlane",
      "beforeMap",
      "afterMap",
      "beforeTileLayer",
      "afterTileLayer",
      "overlayLayer",
      "markerLayer",
      "placeLabelLayer",
      "mapCallout",
      "calloutYear",
      "calloutTitle",
      "calloutMeta",
      "mapEmpty",
      "mapAttribution",
      "zoomInButton",
      "zoomOutButton",
      "recenterButton",
      "view2dButton",
      "view3dButton",
      "prevYearButton",
      "nextYearButton",
      "timelineDock",
      "yearStrip",
      "yearSlider",
      "timelineSummary",
      "replayButton",
      "compareLabel",
      "compareNote",
      "compareSlider",
      "compareButton",
      "contextLensButton",
      "exportBriefButton",
      "exportJsonButton",
      "copyBriefButton",
      "closeBriefButton",
      "detailIndex",
      "detailTitle",
      "detailSubtitle",
      "briefCoverageStatus",
      "proposalTypeSelect",
      "proposalScaleSelect",
      "proposalStageSelect",
      "copyPlanningReportButton",
      "plannerCompareButton",
      "plannerTrafficButton",
      "loadPlannerEvidenceButton",
      "plannerWorkbench",
      "observedChange",
      "impactModeBar",
      "impactPanel",
      "evidenceFrames",
      "confidenceDot",
      "detailConfidence",
      "confidenceText",
      "limitationsList",
      "causalClaimLabel",
      "causalClaimText",
      "sourceList",
      "catalogSummary",
      "catalogStats",
      "catalogMvpStack",
      "catalogDomainGrid",
      "catalogDomainCount",
      "catalogSourceGrid",
      "catalogSourceCount",
      "catalogFoundationalGrid",
      "catalogFoundationalCount",
      "catalogTimelineList",
      "catalogTimelineCount",
      "catalogAdapters",
      "catalogVisuals",
      "catalogGraphModel",
      "catalogInterpolation",
      "catalogLegalList",
      "catalogOpenQuestions",
      "toast",
    ]) {
      els[id] = document.getElementById(id);
    }
  }

  function wireEvents() {
    els.citySelect.addEventListener("change", () => loadCity(els.citySelect.value));
    els.eventSearch.addEventListener("input", () => {
      state.search = els.eventSearch.value.trim().toLowerCase();
      state.listLimit = MAX_LIST_EVENTS;
      refreshFilteredView({ preferCurrentYear: true });
    });
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        els.eventSearch.focus();
      }
    });
    els.categoryFilter.addEventListener("change", () => {
      state.category = els.categoryFilter.value;
      handleFilterChange();
    });
    els.confidenceFilter.addEventListener("change", () => {
      state.confidence = els.confidenceFilter.value;
      handleFilterChange();
    });
    els.sourceFilter.addEventListener("change", () => {
      state.source = els.sourceFilter.value;
      handleFilterChange();
    });
    els.sortSelect.addEventListener("change", () => {
      state.sort = els.sortSelect.value;
      handleFilterChange();
    });
    els.clearFiltersButton.addEventListener("click", toggleFilterPanel);
    els.resetFiltersButton?.addEventListener("click", clearFilters);
    if (els.viewChangelogButton) {
      els.viewChangelogButton.addEventListener("click", handleChangelogButton);
    }
    els.yearSlider.addEventListener("input", () => setYear(Number(els.yearSlider.value)));
    els.prevYearButton.addEventListener("click", () => stepYear(-1));
    els.nextYearButton.addEventListener("click", () => stepYear(1));
    els.zoomInButton.addEventListener("click", () => setZoom(state.mapZoom + 1));
    els.zoomOutButton.addEventListener("click", () => setZoom(state.mapZoom - 1));
    els.recenterButton.addEventListener("click", recenterMap);
    els.view2dButton.addEventListener("click", () => setViewMode("2d"));
    els.view3dButton.addEventListener("click", () => setViewMode("3d"));
    els.mapViewport.addEventListener("pointerdown", startMapDrag);
    els.mapViewport.addEventListener("pointermove", moveMapDrag);
    els.mapViewport.addEventListener("pointerup", endMapDrag);
    els.mapViewport.addEventListener("pointercancel", endMapDrag);
    els.mapViewport.addEventListener("wheel", zoomMapWheel, { passive: false });
    els.mapPlane.addEventListener("wheel", zoomMapWheel, { passive: false });
    els.compareSlider.addEventListener("input", () => setCompareX(Number(els.compareSlider.value)));
    els.compareButton?.addEventListener("click", () => toggleCompare());
    els.proposalTypeSelect?.addEventListener("change", () => {
      state.proposalType = els.proposalTypeSelect.value;
      renderPlannerWorkbench(state.selectedEvent);
    });
    els.proposalScaleSelect?.addEventListener("change", () => {
      state.proposalScale = els.proposalScaleSelect.value;
      renderPlannerWorkbench(state.selectedEvent);
    });
    els.proposalStageSelect?.addEventListener("change", () => {
      state.proposalStage = els.proposalStageSelect.value;
      renderPlannerWorkbench(state.selectedEvent);
    });
    els.copyPlanningReportButton?.addEventListener("click", copyPlanningReport);
    els.plannerCompareButton?.addEventListener("click", () => toggleCompare(true));
    els.plannerTrafficButton?.addEventListener("click", () => {
      setImpactMode("traffic");
      els.impactPanel?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
    els.loadPlannerEvidenceButton?.addEventListener("click", loadAllEventsForChangelog);
    els.contextLensButton?.addEventListener("click", () => {
      setImpactMode("components");
      els.impactPanel?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
    if (els.impactModeBar) {
      els.impactModeBar.querySelectorAll("[data-impact-mode]").forEach((button) => {
        button.addEventListener("click", () => setImpactMode(button.dataset.impactMode || "place"));
      });
    }
    els.replayButton.addEventListener("click", replayYears);
    els.exportBriefButton.addEventListener("click", exportBrief);
    els.exportJsonButton?.addEventListener("click", exportBriefJson);
    els.copyBriefButton.addEventListener("click", copyBrief);
    els.closeBriefButton?.addEventListener("click", clearSelectedBrief);
    document.querySelectorAll(".section-toggle").forEach((button) => {
      button.addEventListener("click", () => toggleBriefSection(button));
    });
    window.addEventListener("resize", debounce(() => {
      scheduleMapRender();
    }, 150));
  }

  async function loadIndex() {
    try {
      state.index = await fetchJson("/data/city-atlas/index.json");
      state.cityId = getUrlParam("city") || state.index.default_city_id || state.index.cities?.[0]?.city_id || "london";
      renderCitySelect();
    } catch (error) {
      renderFatal(`Could not load city atlas index: ${error.message}`);
    }
  }

  async function loadImageryArchive() {
    try {
      const manifest = await fetchJson("/data/wayback-imagery.json");
      const layers = Array.isArray(manifest.layers) ? manifest.layers.slice().sort((a, b) => String(a.date).localeCompare(String(b.date))) : [];
      state.imageryArchive = layers.length ? { ...manifest, layers } : null;
    } catch (_error) {
      state.imageryArchive = null;
    }
  }

  async function loadEvidenceCatalog() {
    try {
      state.evidenceCatalog = await fetchJson("/data/city-atlas/evidence-catalog.json");
    } catch (_error) {
      state.evidenceCatalog = null;
    }
  }

  function renderCitySelect() {
    const cities = state.index?.cities || [];
    els.citySelect.innerHTML = cities.map((city) => (
      `<option value="${escapeAttr(city.city_id)}">${escapeHtml(shortCityName(city.display_name))}</option>`
    )).join("");
    if (!cities.some((city) => city.city_id === state.cityId)) {
      state.cityId = cities[0]?.city_id || state.cityId;
    }
    els.citySelect.value = state.cityId;
  }

  async function loadCity(cityId) {
    state.cityId = cityId;
    state.cityMeta = (state.index?.cities || []).find((city) => city.city_id === cityId) || state.index?.cities?.[0] || null;
    if (!state.cityMeta) return renderFatal("No city metadata is available.");

    state.loadedEvents = new Map();
    state.eventsByYear = new Map();
    state.availability = null;
    state.currentState = null;
    state.sourceById = new Map();
    state.selectedEventId = null;
    state.selectedEvent = null;
    state.category = "all";
    state.confidence = "all";
    state.source = "all";
    state.search = "";
    state.sort = "relevance";
    state.proposalType = "housing";
    state.proposalScale = "site";
    state.proposalStage = "early";
    state.listLimit = MAX_LIST_EVENTS;
    state.allEventsLoaded = false;
    state.isLoadingAllEvents = false;
    state.compareEnabled = false;
    els.eventSearch.value = "";
    els.categoryFilter.value = "all";
    els.confidenceFilter.value = "all";
    els.sourceFilter.value = "all";
    els.sortSelect.value = "relevance";
    if (els.proposalTypeSelect) els.proposalTypeSelect.value = state.proposalType;
    if (els.proposalScaleSelect) els.proposalScaleSelect.value = state.proposalScale;
    if (els.proposalStageSelect) els.proposalStageSelect.value = state.proposalStage;
    setLoading();

    try {
      const paths = state.cityMeta.artifact_paths || {};
      const [city, eventsIndex, sources, availability, currentState] = await Promise.all([
        fetchJson(dataPathToUrl(paths.city)),
        fetchJson(dataPathToUrl(paths.events)),
        fetchJson(dataPathToUrl(paths.sources)),
        paths.availability ? fetchJson(dataPathToUrl(paths.availability)).catch(() => null) : Promise.resolve(null),
        paths.current_state ? fetchJson(dataPathToUrl(paths.current_state)).catch(() => null) : Promise.resolve(null),
      ]);
      state.city = city;
      state.eventsIndex = eventsIndex;
      state.sources = sources;
      state.availability = availability;
      state.currentState = currentState;
      state.sourceById = new Map((sources.sources || []).map((source) => [source.source_id, source]));
      state.years = getAvailableYears();
      state.year = preferredYear();
      state.beforeYear = preferredBeforeYear(state.year);
      state.mapCenter = city.default_center || [0, 0];
      state.mapZoom = cityMapZoom(city);
      if (state.cameraFrame) {
        window.cancelAnimationFrame(state.cameraFrame);
        state.cameraFrame = null;
      }
      syncCameraToTarget();
      resetTileCache();
      setCompareX(50, { silent: true });
      applyTemporalScene();
      renderChrome();
      renderTimeline();
      initMapScenes();
      setCameraTarget(state.mapCenter, state.mapZoom, { instant: true });
      await ensureContextEvents();
      await ensureYearLoaded(state.year);
      renderSourceFilter();
      renderAll();
      scheduleMapRender();
    } catch (error) {
      renderFatal(`Could not load ${state.cityMeta.display_name}: ${error.message}`);
    }
  }

  function setLoading() {
    renderFocusHeading("loading");
    els.areaTitle.textContent = state.cityMeta?.display_name || "Loading city";
    els.listMeta.textContent = "Loading records";
    els.coverageNotice.innerHTML = `<strong>Coverage loading</strong><span>Source and date coverage will appear with the selected city.</span>`;
    els.eventList.innerHTML = `<div class="empty-state">Loading source-backed city records.</div>`;
    els.markerLayer.innerHTML = "";
    els.overlayLayer.innerHTML = "";
    els.mapEmpty.hidden = true;
    renderEmptyBrief();
  }

  function renderChrome() {
    document.title = `${shortCityName(state.city?.display_name)} - Open Citylog`;
    renderFocusHeading();
    els.areaTitle.textContent = shortCityName(state.city?.display_name);
    els.mapAttribution.textContent = imageryAttribution();
    els.mapStage?.classList.toggle("is-comparing", state.compareEnabled);
    els.compareButton?.setAttribute("aria-pressed", String(state.compareEnabled));
    renderCitySelect();
    renderLayerBar();
    renderCoverageNotice();
    renderEvidenceCatalog();
    scheduleMapRender();
  }

  function renderFocusHeading(mode = "ready") {
    if (!els.changeLogTitle || !els.changeLogSubtitle) return;
    const cityName = shortCityName(state.city?.display_name || state.cityMeta?.display_name || "City atlas");
    if (mode === "loading") {
      els.changeLogTitle.textContent = cityName || "Loading city";
      els.changeLogSubtitle.textContent = "Loading source-backed records and coverage notes";
      return;
    }
    if (state.cityId === "london") {
      els.changeLogTitle.textContent = "Stratford / Olympic Park / Lower Lea Valley";
      els.changeLogSubtitle.textContent = "London focus area within the wider source-backed city atlas";
      return;
    }
    if (state.cityId === "nyc") {
      els.changeLogTitle.textContent = "New York City";
      els.changeLogSubtitle.textContent = "Source-backed citywide atlas; use borough, date, and source filters for review";
      return;
    }
    els.changeLogTitle.textContent = cityName;
    els.changeLogSubtitle.textContent = "Source-backed pilot city atlas with public evidence and limitations";
  }

  function renderStaticFilters() {
    els.categoryFilter.innerHTML = CATEGORY_CONFIG.map((item) => (
      `<option value="${escapeAttr(item.id)}">${escapeHtml(item.label)}</option>`
    )).join("");
    els.confidenceFilter.innerHTML = [
      ["all", "All confidence"],
      ["corroborated", "Corroborated"],
      ["documented", "Documented"],
      ["inferred", "Inferred"],
      ["disputed", "Disputed"],
    ].map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  }

  function renderSourceFilter() {
    const sourceIds = new Set();
    for (const event of state.loadedEvents.values()) {
      (event.source_ids || []).forEach((id) => sourceIds.add(id));
    }
    const options = Array.from(sourceIds).sort((a, b) => sourceLabel(a).localeCompare(sourceLabel(b)));
    els.sourceFilter.innerHTML = `<option value="all">All sources</option>` + options.map((id) => (
      `<option value="${escapeAttr(id)}">${escapeHtml(truncate(sourceLabel(id), 34))}</option>`
    )).join("");
    els.sourceFilter.value = state.source;
  }

  function renderCoverageNotice() {
    const summary = state.availability?.summary || state.city?.data_availability || {};
    const families = Array.isArray(state.availability?.matrix)
      ? state.availability.matrix
      : (state.city?.source_families || []);
    const status = formatAvailabilityStatus(summary.status || state.cityMeta?.availability_status || "partial_source_backed");
    const sourceCount = state.cityMeta?.source_count || state.sources?.source_count || 0;
    const eventCount = state.cityMeta?.event_count || state.eventsIndex?.event_count || 0;
    const leadingFamilies = families
      .slice()
      .sort((a, b) => Number(b.event_count || b.source_ids?.length || 0) - Number(a.event_count || a.source_ids?.length || 0))
      .slice(0, 3)
      .map((family) => family.label)
      .filter(Boolean);
    const summaryText = summary.summary
      || `${shortCityName(state.city?.display_name)} has ${formatNumber(eventCount)} searchable records from ${formatNumber(sourceCount)} discovered public sources.`;
    els.coverageNotice.innerHTML = `
      <strong>${escapeHtml(status)}</strong>
      <span>${escapeHtml(summaryText)}</span>
      ${leadingFamilies.length ? `<small>Strongest visible families: ${escapeHtml(leadingFamilies.join(", "))}.</small>` : ""}
    `;
    if (els.briefCoverageStatus) {
      els.briefCoverageStatus.textContent = `${status}: ${formatNumber(eventCount)} records, ${formatNumber(sourceCount)} sources, ${formatNumber(families.length)} coverage families.`;
    }
  }

  function renderEvidenceCatalog() {
    if (!els.catalogSummary || !els.catalogSourceGrid || !els.catalogTimelineList || !els.catalogStats) return;
    const catalog = state.evidenceCatalog;
    const cityKey = evidenceCatalogCityKey();
    if (!catalog) {
      els.catalogSummary.textContent = "The PDF evidence catalog could not be loaded.";
      clearCatalogSlots();
      return;
    }
    if (!cityKey) {
      const cityFamilyCount = (catalog.city_source_families || []).length;
      const tlCount = (catalog.coverage_timelines || []).length;
      els.catalogSummary.textContent = `Catalog covers New York City and London with ${formatNumber(cityFamilyCount)} source families and ${formatNumber(tlCount)} coverage windows. Switch city to NYC or London to load its stack.`;
      clearCatalogSlots();
      renderCatalogFoundational(catalog.foundational_sources || []);
      renderCatalogAdapters(catalog);
      renderCatalogLegal(catalog);
      renderCatalogOpenQuestions(catalog);
      return;
    }

    const citySources = (catalog.city_source_families || []).filter((source) => source.city === cityKey);
    const foundational = catalog.foundational_sources || [];
    const timelines = (catalog.coverage_timelines || []).filter((item) => item.city === cityKey);
    const domainMatches = catalog.domain_comparison || [];
    const cityName = cityKey === "new_york" ? "New York City" : "London";
    const cityKeyName = cityKey === "new_york" ? "new_york" : "london";
    els.catalogSummary.textContent = `${cityName} catalog loaded from the PDF: ${formatNumber(citySources.length)} city source families, ${formatNumber(foundational.length)} shared foundational layers, ${formatNumber(timelines.length)} conservative coverage windows. ${catalog.executive_summary?.time_caveat || "Treat 2026 annual series as partial unless the source is live."}`;
    els.catalogStats.innerHTML = [
      ["Domains", domainMatches.length],
      ["City families", citySources.length],
      ["Global layers", foundational.length],
      ["Timelines", timelines.length],
    ].map(([label, value]) => `<span><strong>${formatNumber(value)}</strong>${escapeHtml(label)}</span>`).join("");

    renderCatalogMvpStack(catalog, cityKeyName);
    renderCatalogDomains(domainMatches, cityKeyName);
    renderCatalogCitySources(citySources);
    renderCatalogFoundational(foundational);
    renderCatalogTimelines(timelines);
    renderCatalogAdapters(catalog);
    renderCatalogLegal(catalog);
    renderCatalogOpenQuestions(catalog);
  }

  function clearCatalogSlots() {
    if (els.catalogStats) els.catalogStats.innerHTML = "";
    if (els.catalogMvpStack) els.catalogMvpStack.innerHTML = "";
    if (els.catalogDomainGrid) els.catalogDomainGrid.innerHTML = "";
    if (els.catalogDomainCount) els.catalogDomainCount.textContent = "";
    if (els.catalogSourceGrid) els.catalogSourceGrid.innerHTML = "";
    if (els.catalogSourceCount) els.catalogSourceCount.textContent = "";
    if (els.catalogFoundationalGrid) els.catalogFoundationalGrid.innerHTML = "";
    if (els.catalogFoundationalCount) els.catalogFoundationalCount.textContent = "";
    if (els.catalogTimelineList) els.catalogTimelineList.innerHTML = "";
    if (els.catalogTimelineCount) els.catalogTimelineCount.textContent = "";
  }

  function renderCatalogMvpStack(catalog, cityKey) {
    if (!els.catalogMvpStack) return;
    const summary = catalog.executive_summary || {};
    const mvp = summary.mvp_stack || {};
    const cityList = cityKey === "new_york" ? mvp.new_york : mvp.london;
    const otherList = cityKey === "new_york" ? mvp.london : mvp.new_york;
    const otherName = cityKey === "new_york" ? "London peer stack" : "NYC peer stack";
    const ownName = cityKey === "new_york" ? "NYC priority stack" : "London priority stack";
    const strengthsKey = cityKey === "new_york" ? "nyc_strengths" : "london_strengths";
    const strengths = summary[strengthsKey] || [];
    const shared = summary.shared_strengths || [];

    const renderChips = (items) => (items || [])
      .map((item) => `<li>${escapeHtml(String(item))}</li>`)
      .join("") || `<li class="muted">Not specified.</li>`;

    els.catalogMvpStack.innerHTML = `
      <div class="catalog-mvp-block">
        <h4>${escapeHtml(ownName)}</h4>
        <ul class="catalog-chip-list">${renderChips(cityList)}</ul>
      </div>
      <div class="catalog-mvp-block">
        <h4>City strengths</h4>
        <ul class="catalog-chip-list">${renderChips(strengths)}</ul>
      </div>
      <div class="catalog-mvp-block">
        <h4>Shared global layers</h4>
        <ul class="catalog-chip-list">${renderChips(shared)}</ul>
      </div>
      <div class="catalog-mvp-block">
        <h4>${escapeHtml(otherName)}</h4>
        <ul class="catalog-chip-list catalog-chip-list-muted">${renderChips(otherList)}</ul>
      </div>
    `;
  }

  function renderCatalogDomains(domains, cityKey) {
    if (!els.catalogDomainGrid) return;
    const items = domains || [];
    if (els.catalogDomainCount) els.catalogDomainCount.textContent = items.length ? String(items.length) : "";
    if (!items.length) {
      els.catalogDomainGrid.innerHTML = `<div class="empty-state">No domain comparisons in catalog.</div>`;
      return;
    }
    const ownLabel = cityKey === "new_york" ? "NYC priority" : "London priority";
    const peerLabel = cityKey === "new_york" ? "London peer" : "NYC peer";
    els.catalogDomainGrid.innerHTML = items.map((item) => {
      const own = cityKey === "new_york" ? item.new_york_priority_source : item.london_priority_source;
      const peer = cityKey === "new_york" ? item.london_priority_source : item.new_york_priority_source;
      return `
        <article class="catalog-domain-card">
          <header>
            <strong>${escapeHtml(item.domain || item.id || "Domain")}</strong>
          </header>
          <dl>
            <dt>${escapeHtml(ownLabel)}</dt>
            <dd>${escapeHtml(own || "Not listed in PDF.")}</dd>
            <dt>${escapeHtml(peerLabel)}</dt>
            <dd>${escapeHtml(peer || "Not listed in PDF.")}</dd>
          </dl>
          <p>${escapeHtml(item.assessment || "")}</p>
        </article>
      `;
    }).join("");
  }

  function renderCatalogCitySources(citySources) {
    if (!els.catalogSourceGrid) return;
    if (els.catalogSourceCount) els.catalogSourceCount.textContent = citySources.length ? String(citySources.length) : "";
    if (!citySources.length) {
      els.catalogSourceGrid.innerHTML = `<div class="empty-state">No city-specific source families found in catalog.</div>`;
      return;
    }
    els.catalogSourceGrid.innerHTML = citySources.map((source) => renderCatalogSourceCard(source)).join("");
  }

  function renderCatalogFoundational(foundational) {
    if (!els.catalogFoundationalGrid) return;
    if (els.catalogFoundationalCount) els.catalogFoundationalCount.textContent = foundational.length ? String(foundational.length) : "";
    if (!foundational.length) {
      els.catalogFoundationalGrid.innerHTML = `<div class="empty-state">No global foundational sources in catalog.</div>`;
      return;
    }
    els.catalogFoundationalGrid.innerHTML = foundational.map((source) => renderCatalogSourceCard(source)).join("");
  }

  function renderCatalogTimelines(timelines) {
    if (!els.catalogTimelineList) return;
    if (els.catalogTimelineCount) els.catalogTimelineCount.textContent = timelines.length ? String(timelines.length) : "";
    if (!timelines.length) {
      els.catalogTimelineList.innerHTML = `<div class="empty-state">No coverage windows supplied for this city.</div>`;
      return;
    }
    els.catalogTimelineList.innerHTML = timelines.map((item) => {
      const startYear = String(item.start_date || "").slice(0, 4);
      const endYear = String(item.end_date || "").slice(0, 4);
      const startN = Number(startYear);
      const endN = Number(endYear);
      const widthPct = Number.isFinite(startN) && Number.isFinite(endN) && endN >= startN
        ? Math.max(((endN - startN) / 26) * 100, 4)
        : 4;
      const offsetPct = Number.isFinite(startN)
        ? Math.max(((startN - 2000) / 26) * 100, 0)
        : 0;
      return `
        <article class="catalog-timeline-item">
          <header>
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(startYear)} – ${escapeHtml(endYear)}</span>
          </header>
          <div class="catalog-timeline-bar" aria-hidden="true">
            <span style="left:${offsetPct}%; width:${widthPct}%;"></span>
          </div>
          <small>${escapeHtml(item.source_basis || "")}</small>
        </article>
      `;
    }).join("");
  }

  function renderCatalogAdapters(catalog) {
    const guidance = catalog.implementation_guidance || {};
    if (els.catalogAdapters) {
      const adapters = guidance.adapter_patterns || [];
      els.catalogAdapters.innerHTML = adapters.length
        ? adapters.map((adapter) => `
            <div class="catalog-adapter-row">
              <strong>${escapeHtml(adapter.id || "")}</strong>
              <span>${escapeHtml(adapter.description || "")}</span>
            </div>
          `).join("")
        : `<div class="empty-state">No adapter patterns recorded.</div>`;
    }
    if (els.catalogVisuals) {
      const visuals = guidance.recommended_visual_products || [];
      els.catalogVisuals.innerHTML = visuals.length
        ? `<h4>Recommended visual products</h4><ul class="catalog-bullet-list">${visuals.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : "";
    }
    if (els.catalogGraphModel) {
      els.catalogGraphModel.textContent = guidance.graph_model || "";
    }
    if (els.catalogInterpolation) {
      els.catalogInterpolation.textContent = guidance.interpolation_strategy || "";
    }
  }

  function renderCatalogLegal(catalog) {
    if (!els.catalogLegalList) return;
    const items = catalog.legal_ethics_constraints || [];
    els.catalogLegalList.innerHTML = items.length
      ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : `<li class="muted">No constraints recorded.</li>`;
  }

  function renderCatalogOpenQuestions(catalog) {
    if (!els.catalogOpenQuestions) return;
    const items = catalog.open_questions_limitations || [];
    els.catalogOpenQuestions.innerHTML = items.length
      ? items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : `<li class="muted">No open questions recorded.</li>`;
  }

  function renderCatalogSourceCard(source) {
    const href = Array.isArray(source.direct_access) ? source.direct_access.find((url) => /^https?:\/\//.test(url)) : "";
    const adapter = source.recommended_adapter || "Adapter pending";
    const confidence = source.confidence ? `${source.confidence} confidence` : "confidence not supplied";
    const license = source.license_terms ? `<small class="catalog-source-license">${escapeHtml(truncate(source.license_terms, 140))}</small>` : "";
    return `
      <article class="catalog-source-card">
        <div>
          <strong>${escapeHtml(source.source_family || source.id || "Evidence source")}</strong>
          <span>${escapeHtml(adapter)}</span>
        </div>
        <p>${escapeHtml(truncate(source.suggested_use_quality_notes || source.coverage_and_gaps || "Catalog source family", 220))}</p>
        <small>${escapeHtml(confidence)} · ${escapeHtml(source.update_frequency || "cadence varies")} · ${escapeHtml(source.spatial_granularity || "granularity unspecified")}</small>
        ${license}
        ${href ? `<a href="${escapeAttr(href)}" target="_blank" rel="noreferrer">Open source</a>` : ""}
      </article>
    `;
  }

  function evidenceCatalogCityKey() {
    if (state.cityId === "nyc" || state.cityId === "new_york") return "new_york";
    if (state.cityId === "london") return "london";
    return "";
  }

  function renderLayerBar() {
    els.layerBar.innerHTML = CATEGORY_CONFIG.map((item) => (
      `<button class="layer-button" type="button" data-category="${escapeAttr(item.id)}" aria-pressed="${state.category === item.id}" style="--layer-color:${item.color}">
        <span class="layer-dot" aria-hidden="true"></span>${escapeHtml(item.label)}
      </button>`
    )).join("");
    els.layerBar.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        state.category = button.dataset.category || "all";
        els.categoryFilter.value = state.category;
        handleFilterChange();
      });
    });
  }

  async function ensureContextEvents() {
    const chunks = state.eventsIndex?.chunks || [];
    const cityId = state.cityId;
    const featuredContext = new Set(FEATURED_CONTEXT_YEARS[cityId] || []);
    const candidates = chunks.filter((chunk) => {
      const year = Number(chunk.year);
      return year === state.year
        || year === state.beforeYear
        || year === FEATURED_YEAR[cityId]
        || featuredContext.has(year);
    });
    await Promise.all(candidates.map((chunk) => ensureYearLoaded(Number(chunk.year), { silent: true })));
  }

  async function ensureYearLoaded(year, options = {}) {
    const numericYear = Number(year);
    if (!Number.isFinite(numericYear)) return [];
    if (state.eventsByYear.has(numericYear)) return state.eventsByYear.get(numericYear);

    if (!options.silent) els.listMeta.textContent = `Loading ${numericYear}`;
    const chunk = (state.eventsIndex?.chunks || []).find((item) => Number(item.year) === numericYear);
    if (!chunk || !chunk.event_count) {
      state.eventsByYear.set(numericYear, []);
      return [];
    }

    const data = await fetchJson(dataPathToUrl(chunk.json_path));
    const events = Array.isArray(data) ? data : (data.events || []);
    state.eventsByYear.set(numericYear, events);
    events.forEach((event) => state.loadedEvents.set(event.event_id, event));
    return events;
  }

  function renderAll(options = {}) {
    renderSourceFilter();
    renderEventList();
    renderMap();
    renderTimeline();
    if (!options.preserveSelection && !state.selectedEvent) selectInitialEvent();
    if (state.selectedEvent) renderBrief(state.selectedEvent);
  }

  function handleFilterChange() {
    state.listLimit = MAX_LIST_EVENTS;
    renderLayerBar();
    refreshFilteredView({ preferCurrentYear: true });
  }

  async function handleChangelogButton() {
    if (!state.allEventsLoaded) {
      await loadAllEventsForChangelog();
      return;
    }
    state.listLimit += MAX_LIST_EVENTS;
    renderEventList();
    els.eventList?.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  async function loadAllEventsForChangelog() {
    if (state.isLoadingAllEvents) return;
    state.isLoadingAllEvents = true;
    renderEventList();
    try {
      const chunks = state.eventsIndex?.chunks || [];
      for (const chunk of chunks) {
        await ensureYearLoaded(Number(chunk.year), { silent: true });
      }
      state.allEventsLoaded = true;
      state.listLimit = Math.max(state.listLimit, MAX_LIST_EVENTS);
      renderSourceFilter();
      renderAll({ preserveSelection: true });
      toast("Full city changelog loaded.");
    } catch (error) {
      toast(`Could not load full changelog: ${error.message}`);
    } finally {
      state.isLoadingAllEvents = false;
      renderEventList();
    }
  }

  function refreshFilteredView(options = {}) {
    if (state.selectedEvent && matchesFilters(state.selectedEvent)) {
      renderAll({ preserveSelection: true });
      return;
    }
    state.selectedEventId = null;
    state.selectedEvent = null;
    const selected = pickInitialEvent(options);
    if (selected) {
      selectEvent(selected.event_id);
      return;
    }
    renderAll();
  }

  function renderEventList() {
    const filtered = filteredEvents();
    const shown = filtered.slice(0, state.listLimit);
    const cityTotal = Number(state.eventsIndex?.event_count || filtered.length);
    const loadedCount = state.loadedEvents.size;
    els.areaTitle.textContent = listScopeText();
    els.listMeta.textContent = state.allEventsLoaded
      ? `Showing ${formatNumber(shown.length)} of ${formatNumber(filtered.length)} matching records`
      : `Showing ${formatNumber(shown.length)} of ${formatNumber(filtered.length)} loaded records (${formatNumber(cityTotal)} city total)`;
    renderChangelogButton(filtered.length, shown.length, cityTotal, loadedCount);
    if (!shown.length) {
      els.eventList.innerHTML = `<div class="empty-state">No records match these filters. Try another category, year, confidence, or source.</div>`;
      return;
    }
    els.eventList.innerHTML = shown.map((event, index) => renderEventCard(event, index)).join("");
    els.eventList.querySelectorAll("[data-event-id]").forEach((button) => {
      button.addEventListener("click", () => selectEvent(button.dataset.eventId));
    });
  }

  function renderChangelogButton(filteredCount, shownCount, cityTotal, loadedCount) {
    if (!els.viewChangelogButton) return;
    els.viewChangelogButton.disabled = state.isLoadingAllEvents;
    if (state.isLoadingAllEvents) {
      els.viewChangelogButton.textContent = `Loading city records (${formatNumber(loadedCount)} of ${formatNumber(cityTotal)})`;
      return;
    }
    if (!state.allEventsLoaded) {
      els.viewChangelogButton.textContent = `Load full city changelog (${formatNumber(cityTotal)} records)`;
      return;
    }
    if (shownCount < filteredCount) {
      const next = Math.min(MAX_LIST_EVENTS, filteredCount - shownCount);
      els.viewChangelogButton.disabled = false;
      els.viewChangelogButton.textContent = `Show ${formatNumber(next)} more matching records`;
      return;
    }
    els.viewChangelogButton.disabled = true;
    els.viewChangelogButton.textContent = "All matching records shown";
  }

  function listScopeText() {
    const city = shortCityName(state.city?.display_name || state.cityMeta?.display_name);
    const loadedYears = Array.from(state.eventsByYear.keys()).sort((a, b) => a - b);
    const yearText = loadedYears.length
      ? `${loadedYears[0]}-${loadedYears[loadedYears.length - 1]}`
      : "loading";
    const scope = state.allEventsLoaded ? "all years" : `loaded years ${yearText}`;
    return `${city}: map shows ${state.year}; changelog spans ${scope}`;
  }

  function renderEventCard(event, index) {
    const config = categoryConfig(event.category);
    const selected = state.selectedEventId === event.event_id;
    return `
      <button class="event-card" type="button" role="listitem" data-event-id="${escapeAttr(event.event_id)}" aria-selected="${selected}" style="--event-color:${config.color}">
        ${renderEventThumb(event, index + 1)}
        <span class="event-main">
          <span class="event-title-line">
            <span class="event-number">${index + 1}</span>
            <strong>${escapeHtml(cleanTitle(event.title))}</strong>
          </span>
          <time>${escapeHtml(formatEventDate(event))}</time>
          <span class="tag-row">
            <span class="category-pill">${escapeHtml(config.label)}</span>
            <span class="confidence-pill">${escapeHtml(confidenceLabel(event.confidence))}</span>
          </span>
          <p>${escapeHtml(event.affected_area?.label || event.explanation || "Mapped city record")}</p>
        </span>
        <span class="chevron" aria-hidden="true"></span>
      </button>
    `;
  }

  function renderEventThumb(event, number) {
    const point = eventPoint(event);
    const config = categoryConfig(event.category);
    if (!point) {
      return `
        <span class="event-thumb fallback" style="--thumb-bg:${fallbackGradient(config.color)}">
          <span class="thumb-index">${number}</span>
        </span>
      `;
    }
    return `
      <span class="event-thumb">
        ${miniTileHtml(point, Math.max(MIN_ZOOM, Math.min(DETAIL_ZOOM, state.mapZoom + 2)), 136, 136, imageryForYear(event.year))}
        <span class="thumb-index">${number}</span>
      </span>
    `;
  }

  function renderMap() {
    const events = filteredMapEvents();
    const mappable = events
      .map((event) => ({ event, point: eventPoint(event) }))
      .filter((item) => item.point)
      .slice(0, MAX_MARKERS);
    if (state.selectedEvent) {
      const selectedPoint = eventPoint(state.selectedEvent);
      if (selectedPoint && !mappable.some((item) => item.event.event_id === state.selectedEvent.event_id)) {
        mappable.unshift({ event: state.selectedEvent, point: selectedPoint });
      }
    }
    els.mapEmpty.hidden = mappable.length > 0;
    renderOverlay(mappable);
    renderPlaceLabels();
    els.markerLayer.innerHTML = mappable.map(({ event, point }, index) => {
      const pos = project(point);
      const config = categoryConfig(event.category);
      const selected = state.selectedEventId === event.event_id;
      const markerIndex = selected ? 1 : index + 1;
      return `
        <button class="map-marker" type="button" data-event-id="${escapeAttr(event.event_id)}" aria-selected="${selected}" aria-label="${escapeAttr(cleanTitle(event.title))}" style="left:${pos.x}%;top:${pos.y}%;--marker-color:${config.color}">
          <span>${markerIndex}</span>
        </button>
      `;
    }).join("");
    els.markerLayer.querySelectorAll("[data-event-id]").forEach((button) => {
      button.addEventListener("click", () => selectEvent(button.dataset.eventId));
    });
    if (state.selectedEvent) renderMapCallout(state.selectedEvent);
  }

  function renderPlaceLabels() {
    if (!els.placeLabelLayer) return;
    const labels = PLACE_LABELS[state.cityId] || [];
    els.placeLabelLayer.innerHTML = labels.map((place) => {
      const pos = project({ lng: place.lng, lat: place.lat });
      const hidden = pos.x <= 2 || pos.x >= 98 || pos.y <= 3 || pos.y >= 94;
      return `<span class="place-label ${hidden ? "is-edge" : ""}" style="left:${pos.x}%;top:${pos.y}%">${escapeHtml(place.label)}</span>`;
    }).join("");
  }

  function renderOverlay(items) {
    const selected = state.selectedEvent ? { event: state.selectedEvent, point: eventPoint(state.selectedEvent) } : null;
    const overlayItems = selected?.point
      ? [selected, ...items.filter((item) => item.event.event_id !== selected.event.event_id).slice(0, 9)]
      : items.slice(0, 10);
    const areas = overlayItems.map(({ event, point }, index) => {
      const pos = project(point);
      const config = categoryConfig(event.category);
      return `<path class="overlay-area" d="${blobPath(pos, index)}" style="--area-color:${config.color}"></path>`;
    }).join("");
    const lines = selected?.point
      ? items.slice(0, 4).map(({ point }) => {
        const a = project(selected.point);
        const b = project(point);
        return `<line class="overlay-line" x1="${a.x * 10}" y1="${a.y * 10}" x2="${b.x * 10}" y2="${b.y * 10}"></line>`;
      }).join("")
      : "";
    els.overlayLayer.setAttribute("viewBox", "0 0 1000 1000");
    els.overlayLayer.innerHTML = lines + areas;
  }

  function blobPath(pos, index) {
    const cx = pos.x * 10;
    const cy = pos.y * 10;
    const rx = 58 + (index % 3) * 14;
    const ry = 42 + (index % 2) * 12;
    const skew = (index % 4) * 6;
    return [
      `M ${cx - rx} ${cy - skew}`,
      `C ${cx - rx * 0.8} ${cy - ry}, ${cx - rx * 0.15} ${cy - ry * 1.16}, ${cx + rx * 0.58} ${cy - ry * 0.74}`,
      `C ${cx + rx * 1.04} ${cy - ry * 0.28}, ${cx + rx * 0.88} ${cy + ry * 0.72}, ${cx + rx * 0.25} ${cy + ry}`,
      `C ${cx - rx * 0.42} ${cy + ry * 0.92}, ${cx - rx * 1.06} ${cy + ry * 0.42}, ${cx - rx} ${cy - skew}`,
      "Z",
    ].join(" ");
  }

  function renderMapCallout(event) {
    const point = eventPoint(event);
    if (!point) {
      els.mapCallout.hidden = true;
      return;
    }
    const pos = project(point);
    const calloutX = clamp(pos.x + 4, 6, 86);
    const calloutY = clamp(pos.y - 6, 18, 76);
    els.mapStage.style.setProperty("--callout-x", `${calloutX}%`);
    els.mapStage.style.setProperty("--callout-y", `${calloutY}%`);
    els.calloutYear.textContent = `Observed ${event.year || state.year}`;
    els.calloutTitle.textContent = cleanTitle(event.title);
    els.calloutMeta.textContent = event.affected_area?.label || categoryConfig(event.category).label;
    els.mapCallout.hidden = false;
    avoidTimelineCalloutOverlap(calloutY);
  }

  function avoidTimelineCalloutOverlap(initialY) {
    if (!els.timelineDock || !els.mapCallout || els.mapCallout.hidden) return;
    const stageRect = els.mapStage.getBoundingClientRect();
    const timelineRect = els.timelineDock.getBoundingClientRect();
    const calloutRect = els.mapCallout.getBoundingClientRect();
    if (!stageRect.height || !timelineRect.height || !calloutRect.height) return;
    const overlapsTimeline = calloutRect.left < timelineRect.right + 10
      && calloutRect.right > timelineRect.left - 10
      && calloutRect.top < timelineRect.bottom + 10
      && calloutRect.bottom > timelineRect.top - 10;
    if (!overlapsTimeline) return;
    const maxTopPx = timelineRect.top - stageRect.top - calloutRect.height - 14;
    const maxY = (maxTopPx / stageRect.height) * 100;
    const nextY = clamp(Math.min(initialY, maxY), 18, 76);
    els.mapStage.style.setProperty("--callout-y", `${nextY}%`);
  }

  function renderTimeline() {
    const years = timelineYears();
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const imageryPair = selectImageryPair(state.beforeYear, state.year);
    state.beforeImagery = imageryPair.before;
    state.afterImagery = imageryPair.after;
    els.yearSlider.min = String(minYear);
    els.yearSlider.max = String(maxYear);
    els.yearSlider.value = String(state.year);
    els.prevYearButton.disabled = state.year <= minYear;
    els.nextYearButton.disabled = state.year >= maxYear;
    const activeCount = yearEventCount(state.year);
    const sourceCount = state.cityMeta?.source_count || state.sources?.source_count || 0;
    const recordWord = activeCount === 1 ? "record" : "records";
    const listScope = state.allEventsLoaded ? "full changelog loaded" : "changelog shows loaded years";
    els.timelineSummary.textContent = `${state.year}: ${formatNumber(activeCount)} observed ${recordWord} on the map; ${formatNumber(sourceCount)} sources; ${listScope}; satellite ${imageryLabel(state.afterImagery, state.year)}`;
    els.compareLabel.textContent = `${state.beforeYear} -> ${state.year}`;
    els.compareNote.textContent = state.compareEnabled
      ? `${Math.abs(Number(state.year) - Number(state.beforeYear))} years compared`
      : "Compare split is off";
    els.yearStrip.innerHTML = timelineTicks(years).map((year) => `<span>${year}</span>`).join("");
    applyTemporalScene();
    updateMapLibreImagery();
  }

  function timelineTicks(years) {
    const min = Math.min(...years);
    const max = Math.max(...years);
    if (max <= min) return [min];
    const ticks = new Set([min, max, state.beforeYear, state.year]);
    const step = Math.max(1, Math.round((max - min) / 6));
    for (let year = min; year <= max; year += step) ticks.add(year);
    return Array.from(ticks).filter((year) => year >= min && year <= max).sort((a, b) => a - b).slice(0, 9);
  }

  function renderBrief(event) {
    const filtered = filteredEvents();
    const index = Math.max(0, filtered.findIndex((item) => item.event_id === event.event_id));
    const config = categoryConfig(event.category);
    renderCoverageNotice();
    els.detailIndex.textContent = String(index + 1);
    els.detailIndex.style.background = config.color;
    els.detailTitle.textContent = cleanTitle(event.title);
    els.detailSubtitle.textContent = `${formatEventDate(event)} - ${config.label}`;
    els.observedChange.textContent = event.explanation || "This record identifies an observed city change and links it to public evidence.";
    els.detailConfidence.textContent = confidenceLabel(event.confidence);
    els.confidenceDot.style.background = confidenceColor(event.confidence);
    els.confidenceText.textContent = confidenceText(event);
    renderEvidenceFrames(event);
    renderPlannerWorkbench(event);
    renderImpactModeControls();
    renderImpactPanel(event);
    renderLimitations(event);
    renderCausalClaim(event);
    renderSources(event);
  }

  function renderEmptyBrief() {
    els.detailIndex.textContent = "1";
    els.detailTitle.textContent = "Select a record";
    els.detailSubtitle.textContent = "Choose a changelog item or map marker.";
    if (els.briefCoverageStatus) els.briefCoverageStatus.textContent = "Coverage status loads with the city.";
    els.observedChange.textContent = "Loading source-backed records.";
    if (els.impactPanel) els.impactPanel.innerHTML = `<p>Select an event to inspect associated place, mobility, and component context.</p>`;
    renderPlannerWorkbench(null);
    els.evidenceFrames.innerHTML = "";
    els.detailConfidence.textContent = "No event";
    els.confidenceText.textContent = "Select an event to see evidence strength.";
    els.limitationsList.innerHTML = `<li>Coverage and licensing notes load with the selected record.</li>`;
    els.causalClaimLabel.textContent = "Not assessed";
    els.causalClaimText.textContent = "Select an event to see whether the evidence supports a causal claim.";
    els.sourceList.innerHTML = "";
  }

  function renderEvidenceFrames(event) {
    const point = eventPoint(event);
    const config = categoryConfig(event.category);
    const eventYear = Number(event.year) || state.year;
    const before = event.traffic_metrics?.beforeYear
      || (state.beforeYear < eventYear ? state.beforeYear : nearestYearBefore(eventYear));
    const during = eventYear;
    const after = event.traffic_metrics?.afterYear || state.year || eventYear;
    const zoom = Math.max(MIN_ZOOM, Math.min(DETAIL_ZOOM, state.mapZoom));
    const beforeImagery = imageryForYear(before);
    const duringImagery = imageryForYear(during);
    const afterImagery = imageryForYear(after);
    const beforeBg = point ? tileBackground(point, zoom, beforeImagery) : fallbackGradient(config.color);
    const duringBg = point ? tileBackground(point, zoom, duringImagery) : fallbackGradient(config.color);
    const afterBg = point ? tileBackground(point, zoom, afterImagery) : fallbackGradient(config.color);
    els.evidenceFrames.innerHTML = `
      <p class="frame-note">Imagery comparison: ${escapeHtml(imageryFrameLabel(beforeImagery, before))} baseline, ${escapeHtml(imageryFrameLabel(duringImagery, during))} event-period context, and ${escapeHtml(imageryFrameLabel(afterImagery, after))} latest comparison.</p>
      <div class="mini-frame" style="--thumb-bg:${beforeBg};--event-color:${config.color}">
        <em class="frame-tag">Before</em>
        <strong>${escapeHtml(imageryFrameLabel(beforeImagery, before))}</strong>
        <span aria-hidden="true"></span>
      </div>
      <div class="mini-frame" style="--thumb-bg:${duringBg};--event-color:${config.color}">
        <em class="frame-tag">Event</em>
        <strong>${escapeHtml(imageryFrameLabel(duringImagery, during))}</strong>
        <span aria-hidden="true"></span>
      </div>
      <div class="mini-frame" style="--thumb-bg:${afterBg};--event-color:${config.color}">
        <em class="frame-tag">After</em>
        <strong>${escapeHtml(imageryFrameLabel(afterImagery, after))}</strong>
        <span aria-hidden="true"></span>
      </div>
    `;
  }

  function proposalProfile(type) {
    return PROPOSAL_PROFILES[type] || PROPOSAL_PROFILES.housing;
  }

  function renderPlannerWorkbench(event) {
    if (!els.plannerWorkbench) return;
    if (els.copyPlanningReportButton) els.copyPlanningReportButton.disabled = !event;
    if (els.plannerCompareButton) els.plannerCompareButton.disabled = !event;
    if (els.plannerTrafficButton) els.plannerTrafficButton.disabled = !event;
    if (!event) {
      els.plannerWorkbench.innerHTML = `<p>Select a source-backed event to build a planning report from observed precedent, imagery dates, traffic evidence, and source caveats.</p>`;
      return;
    }

    const report = planningReportPayload(event);
    const readiness = planningReadiness(report);
    const questionList = report.design_questions.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const gapList = report.data_gaps.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    els.plannerWorkbench.innerHTML = `
      <div class="planner-status-grid">
        ${readiness.map((item) => `
          <article class="planner-status ${escapeAttr(item.status)}">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
            <small>${escapeHtml(item.note)}</small>
          </article>
        `).join("")}
      </div>

      <article class="planner-diff-card">
        <div class="planner-card-head">
          <span class="impact-kicker">Before/after diff</span>
          <strong>${escapeHtml(report.selected_event?.title || "Selected precedent")}</strong>
        </div>
        <div class="planner-diff-grid">
          <div>
            <span>Before</span>
            <strong>${escapeHtml(String(report.before_after.before_year))}</strong>
            <small>${escapeHtml(report.before_after.before_imagery_label)}</small>
            <em>${formatNumber(report.evidence.before_window.count)} related records loaded</em>
          </div>
          <div>
            <span>After</span>
            <strong>${escapeHtml(String(report.before_after.after_year))}</strong>
            <small>${escapeHtml(report.before_after.after_imagery_label)}</small>
            <em>${formatNumber(report.evidence.after_window.count)} related records loaded</em>
          </div>
        </div>
        <p>${escapeHtml(report.before_after.note)}</p>
      </article>

      <article class="planner-traffic-card">
        <div class="planner-card-head">
          <span class="impact-kicker">Traffic evidence</span>
          <strong>${escapeHtml(report.traffic.heading)}</strong>
        </div>
        <div class="planner-traffic-grid">
          <div><span>Before window</span><strong>${formatNumber(report.traffic.before_window.count)}</strong></div>
          <div><span>After window</span><strong>${formatNumber(report.traffic.after_window.count)}</strong></div>
          <div><span>Observed metrics</span><strong>${formatNumber(report.traffic.observed_metric_count)}</strong></div>
        </div>
        <p>${escapeHtml(report.traffic.note)}</p>
      </article>

      <details class="planner-report-block" open>
        <summary>Planner questions and gaps</summary>
        <div class="planner-two-col">
          <div>
            <strong>Review questions</strong>
            <ul>${questionList}</ul>
          </div>
          <div>
            <strong>Data gaps</strong>
            <ul>${gapList}</ul>
          </div>
        </div>
      </details>

      <div class="planner-analogue-list">
        <div class="planner-card-head">
          <span class="impact-kicker">Historical analogues</span>
          <strong>${formatNumber(report.analogues.length)} loaded precedents</strong>
        </div>
        ${report.analogues.length ? report.analogues.map((item) => `
          <article class="planner-analogue">
            <span>${escapeHtml(item.year || "date unknown")}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.reason)}</small>
          </article>
        `).join("") : `<p>No close analogue is loaded yet. Load full city evidence or broaden filters before treating this as a coverage finding.</p>`}
      </div>
      <p class="planner-caveat">This is a planning screen built from observed records. It does not forecast, simulate, or prove project effects.</p>
    `;
  }

  function planningReportPayload(event) {
    const profile = proposalProfile(state.proposalType);
    const beforeYear = plannerBeforeYear(event);
    const afterYear = plannerAfterYear(event, beforeYear);
    const eventYear = plannerEventYear(event) || state.year;
    const beforeImagery = imageryForYear(beforeYear);
    const afterImagery = imageryForYear(afterYear);
    const traffic = plannerTrafficSummary(event, beforeYear, afterYear);
    const evidence = plannerEvidenceCounts(profile, beforeYear, afterYear, eventYear);
    const analogues = plannerAnalogueEvents(event, profile, 5);
    const sourceCount = Math.max((event?.evidence || []).length, (event?.source_ids || []).length);
    const dataGaps = plannerDataGaps(event, traffic, evidence, sourceCount);
    return {
      product: "Open Citylog",
      mode: "Architecture planning workbench",
      proposal: {
        type: state.proposalType,
        type_label: profile.label,
        scale: state.proposalScale,
        stage: state.proposalStage,
      },
      caveat: "Historical evidence screen only. It does not forecast, simulate, or prove future project effects.",
      selected_event: event ? {
        event_id: event.event_id,
        title: cleanTitle(event.title),
        year: plannerEventYear(event),
        date: formatEventDate(event),
        category: event.category,
        confidence: event.confidence,
        place: event.affected_area?.label || shortCityName(state.city?.display_name),
        source_count: sourceCount,
      } : null,
      before_after: {
        before_year: beforeYear,
        after_year: afterYear,
        event_year: eventYear,
        before_imagery_label: imageryFrameLabel(beforeImagery, beforeYear),
        after_imagery_label: imageryFrameLabel(afterImagery, afterYear),
        note: beforeAfterPlanningNote(beforeImagery, afterImagery, beforeYear, afterYear),
      },
      evidence,
      traffic,
      analogues,
      design_questions: profile.questions,
      data_gaps: dataGaps,
      linked_sources: event ? linkedSourcesForEvent(event) : [],
      loaded_scope: state.allEventsLoaded
        ? "Full city changelog loaded in browser"
        : "Only the currently loaded timeline years are included in counts and analogues",
    };
  }

  function plannerBeforeYear(event) {
    const explicit = Number(event?.traffic_metrics?.beforeYear);
    if (Number.isFinite(explicit)) return explicit;
    const eventYear = plannerEventYear(event);
    if (Number.isFinite(eventYear)) return nearestYearBefore(eventYear);
    return Number(state.beforeYear) || CURRENT_YEAR - 1;
  }

  function plannerAfterYear(event, beforeYear) {
    const explicit = Number(event?.traffic_metrics?.afterYear);
    const eventYear = plannerEventYear(event);
    const fallback = Math.max(Number(state.year) || CURRENT_YEAR, Number(eventYear) || CURRENT_YEAR);
    const candidate = Number.isFinite(explicit) ? explicit : fallback;
    return candidate < beforeYear ? beforeYear : candidate;
  }

  function beforeAfterPlanningNote(beforeImagery, afterImagery, beforeYear, afterYear) {
    const notes = [];
    if (beforeImagery?.is_earliest_available) {
      notes.push(`before imagery falls back to ${beforeImagery.date}, the earliest archive`);
    }
    if (afterImagery?.is_latest_available) {
      notes.push(`after imagery falls back to ${afterImagery.date}, the latest archive`);
    }
    if (!notes.length) notes.push(`imagery is selected for ${beforeYear} and ${afterYear} where archive coverage exists`);
    return `${notes.join("; ")}. Inspect linked sources before treating visual difference as proof of delivery.`;
  }

  function plannerEvidenceCounts(profile, beforeYear, afterYear, eventYear) {
    const beforeWindow = { start: beforeYear - 2, end: beforeYear };
    const afterWindow = { start: Math.min(eventYear, afterYear), end: afterYear };
    const categoryCounts = new Map();
    let relevantLoaded = 0;
    let beforeCount = 0;
    let afterCount = 0;
    for (const item of state.loadedEvents.values()) {
      if (!eventMatchesProposal(item, profile)) continue;
      relevantLoaded += 1;
      categoryCounts.set(item.category || "unknown", (categoryCounts.get(item.category || "unknown") || 0) + 1);
      const year = plannerEventYear(item);
      if (!Number.isFinite(year)) continue;
      if (year >= beforeWindow.start && year <= beforeWindow.end) beforeCount += 1;
      if (year >= afterWindow.start && year <= afterWindow.end) afterCount += 1;
    }
    const categories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, label: categoryConfig(category).label || signalLabel(category), count }));
    return {
      loaded_record_count: state.loadedEvents.size,
      full_city_loaded: state.allEventsLoaded,
      relevant_loaded_count: relevantLoaded,
      before_window: { ...beforeWindow, count: beforeCount },
      after_window: { ...afterWindow, count: afterCount },
      categories,
    };
  }

  function plannerTrafficSummary(event, beforeYear, afterYear) {
    const metric = observedTrafficMetric(event);
    const deltas = observedTrafficDeltas(event);
    const eventYear = plannerEventYear(event) || afterYear;
    const beforeWindow = { start: beforeYear - 2, end: beforeYear, count: 0 };
    const afterWindow = { start: Math.min(eventYear, afterYear), end: afterYear, count: 0 };
    const examples = [];
    for (const item of state.loadedEvents.values()) {
      if (!isTrafficEvidence(item)) continue;
      const year = plannerEventYear(item);
      if (!Number.isFinite(year)) continue;
      if (year >= beforeWindow.start && year <= beforeWindow.end) beforeWindow.count += 1;
      if (year >= afterWindow.start && year <= afterWindow.end) afterWindow.count += 1;
      if (examples.length < 4 && year >= beforeWindow.start && year <= afterWindow.end) {
        examples.push({ title: cleanTitle(item.title), year: String(year), source_ids: item.source_ids || [] });
      }
    }
    const observedMetricCount = (metric ? 1 : 0) + deltas.length;
    const hasTrafficContext = observedMetricCount > 0 || beforeWindow.count > 0 || afterWindow.count > 0;
    return {
      heading: hasTrafficContext ? "Observed mobility context found" : "Traffic data gap",
      observed_metric_count: observedMetricCount,
      observed_metric: metric ? {
        before_label: metric.beforeLabel || "Before",
        before_value: metric.beforeValue,
        after_label: metric.afterLabel || "After",
        after_value: metric.afterValue,
        note: metric.note || null,
      } : null,
      observed_deltas: deltas,
      before_window: beforeWindow,
      after_window: afterWindow,
      examples,
      note: hasTrafficContext
        ? "Counts are traffic or mobility evidence records loaded for the selected windows; they are not traffic-volume measurements unless an observed metric is explicitly supplied."
        : "No observed traffic metric or loaded traffic evidence record covers the selected before/after windows. Add transport counts, collision records, bus reliability, or travel-time sources before using this as traffic evidence.",
    };
  }

  function plannerAnalogueEvents(event, profile, limit) {
    if (!event) return [];
    const anchor = eventPoint(event);
    const scored = [];
    for (const item of state.loadedEvents.values()) {
      if (!item || item.event_id === event.event_id) continue;
      if (!eventMatchesProposal(item, profile) && item.category !== event.category) continue;
      const point = eventPoint(item);
      const distance = anchor && point ? distanceKm(anchor, point) : null;
      const confidence = CONFIDENCE_SCORE[item.confidence] || 0;
      const sameCategory = item.category === event.category ? 32 : 0;
      const distanceScore = Number.isFinite(distance) ? Math.max(0, 30 - distance) : 6;
      const sourceScore = Math.min(4, sourceCountForEvent(item)) * 4;
      const generatedPenalty = isGeneratedRowEvent(item) ? 10 : 0;
      scored.push({
        event: item,
        distance,
        score: sameCategory + distanceScore + confidence * 7 + sourceScore - generatedPenalty,
      });
    }
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        event_id: item.event.event_id,
        title: cleanTitle(item.event.title),
        year: String(plannerEventYear(item.event) || ""),
        confidence: item.event.confidence,
        category: item.event.category,
        reason: analogueReason(item.event, item.distance),
      }));
  }

  function analogueReason(event, distance) {
    const parts = [confidenceLabel(event.confidence), categoryConfig(event.category).label];
    if (Number.isFinite(distance)) parts.push(`${distance.toFixed(distance < 10 ? 1 : 0)} km from selected record`);
    parts.push(`${sourceCountForEvent(event)} source${sourceCountForEvent(event) === 1 ? "" : "s"}`);
    return parts.join("; ");
  }

  function planningReadiness(report) {
    const sources = report.selected_event?.source_count || 0;
    const confidence = report.selected_event?.confidence || "";
    const strongConfidence = confidence === "corroborated" || confidence === "documented";
    const trafficCount = report.traffic.observed_metric_count + report.traffic.before_window.count + report.traffic.after_window.count;
    return [
      {
        label: "Provenance",
        value: `${formatNumber(sources)} source${sources === 1 ? "" : "s"}`,
        status: sources > 0 ? "ok" : "gap",
        note: sources > 0 ? "Linked source rows are available for review." : "No linked source rows are attached.",
      },
      {
        label: "Confidence",
        value: confidenceLabel(confidence),
        status: strongConfidence ? "ok" : "warn",
        note: strongConfidence ? "Good enough for precedent screening." : "Treat as a prompt for further source review.",
      },
      {
        label: "Before/after",
        value: `${report.before_after.before_year} -> ${report.before_after.after_year}`,
        status: "ok",
        note: "Imagery dates are shown with archive fallback notes.",
      },
      {
        label: "Traffic",
        value: `${formatNumber(trafficCount)} records`,
        status: trafficCount > 0 ? "ok" : "gap",
        note: trafficCount > 0 ? "Mobility evidence is present in loaded records." : "Add observed traffic sources before making a mobility claim.",
      },
    ];
  }

  function plannerDataGaps(event, traffic, evidence, sourceCount) {
    const gaps = [];
    if (!sourceCount) gaps.push("Attach at least one public source row for the selected precedent.");
    if (!traffic.observed_metric_count) gaps.push("Observed traffic volumes, speeds, collisions, or transit performance are not directly supplied for this event.");
    if (!state.allEventsLoaded) gaps.push("Counts and analogues use currently loaded years only; load full city evidence for a wider screen.");
    if (event?.confidence === "inferred") gaps.push("The selected record is inferred; verify effective dates before using it in a planning report.");
    if (!evidence.categories.length) gaps.push("No related category mix is loaded for the chosen proposal type.");
    if (!gaps.length) gaps.push("Primary gaps depend on scheme specifics: surveys, consultation records, utilities, costs, and statutory assessment evidence are outside this atlas unless linked sources are added.");
    return gaps;
  }

  function eventMatchesProposal(event, profile) {
    if (!event) return false;
    if (profile.categories.includes(event.category)) return true;
    const text = eventText(event);
    return profile.signals.some((term) => text.includes(term));
  }

  function isTrafficEvidence(event) {
    if (!event) return false;
    if (event.category === "transport") return true;
    return /traffic|transport|transit|mobility|road|street|collision|congestion|bus|rail|station|cycle|walking|pedestrian|disruption|tfl|dft/i.test(eventText(event));
  }

  function plannerEventYear(event) {
    const direct = Number(event?.year);
    if (Number.isFinite(direct)) return direct;
    const match = String(event?.effective_date || event?.effective_date_range?.start || "").match(/\b(18|19|20)\d{2}\b/);
    return match ? Number(match[0]) : NaN;
  }

  function sourceCountForEvent(event) {
    return Math.max((event?.evidence || []).length, (event?.source_ids || []).length);
  }

  function distanceKm(a, b) {
    const radius = 6371;
    const lat1 = Number(a.lat) * Math.PI / 180;
    const lat2 = Number(b.lat) * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLng = (Number(b.lng) - Number(a.lng)) * Math.PI / 180;
    const h = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function setImpactMode(mode) {
    const allowed = ["place", "traffic", "components"];
    state.impactMode = allowed.includes(mode) ? mode : "place";
    renderImpactModeControls();
    if (state.selectedEvent) renderImpactPanel(state.selectedEvent);
    renderMap();
  }

  function renderImpactModeControls() {
    if (!els.impactModeBar) return;
    els.impactModeBar.querySelectorAll("[data-impact-mode]").forEach((button) => {
      const active = button.dataset.impactMode === state.impactMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (els.mapStage) els.mapStage.dataset.impactView = state.impactMode;
  }

  function renderImpactPanel(event) {
    if (!els.impactPanel) return;
    if (!event) {
      els.impactPanel.innerHTML = `<p>Select an event to inspect associated place, mobility, and component context.</p>`;
      return;
    }
    if (state.impactMode === "traffic") {
      els.impactPanel.innerHTML = renderTrafficImpact(event);
      return;
    }
    if (state.impactMode === "components") {
      els.impactPanel.innerHTML = renderComponentImpact(event);
      return;
    }
    els.impactPanel.innerHTML = renderPlaceImpact(event);
  }

  function renderPlaceImpact(event) {
    const point = eventPoint(event);
    const sourceCount = Math.max((event.evidence || []).length, (event.source_ids || []).length);
    const geometryLabel = event.geometry?.type || (point ? "Point" : "No map geometry");
    const area = event.affected_area?.label || shortCityName(state.city?.display_name);
    return `
      <article class="impact-card impact-place">
        <span class="impact-kicker">Observed place change</span>
        <strong>${escapeHtml(area)}</strong>
        <p>${escapeHtml(event.explanation || "This record marks an observed change at the selected place.")}</p>
        <dl class="impact-facts">
          <div><dt>When</dt><dd>${escapeHtml(formatEventDate(event))}</dd></div>
          <div><dt>Geometry</dt><dd>${escapeHtml(geometryLabel)}</dd></div>
          <div><dt>Evidence</dt><dd>${formatNumber(sourceCount)} source${sourceCount === 1 ? "" : "s"}</dd></div>
        </dl>
        <small>Shown on a real georeferenced map. The highlight marks the recorded place/geometry; broader effects are not causal claims.</small>
      </article>
    `;
  }

  function renderTrafficImpact(event) {
    const traffic = observedTrafficMetric(event);
    const rows = observedTrafficDeltas(event);
    const metric = traffic ? `
      <article class="impact-card traffic-metric">
        <span class="impact-kicker">Observed traffic context</span>
        <strong>${escapeHtml(traffic.beforeLabel || "Before")} -> ${escapeHtml(traffic.afterLabel || "After")}</strong>
        <div class="impact-meter-pair">
          ${renderMeter("Before", traffic.beforeValue, parseMetricValue(traffic.beforeValue))}
          ${renderMeter("After", traffic.afterValue, parseMetricValue(traffic.afterValue))}
        </div>
        <small>${escapeHtml(traffic.note || "Traffic figures are contextual indicators, not proof of causation.")}</small>
      </article>` : "";
    const deltaCards = rows.map(renderDeltaCard).join("");
    const fallback = !metric && !deltaCards ? `
      <article class="impact-card muted">
        <span class="impact-kicker">Traffic</span>
        <strong>No measured traffic metric supplied</strong>
        <p>This record is tagged ${escapeHtml(event.lens || event.category || "city change")}. Inspect the linked sources before using it as traffic evidence.</p>
        <small>Not causal: generated source tags are not treated as measured congestion, speed, or volume outcomes.</small>
      </article>` : "";
    return `<div class="impact-stack">${metric}${deltaCards}${fallback}<p class="impact-caveat">Traffic and mobility context only; this atlas does not infer outcomes where observed traffic measurements are absent.</p></div>`;
  }

  function renderComponentImpact(event) {
    const cards = componentCards(event);
    return `
      <div class="component-grid">
        ${cards.map((card) => `
          <article class="impact-card component-card ${card.active ? "active" : ""}">
            <span class="component-dot" style="--component-color:${escapeAttr(card.color)}"></span>
            <strong>${escapeHtml(card.label)}</strong>
            <span class="component-value">${escapeHtml(card.value)}</span>
            <p>${escapeHtml(card.note)}</p>
            <small>${card.active ? "Affected/mentioned by selected event evidence or signals." : "City context available; not directly linked to this event."}</small>
          </article>
        `).join("")}
        <p class="impact-caveat">Components come from current atlas source coverage and event affected_signals. They are context layers, not modeled outcomes.</p>
      </div>
    `;
  }

  function observedTrafficMetric(event) {
    const traffic = event.traffic_metrics || null;
    if (!traffic || traffic.observed !== true) return null;
    return traffic;
  }

  function observedTrafficDeltas(event) {
    return (event.impact_deltas || [])
      .filter((item) => item && item.observed === true)
      .filter((item) => /traffic|transit|mobility|road|travel|cycle|active/i.test(item.label || ""));
  }

  function renderDeltaCard(delta) {
    const before = Number(delta.before);
    const after = Number(delta.after);
    const changed = Number(delta.delta);
    return `
      <article class="impact-card">
        <span class="impact-kicker">${escapeHtml(delta.unit || "index")}</span>
        <strong>${escapeHtml(delta.label || "Context indicator")}</strong>
        <div class="impact-meter-pair">
          ${renderMeter("Before", String(delta.before ?? "n/a"), before)}
          ${renderMeter("After", String(delta.after ?? "n/a"), after)}
        </div>
        <p class="delta-line">${Number.isFinite(changed) ? `${changed > 0 ? "+" : ""}${changed}` : "Change not quantified"}</p>
        <small>${escapeHtml(delta.basis || "Source-backed context indicator.")}</small>
      </article>
    `;
  }

  function renderMeter(label, value, percent) {
    const safePercent = Number.isFinite(percent) ? clamp(percent, 0, 100) : 0;
    return `
      <div class="impact-meter">
        <span>${escapeHtml(label)} <b>${escapeHtml(value)}</b></span>
        <i style="--meter:${safePercent}%"></i>
      </div>
    `;
  }

  function componentCards(event) {
    const signals = new Set((event.affected_signals || []).map(normalizeSignal));
    signals.add(normalizeSignal(event.category));
    signals.add(normalizeSignal(event.lens));
    const deltas = (event.impact_deltas || []).filter((item) => item && item.observed === true);
    const sourceCards = Array.isArray(state.currentState?.cards) && state.currentState.cards.length
      ? state.currentState.cards
      : defaultComponentCards(event);
    return sourceCards.slice(0, 6).map((card) => {
      const haystack = normalizeSignal(`${card.id} ${card.label} ${card.note}`);
      const delta = deltas.find((item) => haystack.split(" ").some((word) => word.length > 3 && normalizeSignal(item.label).includes(word)));
      const active = Array.from(signals).some((signal) => signal && (haystack.includes(signal) || signal.includes(haystack))) || Boolean(delta);
      return {
        id: card.id,
        label: card.label,
        value: delta ? `${delta.before ?? "?"} -> ${delta.after ?? "?"}` : String(card.value ?? "context"),
        note: delta?.basis || card.note || "Context layer available in the city atlas.",
        active,
        color: componentColor(card.id),
      };
    });
  }

  function defaultComponentCards(event) {
    const signals = event.affected_signals?.length ? event.affected_signals : [event.category || event.lens || "place"];
    return signals.map((signal) => ({ id: signal, label: signalLabel(signal), value: "tagged", note: "Mentioned by this event record; no current-state count was supplied." }));
  }

  function normalizeSignal(value) {
    return String(value || "").toLowerCase().replace(/[_/-]+/g, " ").replace(/[^a-z0-9 ]+/g, "").trim();
  }

  function signalLabel(value) {
    return String(value || "Context").replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function componentColor(id) {
    const text = normalizeSignal(id);
    if (/traffic|transport|mobility|road|cycle/.test(text)) return "#7c5cff";
    if (/building|planning|built/.test(text)) return "#e9781a";
    if (/environment|green|flood|air/.test(text)) return "#2e9b58";
    if (/service|equity|health|school|civic/.test(text)) return "#0b95b7";
    if (/economy|jobs|business/.test(text)) return "#b7791f";
    if (/util|infra|energy|water/.test(text)) return "#0f9f8f";
    return "#1268db";
  }

  function parseMetricValue(value) {
    const match = String(value || "").match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  function renderLimitations(event) {
    const caveats = [
      ...(event.caveats || []),
      "Causal claim is not made; this is a documented change record with source limitations.",
    ];
    if (usesEarliestImageryFallback(event)) {
      caveats.push(`Satellite archive begins ${state.imageryArchive.earliest_date}; earlier event years use the earliest available Wayback imagery, not a same-year image.`);
    }
    els.limitationsList.innerHTML = caveats.slice(0, 5).map((item) => `<li>${escapeHtml(normalizeCaveat(item))}</li>`).join("");
  }

  function renderCausalClaim(event) {
    const sourceCount = Math.max((event.evidence || []).length, (event.source_ids || []).length);
    const confidence = confidenceLabel(event.confidence).toLowerCase();
    els.causalClaimLabel.textContent = "Available data does not justify a causal claim";
    els.causalClaimText.textContent = `${formatNumber(sourceCount)} public source${sourceCount === 1 ? "" : "s"} and ${confidence} evidence document this change. They do not establish that the event caused wider outcomes.`;
  }

  function renderSources(event) {
    const evidence = event.evidence || [];
    const sourceIds = event.source_ids || [];
    const rows = evidence.length
      ? evidence
      : sourceIds.map((id) => ({ source_id: id, label: sourceLabel(id), url: state.sourceById.get(id)?.url }));
    const sourceHeader = `
      <div class="source-summary">
        <strong>${formatNumber(rows.length)} linked source${rows.length === 1 ? "" : "s"}</strong>
        <span>Use publisher links, access dates, and limitations to review the claim. Causation is not claimed.</span>
        <small>Date basis: ${escapeHtml(event.source_date_field || event.provenance?.source_date_field || "not supplied")}</small>
      </div>
    `;
    els.sourceList.innerHTML = sourceHeader + (rows.slice(0, 7).map((item) => {
      const source = state.sourceById.get(item.source_id);
      const label = item.label || source?.title || item.source_id || "Evidence source";
      const provider = source?.provider || source?.attribution_text || item.kind || "Source record";
      const licence = source?.licence || "Licence not supplied in event evidence";
      const href = item.url || source?.url || "";
      const coverage = source?.coverage_years ? `${source.coverage_years.start}-${source.coverage_years.end}` : "coverage not supplied";
      const record = item.record_id || event.provenance?.source_record_id || source?.source_id || "";
      const raw = item.file_path || source?.raw_metadata_file || "";
      const accessed = sourceAccessed(source, item, event);
      const licenceStatus = sourceLicenceStatus(source);
      return `
        <article class="source-item">
          <div class="source-item-head">
            ${href ? `<a href="${escapeAttr(href)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(label)}</strong></a>` : `<strong>${escapeHtml(label)}</strong>`}
            <span class="source-badge">${escapeHtml(sourceBadge(source, item))}</span>
          </div>
          <span>${escapeHtml(provider)}</span>
          <small>${escapeHtml(licence)}</small>
          <dl class="source-meta">
            <div><dt>Coverage</dt><dd>${escapeHtml(coverage)}</dd></div>
            <div><dt>Accessed</dt><dd>${escapeHtml(accessed)}</dd></div>
            <div><dt>Licence</dt><dd>${escapeHtml(licenceStatus)}</dd></div>
            <div><dt>Record</dt><dd>${escapeHtml(record || "not supplied")}</dd></div>
          </dl>
          <details class="source-technical">
            <summary>Technical trace</summary>
            <dl class="source-meta">
              <div><dt>Transform</dt><dd>${escapeHtml(event.provenance?.transform || "not supplied")}</dd></div>
              <div><dt>Metadata</dt><dd>${escapeHtml(raw || "not supplied")}</dd></div>
            </dl>
          </details>
        </article>
      `;
    }).join("") || `<div class="empty-state">No source rows were supplied for this record.</div>`);
  }

  function sourceAccessed(source, evidence, event) {
    return evidence?.accessed_at
      || source?.accessed_at
      || source?.retrieved_at
      || event?.provenance?.source_retrieved_at
      || (source?.registry_reviewed_at ? `registry reviewed ${source.registry_reviewed_at}; source retrieval not recorded` : "")
      || "not supplied";
  }

  function sourceLicenceStatus(source) {
    const licence = String(source?.licence || "");
    if (!licence) return "not supplied";
    if (/requires source-level review|verify|terms|dataset-specific/i.test(licence)) return "review required";
    return "declared in source catalog";
  }

  function sourceBadge(source, evidence) {
    const text = `${source?.source_confidence || ""} ${source?.provider || ""} ${evidence?.kind || ""}`.toLowerCase();
    if (/official|authority|department|gov|nyc|gla|tfl|census|agency/.test(text)) return "Official";
    if (/openstreetmap|osm/.test(text)) return "Community";
    if (/catalog|discovered/.test(text)) return "Catalog";
    return "Source";
  }

  async function setYear(year) {
    const uiYears = timelineYears();
    const minYear = Math.min(...uiYears);
    const maxYear = Math.max(...uiYears);
    const requestId = state.yearRequest + 1;
    state.yearRequest = requestId;
    state.year = clamp(Number(year), minYear, maxYear);
    state.beforeYear = preferredBeforeYear(state.year);
    await Promise.all([
      ensureYearLoaded(state.year, { silent: true }),
      ensureYearLoaded(state.beforeYear, { silent: true }),
    ]);
    if (requestId !== state.yearRequest) return;
    renderTimeline();
    renderEventList();
    pulseTemporalScene();
    scheduleMapRender();
    if (state.selectedEvent) {
      renderBrief(state.selectedEvent);
      renderMapCallout(state.selectedEvent);
    }
  }

  function stepYear(direction) {
    const years = timelineYears();
    const sorted = years.slice().sort((a, b) => a - b);
    const currentIndex = sorted.findIndex((year) => year >= state.year);
    const nextIndex = clamp(currentIndex + direction, 0, sorted.length - 1);
    setYear(sorted[nextIndex]);
  }

  function selectEvent(eventId, options = {}) {
    const event = state.loadedEvents.get(eventId);
    if (!event) return;
    state.selectedEventId = eventId;
    state.selectedEvent = event;
    if (!options.keepTimeline && Number.isFinite(Number(event.year))) {
      state.year = Number(event.year);
      state.beforeYear = preferredBeforeYear(state.year);
    }
    const point = eventPoint(event);
    if (point) {
      const focusZoom = Math.max(state.mapZoom, FOCUS_ZOOM);
      setCameraTarget(focusCenterForPoint(point, focusZoom), focusZoom);
    }
    renderAll({ preserveSelection: true });
    renderBrief(event);
    renderMapCallout(event);
  }

  function selectInitialEvent(options = {}) {
    const selected = pickInitialEvent(options);
    if (selected) selectEvent(selected.event_id, { keepTimeline: true });
  }

  function pickInitialEvent(options = {}) {
    const mapCandidates = filteredMapEvents();
    const candidates = options.preferCurrentYear && mapCandidates.length ? mapCandidates : filteredEvents();
    return candidates.find((event) => event.confidence === "corroborated" || event.confidence === "documented")
      || candidates.find((event) => eventPoint(event))
      || candidates[0];
  }

  function clearFilters() {
    state.category = "all";
    state.confidence = "all";
    state.source = "all";
    state.search = "";
    state.sort = "relevance";
    state.listLimit = MAX_LIST_EVENTS;
    els.categoryFilter.value = "all";
    els.confidenceFilter.value = "all";
    els.sourceFilter.value = "all";
    els.sortSelect.value = "relevance";
    els.eventSearch.value = "";
    renderLayerBar();
    refreshFilteredView({ preferCurrentYear: true });
  }

  function toggleFilterPanel() {
    const rail = document.querySelector(".change-log");
    const nextOpen = !rail?.classList.contains("filters-open");
    rail?.classList.toggle("filters-open", nextOpen);
    els.clearFiltersButton?.setAttribute("aria-expanded", String(nextOpen));
    els.clearFiltersButton?.setAttribute("aria-label", nextOpen ? "Hide filters" : "Show filters");
    document.getElementById("filterGrid")?.setAttribute("aria-hidden", String(!nextOpen));
  }

  function setZoom(zoom) {
    setCameraTarget(state.mapCenter || state.cameraCenter || state.city?.default_center || [0, 0], zoom);
  }

  function startMapDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest("a, button, input, select, label, .timeline-dock")) return;
    const [lng, lat] = state.cameraCenter || state.mapCenter || state.city?.default_center || [0, 0];
    const zoom = clamp(Math.round(state.cameraZoom || state.mapZoom), MIN_ZOOM, MAX_ZOOM);
    const now = performance.now();
    state.mapDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: now,
      velocityX: 0,
      velocityY: 0,
      startZoom: zoom,
      startCenter: lonLatToWorldPixel(lng, lat, zoom),
    };
    els.mapViewport.classList.add("dragging");
    els.mapViewport.setPointerCapture?.(event.pointerId);
  }

  function moveMapDrag(event) {
    if (!state.mapDrag || state.mapDrag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const nextPixel = {
      x: state.mapDrag.startCenter.x - (event.clientX - state.mapDrag.startX),
      y: state.mapDrag.startCenter.y - (event.clientY - state.mapDrag.startY),
    };
    const nextCenter = worldPixelToLonLat(nextPixel.x, nextPixel.y, state.mapDrag.startZoom);
    const now = performance.now();
    const elapsed = Math.max(16, now - state.mapDrag.lastTime);
    state.mapDrag.velocityX = (event.clientX - state.mapDrag.lastX) / elapsed;
    state.mapDrag.velocityY = (event.clientY - state.mapDrag.lastY) / elapsed;
    state.mapDrag.lastX = event.clientX;
    state.mapDrag.lastY = event.clientY;
    state.mapDrag.lastTime = now;
    setSceneMotion(event.clientX - state.mapDrag.startX, event.clientY - state.mapDrag.startY);
    setCameraTarget([nextCenter.lng, nextCenter.lat], state.mapZoom, { dragging: true, instant: true });
  }

  function endMapDrag(event) {
    if (!state.mapDrag || state.mapDrag.pointerId !== event.pointerId) return;
    const drag = state.mapDrag;
    state.mapDrag = null;
    els.mapViewport.classList.remove("dragging");
    els.mapViewport.releasePointerCapture?.(event.pointerId);
    const speed = Math.hypot(drag.velocityX, drag.velocityY);
    if (speed > 0.02 && state.mapCenter) {
      const zoom = clamp(Math.round(state.mapZoom), MIN_ZOOM, MAX_ZOOM);
      const pixel = lonLatToWorldPixel(state.mapCenter[0], state.mapCenter[1], zoom);
      const fling = worldPixelToLonLat(pixel.x - drag.velocityX * 180, pixel.y - drag.velocityY * 180, zoom);
      setCameraTarget([fling.lng, fling.lat], state.mapZoom);
    }
    settleSceneMotion();
  }

  function zoomMapWheel(event) {
    if (event.__citylogWheelHandled) return;
    event.__citylogWheelHandled = true;
    event.preventDefault();
    if (!state.mapView) {
      setZoom(state.mapZoom + (event.deltaY < 0 ? 1 : -1));
      return;
    }
    const nextZoom = clamp(state.mapZoom + (event.deltaY < 0 ? 1 : -1), MIN_ZOOM, MAX_ZOOM);
    if (nextZoom === state.mapZoom) return;
    const rect = els.mapViewport.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const worldBefore = {
      x: state.mapView.topLeft.x + offsetX,
      y: state.mapView.topLeft.y + offsetY,
    };
    const geoAtPointer = worldPixelToLonLat(worldBefore.x, worldBefore.y, state.mapView.zoom);
    const worldAfter = lonLatToWorldPixel(geoAtPointer.lng, geoAtPointer.lat, nextZoom);
    const centerAfter = {
      x: worldAfter.x - offsetX + state.mapView.width / 2,
      y: worldAfter.y - offsetY + state.mapView.height / 2,
    };
    const nextCenter = worldPixelToLonLat(centerAfter.x, centerAfter.y, nextZoom);
    setCameraTarget([nextCenter.lng, nextCenter.lat], nextZoom);
  }

  function recenterMap() {
    setCameraTarget(state.city?.default_center || state.mapCenter || [0, 0], cityMapZoom(state.city));
    toast("Map recentered.");
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    els.mapStage.classList.toggle("mode-3d", mode === "3d");
    els.view2dButton.classList.toggle("active", mode === "2d");
    els.view3dButton.classList.toggle("active", mode === "3d");
    els.view2dButton.setAttribute("aria-pressed", String(mode === "2d"));
    els.view3dButton.setAttribute("aria-pressed", String(mode === "3d"));
    applyMapLibreViewMode();
  }

  function setCompareX(value, options = {}) {
    state.compareX = clamp(Number(value), 12, 88);
    els.mapStage.style.setProperty("--compare-x", `${state.compareX}%`);
    els.compareSlider.value = String(state.compareX);
    if (!options.silent) renderTimeline();
  }

  function toggleCompare(force) {
    state.compareEnabled = typeof force === "boolean" ? force : !state.compareEnabled;
    els.mapStage.classList.toggle("is-comparing", state.compareEnabled);
    els.compareButton?.classList.toggle("active", state.compareEnabled);
    els.compareButton?.setAttribute("aria-pressed", String(state.compareEnabled));
    renderTimeline();
    toast(state.compareEnabled ? "Before/after compare split enabled." : "Before/after compare split disabled.");
  }

  function clearSelectedBrief() {
    state.selectedEventId = null;
    state.selectedEvent = null;
    els.mapCallout.hidden = true;
    renderEmptyBrief();
    renderEventList();
    renderMap();
    toast("Selection cleared.");
  }

  function toggleBriefSection(button) {
    const section = button.closest(".brief-section");
    if (!section) return;
    const expanded = button.getAttribute("aria-expanded") !== "false";
    button.setAttribute("aria-expanded", String(!expanded));
    section.classList.toggle("is-collapsed", expanded);
  }

  function replayYears() {
    if (state.replayTimer) {
      clearInterval(state.replayTimer);
      state.replayTimer = null;
      els.replayButton.classList.remove("active");
      return;
    }
    const years = timelineYears();
    let index = Math.max(0, years.findIndex((year) => year >= state.year));
    els.replayButton.classList.add("active");
    state.replayTimer = setInterval(() => {
      index = (index + 1) % years.length;
      setYear(years[index]);
      if (index === years.length - 1) {
        clearInterval(state.replayTimer);
        state.replayTimer = null;
        els.replayButton.classList.remove("active");
      }
    }, 750);
  }

  function exportBrief() {
    const payload = briefPayload();
    downloadText(
      briefMarkdown(payload),
      `${state.cityId || "city"}-${state.selectedEventId || "evidence-brief"}.md`,
      "text/markdown",
    );
    toast("Evidence brief exported.");
  }

  function exportBriefJson() {
    downloadText(
      JSON.stringify(briefPayload(), null, 2),
      `${state.cityId || "city"}-${state.selectedEventId || "evidence-brief"}.json`,
      "application/json",
    );
    toast("Evidence JSON exported.");
  }

  function copyBrief() {
    const text = briefMarkdown(briefPayload());
    navigator.clipboard?.writeText(text)
      .then(() => toast("Evidence brief copied."))
      .catch(() => toast("Clipboard unavailable; use Export."));
  }

  function copyPlanningReport() {
    if (!state.selectedEvent) {
      toast("Select a record before copying a planning report.");
      return;
    }
    const text = plannerMarkdown(planningReportPayload(state.selectedEvent));
    navigator.clipboard?.writeText(text)
      .then(() => toast("Planning report copied."))
      .catch(() => toast("Clipboard unavailable; use Export Evidence Brief."));
  }

  function downloadText(text, filename, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function briefPayload() {
    const event = state.selectedEvent;
    return {
      product: "Open Citylog",
      city_id: state.cityId,
      city_name: state.city?.display_name,
      selected_year: state.year,
      before_year: state.beforeYear,
      caveat: "Historical evidence map, not a prediction engine. Causation is not claimed.",
      availability: state.availability ? {
        status: state.availability.summary?.status || state.cityMeta?.availability_status || null,
        summary: state.availability.summary?.summary || null,
        generated_at: state.availability.generated_at || null,
        coverage_family_count: Array.isArray(state.availability.matrix) ? state.availability.matrix.length : 0,
      } : null,
      imagery: {
        provider: state.imageryArchive?.provider || TILE_PROVIDER.name,
        source_url: state.imageryArchive?.source_url || null,
        note: state.imageryArchive?.source_note || "Current imagery fallback; no dated archive manifest loaded.",
        before: state.beforeImagery ? {
          requested_year: state.beforeImagery.requested_year,
          date: state.beforeImagery.date,
          id: state.beforeImagery.id,
        } : null,
        after: state.afterImagery ? {
          requested_year: state.afterImagery.requested_year,
          date: state.afterImagery.date,
          id: state.afterImagery.id,
        } : null,
      },
      event: event ? {
        event_id: event.event_id,
        title: event.title,
        effective_date: event.effective_date,
        source_date_field: event.source_date_field || event.provenance?.source_date_field || null,
        category: event.category,
        confidence: event.confidence,
        affected_area: event.affected_area,
        explanation: event.explanation,
        caveats: event.caveats || [],
        source_ids: event.source_ids || [],
        evidence: event.evidence || [],
        linked_sources: linkedSourcesForEvent(event),
        provenance: event.provenance || null,
      } : null,
      planning_report: event ? planningReportPayload(event) : null,
    };
  }

  function linkedSourcesForEvent(event) {
    if (!event) return [];
    const evidence = event.evidence || [];
    const sourceIds = event.source_ids || [];
    const rows = evidence.length
      ? evidence
      : sourceIds.map((id) => ({ source_id: id, label: sourceLabel(id), url: state.sourceById.get(id)?.url }));
    return rows.map((item) => {
      const source = state.sourceById.get(item.source_id);
      return {
        source_id: item.source_id || source?.source_id || null,
        title: item.label || source?.title || item.source_id || "Evidence source",
        publisher: source?.provider || source?.attribution_text || item.kind || "Source record",
        url: item.url || source?.url || null,
        licence: source?.licence || null,
        licence_status: sourceLicenceStatus(source),
        accessed_at: sourceAccessed(source, item, event),
        record_id: item.record_id || event.provenance?.source_record_id || source?.source_id || null,
        transformation: event.provenance?.transform || null,
      };
    });
  }

  function briefMarkdown(payload) {
    const event = payload.event;
    const lines = [
      `# Evidence Brief: ${event?.title || "No selected record"}`,
      "",
      `Product: ${payload.product}`,
      `City: ${payload.city_name || payload.city_id || "Unknown"}`,
      `Map year: ${payload.selected_year || "Unknown"}`,
      `Caveat: ${payload.caveat}`,
      "",
    ];
    if (!event) {
      lines.push("No event is selected.");
      return lines.join("\n");
    }
    lines.push(
      "## Observed Change",
      "",
      `When: ${event.effective_date || "not supplied"}`,
      `Date basis: ${event.source_date_field || event.provenance?.source_date_field || "not supplied"}`,
      `Category: ${event.category || "not supplied"}`,
      `Confidence: ${confidenceLabel(event.confidence)}`,
      `Place: ${event.affected_area?.label || "not supplied"}`,
      "",
      event.explanation || "No explanation supplied.",
      "",
      "## Limitations",
      "",
    );
    (event.caveats || []).concat(["Causation is not claimed."]).forEach((item) => {
      lines.push(`- ${item}`);
    });
    lines.push("", "## Sources", "");
    (event.linked_sources || []).forEach((source, index) => {
      lines.push(
        `${index + 1}. ${source.title}`,
        `   Publisher: ${source.publisher || "not supplied"}`,
        `   URL: ${source.url || "not supplied"}`,
        `   Licence: ${source.licence || "not supplied"} (${source.licence_status || "not supplied"})`,
        `   Accessed: ${source.accessed_at || "not supplied"}`,
        `   Record: ${source.record_id || "not supplied"}`,
        "",
      );
    });
    lines.push(
      "## Provenance",
      "",
      `Transform: ${event.provenance?.transform || "not supplied"}`,
      `Source URL: ${event.provenance?.source_url || "not supplied"}`,
      `Source retrieved: ${event.provenance?.source_retrieved_at || "not supplied"}`,
    );
    if (payload.planning_report) {
      lines.push("", ...planningReportLines(payload.planning_report, { includeTitle: false }));
    }
    return lines.join("\n");
  }

  function plannerMarkdown(report) {
    return planningReportLines(report, { includeTitle: true }).join("\n");
  }

  function planningReportLines(report, options = {}) {
    const event = report.selected_event;
    const lines = [];
    if (options.includeTitle !== false) {
      lines.push(`# Planning Evidence Screen: ${event?.title || "No selected record"}`, "");
    } else {
      lines.push("## Planning Workbench Report", "");
    }
    lines.push(
      `Product: ${report.product}`,
      `Mode: ${report.mode}`,
      `Proposal type: ${report.proposal.type_label}`,
      `Scale: ${report.proposal.scale}`,
      `Stage: ${report.proposal.stage}`,
      `Caveat: ${report.caveat}`,
      `Loaded scope: ${report.loaded_scope}`,
      "",
    );
    if (event) {
      lines.push(
        "### Selected Precedent",
        "",
        `Event: ${event.title}`,
        `Date: ${event.date}`,
        `Category: ${event.category || "not supplied"}`,
        `Confidence: ${confidenceLabel(event.confidence)}`,
        `Place: ${event.place || "not supplied"}`,
        `Sources: ${event.source_count}`,
        "",
      );
    }
    lines.push(
      "### Before/After",
      "",
      `Before: ${report.before_after.before_year} (${report.before_after.before_imagery_label})`,
      `After: ${report.before_after.after_year} (${report.before_after.after_imagery_label})`,
      `Related records before window: ${report.evidence.before_window.count}`,
      `Related records after window: ${report.evidence.after_window.count}`,
      `Note: ${report.before_after.note}`,
      "",
      "### Traffic Evidence",
      "",
      `Status: ${report.traffic.heading}`,
      `Observed metrics: ${report.traffic.observed_metric_count}`,
      `Traffic records before window: ${report.traffic.before_window.count}`,
      `Traffic records after window: ${report.traffic.after_window.count}`,
      `Note: ${report.traffic.note}`,
      "",
      "### Historical Analogues",
      "",
    );
    if (report.analogues.length) {
      report.analogues.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.title} (${item.year || "date unknown"}) - ${item.reason}`);
      });
    } else {
      lines.push("- No close analogue is loaded yet.");
    }
    lines.push("", "### Review Questions", "");
    report.design_questions.forEach((item) => lines.push(`- ${item}`));
    lines.push("", "### Data Gaps", "");
    report.data_gaps.forEach((item) => lines.push(`- ${item}`));
    lines.push("", "### Linked Sources", "");
    if (report.linked_sources.length) {
      report.linked_sources.slice(0, 8).forEach((source, index) => {
        lines.push(`${index + 1}. ${source.title} - ${source.url || "not supplied"}`);
      });
    } else {
      lines.push("- No linked source rows supplied.");
    }
    return lines;
  }

  function renderTiles() {
    if (!state.city) return;
    if (state.mapSceneReady && state.afterMap) {
      updateMapViewFromMapLibre();
      state.afterMap.resize();
      state.beforeMap?.resize();
      return;
    }
    const viewport = els.mapViewport.getBoundingClientRect();
    const width = Math.max(640, Math.round(viewport.width || els.mapStage.clientWidth || window.innerWidth - 720 || 980));
    const height = Math.max(520, Math.round(viewport.height || els.mapStage.clientHeight || window.innerHeight - 64 || 720));
    const [lng, lat] = state.cameraCenter || state.mapCenter || state.city.default_center || [0, 0];
    const zoom = clamp(Math.round(state.cameraZoom || state.mapZoom || cityMapZoom(state.city)), MIN_ZOOM, MAX_ZOOM);
    const center = lonLatToWorldPixel(lng, lat, zoom);
    const topLeft = {
      x: center.x - width / 2,
      y: center.y - height / 2,
    };
    state.mapView = { zoom, topLeft, width, height };
    if (!state.beforeImagery || !state.afterImagery) {
      const pair = selectImageryPair(state.beforeYear, state.year);
      state.beforeImagery = pair.before;
      state.afterImagery = pair.after;
    }
    const layout = tileLayout(topLeft, width, height, zoom);
    updateTileLayer(els.beforeTileLayer, layout, state.beforeImagery);
    updateTileLayer(els.afterTileLayer, layout, state.afterImagery);
  }

  function tileLayout(topLeft, width, height, zoom) {
    const scale = 2 ** zoom;
    const bufferTiles = 1;
    const startX = Math.floor(topLeft.x / TILE_SIZE) - bufferTiles;
    const endX = Math.floor((topLeft.x + width) / TILE_SIZE) + bufferTiles;
    const startY = Math.floor(topLeft.y / TILE_SIZE) - bufferTiles;
    const endY = Math.floor((topLeft.y + height) / TILE_SIZE) + bufferTiles;
    return {
      zoom,
      scale,
      startX,
      endX,
      startY,
      endY,
      topLeft,
      originX: startX * TILE_SIZE,
      originY: startY * TILE_SIZE,
      key: `${zoom}:${startX}:${endX}:${startY}:${endY}`,
    };
  }

  function updateTileLayer(layer, layout, imagery) {
    if (!layer) return;
    const imageryId = imagery?.id || "current";
    const key = `${layout.key}:${imageryId}`;
    const entries = tileEntries(layout, imagery);
    const hasTiles = Boolean(layer.dataset.tileKey);
    const sameImagery = layer.dataset.imageryId === imageryId;
    const sameZoom = layer.dataset.tileZoom === String(layout.zoom);
    if (layer.dataset.tileKey !== key) {
      if (!hasTiles || (sameImagery && sameZoom)) {
        commitTileLayer(layer, key, imageryId, layout.zoom, entries);
      } else {
        layer.dataset.pendingKey = key;
        preloadTileImages(entries).then(() => {
          if (layer.dataset.pendingKey === key) commitTileLayer(layer, key, imageryId, layout.zoom, entries);
        });
        return;
      }
    }
    const x = Math.round(layout.originX - layout.topLeft.x);
    const y = Math.round(layout.originY - layout.topLeft.y);
    layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function commitTileLayer(layer, key, imageryId, zoom, entries) {
    layer.innerHTML = tileHtml(entries);
    layer.dataset.tileKey = key;
    layer.dataset.imageryId = imageryId;
    layer.dataset.tileZoom = String(zoom);
    layer.dataset.pendingKey = "";
  }

  function tileEntries(layout, imagery) {
    const tiles = [];
    for (let y = layout.startY; y <= layout.endY; y += 1) {
      if (y < 0 || y >= layout.scale) continue;
      for (let x = layout.startX; x <= layout.endX; x += 1) {
        const wrappedX = ((x % layout.scale) + layout.scale) % layout.scale;
        const left = Math.round((x - layout.startX) * TILE_SIZE);
        const top = Math.round((y - layout.startY) * TILE_SIZE);
        tiles.push({
          src: tileUrl(wrappedX, y, layout.zoom, imagery),
          left,
          top,
        });
      }
    }
    return tiles;
  }

  function tileHtml(entries) {
    const tiles = entries.map((entry) => (
      `<img alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" src="${entry.src}" style="left:${entry.left}px;top:${entry.top}px;width:${TILE_SIZE}px;height:${TILE_SIZE}px">`
    ));
    return tiles.join("");
  }

  function preloadTileImages(entries) {
    const firstTiles = entries.slice(0, Math.min(14, entries.length));
    const loads = firstTiles.map((entry) => new Promise((resolve) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = resolve;
      image.src = entry.src;
    }));
    return Promise.all(loads);
  }

  function miniTileHtml(point, zoom, width, height, imagery) {
    const center = lonLatToWorldPixel(point.lng, point.lat, zoom);
    const scale = 2 ** zoom;
    const radius = Math.ceil(Math.max(width, height) / 2) + TILE_SIZE;
    const startX = Math.floor((center.x - radius) / TILE_SIZE);
    const endX = Math.floor((center.x + radius) / TILE_SIZE);
    const startY = Math.floor((center.y - radius) / TILE_SIZE);
    const endY = Math.floor((center.y + radius) / TILE_SIZE);
    const tiles = [];
    for (let y = startY; y <= endY; y += 1) {
      if (y < 0 || y >= scale) continue;
      for (let x = startX; x <= endX; x += 1) {
        const wrappedX = ((x % scale) + scale) % scale;
        const left = Math.round(x * TILE_SIZE - center.x);
        const top = Math.round(y * TILE_SIZE - center.y);
        tiles.push(`<img alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" src="${tileUrl(wrappedX, y, zoom, imagery)}" style="left:calc(50% + ${left}px);top:calc(50% + ${top}px);width:${TILE_SIZE}px;height:${TILE_SIZE}px">`);
      }
    }
    return tiles.join("");
  }

  function filteredEvents() {
    const events = Array.from(state.loadedEvents.values());
    return events.filter(matchesFilters).sort(sortEvents);
  }

  function filteredMapEvents() {
    const yearEvents = state.eventsByYear.get(Number(state.year)) || [];
    const exact = yearEvents.filter(matchesFilters).sort(sortEvents);
    if (exact.length) return exact;
    return filteredEvents().filter((event) => eventPoint(event)).slice(0, MAX_MARKERS);
  }

  function matchesFilters(event) {
    if (state.category !== "all" && event.category !== state.category) return false;
    if (state.confidence !== "all" && event.confidence !== state.confidence) return false;
    if (state.source !== "all" && !(event.source_ids || []).includes(state.source)) return false;
    if (!state.search) return true;
    return eventText(event).includes(state.search);
  }

  function sortEvents(a, b) {
    if (state.sort === "newest") return Number(b.year || 0) - Number(a.year || 0) || cleanTitle(a.title).localeCompare(cleanTitle(b.title));
    if (state.sort === "oldest") return Number(a.year || 0) - Number(b.year || 0) || cleanTitle(a.title).localeCompare(cleanTitle(b.title));
    return eventScore(b) - eventScore(a) || Number(b.year || 0) - Number(a.year || 0) || cleanTitle(a.title).localeCompare(cleanTitle(b.title));
  }

  function eventScore(event) {
    const selectedYear = Number(state.selectedEvent?.year);
    const anchorYear = Number.isFinite(selectedYear) ? selectedYear : FEATURED_YEAR[state.cityId];
    let score = 0;
    if (Number(event.year) === anchorYear) score += 60;
    if (Number(event.year) === FEATURED_YEAR[state.cityId]) score += 16;
    if (isFeaturedPlaceEvent(event)) score += 84;
    if (isPrimaryLondonFocusEvent(event)) score += 128;
    if (isCuratedMilestone(event)) score += 150;
    score += (CONFIDENCE_SCORE[event.confidence] || 0) * 12;
    score += Math.min(3, (event.source_ids || []).length) * 3;
    if (eventPoint(event)) score += 5;
    if (isCurrentLayer(event)) score -= 12;
    if (isGeneratedRowEvent(event)) score -= 65;
    if (/official-|milestone-/i.test(event.event_id || "")) score += 8;
    return score;
  }

  function isCurrentLayer(event) {
    return /^current data layer:/i.test(event.title || "") || (event.caveats || []).some((item) => /current-state source marker/i.test(item));
  }

  function isFeaturedPlaceEvent(event) {
    if (state.cityId !== "london") return false;
    const text = eventText(event);
    const point = eventPoint(event);
    const nearLowerLea = point
      ? point.lng >= -0.08 && point.lng <= 0.04 && point.lat >= 51.51 && point.lat <= 51.57
      : true;
    return nearLowerLea && LONDON_FOCUS_TERMS.some((term) => text.includes(term));
  }

  function isPrimaryLondonFocusEvent(event) {
    return state.cityId === "london"
      && /olympic.*legacy|olympic.*paralympic|queen elizabeth olympic park/i.test(event.title || "");
  }

  function isCuratedMilestone(event) {
    return /(?:^|-)milestone-/i.test(event.event_id || "")
      || /official-source/i.test(event.event_id || "");
  }

  function isGeneratedRowEvent(event) {
    return /^(lon_|nyc_|planning-)/i.test(event.event_id || "");
  }

  function eventText(event) {
    return [
      event.title,
      event.category,
      event.lens,
      event.confidence,
      event.effective_date,
      event.affected_area?.label,
      event.explanation,
      ...(event.source_ids || []),
      ...(event.affected_signals || []),
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function getAvailableYears() {
    const years = (state.eventsIndex?.event_years || []).map(Number).filter(Number.isFinite);
    return Array.from(new Set(years)).sort((a, b) => a - b);
  }

  function timelineYears() {
    const modern = state.years.filter((year) => year >= 2000);
    return modern.length ? modern : (state.years.length ? state.years : [state.year]);
  }

  function yearEventCount(year) {
    const loaded = state.eventsByYear.get(Number(year));
    if (loaded) return loaded.length;
    const chunk = (state.eventsIndex?.chunks || []).find((item) => Number(item.year) === Number(year));
    return Number(chunk?.event_count || 0);
  }

  function preferredYear() {
    const urlYear = Number(getUrlParam("year"));
    if (Number.isFinite(urlYear) && state.years.includes(urlYear)) return urlYear;
    const featured = FEATURED_YEAR[state.cityId];
    if (state.years.includes(featured)) return featured;
    return Math.min(Math.max(...state.years), CURRENT_YEAR);
  }

  function nearestYearBefore(year) {
    const sorted = state.years.filter((item) => item < year).sort((a, b) => b - a);
    return sorted[0] || Math.max(Math.min(...state.years), year - 1);
  }

  function preferredBeforeYear(year) {
    if (state.cityId === "london" && Number(year) >= 2026 && state.years.includes(2004)) return 2004;
    return nearestYearBefore(year);
  }

  function eventPoint(event) {
    return geometryCenter(event?.geometry);
  }

  function geometryCenter(geometry) {
    if (!geometry || typeof geometry !== "object") return null;
    if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
      const [lng, lat] = geometry.coordinates.map(Number);
      return Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null;
    }
    const pairs = collectCoordinatePairs(geometry.coordinates);
    if (!pairs.length) return null;
    const sum = pairs.reduce((acc, item) => ({ lng: acc.lng + item[0], lat: acc.lat + item[1] }), { lng: 0, lat: 0 });
    return { lng: sum.lng / pairs.length, lat: sum.lat / pairs.length };
  }

  function collectCoordinatePairs(value, out = []) {
    if (!Array.isArray(value)) return out;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      out.push(value);
      return out;
    }
    value.forEach((item) => collectCoordinatePairs(item, out));
    return out;
  }

  function project(point) {
    const raw = projectRaw(point);
    return { x: clamp(raw.x, 1.5, 98.5), y: clamp(raw.y, 2, 95) };
  }

  function projectRaw(point) {
    if (state.mapSceneReady && state.afterMap && els.mapViewport) {
      const rect = els.mapViewport.getBoundingClientRect();
      const projected = state.afterMap.project([point.lng, point.lat]);
      return {
        x: (projected.x / Math.max(1, rect.width)) * 100,
        y: (projected.y / Math.max(1, rect.height)) * 100,
      };
    }
    if (state.mapView) {
      const pixel = lonLatToWorldPixel(point.lng, point.lat, state.mapView.zoom);
      return {
        x: ((pixel.x - state.mapView.topLeft.x) / state.mapView.width) * 100,
        y: ((pixel.y - state.mapView.topLeft.y) / state.mapView.height) * 100,
      };
    }
    const [minLng, minLat, maxLng, maxLat] = state.city?.bounds || [-180, -80, 180, 80];
    return {
      x: ((point.lng - minLng) / (maxLng - minLng)) * 100,
      y: (1 - ((point.lat - minLat) / (maxLat - minLat))) * 100,
    };
  }

  function focusCenterForPoint(point, zoom) {
    const viewport = els.mapViewport?.getBoundingClientRect();
    const width = Math.max(640, Math.round(viewport?.width || els.mapStage?.clientWidth || 980));
    const height = Math.max(520, Math.round(viewport?.height || els.mapStage?.clientHeight || 720));
    const stageRect = els.mapStage?.getBoundingClientRect();
    const timelineRect = els.timelineDock?.getBoundingClientRect();
    const timelineSafeY = stageRect?.height && timelineRect?.height
      ? ((timelineRect.top - stageRect.top - 52) / stageRect.height)
      : 0.44;
    const desiredX = 0.46;
    const desiredY = clamp(Math.min(0.46, timelineSafeY), 0.34, 0.46);
    const pixel = lonLatToWorldPixel(point.lng, point.lat, zoom);
    const focus = worldPixelToLonLat(
      pixel.x + width * (0.5 - desiredX),
      pixel.y + height * (0.5 - desiredY),
      zoom
    );
    return [focus.lng, focus.lat];
  }

  function lonLatToWorldPixel(lng, lat, zoom) {
    const safeLat = clamp(Number(lat), -85.05112878, 85.05112878);
    const scale = 2 ** zoom;
    const x = ((Number(lng) + 180) / 360) * scale * TILE_SIZE;
    const rad = safeLat * Math.PI / 180;
    const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale * TILE_SIZE;
    return { x, y };
  }

  function worldPixelToLonLat(x, y, zoom) {
    const worldSize = TILE_SIZE * (2 ** zoom);
    const lng = (Number(x) / worldSize) * 360 - 180;
    const mercator = Math.PI - (2 * Math.PI * Number(y)) / worldSize;
    const lat = (180 / Math.PI) * Math.atan(Math.sinh(mercator));
    return { lng, lat: clamp(lat, -85.05112878, 85.05112878) };
  }

  function tileUrl(x, y, z, imagery) {
    const template = imagery?.tile_template || TILE_PROVIDER.template;
    return template
      .replace("{z}", encodeURIComponent(z))
      .replace("{x}", encodeURIComponent(x))
      .replace("{y}", encodeURIComponent(y));
  }

  function mapLibreTileTemplate(imagery) {
    if (imagery?.item_id) return `/api/imagery/wayback/${encodeURIComponent(imagery.item_id)}/{z}/{y}/{x}`;
    return TILE_PROVIDER.template;
  }

  function tileBackground(point, zoom, imagery) {
    const pixel = lonLatToWorldPixel(point.lng, point.lat, zoom);
    const x = Math.floor(pixel.x / TILE_SIZE);
    const y = Math.floor(pixel.y / TILE_SIZE);
    const scale = 2 ** zoom;
    const wrappedX = ((x % scale) + scale) % scale;
    return `url(${tileUrl(wrappedX, y, zoom, imagery)})`;
  }

  function fallbackGradient(color) {
    return `linear-gradient(135deg, ${color}, #475569)`;
  }

  function initMapScenes() {
    if (!els.beforeMap || !els.afterMap || !window.maplibregl) return false;
    const center = state.mapCenter || state.city?.default_center || [0, 0];
    const zoom = clamp(Number(state.mapZoom || cityMapZoom(state.city)), MIN_ZOOM, MAX_ZOOM);

    if (state.beforeMap && state.afterMap) {
      state.afterMap.jumpTo({ center, zoom });
      state.beforeMap.jumpTo({ center, zoom });
      updateMapLibreImagery();
      applyMapLibreViewMode();
      state.afterMap.resize();
      state.beforeMap.resize();
      return true;
    }

    const options = {
      center,
      zoom,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      attributionControl: false,
      fadeDuration: 250,
    };

    state.beforeMap = new window.maplibregl.Map({
      ...options,
      container: els.beforeMap,
      style: mapLibreStyle(state.beforeImagery),
      interactive: false,
    });
    state.afterMap = new window.maplibregl.Map({
      ...options,
      container: els.afterMap,
      style: mapLibreStyle(state.afterImagery),
      interactive: true,
      dragRotate: false,
      pitchWithRotate: false,
    });

    state.afterMap.dragRotate.disable();
    state.afterMap.touchZoomRotate.disableRotation();
    state.afterMap.on("move", syncFromMapLibre);
    state.afterMap.on("zoom", syncFromMapLibre);
    state.afterMap.on("load", () => {
      state.afterMapLoaded = true;
      markMapLibreReady();
    });
    state.beforeMap.on("load", () => {
      state.beforeMapLoaded = true;
      markMapLibreReady();
    });
    window.requestAnimationFrame(() => {
      state.beforeMapLoaded = true;
      state.afterMapLoaded = true;
      markMapLibreReady();
    });
    return true;
  }

  function markMapLibreReady() {
    if (!state.beforeMapLoaded || !state.afterMapLoaded) return;
    state.mapSceneReady = true;
    els.mapStage.classList.add("maplibre-ready");
    const center = state.mapCenter || state.city?.default_center || [0, 0];
    const zoom = clamp(Number(state.mapZoom || cityMapZoom(state.city)), MIN_ZOOM, MAX_ZOOM);
    state.afterMap.jumpTo({ center, zoom });
    state.beforeMap.jumpTo({ center, zoom });
    updateMapViewFromMapLibre();
    updateMapLibreImagery();
    applyMapLibreViewMode();
    scheduleMapRender();
  }

  function mapLibreStyle(imagery) {
    return {
      version: 8,
      sources: {
        imagery: {
          type: "raster",
          tiles: [mapLibreTileTemplate(imagery)],
          tileSize: TILE_SIZE,
          minzoom: MIN_ZOOM,
          maxzoom: MAX_ZOOM,
          attribution: imageryAttribution(),
        },
      },
      layers: [
        {
          id: "imagery",
          type: "raster",
          source: "imagery",
          paint: {
            "raster-fade-duration": 320,
          },
        },
      ],
    };
  }

  function updateMapLibreImagery() {
    if (!state.beforeMap || !state.afterMap) return;
    setMapLibreTiles(state.beforeMap, state.beforeImagery);
    setMapLibreTiles(state.afterMap, state.afterImagery);
  }

  function setMapLibreTiles(map, imagery) {
    if (!map) return;
    const template = mapLibreTileTemplate(imagery);
    if (map.__imageryTemplate === template) return;
    if (!map.isStyleLoaded()) {
      map.once("styledata", () => setMapLibreTiles(map, imagery));
      return;
    }
    const source = map.getSource("imagery");
    if (source?.setTiles) {
      source.setTiles([template]);
      map.__imageryTemplate = template;
      return;
    }
    const camera = {
      center: map.getCenter(),
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    };
    map.setStyle(mapLibreStyle(imagery));
    map.once("styledata", () => map.jumpTo(camera));
    map.__imageryTemplate = template;
  }

  function syncFromMapLibre() {
    if (!state.afterMap || !state.beforeMap || state.mapSyncing) return;
    const center = state.afterMap.getCenter();
    const zoom = state.afterMap.getZoom();
    const camera = {
      center,
      zoom,
      bearing: state.afterMap.getBearing(),
      pitch: state.afterMap.getPitch(),
    };
    state.mapSyncing = true;
    state.beforeMap.jumpTo(camera);
    state.mapSyncing = false;
    state.mapCenter = [center.lng, center.lat];
    state.mapZoom = zoom;
    state.cameraCenter = [center.lng, center.lat];
    state.cameraZoom = zoom;
    updateMapViewFromMapLibre();
    requestMapOverlayRender();
  }

  function updateMapViewFromMapLibre() {
    if (!state.afterMap || !els.mapViewport) return;
    const rect = els.mapViewport.getBoundingClientRect();
    const center = state.afterMap.getCenter();
    const zoom = state.afterMap.getZoom();
    const width = Math.max(640, Math.round(rect.width || els.mapStage.clientWidth || window.innerWidth - 720 || 980));
    const height = Math.max(520, Math.round(rect.height || els.mapStage.clientHeight || window.innerHeight - 64 || 720));
    const roundedZoom = clamp(Math.round(zoom), MIN_ZOOM, MAX_ZOOM);
    const centerPixel = lonLatToWorldPixel(center.lng, center.lat, roundedZoom);
    state.mapView = {
      zoom: roundedZoom,
      topLeft: {
        x: centerPixel.x - width / 2,
        y: centerPixel.y - height / 2,
      },
      width,
      height,
    };
  }

  function requestMapOverlayRender() {
    if (state.mapRenderFrame) return;
    state.mapRenderFrame = window.requestAnimationFrame(() => {
      state.mapRenderFrame = null;
      renderMap();
    });
  }

  function applyMapLibreViewMode() {
    if (!state.afterMap || !state.mapSceneReady) return;
    const camera = state.viewMode === "3d"
      ? { pitch: 58, bearing: -14, duration: 420 }
      : { pitch: 0, bearing: 0, duration: 320 };
    state.afterMap.easeTo(camera);
  }

  function selectImageryPair(beforeYear, afterYear) {
    return {
      before: imageryForYear(beforeYear),
      after: imageryForYear(afterYear),
    };
  }

  function imageryForYear(year) {
    const layers = state.imageryArchive?.layers || [];
    if (!layers.length) return null;
    const numericYear = Number(year);
    const targetYear = Number.isFinite(numericYear) ? numericYear : CURRENT_YEAR;
    const targetDate = `${targetYear}-12-31`;
    let candidate = layers[0];
    for (const layer of layers) {
      if (String(layer.date) <= targetDate) candidate = layer;
      else break;
    }
    return {
      ...candidate,
      requested_year: targetYear,
      is_earliest_available: targetYear < Number(layers[0].year),
      is_latest_available: targetYear > Number(layers[layers.length - 1].year),
    };
  }

  function imageryLabel(imagery, requestedYear) {
    if (!imagery) return "current imagery";
    const year = Number(requestedYear ?? imagery.requested_year);
    if (Number.isFinite(year) && year < Number(imagery.year)) return `${imagery.date} earliest archive`;
    if (Number.isFinite(year) && year > Number(imagery.year)) return `${imagery.date} latest archive`;
    return imagery.date;
  }

  function imageryFrameLabel(imagery, requestedYear) {
    if (!imagery) return String(requestedYear || "current");
    const year = Number(requestedYear ?? imagery.requested_year);
    if (Number.isFinite(year) && year !== Number(imagery.year)) return `${imagery.date}*`;
    return imagery.date;
  }

  function imageryAttribution() {
    const archive = state.imageryArchive;
    if (!archive?.earliest_date || !archive?.latest_date) return TILE_PROVIDER.attribution;
    return `${archive.provider} (${archive.earliest_date} to ${archive.latest_date}); source-backed event overlays`;
  }

  function usesEarliestImageryFallback(event) {
    const earliest = Number(state.imageryArchive?.earliest_date?.slice(0, 4));
    if (!Number.isFinite(earliest)) return false;
    const eventYear = Number(event?.traffic_metrics?.beforeYear || event?.year);
    return Number.isFinite(eventYear) && eventYear < earliest;
  }

  function setCameraTarget(center, zoom, options = {}) {
    const fallback = state.cameraCenter || state.mapCenter || state.city?.default_center || [0, 0];
    const nextCenter = Array.isArray(center) ? center : fallback;
    const nextZoom = clamp(Number(zoom ?? state.mapZoom ?? cityMapZoom(state.city)), MIN_ZOOM, MAX_ZOOM);
    const lng = Number(nextCenter[0]);
    const lat = Number(nextCenter[1]);
    state.mapCenter = [
      Number.isFinite(lng) ? lng : fallback[0],
      Number.isFinite(lat) ? clamp(lat, -85.05112878, 85.05112878) : fallback[1],
    ];
    state.mapZoom = nextZoom;

    if (state.mapSceneReady && state.afterMap) {
      const camera = { center: state.mapCenter, zoom: nextZoom };
      if (options.instant || prefersReducedMotion()) {
        state.afterMap.jumpTo(camera);
      } else {
        state.afterMap.easeTo({ ...camera, duration: 420 });
      }
      syncFromMapLibre();
      return;
    }

    if (!state.cameraCenter || !Number.isFinite(Number(state.cameraZoom))) {
      syncCameraToTarget();
      renderTiles();
      renderMap();
      return;
    }

    if (options.instant || prefersReducedMotion()) {
      syncCameraToTarget();
      renderTiles();
      renderMap();
      return;
    }

    startCameraAnimation();
  }

  function syncCameraToTarget() {
    const center = state.mapCenter || state.city?.default_center || [0, 0];
    state.cameraCenter = [Number(center[0]) || 0, Number(center[1]) || 0];
    state.cameraZoom = clamp(Number(state.mapZoom || cityMapZoom(state.city)), MIN_ZOOM, MAX_ZOOM);
  }

  function startCameraAnimation() {
    if (state.cameraFrame) return;
    state.cameraFrame = window.requestAnimationFrame(animateCamera);
  }

  function animateCamera() {
    state.cameraFrame = null;
    const target = state.mapCenter || state.cameraCenter || state.city?.default_center || [0, 0];
    if (!state.cameraCenter) state.cameraCenter = [...target];
    if (!Number.isFinite(Number(state.cameraZoom))) state.cameraZoom = state.mapZoom;

    const ease = state.mapDrag ? 0.34 : 0.18;
    const dx = Number(target[0]) - Number(state.cameraCenter[0]);
    const dy = Number(target[1]) - Number(state.cameraCenter[1]);
    const dz = Number(state.mapZoom) - Number(state.cameraZoom);
    state.cameraCenter = [
      Number(state.cameraCenter[0]) + dx * ease,
      Number(state.cameraCenter[1]) + dy * ease,
    ];
    state.cameraZoom = Number(state.cameraZoom) + dz * ease;

    renderTiles();
    renderMap();

    const closeEnough = Math.abs(dx) < 0.00003 && Math.abs(dy) < 0.00003 && Math.abs(dz) < 0.01;
    if (closeEnough) {
      syncCameraToTarget();
      renderTiles();
      renderMap();
      return;
    }
    state.cameraFrame = window.requestAnimationFrame(animateCamera);
  }

  function setSceneMotion(deltaX, deltaY) {
    if (state.viewMode !== "3d") return;
    const tilt = clamp(-deltaY / 44, -3.6, 3.6);
    const bearing = clamp(deltaX / 80, -2.8, 2.8);
    const lift = clamp(deltaY / 20, -8, 8);
    els.mapStage.style.setProperty("--scene-tilt", `${tilt.toFixed(2)}deg`);
    els.mapStage.style.setProperty("--scene-bearing", `${bearing.toFixed(2)}deg`);
    els.mapStage.style.setProperty("--scene-lift", `${lift.toFixed(1)}px`);
    els.mapStage.style.setProperty("--scene-scale", "1.045");
  }

  function settleSceneMotion() {
    els.mapStage.style.setProperty("--scene-tilt", "0deg");
    els.mapStage.style.setProperty("--scene-bearing", "0deg");
    els.mapStage.style.setProperty("--scene-lift", "0px");
    els.mapStage.style.setProperty("--scene-scale", "1.03");
  }

  function applyTemporalScene() {
    if (!els.mapStage) return;
    els.mapStage.style.setProperty("--before-filter", "none");
    els.mapStage.style.setProperty("--after-filter", "none");
    els.mapAttribution.textContent = imageryAttribution();
  }

  function pulseTemporalScene() {
    els.mapStage.classList.add("time-scrubbing");
    window.clearTimeout(state.timeScrubTimer);
    state.timeScrubTimer = window.setTimeout(() => {
      els.mapStage.classList.remove("time-scrubbing");
    }, 520);
  }

  function resetTileCache() {
    for (const layer of [els.beforeTileLayer, els.afterTileLayer]) {
      if (!layer) continue;
      layer.dataset.tileKey = "";
      layer.style.transform = "";
    }
  }

  function scheduleMapRender() {
    renderTiles();
    renderMap();
    window.requestAnimationFrame(() => {
      renderTiles();
      renderMap();
    });
    window.setTimeout(() => {
      renderTiles();
      renderMap();
    }, 250);
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  }

  function cityMapZoom(city) {
    return clamp(Math.round(city?.default_zoom || 12), MIN_ZOOM, MAX_ZOOM);
  }

  function categoryConfig(category) {
    return CATEGORY_CONFIG.find((item) => item.id === category) || CATEGORY_CONFIG[0];
  }

  function confidenceLabel(confidence) {
    return CONFIDENCE_LABELS[confidence] || "Unknown";
  }

  function confidenceColor(confidence) {
    if (confidence === "corroborated") return "#15803d";
    if (confidence === "documented") return "#2e9b58";
    if (confidence === "inferred") return "#e9781a";
    if (confidence === "disputed") return "#d14c68";
    return "#8a96a8";
  }

  function confidenceText(event) {
    if (event.confidence === "corroborated") return "Multiple independent evidence records support this observed change.";
    if (event.confidence === "documented") return "Public documentary evidence supports this observed change.";
    if (event.confidence === "inferred") return "Inferred from mapped or derived records; dates may be mapped-visibility dates.";
    if (event.confidence === "disputed") return "Evidence is incomplete or disputed; treat this record as a prompt for review.";
    return "Confidence criteria are not available for this record.";
  }

  function formatAvailabilityStatus(value) {
    return String(value || "partial_source_backed")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function normalizeCaveat(text) {
    return String(text || "");
  }

  function sourceLabel(sourceId) {
    const source = state.sourceById.get(sourceId);
    return source?.title || source?.provider || sourceId || "Source";
  }

  function cleanTitle(title) {
    return String(title || "Untitled record")
      .replace(/^Current data layer:\s*/i, "")
      .replace(/^London Olympic and Paralympic Games; Olympic Park legacy transition$/i, "Olympic Park development")
      .replace(/^Elizabeth line opens through central London$/i, "Stratford transport upgrades")
      .replace(/^COVID-19 lockdown and emergency Streetspace measures$/i, "Public realm and Streetspace measures")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatEventDate(event) {
    if (event?.effective_date_range) {
      const start = event.effective_date_range.start || "?";
      const end = event.effective_date_range.end || "?";
      return `${start} - ${end}`;
    }
    return event?.effective_date || String(event?.year || "Unknown date");
  }

  function shortCityName(name) {
    return String(name || "City").split(",")[0];
  }

  function dataPathToUrl(filePath) {
    return "/" + String(filePath || "").replace(/\\/g, "/").replace(/^web\//, "").replace(/^\//, "");
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
    return response.json();
  }

  function getUrlParam(name) {
    return new URL(window.location.href).searchParams.get(name);
  }

  function renderFatal(message) {
    els.eventList.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
    els.mapEmpty.textContent = message;
    els.mapEmpty.hidden = false;
    els.observedChange.textContent = message;
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 3000);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-GB").format(Number(value) || 0);
  }

  function truncate(value, length) {
    const text = String(value || "");
    return text.length > length ? `${text.slice(0, length - 1)}...` : text;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function exposeTestApi() {
    window.BimsAtlas = {
      state,
      filteredEvents,
      filteredMapEvents,
      setYear,
      selectFirstEvent: () => selectInitialEvent({ preferCurrentYear: true }),
      setCategory: (category) => {
        state.category = category;
        els.categoryFilter.value = category;
        renderLayerBar();
        refreshFilteredView({ preferCurrentYear: true });
      },
      setViewMode,
      toggleCompare,
      loadAllEventsForChangelog,
      planningReportPayload,
      copyPlanningReport,
      copyBrief,
      exportBrief,
      exportBriefJson,
    };
  }
})();
