(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  const DEFAULT_CITY = "belfast";
  const DEFAULT_YEAR = 2024;
  const MAX_MARKERS = 90;
  const EVENT_LIST_BATCH_SIZE = 24;
  const PLAY_RATE_YEARS_PER_SECOND = 1.4;

  const TILE_PROVIDER = {
    name: "OpenStreetMap Standard",
    attribution: "OpenStreetMap contributors",
    template: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  };

  // The new UI uses "layers" — we map them to the OpenCityLog event categories.
  const LAYERS = [
    { id: "transport",         label: "Transport",        color: "#1B7A85" },
    { id: "built_environment", label: "Planning & Built", color: "#C8472E" },
    { id: "civic_services",    label: "Civic services",   color: "#D69423" },
    { id: "economy",           label: "Economy",          color: "#7A3B7A" },
    { id: "environment",       label: "Environment",      color: "#3F6B3A" },
    { id: "utilities",         label: "Utilities",        color: "#8C7460" },
  ];
  const LAYER_BY_ID = new Map(LAYERS.map((l) => [l.id, l]));
  const MAP_LENSES = [
    {
      id: "transport",
      layerId: "transport",
      label: "Transport",
      shortLabel: "Transport",
      summary: "Route and street-segment activity from source-backed transport records.",
      empty: "No transport linework is available for the selected year and filters.",
      caveat: "Line color is a mapped activity surface, not measured traffic speed, congestion, or capacity.",
      legend: [
        { label: "Lower activity", color: "#2f8f46", shape: "line" },
        { label: "Moderate activity", color: "#d6a33e", shape: "line" },
        { label: "Higher activity", color: "#c8472e", shape: "line" },
      ],
    },
    {
      id: "built_environment",
      layerId: "built_environment",
      label: "Planning & Built",
      shortLabel: "Built",
      summary: "Planning cells, building footprints, and site records from available source-backed geometry.",
      empty: "No footprint or site geometry is available for the selected year and filters.",
      caveat: "Planning cells are evidence grids, not parcel boundaries. Belfast footprints use OSM visibility proxy dates where available.",
      legend: [
        { label: "Permitted or proposed cell", color: "#d6a33e", shape: "polygon" },
        { label: "Construction or completion", color: "#c8472e", shape: "polygon" },
        { label: "Mapped/inferred or uncertain", color: "#8f9d9d", shape: "outline" },
        { label: "Source-backed site point", color: "#c8472e", shape: "square" },
      ],
    },
    {
      id: "civic_services",
      layerId: "civic_services",
      label: "Civic Services",
      shortLabel: "Civic",
      summary: "Service evidence cells plus small facility glyphs where records have geometry.",
      empty: "No civic service records with usable geometry match the selected year and filters.",
      caveat: "Coverage cells are evidence grids around facility records, not surveyed service catchments or capacity areas.",
      legend: [
        { label: "Health or education cell", color: "#2a84a6", shape: "polygon" },
        { label: "Community/leisure cell", color: "#d69423", shape: "polygon" },
        { label: "Facility point", color: "#2a84a6", shape: "plus" },
      ],
    },
    {
      id: "economy",
      layerId: "economy",
      label: "Economy",
      shortLabel: "Economy",
      summary: "Activity cells and nearest mapped frontage ribbons from source-backed economy records.",
      empty: "No economy records with usable geometry match the selected year and filters.",
      caveat: "Frontage ribbons reuse nearest OSM street geometry for context; they are not measured footfall, spend, or vacancy.",
      legend: [
        { label: "Commercial or office cell", color: "#7a3b7a", shape: "polygon" },
        { label: "Hospitality/visitor cell", color: "#d69423", shape: "polygon" },
        { label: "Nearest frontage ribbon", color: "#c8472e", shape: "line" },
      ],
    },
    {
      id: "utilities",
      layerId: "utilities",
      label: "Utilities",
      shortLabel: "Utilities",
      summary: "Streetwork and infrastructure traces plus small asset/work glyphs where records have geometry.",
      empty: "No utilities records with usable geometry match the selected year and filters.",
      caveat: "Utility traces are nearest mapped street/work context only. No capacity data is inferred.",
      legend: [
        { label: "Utility or work trace", color: "#8c7460", shape: "line" },
        { label: "Repair/disruption status", color: "#c8472e", shape: "line" },
        { label: "Observed or mapped asset point", color: "#8c7460", shape: "bolt" },
      ],
    },
  ];
  const MAP_LENS_BY_ID = new Map(MAP_LENSES.map((lens) => [lens.id, lens]));
  const DEFAULT_MAP_LENS = "transport";
  const POINT_LENS_IDS = new Set(["built_environment", "civic_services", "economy", "utilities"]);
  const DETAIL_SOURCE_ID = "osm-detail";
  const DETAIL_LENS_LAYER_IDS = [
    "lens-built-footprints-fill",
    "lens-built-footprints-outline",
    "lens-built-footprints-year",
  ];
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
  const LENS_DETAIL_SOURCE_ID = "lens-detail-overlays";
  const LENS_ROAD_BASE_SOURCE_ID = "lens-transport-road-base";
  const LENS_ROAD_SOURCE_ID = "lens-transport-road-year";
  const LENS_DETAIL_LAYER_IDS = [
    "lens-planning-cells-fill",
    "lens-planning-cells-outline",
    "lens-civic-coverage-fill",
    "lens-civic-coverage-outline",
    "lens-civic-facility-icons",
    "lens-economy-cells-fill",
    "lens-economy-cells-outline",
    "lens-economy-frontage-case",
    "lens-economy-frontage",
    "lens-utilities-trace-case",
    "lens-utilities-trace",
    "lens-utility-asset-icons",
  ];
  const LENS_LAYER_IDS = [
    "lens-heatmap",
    "lens-current-points-glow",
    "lens-current-points",
    ...DETAIL_LENS_LAYER_IDS,
    ...LENS_DETAIL_LAYER_IDS,
    "lens-built-site-icons",
    "lens-civic-icons",
    "lens-economy-icons",
    "lens-utilities-icons",
    "lens-transport-base-case",
    "lens-transport-base",
    "lens-transport-roads-case",
    "lens-transport-roads",
    "lens-transport-hotspots",
  ];

  // Curated proposals shown in the Proposal Lens overlay. These are illustrative
  // historical-analogue cases for the lens; they do not depend on per-city event
  // chunks loading. Keeping them as a tiny static list lets the lens stay
  // useful without recomputing analogues from event metadata each request.
  const PROPOSALS = [
    {
      id: "p-belfast-glider-northsouth",
      city: "belfast",
      title: "Belfast Glider North–South extension",
      type: "Transit · BRT",
      decision: "DfI scoping 2026",
      summary: "Extending the Glider corridor north and south of the city centre to reach North Belfast and the Cathedral Quarter rail interchange.",
      analogs: [
        {
          place: "Belfast",
          title: "Glider G1/G2 launch",
          year: 2018,
          layer: "transport",
          outcomes: [
            { k: "Daily boardings", v: "30,000" },
            { k: "Bus speed (peak)", v: "+22%" },
            { k: "Bus mode share corridor", v: "+5 pts" },
          ],
        },
        {
          place: "London",
          title: "East London Overground",
          year: 2009,
          layer: "transport",
          outcomes: [
            { k: "Daily entries (Dalston Jn)", v: "38,400" },
            { k: "Punctuality (PPM)", v: "95.6%" },
            { k: "Observed ridership difference", v: "+38%" },
          ],
        },
        {
          place: "Seoul",
          title: "Line 9 East extension",
          year: 2011,
          layer: "transport",
          outcomes: [
            { k: "Observed ridership difference", v: "+12%" },
            { k: "1km rent uplift", v: "+19%" },
            { k: "Cycle/bus modal", v: "−4%" },
          ],
        },
      ],
      distribution: {
        "Observed ridership difference": "+12% — +38%",
        "Rent uplift within 1km": "+8% — +24%",
        "Bus speed (parallel)": "+4% — +22%",
        "Local NO₂ change": "−3% — −9%",
      },
    },
    {
      id: "p-belfast-cathedralquarter",
      city: "belfast",
      title: "Cathedral Quarter regeneration phase 3",
      type: "Mixed-use regeneration",
      decision: "Belfast City Council review 2026",
      summary: "Continued regeneration of Belfast's Cathedral Quarter with mixed-use development around York Street and the new Ulster University campus.",
      analogs: [
        {
          place: "London",
          title: "King's Cross Central",
          year: 2007,
          layer: "built_environment",
          outcomes: [
            { k: "Affordable delivered", v: "40%" },
            { k: "Rent uplift 1km", v: "+38%" },
            { k: "Office GIA", v: "325k m²" },
          ],
        },
        {
          place: "Belfast",
          title: "Titanic Quarter masterplan",
          year: 2012,
          layer: "built_environment",
          outcomes: [
            { k: "Workspace delivered", v: "150,000 m²" },
            { k: "Visitor arrivals", v: "850k/yr" },
            { k: "Affordable %", v: "low" },
          ],
        },
        {
          place: "Seoul",
          title: "Dongdaemun Design Plaza",
          year: 2014,
          layer: "environment",
          outcomes: [
            { k: "Annual visitors", v: "8.6M" },
            { k: "GIA", v: "86,574 m²" },
            { k: "Adjacent rent change", v: "+25%" },
          ],
        },
      ],
      distribution: {
        "Affordable housing delivered": "9% — 40%",
        "Rent uplift within 1km (5y)": "+18% — +52%",
        "Public realm added": "0.4 ha — 10 ha",
        "Workspace GIA": "82k — 325k m²",
      },
    },
    {
      id: "p-belfast-cyclenet",
      city: "belfast",
      title: "Belfast Cycle Network completion",
      type: "Cycling · protected lanes",
      decision: "DfI Cycle Network 2030 draft",
      summary: "Closing the gaps in the protected cycling network across central and inner Belfast, including segregated lanes on Donegall Pass and the Westlink corridor.",
      analogs: [
        {
          place: "London",
          title: "Cycle Superhighway CS3",
          year: 2014,
          layer: "transport",
          outcomes: [
            { k: "Daily cyclists", v: "13,400" },
            { k: "Daily growth vs baseline", v: "+345%" },
            { k: "Cycle KSI rate", v: "−40%" },
          ],
        },
        {
          place: "Seoul",
          title: "Cheonggyecheon restoration",
          year: 2005,
          layer: "environment",
          outcomes: [
            { k: "Corridor air temp", v: "−3.6°C" },
            { k: "Daily visitors", v: "64,000" },
            { k: "Adjacent rents", v: "+30–50%" },
          ],
        },
        {
          place: "Berlin",
          title: "Friedrichshain pop-up bike lanes",
          year: 2020,
          layer: "transport",
          outcomes: [
            { k: "Cycle counts", v: "+25%" },
            { k: "Adjacent NO₂", v: "−12%" },
            { k: "Cyclist KSI", v: "−18%" },
          ],
        },
      ],
      distribution: {
        "Daily cyclists growth": "+25% — +345%",
        "Cyclist KSI change": "−40% — −18%",
        "Adjacent NO₂": "−12% — −3%",
        "Bus journey time impact": "+0% — +4%",
      },
    },
  ];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const state = {
    index: null,
    cityId: DEFAULT_CITY,
    cityMeta: null,
    city: null,
    availability: null,
    availabilityError: null,
    sources: [],
    sourceById: new Map(),
    eventsIndex: null,
    chunks: new Map(),                 // year -> chunk metadata
    years: [],
    yearRange: [2007, 2026],
    year: DEFAULT_YEAR,
    activeLayers: new Set(LAYERS.map((l) => l.id)),
    activeLens: DEFAULT_MAP_LENS,
    confidenceFilter: "all",
    showInferred: true,
    search: "",
    eventListLimit: EVENT_LIST_BATCH_SIZE,
    loadedEvents: new Map(),           // year -> array of events
    loadingYears: new Map(),
    yearLoadErrors: new Map(),
    eventById: new Map(),
    selectedEventId: null,
    selectedEvent: null,
    pendingCameraFocusEventId: null,
    playing: false,
    playRaf: null,
    map: null,
    mapReady: false,
    markers: new Map(),                // eventId -> maplibregl.Marker
    theme: "light",
    changelogOpen: true,
    compareOpen: false,
    compareBeforeYear: null,
    compareAfterYear: null,
    compareEvidenceLoadingKey: "",
    detailEvidenceLoadingKey: "",
    mapTilted: false,
    lensOpen: false,
    methodOpen: false,
    welcomeOpen: true,
    currentProposalId: PROPOSALS[0].id,
    detailLayerLoaded: false,
    detailLayerError: null,
    detailLayerPathLoaded: null,
    lensOverlayLoaded: false,
    lensOverlayError: null,
    transportRoadBasePathLoaded: null,
    transportRoadYearPathLoaded: null,
    transportRoadYearLoaded: null,
    transportRoadFeatureCountPathLoaded: null,
    transportRoadFeatureCountYearLoaded: null,
    transportRoadFeatureCount: null,
    lensDetailYearPathLoaded: null,
    lensDetailYearLoaded: null,
    lensEventFeatureCount: 0,
    lensEventSourceKey: "",
  };

  const els = {};

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) {
      state.changelogOpen = false;
    }
    collectElements();
    setChangelogOpen(state.changelogOpen);
    wireEvents();
    renderLayers();
    renderLensSwitcher();
    renderProposalLensList();
    renderLensOutcomes(currentProposal());
    renderLensAnalogs(currentProposal());
    updateLensHead();
    setAppStatus("Loading source-backed city atlas…");
    try {
      await loadIndex();
      await loadCity(initialCityId());
      setAppStatus("");
    } catch (error) {
      console.error("[atlas] failed to load", error);
      setAppStatus(`Failed to load atlas: ${error.message}`);
    }
  }

  function collectElements() {
    const ids = [
      "map", "appStatus", "toast", "toastText",
      "cityToggle", "cityNameLabel", "cityMenu",
      "searchInput", "searchResults",
      "changelogToggle", "changelogPanel", "eventList", "eventListCount", "eventListMeta", "eventListMore",
      "compareBtn", "comparePanel", "compareClose", "compareBeforeYear", "compareAfterYear", "compareStats", "compareNote",
      "recenterBtn", "tiltBtn",
      "methodBtn", "shareBtn", "themeBtn",
      "layersPanel", "layersList", "layersCount", "lensSwitcher", "lensLegend", "lensDataState",
      "confidenceFilter", "showInferredToggle", "coverageNote",
      "detailPanel", "detailEmpty", "detailInner", "emptyCityName",
      "lensFab", "lensOverlay", "lensClose", "lensTitle", "lensType",
      "lensDecision", "lensSummary", "lensProposals", "lensAnalogs",
      "lensOutcomes", "lensExport", "lensDiscuss",
      "methodOverlay", "methodClose", "methodDatasetTable", "methodCities",
      "tlYear", "tlVisible", "tlTotal", "tlCity", "tlLayers",
      "playBtn", "playIcon",
      "tlTrack", "tlHistogram", "tlAxis", "tlCursor", "tlScrub",
      "welcome", "welcomeCity", "welcomeStart", "welcomeSkip",
    ];
    for (const id of ids) els[id] = document.getElementById(id);
  }

  function wireEvents() {
    // City switcher
    els.cityToggle?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !els.cityMenu.hasAttribute("hidden");
      open ? els.cityMenu.setAttribute("hidden", "") : els.cityMenu.removeAttribute("hidden");
    });
    document.addEventListener("click", () => els.cityMenu?.setAttribute("hidden", ""));
    els.cityMenu?.addEventListener("click", (e) => e.stopPropagation());

    // Search
    els.searchInput?.addEventListener("input", () => {
      state.search = els.searchInput.value.trim();
      renderSearchResults();
      resetEventListLimit();
      renderEventList();
      syncTopline();
      updateTimeDependentMapState();
      renderMarkers();
    });
    els.searchInput?.addEventListener("focus", () => renderSearchResults());
    els.searchInput?.addEventListener("blur", () => {
      // delay so click on a result can fire first
      setTimeout(() => els.searchResults?.setAttribute("hidden", ""), 160);
    });

    // Layers panel: confidence + inferred toggle
    els.confidenceFilter?.addEventListener("change", async () => {
      state.confidenceFilter = els.confidenceFilter.value;
      resetEventListLimit();
      renderAll();
      updateTimeDependentMapState();
      renderMarkers();
      await reconcileSelectionWithFilters({ keepCamera: true });
    });
    els.showInferredToggle?.addEventListener("change", async () => {
      state.showInferred = !!els.showInferredToggle.checked;
      resetEventListLimit();
      renderAll();
      updateTimeDependentMapState();
      renderMarkers();
      await reconcileSelectionWithFilters({ keepCamera: true });
    });

    // Methodology
    els.methodBtn?.addEventListener("click", () => setMethodOpen(true));
    els.methodClose?.addEventListener("click", () => setMethodOpen(false));

    // Restored atlas controls
    els.changelogToggle?.addEventListener("click", () => setChangelogOpen(!state.changelogOpen));
    els.eventListMore?.addEventListener("click", () => {
      state.eventListLimit += EVENT_LIST_BATCH_SIZE;
      renderEventList();
    });
    els.compareBtn?.addEventListener("click", () => setCompareOpen(!state.compareOpen));
    els.compareClose?.addEventListener("click", () => setCompareOpen(false));
    els.compareBeforeYear?.addEventListener("change", () => {
      state.compareBeforeYear = Number(els.compareBeforeYear.value);
      renderComparePanel();
    });
    els.compareAfterYear?.addEventListener("change", () => {
      state.compareAfterYear = Number(els.compareAfterYear.value);
      renderComparePanel();
    });
    els.recenterBtn?.addEventListener("click", recenterMap);
    els.tiltBtn?.addEventListener("click", toggleMapTilt);

    // Share
    els.shareBtn?.addEventListener("click", async () => {
      const url = new URL(window.location.href);
      url.searchParams.set("city", state.cityId);
      url.searchParams.set("year", String(state.year));
      await copyText(url.toString(), "Permalink copied - view shared with city and year");
    });

    // Theme
    els.themeBtn?.addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      document.body.setAttribute("data-theme", state.theme);
    });

    // Welcome
    els.welcomeStart?.addEventListener("click", () => setWelcomeOpen(false));
    els.welcomeSkip?.addEventListener("click", () => setWelcomeOpen(false));

    // Proposal Lens
    els.lensFab?.addEventListener("click", () => setLensOpen(true));
    els.lensClose?.addEventListener("click", () => setLensOpen(false));
    els.lensExport?.addEventListener("click", () => toast("Export coming soon — every analogue carries its source chain"));
    els.lensDiscuss?.addEventListener("click", () => toast("Team workspaces ship in the next OpenCityLog drop"));

    // Timeline play
    els.playBtn?.addEventListener("click", togglePlay);

    // Timeline scrub
    let scrubbing = false;
    const scrubFromEvent = (e) => {
      const track = els.tlTrack;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const [yStart, yEnd] = state.yearRange;
      const next = Math.round(yStart + f * (yEnd - yStart));
      setYear(next);
    };
    els.tlScrub?.addEventListener("pointerdown", (e) => {
      scrubbing = true;
      stopPlay();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      scrubFromEvent(e);
    });
    els.tlScrub?.addEventListener("pointermove", (e) => { if (scrubbing) scrubFromEvent(e); });
    els.tlScrub?.addEventListener("pointerup", () => { scrubbing = false; });

    // Keyboard
    document.addEventListener("keydown", (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "ArrowRight") setYear(Math.min(state.yearRange[1], state.year + 1));
      else if (e.key === "ArrowLeft") setYear(Math.max(state.yearRange[0], state.year - 1));
      else if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "/") { e.preventDefault(); els.searchInput?.focus(); }
      else if (e.key.toLowerCase() === "p") setLensOpen(true);
      else if (e.key === "Escape") {
        if (state.lensOpen) setLensOpen(false);
        else if (state.methodOpen) setMethodOpen(false);
        else if (state.compareOpen) setCompareOpen(false);
        else if (state.welcomeOpen) setWelcomeOpen(false);
        else if (state.selectedEventId) clearSelection();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  async function loadIndex() {
    state.index = await fetchJson("/data/city-atlas/index.json");
    renderCityMenu();
  }

  async function loadCity(cityId) {
    stopPlay();
    state.cityId = cityId;
    state.cityMeta = cityMeta(cityId);
    if (!state.cityMeta) throw new Error(`City not found: ${cityId}`);

    setAppStatus(`Loading ${shortCityName(state.cityMeta.display_name)}…`);

    const paths = state.cityMeta.artifact_paths || {};
    const [cityDoc, eventsIndex, sourcesDoc, availabilityDoc] = await Promise.all([
      fetchJson(dataPathToUrl(paths.city)),
      fetchJson(dataPathToUrl(paths.events)),
      fetchJson(dataPathToUrl(paths.sources)),
      paths.availability
        ? fetchJson(dataPathToUrl(paths.availability)).catch((error) => ({ __error: error }))
        : Promise.resolve(null),
    ]);

    state.city = cityDoc;
    state.eventsIndex = eventsIndex;
    state.availability = availabilityDoc && !availabilityDoc.__error ? availabilityDoc : null;
    state.availabilityError = availabilityDoc?.__error?.message || null;
    state.chunks = new Map((eventsIndex.chunks || []).map((c) => [Number(c.year), c]));
    state.sources = sourcesDoc.sources || [];
    state.sourceById = new Map(state.sources.map((s) => [s.source_id, s]));
    state.years = (eventsIndex.event_years || [...state.chunks.keys()])
      .map(Number).filter(Number.isFinite).sort((a, b) => a - b);

    if (state.years.length) {
      state.yearRange = [state.years[0], state.years[state.years.length - 1]];
    }
    // pick a sensible default year
    const params = new URL(window.location.href).searchParams;
    const requestedEventId = initialEventId();
    const requestedLens = normalizeMapLensId(params.get("lens"));
    state.activeLens = requestedLens || state.activeLens || DEFAULT_MAP_LENS;
    const desiredYear = Number(params.get("year"));
    if (Number.isFinite(desiredYear) && state.years.includes(desiredYear)) {
      state.year = desiredYear;
    } else if (state.years.includes(DEFAULT_YEAR)) {
      state.year = DEFAULT_YEAR;
    } else {
      state.year = state.years[state.years.length - 1] || DEFAULT_YEAR;
    }

    state.loadedEvents.clear();
    state.loadingYears.clear();
    state.yearLoadErrors.clear();
    state.eventById.clear();
    state.selectedEventId = null;
    state.selectedEvent = null;
    state.pendingCameraFocusEventId = null;
    state.search = "";
    state.eventListLimit = EVENT_LIST_BATCH_SIZE;
    state.compareOpen = false;
    state.compareBeforeYear = compareDefaultBeforeYear();
    state.compareAfterYear = state.year;
    state.mapTilted = false;
    state.detailLayerError = null;
    state.lensOverlayError = null;
    state.lensEventFeatureCount = 0;
    state.lensEventSourceKey = "";
    if (els.searchInput) els.searchInput.value = "";

    setText(els.cityNameLabel, shortCityName(state.city.display_name));
    setText(els.welcomeCity, shortCityName(state.city.display_name));
    setText(els.emptyCityName, shortCityName(state.city.display_name));
    setText(els.tlCity, shortCityName(state.city.display_name));

    renderCityMenu();
    renderAll();
    initOrUpdateMap();

    // Preload current year for snappier first interaction
    await loadYear(state.year);
    await loadLensYearsForTimeline(state.year);
    renderAll();
    updateTimeDependentMapState();
    renderMarkers();
    setAppStatus("");
    if (requestedEventId) {
      await selectEvent(requestedEventId, { silent: true });
    }
    if (!state.selectedEvent) await selectFirstVisibleEvent();
  }

  async function loadYear(year) {
    const numericYear = Number(year);
    if (!Number.isFinite(numericYear)) return [];
    if (state.loadedEvents.has(numericYear)) return state.loadedEvents.get(numericYear);
    if (state.loadingYears.has(numericYear)) return state.loadingYears.get(numericYear);

    const chunk = state.chunks.get(numericYear);
    if (!chunk?.json_path) {
      state.loadedEvents.set(numericYear, []);
      return [];
    }
    const promise = fetchJson(dataPathToUrl(chunk.json_path))
      .then((payload) => {
        const arr = Array.isArray(payload?.events) ? payload.events : (Array.isArray(payload?.features) ? payload.features : []);
        const events = arr.map((raw, idx) => normalizeEvent(raw, numericYear, idx));
        state.loadedEvents.set(numericYear, events);
        state.yearLoadErrors.delete(numericYear);
        for (const e of events) state.eventById.set(e.id, e);
        return events;
      })
      .catch((err) => {
        console.warn(`[atlas] year ${numericYear} failed to load`, err);
        state.yearLoadErrors.set(numericYear, err.message || String(err));
        state.loadedEvents.set(numericYear, []);
        return [];
      })
      .finally(() => state.loadingYears.delete(numericYear));
    state.loadingYears.set(numericYear, promise);
    return promise;
  }

  async function loadLensYearsForTimeline(year = state.year) {
    const target = currentTimelineYear(year);
    const start = Math.max(earliestTimelineYear(), target - 2);
    const years = [];
    for (let candidate = start; candidate <= target; candidate += 1) {
      if (state.chunks.has(candidate) || state.years.includes(candidate)) years.push(candidate);
    }
    await Promise.all(years.map((candidate) => loadYear(candidate)));
  }

  function normalizeEvent(raw, fallbackYear, index) {
    const props = raw.properties || raw;
    const geom = raw.geometry || props.geometry || null;
    const sourceIds = props.source_ids || props.sources || [];
    const event = {
      id: String(props.event_id || raw.id || props.id || `${fallbackYear}-${index}`),
      title: cleanTitle(props.title),
      shortDescription: cleanSummary(props.short_description || props.summary || props.explanation || ""),
      year: Number(props.year || fallbackYear),
      effectiveDate: props.effective_date || "",
      effectiveDateRange: props.effective_date_range || null,
      datePrecision: props.date_precision || "",
      sourceDateField: props.source_date_field || "",
      category: props.category || "built_environment",
      lens: props.lens || props.category || "city_change",
      confidence: props.confidence || "documented",
      summary: cleanSummary(props.explanation || props.summary || ""),
      area: props.affected_area?.label || props.affected_area_label || "",
      sourceIds: Array.isArray(sourceIds) ? sourceIds.filter(Boolean) : [sourceIds].filter(Boolean),
      evidence: Array.isArray(props.evidence) ? props.evidence : [],
      affectedSignals: Array.isArray(props.affected_signals) ? props.affected_signals : [],
      impactDeltas: Array.isArray(props.impact_deltas) ? props.impact_deltas : [],
      trafficMetrics: props.traffic_metrics || null,
      caveats: Array.isArray(props.caveats) ? props.caveats : [],
      provenance: props.provenance || {},
      geometry: geom,
    };
    event.lngLat = geometryToLngLat(geom);
    return event;
  }

  function geometryToLngLat(geom) {
    if (!geom) return null;
    if (geom.type === "Point" && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
      const [lng, lat] = geom.coordinates;
      if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
    }
    if (geom.type === "Polygon" && Array.isArray(geom.coordinates?.[0])) {
      return averageRing(geom.coordinates[0]);
    }
    if (geom.type === "LineString" && Array.isArray(geom.coordinates)) {
      return averageRing(geom.coordinates);
    }
    return null;
  }
  function averageRing(coords) {
    let lng = 0, lat = 0, n = 0;
    for (const [x, y] of coords) {
      if (Number.isFinite(x) && Number.isFinite(y)) { lng += x; lat += y; n += 1; }
    }
    return n ? [lng / n, lat / n] : null;
  }

  // ---------------------------------------------------------------------------
  // Map — preserves the original MapLibre + OSM stack
  // ---------------------------------------------------------------------------

  function initOrUpdateMap() {
    if (!els.map || !window.maplibregl) return;
    const center = mapCenter();
    const zoom = Number(state.city?.default_zoom || 11.5);

    if (state.map) {
      state.map.jumpTo({ center, zoom, pitch: state.mapTilted ? 48 : 0, bearing: state.mapTilted ? -10 : 0 });
      setTimeout(() => state.map.resize(), 60);
      updateTimeDependentMapState();
      updateMapToolState();
      return;
    }

    state.map = new window.maplibregl.Map({
      container: els.map,
      style: {
        version: 8,
        sources: {
          basemap: {
            type: "raster",
            tiles: [TILE_PROVIDER.template],
            tileSize: 256,
            attribution: TILE_PROVIDER.attribution,
          },
        },
        layers: [{ id: "basemap", type: "raster", source: "basemap", paint: { "raster-fade-duration": 180 } }],
      },
      center,
      zoom,
      pitch: state.mapTilted ? 48 : 0,
      bearing: state.mapTilted ? -10 : 0,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false,
    });
    state.map.addControl(new window.maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true,
    }), "bottom-right");
    state.map.addControl(new window.maplibregl.AttributionControl({
      compact: true,
    }), "bottom-left");

    const onReady = () => {
      if (state.mapReady) return;
      state.mapReady = true;
      state.map.resize();
      updateTimeDependentMapState();
      renderMarkers();
      focusPendingCameraEvent(0);
    };
    state.map.on("load", onReady);
    state.map.once("idle", onReady);
    try { state.map.triggerRepaint(); } catch (_e) { /* not yet ready */ }
  }

  function mapCenter() {
    const center = state.city?.default_center;
    if (Array.isArray(center) && center.length === 2) return center;
    return [-5.9301, 54.5973];
  }

  function renderMarkers() {
    if (!state.map) return;
    const events = filteredEvents().filter((event) => event.lngLat).slice(0, MAX_MARKERS);
    const eventIds = new Set(events.map((e) => e.id));

    // Remove markers that are no longer visible
    for (const [id, marker] of state.markers) {
      if (!eventIds.has(id)) {
        marker.remove();
        state.markers.delete(id);
      }
    }

    for (const event of events) {
      const existing = state.markers.get(event.id);
      if (existing) {
        const el = existing.getElement();
        el.className = "pin-wrap";
        el.style.zIndex = markerZIndex(event);
        const pin = el.querySelector(".pin");
        pin?.setAttribute("data-active", String(event.id === state.selectedEventId));
        pin?.setAttribute("aria-pressed", String(event.id === state.selectedEventId));
        continue;
      }
      const layer = LAYER_BY_ID.get(event.category) || LAYERS[1];
      const el = document.createElement("div");
      el.className = "pin-wrap";
      el.style.zIndex = markerZIndex(event);
      el.innerHTML = `
        <div class="pin" data-active="${event.id === state.selectedEventId}" style="--accent:${layer.color}" role="button" tabindex="0" aria-pressed="${event.id === state.selectedEventId}" aria-label="${escapeAttr(`${event.title}, ${event.year}`)}">
          <div class="pin-label">${escapeHtml(truncate(event.title, 60))} · ${event.year}</div>
        </div>`;
      const selectMarker = () => selectEvent(event.id);
      el.addEventListener("click", selectMarker);
      addPressHandler(el.querySelector(".pin"), selectMarker);
      const marker = new window.maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(event.lngLat)
        .addTo(state.map);
      state.markers.set(event.id, marker);
    }
  }

  function markerZIndex(event) {
    if (event.id === state.selectedEventId) return "90";
    if (event.confidence === "corroborated") return "50";
    if (event.confidence === "documented") return "45";
    if (event.confidence === "disputed") return "35";
    return "25";
  }

  // ---------------------------------------------------------------------------
  // Map lens overlays
  // ---------------------------------------------------------------------------

  function detailLayerPath() {
    const configured = state.cityMeta?.artifact_paths?.detail_layers || state.city?.artifact_paths?.detail_layers;
    return configured ? dataPathToUrl(configured) : "";
  }

  function transportRoadBasePath() {
    const configured = state.cityMeta?.artifact_paths?.transport_roads_base || state.city?.artifact_paths?.transport_roads_base;
    return configured ? dataPathToUrl(configured) : "";
  }

  function transportRoadYearPath(year = state.year) {
    const template = state.cityMeta?.artifact_paths?.transport_roads_template || state.city?.artifact_paths?.transport_roads_template;
    const numericYear = currentTimelineYear(year);
    return template ? dataPathToUrl(String(template).replace("{year}", String(numericYear))) : "";
  }

  function lensDetailYearPath(year = state.year) {
    const template = state.cityMeta?.artifact_paths?.lens_detail_template || state.city?.artifact_paths?.lens_detail_template;
    const numericYear = currentTimelineYear(year);
    return template ? dataPathToUrl(String(template).replace("{year}", String(numericYear))) : "";
  }

  function ensureDetailLayers() {
    if (!state.map || !state.mapReady) return;
    const path = detailLayerPath();
    if (!path) {
      removeDetailLayers();
      return;
    }

    try {
      const existing = state.map.getSource(DETAIL_SOURCE_ID);
      if (existing?.setData) {
        if (state.detailLayerPathLoaded !== path) existing.setData(path);
      } else {
        state.map.addSource(DETAIL_SOURCE_ID, { type: "geojson", data: path, generateId: true });
      }
      state.detailLayerPathLoaded = path;
      if (!state.map.getLayer("detail-roads-current")) addDetailLayers();
      state.detailLayerLoaded = true;
      state.detailLayerError = null;
      renderCoverageNote();
      updateDetailLayerFilters();
    } catch (error) {
      state.detailLayerLoaded = false;
      state.detailLayerError = error.message;
      renderCoverageNote();
      console.warn("[atlas] detail layer unavailable", error);
    }
  }

  function addDetailLayers() {
    state.map.addLayer({
      id: "detail-roads-current",
      type: "line",
      source: DETAIL_SOURCE_ID,
      filter: ["==", ["get", "layer"], "road"],
      paint: {
        "line-color": "#a9c9bd",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.05, 14, 0.14, 17, 0.22],
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.3, 14, 0.9, 17, 2.2],
      },
    });
    state.map.addLayer({
      id: "detail-buildings-fill",
      type: "fill",
      source: DETAIL_SOURCE_ID,
      minzoom: 10,
      filter: detailVisibilityFilter("building"),
      paint: {
        "fill-color": detailBuildingColorExpression(),
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.1, 14, 0.22, 17, 0.34],
      },
    });
    state.map.addLayer({
      id: "detail-buildings-extrusion",
      type: "fill-extrusion",
      source: DETAIL_SOURCE_ID,
      minzoom: 13,
      filter: detailVisibilityFilter("building"),
      paint: {
        "fill-extrusion-color": detailBuildingColorExpression(),
        "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 13, 0, 15, ["to-number", ["get", "height_m"], 8]],
        "fill-extrusion-opacity": 0.38,
      },
    });
    state.map.addLayer({
      id: "detail-buildings-outline",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 12,
      filter: detailVisibilityFilter("building"),
      paint: {
        "line-color": "#f4ead2",
        "line-opacity": 0.28,
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.3, 16, 0.9],
      },
    });
    state.map.addLayer({
      id: "detail-roads-visible",
      type: "line",
      source: DETAIL_SOURCE_ID,
      filter: detailVisibilityFilter("road"),
      paint: {
        "line-color": ["case", [">=", ["to-number", ["get", "rank"], 1], 3], "#d6a33e", "#1b7a85"],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.18, 14, 0.4, 17, 0.58],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, ["*", ["to-number", ["get", "rank"], 1], 0.24],
          14, ["*", ["to-number", ["get", "rank"], 1], 0.62],
          17, ["*", ["to-number", ["get", "rank"], 1], 1.1],
        ],
      },
    });
    state.map.addLayer({
      id: "detail-roads-year",
      type: "line",
      source: DETAIL_SOURCE_ID,
      filter: detailYearFilter("road"),
      paint: {
        "line-color": "#d2452f",
        "line-opacity": 0.78,
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, ["*", ["to-number", ["get", "rank"], 1], 0.48],
          14, ["*", ["to-number", ["get", "rank"], 1], 1.1],
          17, ["*", ["to-number", ["get", "rank"], 1], 1.8],
        ],
      },
    });
    state.map.addLayer({
      id: "detail-buildings-year-outline",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 12,
      filter: detailYearFilter("building"),
      paint: {
        "line-color": "#d2452f",
        "line-opacity": 0.76,
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 0.8, 16, 1.8],
      },
    });
  }

  function removeDetailLayers() {
    if (!state.map) return;
    for (const layerId of [...DETAIL_LENS_LAYER_IDS, ...DETAIL_LAYER_IDS]) {
      if (state.map.getLayer(layerId)) state.map.removeLayer(layerId);
    }
    if (state.map.getSource(DETAIL_SOURCE_ID)) state.map.removeSource(DETAIL_SOURCE_ID);
    state.detailLayerLoaded = false;
    state.detailLayerPathLoaded = null;
  }

  function updateDetailLayerFilters() {
    if (!state.map?.getSource(DETAIL_SOURCE_ID)) return;
    for (const layerId of ["detail-buildings-fill", "detail-buildings-extrusion", "detail-buildings-outline"]) {
      if (state.map.getLayer(layerId)) state.map.setFilter(layerId, detailVisibilityFilter("building"));
    }
    if (state.map.getLayer("detail-buildings-fill")) {
      state.map.setPaintProperty("detail-buildings-fill", "fill-color", detailBuildingColorExpression());
    }
    if (state.map.getLayer("detail-buildings-extrusion")) {
      state.map.setPaintProperty("detail-buildings-extrusion", "fill-extrusion-color", detailBuildingColorExpression());
    }
    updateDetailLayerPaint();
    if (state.map.getLayer("detail-roads-visible")) state.map.setFilter("detail-roads-visible", detailVisibilityFilter("road"));
    if (state.map.getLayer("detail-roads-year")) state.map.setFilter("detail-roads-year", detailYearFilter("road"));
    if (state.map.getLayer("detail-buildings-year-outline")) state.map.setFilter("detail-buildings-year-outline", detailYearFilter("building"));
  }

  function detailVisibilityFilter(layer) {
    return ["all", ["==", ["get", "layer"], layer], ["<=", ["to-number", ["get", "visible_year"], 9999], currentTimelineYear()]];
  }

  function detailYearFilter(layer) {
    return ["all", ["==", ["get", "layer"], layer], ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()]];
  }

  function detailBuildingColorExpression() {
    const builtActive = isActiveMapLens("built_environment");
    return [
      "case",
      ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
      builtActive ? "#c8472e" : "#b88974",
      builtActive ? "#a9b08f" : "#b8b6a8",
    ];
  }

  function updateDetailLayerPaint() {
    const builtActive = isActiveMapLens("built_environment");
    const transportActive = isActiveMapLens("transport");
    if (state.map.getLayer("detail-buildings-fill")) {
      state.map.setPaintProperty(
        "detail-buildings-fill",
        "fill-opacity",
        ["interpolate", ["linear"], ["zoom"], 10, builtActive ? 0.1 : 0.03, 14, builtActive ? 0.2 : 0.08, 17, builtActive ? 0.3 : 0.14],
      );
    }
    if (state.map.getLayer("detail-buildings-extrusion")) {
      state.map.setPaintProperty("detail-buildings-extrusion", "fill-extrusion-opacity", builtActive ? 0.32 : 0.12);
    }
    if (state.map.getLayer("detail-roads-visible")) {
      state.map.setPaintProperty(
        "detail-roads-visible",
        "line-opacity",
        ["interpolate", ["linear"], ["zoom"], 10, transportActive ? 0.18 : 0.08, 14, transportActive ? 0.42 : 0.18, 17, transportActive ? 0.62 : 0.28],
      );
    }
  }

  function ensureLensOverlays() {
    if (!state.map || !state.mapReady) return;
    const basePath = transportRoadBasePath();
    const yearPath = transportRoadYearPath(state.year);
    const detailPath = shouldLoadLensDetail() ? lensDetailYearPath(state.year) : "";

    try {
      const lensSource = state.map.getSource(LENS_SOURCE_ID);
      if (!lensSource) {
        state.map.addSource(LENS_SOURCE_ID, { type: "geojson", data: emptyFeatureCollection(), generateId: true });
      }

      const detailSource = state.map.getSource(LENS_DETAIL_SOURCE_ID);
      if (detailPath) {
        if (detailSource?.setData) {
          if (state.lensDetailYearPathLoaded !== detailPath) detailSource.setData(detailPath);
        } else {
          state.map.addSource(LENS_DETAIL_SOURCE_ID, { type: "geojson", data: detailPath, generateId: true });
        }
        state.lensDetailYearPathLoaded = detailPath;
        state.lensDetailYearLoaded = currentTimelineYear();
      } else if (!detailSource) {
        state.map.addSource(LENS_DETAIL_SOURCE_ID, { type: "geojson", data: emptyFeatureCollection(), generateId: true });
        state.lensDetailYearPathLoaded = "";
        state.lensDetailYearLoaded = null;
      } else if (detailSource?.setData && state.lensDetailYearPathLoaded !== "") {
        detailSource.setData(emptyFeatureCollection());
        state.lensDetailYearPathLoaded = "";
        state.lensDetailYearLoaded = null;
      }

      if (basePath) {
        const baseSource = state.map.getSource(LENS_ROAD_BASE_SOURCE_ID);
        if (baseSource?.setData) {
          if (state.transportRoadBasePathLoaded !== basePath) baseSource.setData(basePath);
        } else {
          state.map.addSource(LENS_ROAD_BASE_SOURCE_ID, { type: "geojson", data: basePath, generateId: true });
        }
        state.transportRoadBasePathLoaded = basePath;
      }

      if (yearPath) {
        const roadSource = state.map.getSource(LENS_ROAD_SOURCE_ID);
        if (roadSource?.setData) {
          if (state.transportRoadYearPathLoaded !== yearPath) roadSource.setData(yearPath);
        } else {
          state.map.addSource(LENS_ROAD_SOURCE_ID, { type: "geojson", data: yearPath, generateId: true });
        }
        state.transportRoadYearPathLoaded = yearPath;
        state.transportRoadYearLoaded = currentTimelineYear();
        updateTransportRoadFeatureCount(yearPath, currentTimelineYear());
      }

      if (!state.map.getLayer("lens-civic-icons") || !state.map.getLayer("lens-transport-roads") || !state.map.getLayer("lens-planning-cells-fill")) {
        addLensOverlayLayers();
      } else {
        ensureBuiltFootprintLensLayers();
        addLensDetailLayers();
      }
      updateLensEventSource();
      state.lensOverlayLoaded = true;
      state.lensOverlayError = null;
      renderCoverageNote();
      updateLensOverlayFilters();
    } catch (error) {
      state.lensOverlayLoaded = false;
      state.lensOverlayError = error.message;
      renderCoverageNote();
      console.warn("[atlas] lens overlays unavailable", error);
    }
  }

  function addLensOverlayLayers() {
    ensureLensImages();
    ensureBuiltFootprintLensLayers();
    addLensDetailLayers();
    addPointLensLayer("lens-built-site-icons", "built_environment", "lens-icon-built", 9.6, 0.72, false, 13.2);
    addPointLensLayer("lens-civic-icons", "civic_services", "lens-icon-civic", 10.2, 0.78, true);
    addPointLensLayer("lens-economy-icons", "economy", "lens-icon-economy", 9.8, 0.76, true);
    addPointLensLayer("lens-utilities-icons", "utilities", "lens-icon-utilities", 10.6, 0.78, true);

    if (
      !state.map.getSource(LENS_ROAD_BASE_SOURCE_ID)
      || !state.map.getSource(LENS_ROAD_SOURCE_ID)
      || state.map.getLayer("lens-transport-roads")
    ) return;
    state.map.addLayer({
      id: "lens-transport-base-case",
      type: "line",
      source: LENS_ROAD_BASE_SOURCE_ID,
      filter: transportBaseRoadFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#201c17",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.03, 12, 0.07, 16, 0.12],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          8, ["*", ["to-number", ["get", "rank"], 1], 0.32],
          12, ["*", ["to-number", ["get", "rank"], 1], 0.62],
          16, ["*", ["to-number", ["get", "rank"], 1], 1.15],
        ],
        "line-blur": 0.2,
      },
    });
    state.map.addLayer({
      id: "lens-transport-base",
      type: "line",
      source: LENS_ROAD_BASE_SOURCE_ID,
      filter: transportBaseRoadFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#1b7a85",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 8, 0.05, 12, 0.16, 16, 0.34],
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
        "line-color": "#201c17",
        "line-opacity": ["interpolate", ["linear"], transportActivityExpression(), 0, 0, 0.2, 0.14, 1, 0.24],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["+", 1, ["*", transportActivityExpression(), 2.4]], ["to-number", ["get", "rank"], 1]],
          13, ["*", ["+", 1.2, ["*", transportActivityExpression(), 3.4]], ["to-number", ["get", "rank"], 1]],
          16, ["*", ["+", 1.6, ["*", transportActivityExpression(), 5.4]], ["to-number", ["get", "rank"], 1]],
        ],
        "line-blur": 0.24,
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
      filter: transportHotspotFilter(),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#d2452f",
        "line-opacity": ["interpolate", ["linear"], transportActivityExpression(), 0, 0, 0.45, 0.08, 1, 0.16],
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          9, ["*", ["+", 1.2, ["*", transportActivityExpression(), 3.4]], ["to-number", ["get", "rank"], 1]],
          13, ["*", ["+", 1.8, ["*", transportActivityExpression(), 5.6]], ["to-number", ["get", "rank"], 1]],
          16, ["*", ["+", 2.4, ["*", transportActivityExpression(), 8.4]], ["to-number", ["get", "rank"], 1]],
        ],
        "line-blur": 0.9,
      },
    });
  }

  function addLensDetailLayers() {
    if (!state.map?.getSource(LENS_DETAIL_SOURCE_ID) || state.map.getLayer("lens-planning-cells-fill")) return;
    state.map.addLayer({
      id: "lens-planning-cells-fill",
      type: "fill",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9.2,
      filter: lensDetailFilter("planning_cell"),
      layout: { visibility: "none" },
      paint: {
        "fill-color": planningCellColorExpression(),
        "fill-opacity": lensDetailFillOpacity(0.2, 0.64),
      },
    });
    state.map.addLayer({
      id: "lens-planning-cells-outline",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9.2,
      filter: lensDetailFilter("planning_cell"),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": planningCellColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.28, 0.82),
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.35, 13, 0.75, 16, 1.35],
      },
    });
    state.map.addLayer({
      id: "lens-civic-coverage-fill",
      type: "fill",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 8.8,
      filter: lensDetailFilter("civic_coverage_cell"),
      layout: { visibility: "none" },
      paint: {
        "fill-color": civicCellColorExpression(),
        "fill-opacity": lensDetailFillOpacity(0.16, 0.5),
      },
    });
    state.map.addLayer({
      id: "lens-civic-coverage-outline",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 8.8,
      filter: lensDetailFilter("civic_coverage_cell"),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": civicCellColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.18, 0.58),
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.25, 13, 0.5, 16, 0.9],
      },
    });
    state.map.addLayer({
      id: "lens-civic-facility-icons",
      type: "symbol",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 8.8,
      filter: lensDetailFilter("civic_facility"),
      layout: detailIconLayout("lens-icon-civic", 9.5, true),
      paint: detailIconPaint(0.86),
    });
    state.map.addLayer({
      id: "lens-economy-cells-fill",
      type: "fill",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9.4,
      filter: lensDetailFilter("economy_activity_cell"),
      layout: { visibility: "none" },
      paint: {
        "fill-color": economyCellColorExpression(),
        "fill-opacity": lensDetailFillOpacity(0.16, 0.56),
      },
    });
    state.map.addLayer({
      id: "lens-economy-cells-outline",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9.4,
      filter: lensDetailFilter("economy_activity_cell"),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": economyCellColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.16, 0.66),
        "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.22, 13, 0.52, 16, 1],
      },
    });
    state.map.addLayer({
      id: "lens-economy-frontage-case",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9,
      filter: lensDetailFilter("economy_frontage"),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#201c17",
        "line-opacity": lensDetailLineOpacity(0.08, 0.24),
        "line-width": lensTraceWidthExpression(2.2, 7.2),
        "line-blur": 0.4,
      },
    });
    state.map.addLayer({
      id: "lens-economy-frontage",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9,
      filter: lensDetailFilter("economy_frontage"),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": economyCellColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.28, 0.86),
        "line-width": lensTraceWidthExpression(0.8, 4.2),
      },
    });
    state.map.addLayer({
      id: "lens-utilities-trace-case",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9,
      filter: lensDetailFilter("utility_trace"),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": "#201c17",
        "line-opacity": lensDetailLineOpacity(0.1, 0.3),
        "line-width": lensTraceWidthExpression(2.4, 7.6),
        "line-blur": 0.35,
      },
    });
    state.map.addLayer({
      id: "lens-utilities-trace",
      type: "line",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9,
      filter: lensDetailFilter("utility_trace"),
      layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": utilityTraceColorExpression(),
        "line-opacity": lensDetailLineOpacity(0.28, 0.9),
        "line-width": lensTraceWidthExpression(0.9, 4.4),
        "line-dasharray": [1.8, 0.8],
      },
    });
    state.map.addLayer({
      id: "lens-utility-asset-icons",
      type: "symbol",
      source: LENS_DETAIL_SOURCE_ID,
      minzoom: 9,
      filter: lensDetailFilter("utility_asset"),
      layout: detailIconLayout("lens-icon-utilities", 9.8, true),
      paint: detailIconPaint(0.84),
    });
  }

  function lensDetailIntensityExpression() {
    return ["to-number", ["get", "intensity"], 0.35];
  }

  function lensDetailFillOpacity(low, high) {
    const intensity = lensDetailIntensityExpression();
    return [
      "*",
      ["case", ["==", ["get", "confidence"], "inferred"], 0.64, ["==", ["get", "confidence"], "disputed"], 0.72, 1],
      ["interpolate", ["linear"], intensity, 0, low, 1, high],
    ];
  }

  function lensDetailLineOpacity(low, high) {
    const intensity = lensDetailIntensityExpression();
    return [
      "*",
      ["case", ["==", ["get", "confidence"], "inferred"], 0.58, ["==", ["get", "confidence"], "disputed"], 0.68, 1],
      ["interpolate", ["linear"], intensity, 0, low, 1, high],
    ];
  }

  function lensTraceWidthExpression(low, high) {
    const intensity = lensDetailIntensityExpression();
    const rank = ["min", 2.4, ["max", 0.7, ["to-number", ["get", "rank"], 1]]];
    return [
      "interpolate", ["linear"], ["zoom"],
      9, ["*", ["interpolate", ["linear"], intensity, 0, low * 0.36, 1, high * 0.36], rank],
      13, ["*", ["interpolate", ["linear"], intensity, 0, low * 0.72, 1, high * 0.72], rank],
      16, ["*", ["interpolate", ["linear"], intensity, 0, low, 1, high], rank],
    ];
  }

  function planningCellColorExpression() {
    return [
      "match", ["get", "lifecycle_status"],
      "permitted", "#d6a33e",
      "proposed", "#c98667",
      "planned", "#b887b8",
      "construction", "#d66a3a",
      "completed", "#4f9a5b",
      "demolished", "#655b54",
      "inferred", "#8f9d9d",
      "uncertain", "#b8b6a8",
      "#b8b6a8",
    ];
  }

  function civicCellColorExpression() {
    return [
      "match", ["get", "service_type"],
      "health", "#2a84a6",
      "education", "#1b7a85",
      "library", "#7a3b7a",
      "leisure", "#4f9a5b",
      "community", "#d69423",
      "safety", "#c8472e",
      "#8ab7bd",
    ];
  }

  function economyCellColorExpression() {
    return [
      "match", ["get", "sector"],
      "retail", "#7a3b7a",
      "office", "#5f4a9a",
      "hospitality", "#d69423",
      "industrial", "#8c7460",
      "culture_visitor", "#c8472e",
      "education_health", "#2a84a6",
      "residential_change", "#b887b8",
      "vacancy", "#655b54",
      "#8d5a90",
    ];
  }

  function utilityTraceColorExpression() {
    return [
      "match", ["get", "work_status"],
      "repair", "#d66a3a",
      "disruption", "#c8472e",
      "planned", "#d6a33e",
      "current", "#4f9a5b",
      "mapped_asset", "#8c7460",
      "#8c7460",
    ];
  }

  function detailIconLayout(iconId, baseSize, allowOverlap) {
    return {
      visibility: "none",
      "icon-image": iconId,
      "icon-allow-overlap": allowOverlap,
      "icon-ignore-placement": allowOverlap,
      "icon-size": [
        "interpolate", ["linear"], ["zoom"],
        9, baseSize / 24,
        13, (baseSize + 2.2) / 24,
        16, (baseSize + 5.5) / 24,
      ],
    };
  }

  function detailIconPaint(opacity) {
    return {
      "icon-opacity": [
        "case",
        ["==", ["get", "confidence"], "inferred"],
        Math.max(0.34, opacity - 0.34),
        ["==", ["get", "confidence"], "disputed"],
        Math.max(0.38, opacity - 0.24),
        opacity,
      ],
    };
  }

  function ensureBuiltFootprintLensLayers() {
    if (!state.map?.getSource(DETAIL_SOURCE_ID) || state.map.getLayer("lens-built-footprints-fill")) return;
    state.map.addLayer({
      id: "lens-built-footprints-fill",
      type: "fill",
      source: DETAIL_SOURCE_ID,
      minzoom: 10.4,
      filter: builtFootprintFilter(),
      layout: { visibility: "none" },
      paint: {
        "fill-color": [
          "case",
          ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
          "#c8472e",
          "#c98667",
        ],
        "fill-opacity": [
          "case",
          ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
          0.36,
          0.18,
        ],
      },
    });
    state.map.addLayer({
      id: "lens-built-footprints-outline",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 10.4,
      filter: builtFootprintFilter(),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": "#f3c7b8",
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0.18, 14, 0.42, 17, 0.66],
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.25, 14, 0.75, 17, 1.1],
      },
    });
    state.map.addLayer({
      id: "lens-built-footprints-year",
      type: "line",
      source: DETAIL_SOURCE_ID,
      minzoom: 11.6,
      filter: builtFootprintYearFilter(),
      layout: { visibility: "none", "line-join": "round" },
      paint: {
        "line-color": "#201c17",
        "line-opacity": 0.72,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.8, 15, 1.7, 17, 2.4],
        "line-dasharray": [1.2, 0.8],
      },
    });
  }

  function addPointLensLayer(layerId, category, iconId, baseSize, opacity, allowOverlap, minZoom = 9) {
    if (state.map.getLayer(layerId) || !state.map.getSource(LENS_SOURCE_ID)) return;
    state.map.addLayer({
      id: layerId,
      type: "symbol",
      source: LENS_SOURCE_ID,
      minzoom: minZoom,
      filter: lensCategoryFilter(category),
      layout: {
        visibility: "none",
        "icon-image": iconId,
        "icon-allow-overlap": allowOverlap,
        "icon-ignore-placement": allowOverlap,
        "icon-size": [
          "interpolate", ["linear"], ["zoom"],
          9, baseSize / 24,
          13, (baseSize + 2.5) / 24,
          16, (baseSize + 6) / 24,
        ],
      },
      paint: {
        "icon-opacity": [
          "case",
          ["==", ["get", "confidence"], "inferred"],
          Math.max(0.34, opacity - 0.32),
          ["==", ["get", "confidence"], "disputed"],
          Math.max(0.38, opacity - 0.22),
          opacity,
        ],
      },
    });
  }

  function ensureLensImages() {
    if (!state.map) return;
    addLensImage("lens-icon-built", "#c8472e", "built");
    addLensImage("lens-icon-civic", "#2a84a6", "civic");
    addLensImage("lens-icon-economy", "#7a3b7a", "economy");
    addLensImage("lens-icon-utilities", "#8c7460", "utilities");
  }

  function addLensImage(id, color, shape) {
    if (state.map.hasImage?.(id)) return;
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 48, 48);
    ctx.strokeStyle = "#201c17";
    ctx.lineWidth = 4;
    ctx.fillStyle = color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (shape === "built") {
      ctx.fillRect(13, 13, 22, 22);
      ctx.strokeRect(13, 13, 22, 22);
      ctx.strokeStyle = "rgba(255,255,255,0.72)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 30);
      ctx.lineTo(30, 18);
      ctx.stroke();
    } else if (shape === "civic") {
      ctx.beginPath();
      ctx.arc(24, 24, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#fff4d4";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(24, 15);
      ctx.lineTo(24, 33);
      ctx.moveTo(15, 24);
      ctx.lineTo(33, 24);
      ctx.stroke();
    } else if (shape === "economy") {
      ctx.beginPath();
      ctx.moveTo(24, 8);
      ctx.lineTo(40, 24);
      ctx.lineTo(24, 40);
      ctx.lineTo(8, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(16, 24);
      ctx.lineTo(32, 24);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(17, 7);
      ctx.lineTo(34, 17);
      ctx.lineTo(34, 31);
      ctx.lineTo(17, 41);
      ctx.lineTo(8, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#f1e5d0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(27, 13);
      ctx.lineTo(20, 25);
      ctx.lineTo(28, 25);
      ctx.lineTo(21, 36);
      ctx.stroke();
    }
    state.map.addImage(id, ctx.getImageData(0, 0, canvas.width, canvas.height), { pixelRatio: 2 });
  }

  function removeLensOverlays() {
    if (!state.map) return;
    for (const layerId of LENS_LAYER_IDS) {
      if (state.map.getLayer(layerId)) state.map.removeLayer(layerId);
    }
    for (const sourceId of [LENS_ROAD_SOURCE_ID, LENS_ROAD_BASE_SOURCE_ID, LENS_DETAIL_SOURCE_ID, LENS_SOURCE_ID]) {
      if (state.map.getSource(sourceId)) state.map.removeSource(sourceId);
    }
    state.lensOverlayLoaded = false;
    state.transportRoadBasePathLoaded = null;
    state.transportRoadYearPathLoaded = null;
    state.transportRoadYearLoaded = null;
    state.transportRoadFeatureCountPathLoaded = null;
    state.transportRoadFeatureCountYearLoaded = null;
    state.transportRoadFeatureCount = null;
    state.lensDetailYearPathLoaded = null;
    state.lensDetailYearLoaded = null;
    state.lensEventFeatureCount = 0;
    state.lensEventSourceKey = "";
  }

  function updateLensOverlayFilters() {
    if (!state.map) return;
    updateTransportRoadYearSource();
    updateLensDetailYearSource();
    updateLensEventSource();
    if (!state.map.getSource(LENS_SOURCE_ID)) return;
    ensureBuiltFootprintLensLayers();
    addLensDetailLayers();
    for (const layerId of ["lens-heatmap", "lens-current-points-glow", "lens-current-points"]) {
      if (state.map.getLayer(layerId)) state.map.setLayoutProperty(layerId, "visibility", "none");
    }
    updateBuiltFootprintLensLayers();
    updateLensDetailLayers();
    updatePointLensLayer("lens-built-site-icons", "built_environment");
    updatePointLensLayer("lens-civic-icons", "civic_services");
    updatePointLensLayer("lens-economy-icons", "economy");
    updatePointLensLayer("lens-utilities-icons", "utilities");

    const showTransportRoads = isActiveMapLens("transport");
    for (const layerId of ["lens-transport-base-case", "lens-transport-base"]) {
      if (!state.map.getLayer(layerId)) continue;
      state.map.setFilter(layerId, transportBaseRoadFilter());
      state.map.setLayoutProperty(layerId, "visibility", showTransportRoads ? "visible" : "none");
    }
    for (const layerId of ["lens-transport-roads-case", "lens-transport-roads"]) {
      if (!state.map.getLayer(layerId)) continue;
      state.map.setFilter(layerId, transportRoadFilter());
      state.map.setLayoutProperty(layerId, "visibility", showTransportRoads ? "visible" : "none");
    }
    if (state.map.getLayer("lens-transport-hotspots")) {
      state.map.setFilter("lens-transport-hotspots", transportHotspotFilter());
      state.map.setLayoutProperty("lens-transport-hotspots", "visibility", showTransportRoads ? "visible" : "none");
    }
    if (state.map.getLayer("lens-transport-roads")) {
      const paint = transportRoadPaint();
      Object.entries(paint).forEach(([key, value]) => state.map.setPaintProperty("lens-transport-roads", key, value));
    }
    renderLensLegend();
  }

  function updatePointLensLayer(layerId, category) {
    if (!state.map?.getLayer(layerId)) return;
    state.map.setFilter(layerId, lensCategoryFilter(category));
    const detailBacked = category !== "built_environment" && Boolean(lensDetailYearPath(state.year));
    state.map.setLayoutProperty(layerId, "visibility", isActiveMapLens(category) && !detailBacked ? "visible" : "none");
  }

  function updateLensDetailLayers() {
    if (!state.map?.getSource(LENS_DETAIL_SOURCE_ID)) return;
    const visibilityByLayer = {
      "lens-planning-cells-fill": isActiveMapLens("built_environment"),
      "lens-planning-cells-outline": isActiveMapLens("built_environment"),
      "lens-civic-coverage-fill": isActiveMapLens("civic_services"),
      "lens-civic-coverage-outline": isActiveMapLens("civic_services"),
      "lens-civic-facility-icons": isActiveMapLens("civic_services"),
      "lens-economy-cells-fill": isActiveMapLens("economy"),
      "lens-economy-cells-outline": isActiveMapLens("economy"),
      "lens-economy-frontage-case": isActiveMapLens("economy"),
      "lens-economy-frontage": isActiveMapLens("economy"),
      "lens-utilities-trace-case": isActiveMapLens("utilities"),
      "lens-utilities-trace": isActiveMapLens("utilities"),
      "lens-utility-asset-icons": isActiveMapLens("utilities"),
    };
    const filterByLayer = {
      "lens-planning-cells-fill": lensDetailFilter("planning_cell"),
      "lens-planning-cells-outline": lensDetailFilter("planning_cell"),
      "lens-civic-coverage-fill": lensDetailFilter("civic_coverage_cell"),
      "lens-civic-coverage-outline": lensDetailFilter("civic_coverage_cell"),
      "lens-civic-facility-icons": lensDetailFilter("civic_facility"),
      "lens-economy-cells-fill": lensDetailFilter("economy_activity_cell"),
      "lens-economy-cells-outline": lensDetailFilter("economy_activity_cell"),
      "lens-economy-frontage-case": lensDetailFilter("economy_frontage"),
      "lens-economy-frontage": lensDetailFilter("economy_frontage"),
      "lens-utilities-trace-case": lensDetailFilter("utility_trace"),
      "lens-utilities-trace": lensDetailFilter("utility_trace"),
      "lens-utility-asset-icons": lensDetailFilter("utility_asset"),
    };
    for (const [layerId, visible] of Object.entries(visibilityByLayer)) {
      if (!state.map.getLayer(layerId)) continue;
      state.map.setFilter(layerId, filterByLayer[layerId]);
      state.map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    }
  }

  function updateBuiltFootprintLensLayers() {
    const showBuilt = isActiveMapLens("built_environment") && state.map?.getSource(DETAIL_SOURCE_ID);
    for (const layerId of DETAIL_LENS_LAYER_IDS) {
      if (!state.map?.getLayer(layerId)) continue;
      const filter = layerId === "lens-built-footprints-year" ? builtFootprintYearFilter() : builtFootprintFilter();
      state.map.setFilter(layerId, filter);
      state.map.setLayoutProperty(layerId, "visibility", showBuilt ? "visible" : "none");
    }
  }

  function isActiveMapLens(lensId) {
    const lens = MAP_LENS_BY_ID.get(lensId);
    return Boolean(lens && state.activeLens === lens.id && state.activeLayers.has(lens.layerId));
  }

  function shouldLoadLensDetail() {
    const lens = activeMapLens();
    return Boolean(lens && lens.id !== "transport" && state.activeLayers.has(lens.layerId));
  }

  function updateTransportRoadYearSource() {
    const source = state.map?.getSource(LENS_ROAD_SOURCE_ID);
    if (!source?.setData) return;
    const path = transportRoadYearPath(state.year);
    if (!path) return;
    if (state.transportRoadYearPathLoaded === path) {
      updateTransportRoadFeatureCount(path, currentTimelineYear());
      return;
    }
    source.setData(path);
    state.transportRoadYearPathLoaded = path;
    state.transportRoadYearLoaded = currentTimelineYear();
    updateTransportRoadFeatureCount(path, currentTimelineYear());
  }

  function updateTransportRoadFeatureCount(path, year) {
    if (!path) {
      state.transportRoadFeatureCountPathLoaded = null;
      state.transportRoadFeatureCountYearLoaded = null;
      state.transportRoadFeatureCount = null;
      return;
    }
    if (state.transportRoadFeatureCountPathLoaded === path) return;
    state.transportRoadFeatureCountPathLoaded = path;
    state.transportRoadFeatureCountYearLoaded = null;
    state.transportRoadFeatureCount = null;
    fetchJson(path)
      .then((payload) => {
        if (state.transportRoadFeatureCountPathLoaded !== path) return;
        state.transportRoadFeatureCount = Array.isArray(payload.features) ? payload.features.length : 0;
        state.transportRoadFeatureCountYearLoaded = year;
        renderLensLegend();
      })
      .catch(() => {
        if (state.transportRoadFeatureCountPathLoaded !== path) return;
        state.transportRoadFeatureCount = null;
        state.transportRoadFeatureCountYearLoaded = null;
        renderLensLegend();
      });
  }

  function updateLensDetailYearSource() {
    const source = state.map?.getSource(LENS_DETAIL_SOURCE_ID);
    if (!source?.setData) return;
    if (!shouldLoadLensDetail()) {
      if (state.lensDetailYearPathLoaded !== "") {
        source.setData(emptyFeatureCollection());
        state.lensDetailYearPathLoaded = "";
        state.lensDetailYearLoaded = null;
      }
      return;
    }
    const path = lensDetailYearPath(state.year);
    if (!path) {
      if (state.lensDetailYearPathLoaded !== "") {
        source.setData(emptyFeatureCollection());
        state.lensDetailYearPathLoaded = "";
        state.lensDetailYearLoaded = null;
      }
      return;
    }
    if (state.lensDetailYearPathLoaded === path) return;
    source.setData(path);
    state.lensDetailYearPathLoaded = path;
    state.lensDetailYearLoaded = currentTimelineYear();
  }

  function updateTimeDependentMapState() {
    ensureDetailLayers();
    ensureLensOverlays();
    updateDetailLayerFilters();
    updateLensOverlayFilters();
  }

  function updateLensEventSource() {
    const source = state.map?.getSource(LENS_SOURCE_ID);
    if (!source?.setData) return;
    const key = lensEventSourceKey();
    if (state.lensEventSourceKey === key) return;
    const collection = lensEventFeatureCollection();
    source.setData(collection);
    state.lensEventFeatureCount = collection.features.length;
    state.lensEventSourceKey = key;
  }

  function lensEventSourceKey() {
    const year = currentTimelineYear();
    return [
      state.cityId,
      state.activeLens,
      year,
      activeLayerIds().join(","),
      state.confidenceFilter,
      state.showInferred ? "inferred-on" : "inferred-off",
      state.search,
      state.loadedEvents.get(year)?.length || 0,
    ].join(":");
  }

  function lensEventFeatureCollection() {
    const features = [];
    if (!POINT_LENS_IDS.has(state.activeLens)) {
      return { type: "FeatureCollection", features };
    }
    const events = lensEventsForYear(currentTimelineYear())
      .filter((event) => event.category === state.activeLens);
    for (const event of events) {
      features.push(lensFeatureFromEvent(event, "current"));
    }
    return { type: "FeatureCollection", features };
  }

  function lensEventsForYear(year) {
    let events = visibleEventsForYear(year).filter((event) => event.lngLat);
    if (state.search) {
      const q = state.search.toLowerCase();
      events = events.filter((event) =>
        (event.title || "").toLowerCase().includes(q) ||
        (event.area || "").toLowerCase().includes(q) ||
        (event.summary || "").toLowerCase().includes(q));
    }
    return events;
  }

  function lensFeatureFromEvent(event, role) {
    const layer = LAYER_BY_ID.get(event.category) || LAYERS[1];
    return {
      type: "Feature",
      id: `${role}-${event.id}`,
      properties: {
        layer: "lens_event",
        lens_role: role,
        event_id: event.id,
        title: event.title,
        short_description: event.shortDescription || event.summary || "",
        category: event.category,
        category_color: layer.color,
        year: Number(event.year),
        confidence: event.confidence || "documented",
        heat_weight: lensHeatWeight(event),
        source_count: event.sourceIds?.length || 0,
        evidence_count: Array.isArray(event.evidence) ? event.evidence.length : 0,
        source_ids: (event.sourceIds || []).join(","),
      },
      geometry: { type: "Point", coordinates: event.lngLat },
    };
  }

  function isLensPointEvent(event) {
    return event.confidence === "documented" || event.confidence === "corroborated";
  }

  function lensHeatWeight(event) {
    const base = event.confidence === "documented" ? 1.05
      : event.confidence === "corroborated" ? 1.2
      : event.confidence === "inferred" ? 0.35
      : 0.55;
    const sourceBoost = Math.min(0.35, (event.sourceIds?.length || 0) * 0.07);
    return Number((base + sourceBoost).toFixed(3));
  }

  function lensHeatmapFilter() {
    const categories = activeNonTransportLayerIds();
    if (!categories.length) return ["==", ["get", "category"], "__none__"];
    return ["all", ["==", ["get", "lens_role"], "heat"], ["match", ["get", "category"], categories, true, false]];
  }

  function lensPointFilter() {
    return ["==", ["get", "lens_role"], "point"];
  }

  function lensCategoryFilter(category) {
    return ["all", ["==", ["get", "lens_role"], "current"], ["==", ["get", "category"], category]];
  }

  function lensDetailFilter(layer) {
    return [
      "all",
      ["==", ["get", "layer"], layer],
      ["==", ["to-number", ["get", "year"], 0], currentTimelineYear()],
      ...lensDetailConfidenceFilter(),
    ];
  }

  function lensDetailConfidenceFilter() {
    const clauses = [];
    if (state.confidenceFilter !== "all") clauses.push(["==", ["get", "confidence"], state.confidenceFilter]);
    if (!state.showInferred) clauses.push(["!=", ["get", "confidence"], "inferred"]);
    return clauses;
  }

  function builtFootprintFilter() {
    return [
      "all",
      ["==", ["get", "layer"], "building"],
      ["<=", ["to-number", ["get", "visible_year"], 9999], currentTimelineYear()],
    ];
  }

  function builtFootprintYearFilter() {
    return [
      "all",
      ["==", ["get", "layer"], "building"],
      ["==", ["to-number", ["get", "visible_year"], 0], currentTimelineYear()],
    ];
  }

  function emptyFeatureCollection() {
    return { type: "FeatureCollection", features: [] };
  }

  function transportBaseRoadFilter() {
    return ["==", ["get", "layer"], "traffic_road_base"];
  }

  function transportRoadFilter() {
    return [
      "all",
      ["==", ["get", "layer"], "traffic_road"],
      ["<=", ["to-number", ["get", "visible_year"], 9999], currentTimelineYear()],
      [">", transportActivityExpression(), 0],
    ];
  }

  function transportHotspotFilter() {
    return [
      "all",
      ["==", ["get", "layer"], "traffic_road"],
      ["<=", ["to-number", ["get", "visible_year"], 9999], currentTimelineYear()],
      [">=", transportActivityExpression(), 0.45],
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
        0, "#2f8f46",
        0.22, "#6da34d",
        0.46, "#d6a33e",
        0.7, "#d66a3a",
        1, "#c8472e",
      ],
      "line-opacity": ["interpolate", ["linear"], activity, 0, 0.18, 0.2, 0.56, 1, 0.96],
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        9, ["*", ["+", 0.44, ["*", activity, 2.7]], ["to-number", ["get", "rank"], 1]],
        13, ["*", ["+", 0.86, ["*", activity, 3.9]], ["to-number", ["get", "rank"], 1]],
        16, ["*", ["+", 1.35, ["*", activity, 6.1]], ["to-number", ["get", "rank"], 1]],
      ],
    };
  }

  function lensHeatmapColor() {
    const ramps = {
      built_environment: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.08, "rgba(200,71,46,0.28)",
        0.35, "rgba(214,148,35,0.58)",
        0.68, "rgba(200,71,46,0.76)",
        1, "rgba(122,59,122,0.9)",
      ],
      transport: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.08, "rgba(27,122,133,0.34)",
        0.35, "rgba(63,107,58,0.62)",
        0.68, "rgba(214,148,35,0.82)",
        1, "rgba(200,71,46,0.94)",
      ],
      environment: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.12, "rgba(63,107,58,0.34)",
        0.45, "rgba(73,140,88,0.68)",
        0.78, "rgba(214,148,35,0.82)",
        1, "rgba(200,71,46,0.9)",
      ],
      civic_services: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.12, "rgba(27,122,133,0.3)",
        0.45, "rgba(42,132,166,0.66)",
        0.78, "rgba(214,148,35,0.82)",
        1, "rgba(200,71,46,0.9)",
      ],
      economy: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.12, "rgba(122,59,122,0.3)",
        0.45, "rgba(135,76,139,0.66)",
        0.78, "rgba(214,148,35,0.82)",
        1, "rgba(200,71,46,0.9)",
      ],
      utilities: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.12, "rgba(140,116,96,0.32)",
        0.45, "rgba(166,133,89,0.64)",
        0.78, "rgba(214,148,35,0.8)",
        1, "rgba(200,71,46,0.9)",
      ],
      all: [
        "interpolate", ["linear"], ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.08, "rgba(27,122,133,0.28)",
        0.35, "rgba(214,148,35,0.56)",
        0.68, "rgba(200,71,46,0.78)",
        1, "rgba(122,59,122,0.9)",
      ],
    };
    const active = activeLayerIds();
    return active.length === 1 ? (ramps[active[0]] || ramps.all) : ramps.all;
  }

  function overlayTimeRange() {
    const year = currentTimelineYear();
    return { start: Math.max(earliestTimelineYear(), year - 2), end: year };
  }

  function activeLayerIds() {
    return LAYERS.map((layer) => layer.id).filter((id) => state.activeLayers.has(id));
  }

  function activeNonTransportLayerIds() {
    return activeLayerIds().filter((id) => id !== "transport");
  }

  function currentTimelineYear(value = state.year) {
    const year = Number(value);
    if (Number.isFinite(year)) return Math.round(year);
    return state.yearRange[1] || DEFAULT_YEAR;
  }

  function earliestTimelineYear() {
    return state.yearRange[0] || state.years[0] || DEFAULT_YEAR;
  }

  function isLayerVisible(layerId) {
    if (!state.map?.getLayer(layerId)) return false;
    return state.map.getLayoutProperty(layerId, "visibility") !== "none";
  }

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  function visibleEventsForYear(year) {
    const arr = state.loadedEvents.get(year) || [];
    return arr.filter((e) => state.activeLayers.has(e.category))
      .filter((e) => state.confidenceFilter === "all" || e.confidence === state.confidenceFilter)
      .filter((e) => state.showInferred || e.confidence !== "inferred");
  }

  function filteredEvents() {
    let events = visibleEventsForYear(state.year);
    if (state.search) {
      const q = state.search.toLowerCase();
      events = events.filter((e) =>
        (e.title || "").toLowerCase().includes(q) ||
        (e.area || "").toLowerCase().includes(q) ||
        (e.summary || "").toLowerCase().includes(q));
    }
    return events;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  function renderAll() {
    renderLayers();
    renderLensSwitcher();
    renderLensLegend();
    renderCoverageNote();
    renderTimeline();
    renderDetail();
    renderSearchResults();
    renderEventList();
    renderComparePanel();
    syncTopline();
  }

  function renderLayers() {
    if (!els.layersList) return;
    const counts = {};
    for (const l of LAYERS) counts[l.id] = 0;
    for (const e of state.loadedEvents.get(state.year) || []) {
      if (counts[e.category] !== undefined) counts[e.category] += 1;
    }

    els.layersList.innerHTML = LAYERS.map((l) => {
      const on = state.activeLayers.has(l.id);
      return `
        <div class="layer-row" data-on="${on}" data-layer="${escapeAttr(l.id)}" role="button" tabindex="0" aria-pressed="${on}">
          <span class="layer-swatch" style="--accent:${l.color}"></span>
          <span class="layer-name">${escapeHtml(l.label)}</span>
          <span class="layer-count">${counts[l.id] || 0}</span>
        </div>
      `;
    }).join("");

    els.layersList.querySelectorAll(".layer-row").forEach((row) => {
      const toggleLayer = async () => {
        const id = row.getAttribute("data-layer");
        if (state.activeLayers.has(id)) state.activeLayers.delete(id);
        else state.activeLayers.add(id);
        resetEventListLimit();
        renderAll();
        updateTimeDependentMapState();
        renderMarkers();
        await reconcileSelectionWithFilters({ keepCamera: false });
      };
      row.addEventListener("click", toggleLayer);
      addPressHandler(row, toggleLayer);
    });

    setText(els.layersCount, `${state.activeLayers.size}/${LAYERS.length} on`);
  }

  function renderLensSwitcher() {
    if (!els.lensSwitcher) return;
    els.lensSwitcher.innerHTML = MAP_LENSES.map((lens) => {
      const active = state.activeLens === lens.id;
      const layerOn = state.activeLayers.has(lens.layerId);
      return `
        <button class="lens-choice" type="button" role="tab" data-lens="${escapeAttr(lens.id)}" data-active="${active}" data-layer-on="${layerOn}" aria-selected="${active}">
          ${escapeHtml(lens.shortLabel)}
        </button>
      `;
    }).join("");
    els.lensSwitcher.querySelectorAll(".lens-choice").forEach((button) => {
      const choose = () => setActiveLens(button.getAttribute("data-lens"));
      button.addEventListener("click", choose);
      addPressHandler(button, choose);
    });
  }

  function renderLensLegend() {
    if (!els.lensLegend) return;
    const lens = activeMapLens();
    const status = lensStatusText(lens);
    if (els.lensDataState) setText(els.lensDataState, status.label);
    els.lensLegend.innerHTML = `
      <div class="lens-legend-head">
        <strong>${escapeHtml(lens.label)}</strong>
        <span>${escapeHtml(status.label)}</span>
      </div>
      <div class="lens-legend-summary">${escapeHtml(lens.summary)}</div>
      <div class="lens-legend-items">
        ${lens.legend.map((item) => `
          <div class="lens-legend-item">
            <span class="lens-symbol ${escapeAttr(item.shape)}" style="--legend-color:${escapeAttr(item.color)}"></span>
            <span>${escapeHtml(item.label)}</span>
          </div>
        `).join("")}
      </div>
      <div class="lens-legend-note" data-empty="${status.empty}">${escapeHtml(status.note || lens.caveat)}</div>
    `;
  }

  function activeMapLens() {
    return MAP_LENS_BY_ID.get(state.activeLens) || MAP_LENS_BY_ID.get(DEFAULT_MAP_LENS);
  }

  function lensStatusText(lens) {
    if (!state.activeLayers.has(lens.layerId)) {
      return {
        label: "Layer off",
        empty: true,
        note: `${lens.label} is disabled in the layer toggles, so its map lens is hidden.`,
      };
    }
    if (lens.id === "transport") {
      if (!transportRoadYearPath(state.year)) return { label: "No linework", empty: true, note: lens.empty };
      if (state.transportRoadFeatureCountYearLoaded === state.year && state.transportRoadFeatureCount === 0) {
        return {
          label: "No linework",
          empty: true,
          note: "No source-backed transport records intersect mapped road segments for the selected year.",
        };
      }
      if (state.transportRoadFeatureCountPathLoaded === transportRoadYearPath(state.year) && state.transportRoadFeatureCountYearLoaded !== state.year) {
        return { label: "Loading lines", empty: false, note: lens.caveat };
      }
      return { label: `${state.year} lines`, empty: false, note: lens.caveat };
    }
    if (lens.id === "built_environment") {
      const pointCount = lensPointCount("built_environment");
      const renderableCount = lensRenderablePointCount("built_environment");
      const hasFootprints = Boolean(detailLayerPath());
      const hasDetailCells = Boolean(renderableCount && lensDetailYearPath(state.year));
      if (!hasFootprints && !pointCount && !hasDetailCells) return { label: "No geometry", empty: true, note: lens.empty };
      if (pointCount && !renderableCount && !hasFootprints) {
        return {
          label: "No site geometry",
          empty: true,
          note: "Records exist for this year, but their geometry is aggregate, citywide, corridor, or otherwise unsuitable for site-like lens rendering.",
        };
      }
      if (!hasFootprints && !hasDetailCells) {
        return {
          label: `${renderableCount} sites`,
          empty: false,
          note: "No footprint polygons are available for this city; rendering source-backed site points only.",
        };
      }
      if (!hasDetailCells && hasFootprints) {
        return {
          label: "Footprint context",
          empty: false,
          note: pointCount
            ? "Planning records for this year are aggregate or non-site records, so only mapped footprint context is shown."
            : "No planning/built event cells match this year; mapped footprint context is shown where available for the selected year.",
        };
      }
      return {
        label: `Cells + ${hasFootprints ? "footprints + " : ""}${renderableCount} sites`,
        empty: false,
        note: lensGeometryNote(lens, pointCount, renderableCount),
      };
    }
    if (lens.id === "civic_services") {
      const count = lensPointCount(lens.id);
      const renderableCount = lensRenderablePointCount(lens.id);
      if (!count) return { label: "No records", empty: true, note: lens.empty };
      if (!renderableCount) return { label: "No site geometry", empty: true, note: "Civic records exist for this year, but only aggregate or non-site geometry is available." };
      return { label: `Cells + ${renderableCount} facilities`, empty: false, note: lensGeometryNote(lens, count, renderableCount) };
    }
    if (lens.id === "economy") {
      const count = lensPointCount(lens.id);
      const renderableCount = lensRenderablePointCount(lens.id);
      if (!count) return { label: "No records", empty: true, note: lens.empty };
      if (!renderableCount) return { label: "No site geometry", empty: true, note: "Economy records exist for this year, but only aggregate or non-site geometry is available." };
      return { label: `Cells/frontages + ${renderableCount} records`, empty: false, note: lensGeometryNote(lens, count, renderableCount) };
    }
    if (lens.id === "utilities") {
      const count = lensPointCount(lens.id);
      const renderableCount = lensRenderablePointCount(lens.id);
      if (!count) return { label: "No records", empty: true, note: lens.empty };
      if (!renderableCount) return { label: "No site geometry", empty: true, note: "Utility records exist for this year, but only aggregate or non-site geometry is available." };
      return { label: `Traces + ${renderableCount} assets`, empty: false, note: lensGeometryNote(lens, count, renderableCount) };
    }
    const count = lensPointCount(lens.id);
    if (!count) return { label: "No records", empty: true, note: lens.empty };
    return { label: `${count} records`, empty: false, note: lens.caveat };
  }

  function lensPointCount(category) {
    return lensEventsForYear(state.year).filter((event) => event.category === category).length;
  }

  function lensRenderablePointCount(category) {
    return lensEventsForYear(state.year).filter((event) => event.category === category && isLensDetailEligibleEvent(event)).length;
  }

  function lensGeometryNote(lens, rawCount, renderableCount) {
    const skipped = Math.max(0, rawCount - renderableCount);
    if (!skipped) return lens.caveat;
    return `${lens.caveat} ${skipped} aggregate or non-site record${skipped === 1 ? "" : "s"} remain available in the event list.`;
  }

  function isLensDetailEligibleEvent(event) {
    const precision = String(event.provenance?.geometry_precision || "").toLowerCase();
    const sourceBasis = String(event.provenance?.source_basis || "").toLowerCase();
    const sourceIds = (event.sourceIds || []).join(" ").toLowerCase();
    const text = [
      event.title,
      event.shortDescription,
      event.summary,
      event.area,
      event.sourceDateField,
    ].filter(Boolean).join(" ").toLowerCase();
    const combined = `${precision} ${sourceBasis} ${sourceIds} ${text}`;
    const geometryScope = precision.trim();
    if (/\buk[-_\s]?hpi\b|\bhpi monthly\b|house[-_\s]?price[-_\s]?index|uk[-_\s]?house[-_\s]?price[-_\s]?index|market[-_\s]?trend|lon-extra-uk-house-price-index/.test(combined)) return false;
    if (/\bborough aggregate\b|\baggregate,\s*not\b|\baggregate record\b/.test(combined)) return false;
    if (/\barea\/city reference\b|\bcitywide\b|\bnot an exact event geometry\b/.test(geometryScope)
      || /^(approximate\s+)?district(?:-extension)?(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
      || /^(approximate\s+)?neighbou?rhood(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
      || /^(rail[-\s])?corridor(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
      || /^(multiple sites|multi[-\s]?site|programme approximate)\b/.test(geometryScope)) return false;
    if (/^area(?:\s+approximate)?$/.test(precision.trim())) return false;
    return Boolean(event.lngLat);
  }

  function renderCoverageNote() {
    if (!els.coverageNote) return;
    const parts = [];
    const summary = state.availability?.summary;
    const status = summary?.status || state.cityMeta?.availability_status;
    if (status) parts.push(`Coverage: ${status.replace(/_/g, " ")}`);
    if (summary?.summary) parts.push(summary.summary);
    if (state.availabilityError) parts.push(`Availability metadata unavailable: ${state.availabilityError}`);
    const yearError = state.yearLoadErrors.get(state.year);
    if (yearError) parts.push(`Could not load ${state.year} event chunk: ${yearError}`);
    if (state.detailLayerError) parts.push(`Detail layer unavailable: ${state.detailLayerError}`);
    if (state.lensOverlayError) parts.push(`Map lens unavailable: ${state.lensOverlayError}`);
    els.coverageNote.textContent = parts.join(" ");
    els.coverageNote.toggleAttribute("data-warning", Boolean(state.availabilityError || yearError || state.detailLayerError || state.lensOverlayError));
  }

  function renderTimeline() {
    if (!els.tlHistogram || !els.tlAxis) return;
    const [yStart, yEnd] = state.yearRange;
    const years = [];
    for (let y = yStart; y <= yEnd; y++) years.push(y);

    // Bucket: per-year, per-layer counts (using chunk metadata since events
    // for non-current years aren't necessarily loaded yet).
    const totalPerYear = new Map();
    let maxStack = 0;
    for (const y of years) {
      const chunk = state.chunks.get(y);
      if (!chunk) { totalPerYear.set(y, {}); continue; }
      const byCat = chunk.counts_by_category || {};
      const filtered = {};
      let total = 0;
      for (const l of LAYERS) {
        if (!state.activeLayers.has(l.id)) continue;
        const n = byCat[l.id] || 0;
        if (!n) continue;
        filtered[l.id] = n;
        total += n;
      }
      totalPerYear.set(y, filtered);
      if (total > maxStack) maxStack = total;
    }

    els.tlHistogram.innerHTML = years.map((y) => {
      const past = y <= state.year;
      const byLayer = totalPerYear.get(y) || {};
      const bars = LAYERS
        .filter((l) => state.activeLayers.has(l.id) && byLayer[l.id])
        .map((l) => {
          const n = byLayer[l.id] || 0;
          // log scale so transport-heavy years don't drown the others
          const h = Math.sqrt(n) / Math.sqrt(Math.max(1, maxStack)) * 100;
          return `<div class="tl-bar" style="height:${h.toFixed(1)}%;background:${l.color}"></div>`;
        }).join("");
      return `<div class="tl-bar-group" data-year="${y}" data-past="${past}">${bars}</div>`;
    }).join("");

    els.tlAxis.innerHTML = years.map((y) => {
      const major = y % 5 === 0;
      return `<div class="tl-axis-tick ${major ? "major" : ""}">${major ? `'${String(y).slice(2)}` : ""}</div>`;
    }).join("");

    const total = yEnd - yStart;
    const pct = total > 0 ? ((state.year - yStart) / total) * 100 : 0;
    els.tlCursor.style.left = `calc(${pct}% - 1px)`;
    setText(els.tlYear, String(state.year));
  }

  function detailEvidenceYears(event) {
    const current = Number(event?.year || state.year);
    const before = [...state.years].filter((year) => year < current).pop() || current;
    return { before, after: current };
  }

  function ensureDetailEvidenceLoaded(event) {
    if (!event) return true;
    const { before, after } = detailEvidenceYears(event);
    const years = [...new Set([before, after].filter((year) => state.chunks.has(year)))];
    const missing = years.filter((year) => !state.loadedEvents.has(year));
    if (!missing.length) return true;
    const key = `${event.id}:${years.join(",")}`;
    if (state.detailEvidenceLoadingKey !== key) {
      state.detailEvidenceLoadingKey = key;
      Promise.all(missing.map((year) => loadYear(year))).finally(() => {
        if (state.detailEvidenceLoadingKey === key) state.detailEvidenceLoadingKey = "";
        renderDetail();
      });
    }
    return false;
  }

  function evidenceRowsForYears(beforeYear, afterYear, selectedEvent = null) {
    const beforeEvents = state.loadedEvents.get(beforeYear) || [];
    const afterEvents = state.loadedEvents.get(afterYear) || [];
    return LAYERS.map((layer) => ({
      layer,
      before: pickEvidenceEvent(beforeEvents, layer.id),
      after: selectedEvent?.category === layer.id && selectedEvent.year === afterYear
        ? selectedEvent
        : pickEvidenceEvent(afterEvents, layer.id),
    }));
  }

  function pickEvidenceEvent(events, category) {
    return events
      .filter((event) => event.category === category)
      .sort((a, b) =>
        confidenceRank(b.confidence) - confidenceRank(a.confidence)
        || eventSourceCount(b) - eventSourceCount(a)
        || String(a.title).localeCompare(String(b.title))
      )[0] || null;
  }

  function confidenceRank(value) {
    const key = String(value || "").toLowerCase();
    if (key === "corroborated") return 4;
    if (key === "documented") return 3;
    if (key === "inferred") return 2;
    if (key === "disputed") return 1;
    return 0;
  }

  function renderEvidenceEventButton(event, emptyText) {
    if (!event) return `<div class="evidence-empty">${escapeHtml(emptyText)}</div>`;
    const source = firstEvidenceLabel(event);
    return `
      <button class="evidence-event" type="button" data-event-id="${escapeAttr(event.id)}">
        <strong>${escapeHtml(event.shortDescription || event.title)}</strong>
        <span>${escapeHtml(event.area || "Unknown area")} / ${eventSourceCount(event)} evidence row${eventSourceCount(event) === 1 ? "" : "s"}${source ? ` / ${escapeHtml(source)}` : ""}</span>
      </button>`;
  }

  function firstEvidenceLabel(event) {
    const evidence = Array.isArray(event?.evidence) ? event.evidence.find((item) => item?.label || item?.record_id || item?.url) : null;
    if (evidence?.label) return evidence.label;
    if (evidence?.record_id) return `Record ${evidence.record_id}`;
    if (evidence?.url) return evidence.url;
    const source = Array.isArray(event?.sourceIds) ? state.sourceById.get(event.sourceIds[0]) : null;
    return source?.title || "";
  }

  function wireEvidenceEventButtons(root) {
    root?.querySelectorAll(".evidence-event[data-event-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-event-id");
        if (id) selectEvent(id);
      });
    });
  }

  function renderDetailLensEvidence(event) {
    const { before, after } = detailEvidenceYears(event);
    const ready = ensureDetailEvidenceLoaded(event);
    if (!ready) {
      return `
        <div class="detail-section">
          <h4>Lens Before / After Evidence</h4>
          <div class="lens-evidence-note">Loading source-backed lens context for ${before} and ${after}.</div>
        </div>`;
    }
    const rows = evidenceRowsForYears(before, after, event);
    return `
      <div class="detail-section">
        <h4>Lens Before / After Evidence</h4>
        <div class="lens-evidence-note">Nearest source-backed records by lens; these are context records, not causal outcome measurements.</div>
        <div class="lens-evidence-grid">
          ${rows.map((row) => `
            <div class="lens-evidence-row" style="--accent:${row.layer.color}">
              <div class="lens-evidence-label"><span></span>${escapeHtml(row.layer.label)}</div>
              <div>
                <small>Before ${before}</small>
                ${renderEvidenceEventButton(row.before, "No earlier source-backed record in this lens")}
              </div>
              <div>
                <small>After / current ${after}</small>
                ${renderEvidenceEventButton(row.after, "No source-backed record in this lens for this year")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>`;
  }

  function renderDetail() {
    if (!els.detailPanel) return;
    if (!state.selectedEvent) {
      els.detailInner.setAttribute("hidden", "");
      els.detailEmpty.removeAttribute("hidden");
      return;
    }
    els.detailEmpty.setAttribute("hidden", "");
    els.detailInner.removeAttribute("hidden");
    const e = state.selectedEvent;
    const layer = LAYER_BY_ID.get(e.category) || LAYERS[1];
    const confidence = confidenceDescriptor(e.confidence);
    const sources = buildSourceRows(e);
    const provenanceFacts = buildProvenanceFacts(e);

    els.detailInner.innerHTML = `
      <div class="detail-head" style="--accent:${layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-chip-row">
          <span class="chip" style="--accent:${layer.color}">${escapeHtml(layer.label)}</span>
          <span class="chip neutral">${e.year}</span>
          ${e.confidence === "inferred" ? '<span class="chip neutral">OSM visibility</span>' : ''}
        </div>
        <h2 class="detail-title">${escapeHtml(e.title)}</h2>
        <div class="detail-where">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="11" height="11"><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.5"/></svg>
          <span>${escapeHtml(e.area || "—")}</span>
          ${e.lngLat ? `<span class="sep">·</span><span style="font-family:var(--font-mono);font-size:10.5px">${e.lngLat[1].toFixed(3)}, ${e.lngLat[0].toFixed(3)}</span>` : ""}
        </div>
      </div>
      <div class="detail-body">
        <p class="detail-summary">${escapeHtml(e.shortDescription || e.summary || "")}</p>

        <div class="detail-section">
          <h4>Confidence</h4>
          <div class="confidence">
            <span class="conf-label" style="color:${confidence.color}">${escapeHtml(confidence.label)}</span>
            <span class="conf-text">${escapeHtml(confidence.description)}</span>
          </div>
        </div>

        ${provenanceFacts.length ? `
          <div class="detail-section">
            <h4>Provenance</h4>
            <div class="provenance-grid">
              ${provenanceFacts.map((fact) => `
                <div class="provenance-row">
                  <span>${escapeHtml(fact.label)}</span>
                  <strong>${escapeHtml(fact.value)}</strong>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        ${renderDetailLensEvidence(e)}

        ${sources.length ? `
          <div class="detail-section">
            <h4>Sources <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:400"> · ${sources.length}</span></h4>
            ${sources.map(renderSourceRow).join("")}
          </div>
        ` : ""}

        ${e.caveats && e.caveats.length ? `
          <div class="detail-section">
            <h4>Caveats</h4>
            <ul class="caveat-list">${e.caveats.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
          </div>
        ` : ""}

        <div class="detail-actions">
          <button class="btn" id="detailOpenLens" style="flex:1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="12" height="12"><circle cx="10" cy="10" r="5.5"/><path d="M14 14l5 5" stroke-linecap="round"/><path d="M10 7v6M7 10h6"/></svg>
            Open in Proposal Lens
          </button>
          <button class="btn btn-icon" id="detailShare" title="Copy permalink">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="12" height="12"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 11l8-4M8 13l8 4"/></svg>
          </button>
        </div>
      </div>
    `;

    els.detailInner.querySelector(".detail-close")?.addEventListener("click", clearSelection);
    wireEvidenceEventButtons(els.detailInner);
    els.detailInner.querySelector("#detailOpenLens")?.addEventListener("click", () => setLensOpen(true));
    els.detailInner.querySelector("#detailShare")?.addEventListener("click", async () => {
      const url = new URL(window.location.href);
      url.searchParams.set("city", state.cityId);
      url.searchParams.set("year", String(state.year));
      url.searchParams.set("event", state.selectedEventId);
      await copyText(url.toString(), "Event permalink copied");
    });
  }

  function buildSourceRows(event) {
    const rows = [];
    if (Array.isArray(event.evidence)) {
      for (const ev of event.evidence) {
        const kind = (ev.kind || "Source").replace(/_/g, " ");
        const source = state.sourceById.get(ev.source_id);
        const title = ev.label || source?.display_name || source?.title || ev.url || "Evidence";
        const year = ev.year ? String(ev.year) : (event.effectiveDate ? event.effectiveDate.slice(0, 4) : String(event.year));
        const url = ev.url || source?.url || "";
        rows.push({
          kind,
          title,
          year,
          url,
          provider: source?.provider || "",
          licence: source?.licence || "",
          accessed: source?.accessed_at || event.provenance?.source_retrieved_at || "",
          attribution: source?.attribution_text || "",
          filePath: ev.file_path || "",
          recordId: ev.record_id || event.provenance?.source_record_id || "",
        });
      }
    }
    if (!rows.length && Array.isArray(event.sourceIds)) {
      for (const sid of event.sourceIds) {
        const source = state.sourceById.get(sid);
        if (!source) continue;
        rows.push({
          kind: source.kind || source.source_family || "Source",
          title: source.display_name || source.title || sid,
          year: String(event.year),
          url: source.url || "",
          provider: source.provider || "",
          licence: source.licence || "",
          accessed: source.accessed_at || event.provenance?.source_retrieved_at || "",
          attribution: source.attribution_text || "",
          filePath: "",
          recordId: event.provenance?.source_record_id || "",
        });
      }
    }
    return rows.slice(0, 6);
  }

  function renderSourceRow(source) {
    const meta = [
      source.provider,
      source.licence ? `Licence: ${source.licence}` : "",
      source.accessed ? `Retrieved: ${source.accessed}` : "",
      source.recordId ? `Record: ${source.recordId}` : "",
      source.filePath ? `File: ${source.filePath}` : "",
    ].filter(Boolean);
    const body = `
      <div class="source-kind">${escapeHtml(source.kind)}</div>
      <div class="source-title">
        <strong>${escapeHtml(source.title)}</strong>
        ${meta.length ? `<span class="source-meta">${meta.map(escapeHtml).join(" / ")}</span>` : ""}
        ${source.attribution ? `<span class="source-note">${escapeHtml(source.attribution)}</span>` : ""}
      </div>
      <div class="source-year">${escapeHtml(source.year)}</div>`;
    if (!source.url) return `<div class="source-row">${body}</div>`;
    return `<a class="source-row" href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer">${body}</a>`;
  }
  function renderEventList() {
    if (!els.eventList) return;
    const events = filteredEvents();
    const selectedIndex = state.selectedEventId ? events.findIndex((event) => event.id === state.selectedEventId) : -1;
    const limit = Math.min(events.length, Math.max(EVENT_LIST_BATCH_SIZE, state.eventListLimit, selectedIndex + 1));
    const visible = events.slice(0, limit);

    setText(els.eventListCount, `${events.length} visible`);
    const city = shortCityName(state.city?.display_name);
    const searchNote = state.search ? ` Search: "${state.search}".` : "";
    setText(els.eventListMeta, `${city} records in ${state.year}. Timeline, layer, confidence, and inferred filters apply.${searchNote}`);

    if (els.eventListMore) {
      els.eventListMore.hidden = limit >= events.length;
      els.eventListMore.textContent = `Show ${Math.min(EVENT_LIST_BATCH_SIZE, Math.max(0, events.length - limit))} more records`;
    }

    if (!visible.length) {
      const loadError = state.yearLoadErrors.get(state.year);
      els.eventList.innerHTML = loadError
        ? `<div class="event-empty">Could not load ${state.year} records. ${escapeHtml(loadError)}</div>`
        : `<div class="event-empty">No source-backed records match the current timeline and filters.</div>`;
      return;
    }

    els.eventList.innerHTML = visible.map((event) => {
      const layer = LAYER_BY_ID.get(event.category) || LAYERS[1];
      const sourceCount = eventSourceCount(event);
      const confidence = confidenceDescriptor(event.confidence).label;
      return `
        <button class="event-row" type="button" role="listitem" data-event-id="${escapeAttr(event.id)}" data-active="${event.id === state.selectedEventId}" style="--accent:${layer.color}">
          <span class="event-dot" aria-hidden="true"></span>
          <span class="event-main">
            <span class="event-title">${escapeHtml(event.title)}</span>
            <span class="event-summary">${escapeHtml(event.shortDescription || event.summary || "")}</span>
            <span class="event-meta">${escapeHtml(event.area || "Unknown area")} / ${escapeHtml(layer.label)} / ${escapeHtml(confidence)} / ${sourceCount} source${sourceCount === 1 ? "" : "s"}</span>
          </span>
          <span class="event-year">${event.year}</span>
        </button>`;
    }).join("");

    els.eventList.querySelectorAll(".event-row").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-event-id");
        if (id) selectEvent(id);
        if (window.matchMedia && window.matchMedia("(max-width: 760px)").matches) setChangelogOpen(false);
      });
    });
  }

  function eventSourceCount(event) {
    const evidence = Array.isArray(event.evidence) ? event.evidence.length : 0;
    const sources = Array.isArray(event.sourceIds) ? event.sourceIds.length : 0;
    return Math.max(evidence, sources, 1);
  }

  function resetEventListLimit() {
    state.eventListLimit = EVENT_LIST_BATCH_SIZE;
  }
  function renderSearchResults() {
    if (!els.searchResults || !els.searchInput) return;
    const q = state.search.trim();
    if (q.length < 2) {
      els.searchResults.setAttribute("hidden", "");
      return;
    }
    const events = visibleEventsForYear(state.year);
    const matches = events
      .filter((e) =>
        (e.title || "").toLowerCase().includes(q.toLowerCase()) ||
        (e.area || "").toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8);

    if (!matches.length) {
      els.searchResults.removeAttribute("hidden");
      els.searchResults.innerHTML = `<div class="search-empty">No matches in ${escapeHtml(shortCityName(state.city?.display_name))} for "${escapeHtml(q)}". Try a different term or scrub the timeline.</div>`;
      return;
    }
    els.searchResults.removeAttribute("hidden");
    els.searchResults.innerHTML = matches.map((m) => {
      const color = (LAYER_BY_ID.get(m.category) || LAYERS[1]).color;
      return `
        <div class="search-row" data-event-id="${escapeAttr(m.id)}" role="button" tabindex="0">
          <span class="dot" style="background:${color}"></span>
          <div>
            <div class="row-title">${escapeHtml(m.title)}</div>
            <div style="font-size:11px;color:var(--muted)">${escapeHtml(m.area || "")}</div>
          </div>
          <span class="meta">${m.year}</span>
        </div>`;
    }).join("");
    els.searchResults.querySelectorAll(".search-row").forEach((row) => {
      const selectResult = () => {
        const id = row.getAttribute("data-event-id");
        selectEvent(id);
        els.searchResults.setAttribute("hidden", "");
        els.searchInput.value = "";
        state.search = "";
      };
      row.addEventListener("click", selectResult);
      addPressHandler(row, selectResult);
    });
  }

  function renderCityMenu() {
    if (!els.cityMenu) return;
    const cities = state.index?.cities || [];
    els.cityMenu.innerHTML = cities.map((c) => `
      <div class="city-row" data-active="${c.city_id === state.cityId}" data-city-id="${escapeAttr(c.city_id)}" role="button" tabindex="0">
        <span class="city-name">${escapeHtml(shortCityName(c.display_name))}</span>
        <span class="meta">${escapeHtml(c.country || "")}</span>
      </div>
    `).join("");
    els.cityMenu.querySelectorAll(".city-row").forEach((row) => {
      const selectCity = async () => {
        const id = row.getAttribute("data-city-id");
        els.cityMenu.setAttribute("hidden", "");
        if (id && id !== state.cityId) {
          try {
            await loadCity(id);
          } catch (err) {
            toast(`Failed to load ${id}: ${err.message}`);
          }
        }
      };
      row.addEventListener("click", selectCity);
      addPressHandler(row, selectCity);
    });
  }

  function syncTopline() {
    const events = filteredEvents();
    const total = totalEventsForYear(state.year);
    setText(els.tlVisible, String(events.length));
    setText(els.tlTotal, String(total));
    setText(els.tlLayers, `${state.activeLayers.size}/${LAYERS.length} layers`);
  }

  function totalEventsForYear(year) {
    const chunk = state.chunks.get(year);
    if (!chunk) return 0;
    const cats = chunk.counts_by_category || {};
    let total = 0;
    for (const l of LAYERS) {
      if (state.activeLayers.has(l.id)) total += cats[l.id] || 0;
    }
    return total;
  }

  // ---------------------------------------------------------------------------
  // Year + selection
  // ---------------------------------------------------------------------------

  async function setYear(year) {
    const next = Math.max(state.yearRange[0], Math.min(state.yearRange[1], Math.round(year)));
    if (next === state.year && state.loadedEvents.has(next)) {
      renderAll();
      updateTimeDependentMapState();
      return;
    }
    state.year = next;
    resetEventListLimit();
    if (state.compareOpen) state.compareAfterYear = next;
    setText(els.tlYear, String(next));
    updateTimeDependentMapState();
    // de-select if the selected event isn't in the new year
    if (state.selectedEvent && state.selectedEvent.year !== next) {
      state.selectedEventId = null;
      state.selectedEvent = null;
    }
    await loadYear(next);
    await loadLensYearsForTimeline(next);
    if (state.year !== next) return;
    renderAll();
    updateTimeDependentMapState();
    renderMarkers();
    if (!state.selectedEvent) await selectFirstVisibleEvent({ keepCamera: true });
  }

  async function selectFirstVisibleEvent(opts = {}) {
    const events = filteredEvents();
    const documented = events.find((e) => e.confidence === "documented");
    const first = documented || events[0];
    if (first) await selectEvent(first.id, { silent: true, ...opts });
  }

  async function reconcileSelectionWithFilters(opts = {}) {
    const events = filteredEvents();
    if (!events.length) {
      state.selectedEventId = null;
      state.selectedEvent = null;
      state.pendingCameraFocusEventId = null;
      renderDetail();
      renderEventList();
      renderMarkers();
      return;
    }
    if (state.selectedEvent && events.some((event) => event.id === state.selectedEventId)) return;
    state.selectedEventId = null;
    state.selectedEvent = null;
    await selectFirstVisibleEvent(opts);
  }

  async function selectEvent(id, opts = {}) {
    let event = state.eventById.get(id);
    if (!event) {
      // try loading any year where the id might live (rare path — usually selecting from current year)
      await loadYear(state.year);
      event = state.eventById.get(id);
    }
    if (!event) {
      if (!opts.silent) toast("Event not found in the current year");
      return;
    }
    state.selectedEventId = event.id;
    state.selectedEvent = event;
    if (event.year !== state.year) {
      await setYear(event.year);
    }
    renderDetail();
    renderEventList();
    renderMarkers();
    if (!opts.keepCamera && event.lngLat) {
      if (state.map && state.mapReady) {
        focusMapOnEvent(event, 720);
      } else {
        state.pendingCameraFocusEventId = event.id;
      }
    }
  }

  function focusPendingCameraEvent(duration = 0) {
    if (!state.pendingCameraFocusEventId || !state.map || !state.mapReady) return;
    const event = state.eventById.get(state.pendingCameraFocusEventId);
    state.pendingCameraFocusEventId = null;
    if (event?.lngLat) focusMapOnEvent(event, duration);
  }

  function focusMapOnEvent(event, duration = 720) {
    if (!event?.lngLat || !state.map || !state.mapReady) return;
    state.map.flyTo({ center: event.lngLat, zoom: Math.max(state.map.getZoom(), 13.2), duration });
  }

  function clearSelection() {
    state.selectedEventId = null;
    state.selectedEvent = null;
    state.pendingCameraFocusEventId = null;
    renderDetail();
    renderEventList();
    renderMarkers();
  }

  // ---------------------------------------------------------------------------
  // Playback
  // ---------------------------------------------------------------------------

  function togglePlay() {
    if (state.playing) stopPlay(); else startPlay();
  }
  function startPlay() {
    if (state.playing) return;
    state.playing = true;
    updatePlayIcon();
    let last = performance.now();
    const step = (now) => {
      if (!state.playing) return;
      const dt = (now - last) / 1000;
      last = now;
      const nextFloat = state.year + dt * PLAY_RATE_YEARS_PER_SECOND;
      const next = Math.round(nextFloat);
      if (next >= state.yearRange[1]) {
        setYear(state.yearRange[1]);
        stopPlay();
        return;
      }
      if (next !== state.year) setYear(next);
      state.playRaf = requestAnimationFrame(step);
    };
    state.playRaf = requestAnimationFrame(step);
  }
  function stopPlay() {
    state.playing = false;
    if (state.playRaf) cancelAnimationFrame(state.playRaf);
    state.playRaf = null;
    updatePlayIcon();
  }
  function updatePlayIcon() {
    if (!els.playIcon) return;
    els.playIcon.innerHTML = state.playing
      ? '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>'
      : '<path d="M7 5l12 7-12 7z"/>';
  }

  // ---------------------------------------------------------------------------
  // Overlays
  // ---------------------------------------------------------------------------

  function setActiveLens(lensId) {
    const next = normalizeMapLensId(lensId);
    if (!next || next === state.activeLens) return;
    state.activeLens = next;
    state.lensEventSourceKey = "";
    renderLensSwitcher();
    renderLensLegend();
    updateTimeDependentMapState();
  }

  function setLensOpen(open) {
    state.lensOpen = open;
    els.lensOverlay?.setAttribute("data-open", String(open));
    if (open) updateLensHead();
  }

  function setMethodOpen(open) {
    state.methodOpen = open;
    els.methodOverlay?.setAttribute("data-open", String(open));
    if (open) renderMethodology();
  }

  function setWelcomeOpen(open) {
    state.welcomeOpen = open;
    els.welcome?.setAttribute("data-open", String(open));
  }

  function setChangelogOpen(open) {
    state.changelogOpen = !!open;
    els.changelogPanel?.setAttribute("data-open", String(state.changelogOpen));
    els.changelogToggle?.setAttribute("aria-pressed", String(state.changelogOpen));
    if (state.changelogOpen) renderEventList();
  }

  function setCompareOpen(open) {
    state.compareOpen = !!open;
    if (state.compareOpen) {
      state.compareBeforeYear = state.compareBeforeYear || compareDefaultBeforeYear();
      state.compareAfterYear = state.compareAfterYear || state.year;
      renderCompareYearOptions();
    }
    renderComparePanel();
  }

  function renderCompareYearOptions() {
    if (!els.compareBeforeYear || !els.compareAfterYear) return;
    const options = state.years.map((year) => `<option value="${year}">${year}</option>`).join("");
    if (els.compareBeforeYear.innerHTML !== options) els.compareBeforeYear.innerHTML = options;
    if (els.compareAfterYear.innerHTML !== options) els.compareAfterYear.innerHTML = options;
    els.compareBeforeYear.value = String(state.compareBeforeYear || compareDefaultBeforeYear());
    els.compareAfterYear.value = String(state.compareAfterYear || state.year);
  }

  function ensureCompareEvidenceLoaded(beforeYear, afterYear) {
    const years = [...new Set([Number(beforeYear), Number(afterYear)].filter((year) => state.chunks.has(year)))];
    const missing = years.filter((year) => !state.loadedEvents.has(year));
    if (!missing.length) return true;
    const key = years.join(",");
    if (state.compareEvidenceLoadingKey !== key) {
      state.compareEvidenceLoadingKey = key;
      Promise.all(missing.map((year) => loadYear(year))).finally(() => {
        if (state.compareEvidenceLoadingKey === key) state.compareEvidenceLoadingKey = "";
        renderComparePanel();
      });
    }
    return false;
  }

  function renderCompareEvidence(rows, beforeYear, afterYear, ready) {
    if (!ready) {
      return `<div class="compare-evidence"><div class="lens-evidence-note">Loading source-backed evidence rows for ${beforeYear} and ${afterYear}.</div></div>`;
    }
    const evidenceRows = evidenceRowsForYears(beforeYear, afterYear)
      .filter((row) => state.activeLayers.has(row.layer.id));
    return `
      <div class="compare-evidence">
        <div class="lens-evidence-note">Before/after rows show one inspectable source-backed record per active lens. Count differences are descriptive, not causal.</div>
        ${evidenceRows.map((row) => `
          <div class="lens-evidence-row" style="--accent:${row.layer.color}">
            <div class="lens-evidence-label"><span></span>${escapeHtml(row.layer.label)}</div>
            <div>
              <small>Before ${beforeYear}</small>
              ${renderEvidenceEventButton(row.before, "No source-backed record in this lens")}
            </div>
            <div>
              <small>After ${afterYear}</small>
              ${renderEvidenceEventButton(row.after, "No source-backed record in this lens")}
            </div>
          </div>
        `).join("")}
      </div>`;
  }

  function renderComparePanel() {
    if (!els.comparePanel) return;
    els.comparePanel.setAttribute("data-open", String(state.compareOpen));
    els.compareBtn?.setAttribute("aria-pressed", String(state.compareOpen));
    if (!state.compareOpen) return;

    renderCompareYearOptions();
    const beforeYear = state.compareBeforeYear || compareDefaultBeforeYear();
    const afterYear = state.compareAfterYear || state.year;
    const beforeCount = compareCountForYear(beforeYear);
    const afterCount = compareCountForYear(afterYear);
    const delta = afterCount - beforeCount;
    const rows = compareCategoryRows(beforeYear, afterYear);
    const evidenceReady = ensureCompareEvidenceLoaded(beforeYear, afterYear);

    if (els.compareStats) {
      els.compareStats.innerHTML = `
        <article><span>${beforeYear}</span><strong>${compactNumber(beforeCount)}</strong><small>records logged</small></article>
        <article><span>${afterYear}</span><strong>${compactNumber(afterCount)}</strong><small>records logged</small></article>
        <article><span>Delta</span><strong>${delta >= 0 ? "+" : ""}${compactNumber(delta)}</strong><small>record count difference</small></article>
        <div class="compare-deltas">
          ${rows.map((row) => `
            <span style="--accent:${row.layer.color}">
              <b>${escapeHtml(row.layer.label)}</b>
              <i>${row.delta >= 0 ? "+" : ""}${compactNumber(row.delta)}</i>
            </span>
          `).join("")}
        </div>
        ${renderCompareEvidence(rows, beforeYear, afterYear, evidenceReady)}`;
      wireEvidenceEventButtons(els.compareStats);
    }
    setText(els.compareNote, "Layer filters apply to this count comparison. OpenStreetMap remains the current orientation basemap; record deltas are not proof of construction volume, congestion, value change, or causation.");
  }

  function compareDefaultBeforeYear() {
    if (!state.years.length) return DEFAULT_YEAR;
    const target = (state.year || DEFAULT_YEAR) - 5;
    let candidate = state.years[0];
    for (const year of state.years) {
      if (year <= target) candidate = year;
      else break;
    }
    return candidate;
  }

  function compareCountForYear(year) {
    const chunk = state.chunks.get(Number(year));
    const counts = chunk?.counts_by_category || {};
    return LAYERS.reduce((sum, layer) => sum + (state.activeLayers.has(layer.id) ? Number(counts[layer.id] || 0) : 0), 0);
  }

  function compareCategoryRows(beforeYear, afterYear) {
    const before = state.chunks.get(Number(beforeYear))?.counts_by_category || {};
    const after = state.chunks.get(Number(afterYear))?.counts_by_category || {};
    return LAYERS
      .filter((layer) => state.activeLayers.has(layer.id))
      .map((layer) => ({
        layer,
        before: Number(before[layer.id] || 0),
        after: Number(after[layer.id] || 0),
        delta: Number(after[layer.id] || 0) - Number(before[layer.id] || 0),
      }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }

  function recenterMap() {
    if (!state.map) return;
    state.map.easeTo({
      center: mapCenter(),
      zoom: Number(state.city?.default_zoom || 11.5),
      pitch: state.mapTilted ? 48 : 0,
      bearing: state.mapTilted ? -10 : 0,
      duration: 520,
    });
  }

  function toggleMapTilt() {
    state.mapTilted = !state.mapTilted;
    updateMapToolState();
    if (!state.map) return;
    state.map.easeTo({ pitch: state.mapTilted ? 48 : 0, bearing: state.mapTilted ? -10 : 0, duration: 420 });
  }

  function updateMapToolState() {
    els.tiltBtn?.setAttribute("aria-pressed", String(state.mapTilted));
  }
  function currentProposal() {
    return PROPOSALS.find((p) => p.id === state.currentProposalId) || PROPOSALS[0];
  }

  function renderProposalLensList() {
    if (!els.lensProposals) return;
    const cityProposals = PROPOSALS.filter((p) => p.city === state.cityId);
    const proposals = cityProposals.length ? cityProposals : PROPOSALS;
    if (!proposals.find((p) => p.id === state.currentProposalId)) {
      state.currentProposalId = proposals[0].id;
    }
    els.lensProposals.innerHTML = proposals.map((p) => {
      const layer = LAYER_BY_ID.get(p.analogs?.[0]?.layer || "transport") || LAYERS[0];
      return `
        <div class="proposal-card" data-active="${p.id === state.currentProposalId}" data-proposal-id="${escapeAttr(p.id)}" role="button" tabindex="0" aria-pressed="${p.id === state.currentProposalId}">
          <div class="ptag" style="color:${layer.color}">● ${escapeHtml(p.type)}</div>
          <div class="ptitle">${escapeHtml(p.title)}</div>
          <div class="pmeta">
            <span>${escapeHtml(p.decision)}</span>
            <span>·</span>
            <span>${p.analogs.length} analogs</span>
          </div>
        </div>`;
    }).join("");
    els.lensProposals.querySelectorAll(".proposal-card").forEach((card) => {
      const selectProposal = () => {
        state.currentProposalId = card.getAttribute("data-proposal-id");
        renderProposalLensList();
        renderLensAnalogs(currentProposal());
        renderLensOutcomes(currentProposal());
        updateLensHead();
      };
      card.addEventListener("click", selectProposal);
      addPressHandler(card, selectProposal);
    });
  }

  function renderLensAnalogs(proposal) {
    if (!els.lensAnalogs || !proposal) return;
    els.lensAnalogs.innerHTML = proposal.analogs.map((a) => `
      <div class="analog">
        <div class="head">
          <span>${escapeHtml(a.place)} · ${escapeHtml((LAYER_BY_ID.get(a.layer) || LAYERS[0]).label)}</span>
          <span class="yr">${a.year}</span>
        </div>
        <div class="t">${escapeHtml(a.title)}</div>
        <div class="out-list">
          ${a.outcomes.map((o) => `
            <div class="out"><span>${escapeHtml(o.k)}</span><span class="val">${escapeHtml(o.v)}</span></div>
          `).join("")}
        </div>
      </div>
    `).join("");
  }

  function renderLensOutcomes(proposal) {
    if (!els.lensOutcomes || !proposal) return;
    els.lensOutcomes.innerHTML = Object.entries(proposal.distribution).map(([k, v]) => `
      <div class="outcome">
        <div class="lbl">${escapeHtml(k)}</div>
        <div class="v">${escapeHtml(v)}</div>
        <div class="range">observed across ${proposal.analogs.length} analogs</div>
      </div>
    `).join("");
  }

  function updateLensHead() {
    const p = currentProposal();
    setText(els.lensTitle, p.title);
    setText(els.lensType, p.type);
    setText(els.lensDecision, p.decision);
    setText(els.lensSummary, p.summary);
  }

  function renderMethodology() {
    if (!els.methodDatasetTable) return;
    const families = (state.city?.source_families || []).slice();
    if (!families.length) {
      els.methodDatasetTable.innerHTML = `<tr><td>Data is still loading.</td></tr>`;
    } else {
      els.methodDatasetTable.innerHTML = `
        <thead><tr><th>Source family</th><th>Coverage</th><th>Years</th><th class="mono">Status</th></tr></thead>
        <tbody>
          ${families.map((f) => `
            <tr>
              <td>${escapeHtml(f.label || f.family_id)}</td>
              <td>${escapeHtml(f.notes || "")}</td>
              <td class="mono">${escapeHtml(f.years?.length ? `${f.years[0]}–${f.years[f.years.length - 1]}` : "—")}</td>
              <td class="mono">${escapeHtml(f.availability || "—")}</td>
            </tr>
          `).join("")}
        </tbody>`;
    }
    const cities = (state.index?.cities || []).map((c) => shortCityName(c.display_name)).join(", ");
    setText(els.methodCities, cities || "Belfast, London, New York.");
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  function cityMeta(id) {
    return (state.index?.cities || []).find((c) => c.city_id === id) || null;
  }
  function initialCityId() {
    const params = new URL(window.location.href).searchParams;
    const requested = params.get("city");
    if (requested && cityMeta(requested)) return requested;
    return cityMeta(DEFAULT_CITY) ? DEFAULT_CITY : state.index?.default_city_id || state.index?.cities?.[0]?.city_id || DEFAULT_CITY;
  }

  function initialEventId() {
    const eventId = new URL(window.location.href).searchParams.get("event");
    return eventId ? String(eventId) : "";
  }

  function confidenceDescriptor(value) {
    const key = String(value || "documented").toLowerCase();
    const descriptions = {
      corroborated: {
        label: "Corroborated",
        color: "var(--conf-high)",
        description: "Supported by independent source organizations. This remains evidence of the observed record, not causation.",
      },
      documented: {
        label: "Documented",
        color: "var(--conf-high)",
        description: "Backed by at least one primary public source. OpenStreetMap basemap is for orientation only.",
      },
      inferred: {
        label: "Inferred (OSM visibility)",
        color: "var(--conf-med)",
        description: "Inferred from OpenStreetMap mapped-visibility metadata. OSM edit dates are not real-world change dates.",
      },
      disputed: {
        label: "Disputed",
        color: "var(--conf-low)",
        description: "Evidence conflicts or limitations are unresolved; inspect caveats and source rows before reuse.",
      },
    };
    return descriptions[key] || { label: titleCase(key), color: "var(--conf-med)", description: "Review source rows and caveats before reuse." };
  }

  function buildProvenanceFacts(event) {
    const p = event.provenance || {};
    return [
      { label: "Effective date", value: event.effectiveDate || String(event.year) },
      { label: "Date precision", value: event.datePrecision || "not stated" },
      { label: "Date basis", value: event.sourceDateField || p.source_date_field || p.source_basis || "" },
      { label: "Retrieved", value: p.source_retrieved_at || "" },
      { label: "Geometry source", value: p.geometry_source || "" },
      { label: "Geometry limitation", value: p.geometry_precision || "" },
      { label: "Transform", value: p.transform || "" },
    ].filter((fact) => fact.value);
  }

  function addPressHandler(el, handler) {
    if (!el) return;
    el.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      handler(event);
    });
  }

  function shortCityName(name) {
    if (!name) return "City";
    return String(name).split(",")[0];
  }

  function dataPathToUrl(path) {
    if (!path) return "";
    if (/^https?:/.test(path)) return path;
    return "/" + String(path).replace(/\\/g, "/").replace(/^web\//, "").replace(/^\//, "");
  }

  function normalizeMapLensId(value) {
    const id = String(value || "").trim();
    return MAP_LENS_BY_ID.has(id) ? id : "";
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return res.json();
  }

  function setAppStatus(text) {
    if (!els.appStatus) return;
    els.appStatus.textContent = text || "";
  }

  let toastTimer = null;
  function toast(message) {
    if (!els.toast) return;
    setText(els.toastText, message);
    els.toast.setAttribute("data-show", "true");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.setAttribute("data-show", "false"), 2200);
  }

  async function copyText(text, successMessage) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(text);
      toast(successMessage);
    } catch (_error) {
      toast("Share unavailable in this browser");
    }
  }

  function setText(el, text) {
    if (el) el.textContent = text == null ? "" : String(text);
  }

  function cleanTitle(t) {
    return String(t || "Untitled change").replace(/\s+/g, " ").trim();
  }
  function cleanSummary(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
  }
  function truncate(s, n) {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
  }
  function compactNumber(n) {
    const value = Number(n) || 0;
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return String(value);
  }
  function titleCase(s) {
    return String(s || "").replace(/(^|\s)\S/g, (ch) => ch.toUpperCase());
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  window.BimsAtlas = {
    state,
    filteredEvents,
    setYear,
    selectEvent,
    clearSelection,
    setActiveLens,
    setChangelogOpen,
    setCompareOpen,
    updateTimeDependentMapState,
    isLayerVisible,
    recenterMap,
  };
})();
