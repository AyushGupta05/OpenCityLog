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
            { k: "Ridership vs forecast", v: "+38%" },
          ],
        },
        {
          place: "Seoul",
          title: "Line 9 East extension",
          year: 2011,
          layer: "transport",
          outcomes: [
            { k: "Ridership vs forecast", v: "+12%" },
            { k: "1km rent uplift", v: "+19%" },
            { k: "Cycle/bus modal", v: "−4%" },
          ],
        },
      ],
      distribution: {
        "Ridership vs forecast": "+12% — +38%",
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
    sources: [],
    sourceById: new Map(),
    eventsIndex: null,
    chunks: new Map(),                 // year -> chunk metadata
    years: [],
    yearRange: [2007, 2026],
    year: DEFAULT_YEAR,
    activeLayers: new Set(LAYERS.map((l) => l.id)),
    confidenceFilter: "all",
    showInferred: true,
    search: "",
    eventListLimit: EVENT_LIST_BATCH_SIZE,
    loadedEvents: new Map(),           // year -> array of events
    loadingYears: new Map(),
    eventById: new Map(),
    selectedEventId: null,
    selectedEvent: null,
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
    mapTilted: false,
    lensOpen: false,
    methodOpen: false,
    welcomeOpen: true,
    currentProposalId: PROPOSALS[0].id,
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
      "layersPanel", "layersList", "layersCount",
      "confidenceFilter", "showInferredToggle",
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
    });
    els.searchInput?.addEventListener("focus", () => renderSearchResults());
    els.searchInput?.addEventListener("blur", () => {
      // delay so click on a result can fire first
      setTimeout(() => els.searchResults?.setAttribute("hidden", ""), 160);
    });

    // Layers panel: confidence + inferred toggle
    els.confidenceFilter?.addEventListener("change", () => {
      state.confidenceFilter = els.confidenceFilter.value;
      resetEventListLimit();
      renderAll();
      renderMarkers();
    });
    els.showInferredToggle?.addEventListener("change", () => {
      state.showInferred = !!els.showInferredToggle.checked;
      resetEventListLimit();
      renderAll();
      renderMarkers();
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
    els.shareBtn?.addEventListener("click", () => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("city", state.cityId);
        url.searchParams.set("year", String(state.year));
        navigator.clipboard?.writeText(url.toString());
        toast("Permalink copied — view shared with city and year");
      } catch {
        toast("Share unavailable in this browser");
      }
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
    const [cityDoc, eventsIndex, sourcesDoc] = await Promise.all([
      fetchJson(dataPathToUrl(paths.city)),
      fetchJson(dataPathToUrl(paths.events)),
      fetchJson(dataPathToUrl(paths.sources)),
    ]);

    state.city = cityDoc;
    state.eventsIndex = eventsIndex;
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
    state.eventById.clear();
    state.selectedEventId = null;
    state.selectedEvent = null;
    state.search = "";
    state.eventListLimit = EVENT_LIST_BATCH_SIZE;
    state.compareOpen = false;
    state.compareBeforeYear = compareDefaultBeforeYear();
    state.compareAfterYear = state.year;
    state.mapTilted = false;
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
    renderAll();
    renderMarkers();
    setAppStatus("");
    selectFirstVisibleEvent();
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
        const events = arr.map((raw, idx) => normalizeEvent(raw, numericYear, idx)).filter((e) => e.lngLat);
        state.loadedEvents.set(numericYear, events);
        for (const e of events) state.eventById.set(e.id, e);
        return events;
      })
      .catch((err) => {
        console.warn(`[atlas] year ${numericYear} failed to load`, err);
        state.loadedEvents.set(numericYear, []);
        return [];
      })
      .finally(() => state.loadingYears.delete(numericYear));
    state.loadingYears.set(numericYear, promise);
    return promise;
  }

  function normalizeEvent(raw, fallbackYear, index) {
    const props = raw.properties || raw;
    const geom = raw.geometry || props.geometry || null;
    const sourceIds = props.source_ids || props.sources || [];
    const event = {
      id: String(props.event_id || raw.id || props.id || `${fallbackYear}-${index}`),
      title: cleanTitle(props.title),
      year: Number(props.year || fallbackYear),
      effectiveDate: props.effective_date || "",
      category: props.category || "built_environment",
      confidence: props.confidence || "documented",
      summary: cleanSummary(props.explanation || props.summary || ""),
      area: props.affected_area?.label || props.affected_area_label || "",
      sourceIds: Array.isArray(sourceIds) ? sourceIds.filter(Boolean) : [sourceIds].filter(Boolean),
      evidence: Array.isArray(props.evidence) ? props.evidence : [],
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
      renderMarkers();
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
    const events = filteredEvents().slice(0, MAX_MARKERS);
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
        el.querySelector(".pin")?.setAttribute("data-active", String(event.id === state.selectedEventId));
        continue;
      }
      const layer = LAYER_BY_ID.get(event.category) || LAYERS[1];
      const el = document.createElement("div");
      el.className = "pin-wrap";
      el.innerHTML = `
        <div class="pin" data-active="${event.id === state.selectedEventId}" style="--accent:${layer.color}">
          <div class="pin-label">${escapeHtml(truncate(event.title, 60))} · ${event.year}</div>
        </div>`;
      el.addEventListener("click", () => {
        selectEvent(event.id);
      });
      const marker = new window.maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(event.lngLat)
        .addTo(state.map);
      state.markers.set(event.id, marker);
    }
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
        <div class="layer-row" data-on="${on}" data-layer="${escapeAttr(l.id)}">
          <span class="layer-swatch" style="--accent:${l.color}"></span>
          <span class="layer-name">${escapeHtml(l.label)}</span>
          <span class="layer-count">${counts[l.id] || 0}</span>
        </div>
      `;
    }).join("");

    els.layersList.querySelectorAll(".layer-row").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-layer");
        if (state.activeLayers.has(id)) state.activeLayers.delete(id);
        else state.activeLayers.add(id);
        resetEventListLimit();
        renderAll();
        renderMarkers();
      });
    });

    setText(els.layersCount, `${state.activeLayers.size}/${LAYERS.length} on`);
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
    const confidenceLabel = e.confidence === "documented" ? "Documented" :
      e.confidence === "inferred" ? "Inferred (OSM visibility)" : titleCase(e.confidence);
    const confidencePct = e.confidence === "documented" ? 0.88 : e.confidence === "inferred" ? 0.42 : 0.6;
    const confColor = confidencePct >= 0.8 ? "var(--conf-high)" :
      confidencePct >= 0.55 ? "var(--conf-med)" : "var(--conf-low)";
    const sources = buildSourceRows(e);

    els.detailInner.innerHTML = `
      <div class="detail-head" style="--accent:${layer.color}">
        <button class="detail-close" type="button" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="14" height="14"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>
        </button>
        <div class="detail-chip-row">
          <span class="chip" style="--accent:${layer.color}">${escapeHtml(layer.label)}</span>
          <span class="chip neutral">${e.year}</span>
          ${e.confidence === "documented" ? '' : '<span class="chip neutral">OSM visibility</span>'}
        </div>
        <h2 class="detail-title">${escapeHtml(e.title)}</h2>
        <div class="detail-where">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="11" height="11"><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke-linejoin="round"/><circle cx="12" cy="9" r="2.5"/></svg>
          <span>${escapeHtml(e.area || "—")}</span>
          ${e.lngLat ? `<span class="sep">·</span><span style="font-family:var(--font-mono);font-size:10.5px">${e.lngLat[1].toFixed(3)}, ${e.lngLat[0].toFixed(3)}</span>` : ""}
        </div>
      </div>
      <div class="detail-body">
        <p class="detail-summary">${escapeHtml(e.summary || "")}</p>

        <div class="detail-section">
          <h4>Confidence</h4>
          <div class="confidence">
            <span class="conf-label" style="color:${confColor}">${escapeHtml(confidenceLabel)}</span>
            <div class="conf-bar"><div class="conf-fill" style="width:${Math.round(confidencePct * 100)}%;background:${confColor}"></div></div>
            <span class="conf-label">${Math.round(confidencePct * 100)}%</span>
          </div>
          <div style="font-size:11.5px;color:var(--muted);margin-top:8px;line-height:1.5">
            ${e.confidence === "documented"
              ? "Backed by at least one primary public source. OpenStreetMap basemap shown for orientation only."
              : "Inferred from OpenStreetMap mapped-visibility metadata. OSM edit dates are not real-world change dates."}
          </div>
        </div>

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
    els.detailInner.querySelector("#detailOpenLens")?.addEventListener("click", () => setLensOpen(true));
    els.detailInner.querySelector("#detailShare")?.addEventListener("click", () => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("city", state.cityId);
        url.searchParams.set("year", String(state.year));
        url.searchParams.set("event", state.selectedEventId);
        navigator.clipboard?.writeText(url.toString());
        toast("Event permalink copied");
      } catch { toast("Share unavailable in this browser"); }
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
        rows.push({ kind, title, year, url });
      }
    }
    if (!rows.length && Array.isArray(event.sourceIds)) {
      for (const sid of event.sourceIds) {
        const source = state.sourceById.get(sid);
        if (!source) continue;
        rows.push({ kind: source.kind || "Source", title: source.display_name || source.title || sid, year: String(event.year), url: source.url || "" });
      }
    }
    return rows.slice(0, 6);
  }

  function renderSourceRow(source) {
    const body = `
      <div class="source-kind">${escapeHtml(source.kind)}</div>
      <div class="source-title">${escapeHtml(source.title)}</div>
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
      els.eventList.innerHTML = `<div class="event-empty">No source-backed records match the current timeline and filters.</div>`;
      return;
    }

    els.eventList.innerHTML = visible.map((event) => {
      const layer = LAYER_BY_ID.get(event.category) || LAYERS[1];
      const sourceCount = eventSourceCount(event);
      const confidence = event.confidence === "documented" ? "Documented" : titleCase(event.confidence || "unknown");
      return `
        <button class="event-row" type="button" role="listitem" data-event-id="${escapeAttr(event.id)}" data-active="${event.id === state.selectedEventId}" style="--accent:${layer.color}">
          <span class="event-dot" aria-hidden="true"></span>
          <span class="event-main">
            <span class="event-title">${escapeHtml(event.title)}</span>
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
        <div class="search-row" data-event-id="${escapeAttr(m.id)}">
          <span class="dot" style="background:${color}"></span>
          <div>
            <div class="row-title">${escapeHtml(m.title)}</div>
            <div style="font-size:11px;color:var(--muted)">${escapeHtml(m.area || "")}</div>
          </div>
          <span class="meta">${m.year}</span>
        </div>`;
    }).join("");
    els.searchResults.querySelectorAll(".search-row").forEach((row) => {
      row.addEventListener("click", () => {
        const id = row.getAttribute("data-event-id");
        selectEvent(id);
        els.searchResults.setAttribute("hidden", "");
        els.searchInput.value = "";
        state.search = "";
      });
    });
  }

  function renderCityMenu() {
    if (!els.cityMenu) return;
    const cities = state.index?.cities || [];
    els.cityMenu.innerHTML = cities.map((c) => `
      <div class="city-row" data-active="${c.city_id === state.cityId}" data-city-id="${escapeAttr(c.city_id)}">
        <span class="city-name">${escapeHtml(shortCityName(c.display_name))}</span>
        <span class="meta">${escapeHtml(c.country || "")}</span>
      </div>
    `).join("");
    els.cityMenu.querySelectorAll(".city-row").forEach((row) => {
      row.addEventListener("click", async () => {
        const id = row.getAttribute("data-city-id");
        els.cityMenu.setAttribute("hidden", "");
        if (id && id !== state.cityId) {
          try {
            await loadCity(id);
          } catch (err) {
            toast(`Failed to load ${id}: ${err.message}`);
          }
        }
      });
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
      return;
    }
    state.year = next;
    resetEventListLimit();
    if (state.compareOpen) state.compareAfterYear = next;
    setText(els.tlYear, String(next));
    // de-select if the selected event isn't in the new year
    if (state.selectedEvent && state.selectedEvent.year !== next) {
      state.selectedEventId = null;
      state.selectedEvent = null;
    }
    await loadYear(next);
    renderAll();
    renderMarkers();
    if (!state.selectedEvent) selectFirstVisibleEvent();
  }

  function selectFirstVisibleEvent() {
    const events = filteredEvents();
    const documented = events.find((e) => e.confidence === "documented");
    const first = documented || events[0];
    if (first) selectEvent(first.id, { silent: true });
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
    if (event.lngLat && state.map && state.mapReady) {
      state.map.flyTo({ center: event.lngLat, zoom: Math.max(state.map.getZoom(), 13.2), duration: 720 });
    }
  }

  function clearSelection() {
    state.selectedEventId = null;
    state.selectedEvent = null;
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
        </div>`;
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
      .filter((row) => row.before || row.after)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 6);
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
        <div class="proposal-card" data-active="${p.id === state.currentProposalId}" data-proposal-id="${escapeAttr(p.id)}">
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
      card.addEventListener("click", () => {
        state.currentProposalId = card.getAttribute("data-proposal-id");
        renderProposalLensList();
        renderLensAnalogs(currentProposal());
        renderLensOutcomes(currentProposal());
        updateLensHead();
      });
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
        <div class="range">across ${proposal.analogs.length} analogs</div>
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

  function shortCityName(name) {
    if (!name) return "City";
    return String(name).split(",")[0];
  }

  function dataPathToUrl(path) {
    if (!path) return "";
    if (/^https?:/.test(path)) return path;
    return "/" + String(path).replace(/\\/g, "/").replace(/^web\//, "").replace(/^\//, "");
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
    setChangelogOpen,
    setCompareOpen,
    recenterMap,
  };
})();
