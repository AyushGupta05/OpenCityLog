(function () {
  "use strict";

  const MAX_LIST_EVENTS = 220;
  const MAX_MAP_MARKERS = 360;
  const MAX_MINI_MARKERS = 120;
  const CURRENT_YEAR = 2026;
  const DEFAULT_LENS = "all";

  const LENSES = [
    { id: "all", label: "All changes", hint: "Every available record", color: "#0f766e" },
    { id: "development", label: "Development", hint: "Planning and built form", color: "#2563eb", categories: ["built_environment"] },
    { id: "transport", label: "Transport", hint: "Road and transit context", color: "#b45309", categories: ["transport"], lenses: ["mobility", "traffic"] },
    { id: "housing", label: "Housing", hint: "Residential signals", color: "#7c3aed", categories: ["built_environment"], keywords: ["housing", "residential", "dwelling", "apartment", "affordable", "homes", "student"] },
    { id: "environment", label: "Environment", hint: "Green and air context", color: "#15803d", categories: ["environment"], keywords: ["green", "park", "tree", "air", "environment", "open space", "public space"] },
    { id: "economy", label: "Economy/jobs", hint: "Employment and activity", color: "#9333ea", categories: ["economy"], lenses: ["jobs"] },
    { id: "energy", label: "Energy/infra", hint: "Utilities and grid", color: "#0e7490", categories: ["utilities"], lenses: ["utilities", "electricity"] },
    { id: "services", label: "Services/equity", hint: "Civic services", color: "#be123c", categories: ["civic_services"], lenses: ["services"] },
  ];

  const CATEGORY_LABELS = {
    built_environment: "Development",
    transport: "Transport",
    utilities: "Energy/infrastructure",
    civic_services: "Services/equity",
    economy: "Economy/jobs",
    environment: "Environment",
  };

  const SIGNAL_LABELS = {
    buildings: "Development",
    built_environment: "Development",
    mobility: "Mobility",
    traffic: "Traffic",
    services: "Services",
    civic_services: "Civic services",
    utilities: "Energy/utilities",
    electricity: "Electricity",
    jobs: "Jobs",
    economy: "Economy",
    green_space: "Green/public space",
  };

  const CONFIDENCE_WEIGHT = {
    corroborated: 4,
    documented: 3,
    inferred: 2,
    disputed: 1,
  };

  const CITY_VIEW_CONFIG = {
    london: {
      defaultYear: 2022,
      defaultLens: "transport",
      featuredEventId: "london-2022-elizabeth-line",
      displayPlace: "London / Stratford / Lower Lea Valley",
      subtitle: "London, England",
      center: [-0.0102, 51.545],
      zoom: 14,
      bounds: [-0.075, 51.505, 0.055, 51.575],
      labels: ["STRATFORD", "OLYMPIC PARK", "LOWER LEA VALLEY"],
    },
    nyc: {
      defaultYear: 2025,
      defaultLens: "transport",
      featuredEventId: "nyc-2025-congestion-pricing",
      displayPlace: "New York City / Manhattan / Midtown",
      subtitle: "New York City, New York",
      center: [-73.9855, 40.754],
      zoom: 14,
      bounds: [-74.035, 40.705, -73.92, 40.815],
      labels: ["HUDSON YARDS", "MIDTOWN", "EAST SIDE"],
    },
  };

  const CITY_DEMO_EVENTS = {
    london: [
      demoEvent("london", "london-2011-dlr-stratford-international", 2011, "DLR extension to Stratford International opened", "transport", "mobility", [-0.0086, 51.5448], "Stratford International", ["tfl-open-data"], "https://tfl.gov.uk/info-for/media/press-releases", "Docklands Light Railway connection added transport access to the Olympic Park and Stratford International area.", ["Opening dates and service context are documented; this does not isolate a traffic-causality effect."], trafficMetrics(2010, 2011, "Pre-extension access", "Post-opening access", "DLR/rail access added to the Stratford International area; road traffic effects are contextual, not causal.")),
      demoEvent("london", "london-2012-olympic-park", 2012, "Queen Elizabeth Olympic Park opens", "built_environment", "mobility", [-0.0163, 51.5386], "Queen Elizabeth Olympic Park", ["london-datastore"], "https://www.queenelizabetholympicpark.co.uk/our-stories/london-legacy-development-corporation-announces-opening-plans-queen-elizabeth-olympic", "The Olympic Park became a major public realm and regeneration anchor in the Lower Lea Valley.", ["Park opening and legacy delivery are documented; traffic and development signals should be read as surrounding context."], trafficMetrics(2008, 2012, "Games build-out period", "Park opening period", "Mobility demand and public-realm access changed around the Olympic Park; source evidence supports timing, not exact congestion attribution.")),
      demoEvent("london", "london-2018-elizabeth-line-station-fitout", 2018, "Elizabeth line stations moved through final fit-out", "transport", "mobility", [-0.0033, 51.5419], "Stratford and east London corridor", ["tfl-open-data"], "https://tfl.gov.uk/corporate/publications-and-reports/elizabeth-line-delivery-group", "Public delivery records show the Elizabeth line moving toward operational readiness across the London rail corridor.", ["Delivery records are administrative evidence; passenger and road impacts require separate observed datasets."], trafficMetrics(2017, 2018, "Construction/delivery phase", "Pre-opening readiness", "Evidence supports delivery status and affected transport corridor; it is not a measured traffic outcome.")),
      demoEvent("london", "london-2022-elizabeth-line", 2022, "Elizabeth line opened", "transport", "mobility", [-0.003, 51.541], "Stratford station and cross-London corridor", ["tfl-open-data"], "https://rms.tfl.gov.uk/info-for/media/press-releases/2022/may/elizabeth-line-to-open-on-24-may-2022", "TfL confirmed the Elizabeth line opened to passengers on 24 May 2022, changing rail access across London.", ["Opening is documented by TfL; this atlas shows access context and before/after evidence, not a claimed road-traffic reduction."], trafficMetrics(2021, 2022, "Before opening", "Passenger service opened", "TfL opening evidence supports a transport-access change. Any road traffic interpretation needs separate traffic-count evidence.")),
    ],
    nyc: [
      demoEvent("nyc", "nyc-2009-high-line", 2009, "High Line opened to the public", "environment", "green_space", [-74.0048, 40.7479], "West Chelsea", ["nyc-open-data"], "https://www.thehighline.org/history/", "The High Line converted a former elevated freight rail structure into public open space on Manhattan's west side.", ["Public-space opening is documented; nearby development and traffic patterns are contextual."], trafficMetrics(2008, 2009, "Before park opening", "Public park opening", "The event records a public-realm change. Traffic effects are not inferred without separate counts.")),
      demoEvent("nyc", "nyc-2010-times-square-plaza", 2010, "Times Square permanent plaza design process began", "transport", "traffic", [-73.9851, 40.758], "Times Square", ["nyc-open-data"], "https://www.nyc.gov/html/dot/html/pr2010/pr10_010.shtml", "NYC DOT initiated permanent plaza design after Green Light for Midtown changed street allocation in Times Square.", ["DOT source documents public-realm and street-design actions; local traffic outcomes require the referenced evaluation data."], trafficMetrics(2009, 2010, "Temporary plaza period", "Permanent design initiated", "DOT records support the before/after street-allocation change; the card avoids claiming exact congestion effects.")),
      demoEvent("nyc", "nyc-2017-second-avenue-subway", 2017, "Second Avenue Subway Phase 1 opened", "transport", "mobility", [-73.947, 40.784], "Upper East Side", ["nyc-open-data"], "https://www.mta.info/project/second-avenue-subway-phase-1", "The first phase of the Second Avenue Subway opened new subway access on Manhattan's East Side.", ["MTA project evidence supports the infrastructure opening; mode-shift and road effects are separate analytical questions."], trafficMetrics(2016, 2017, "Before Phase 1", "Phase 1 opened", "Transit access changed on the East Side. This is evidence context, not a traffic forecast.")),
      demoEvent("nyc", "nyc-2019-hudson-yards", 2019, "Hudson Yards opened", "built_environment", "jobs", [-74.0006, 40.7539], "Far West Side", ["nyc-dcp-mappluto"], "https://www.hudsonyardsnewyork.com/press-media/press-releases/hudson-yards-officially-opens", "Hudson Yards opened as a major mixed-use district on Manhattan's Far West Side.", ["Opening and development context are documented; exact jobs, tax and traffic effects need source-specific datasets."], trafficMetrics(2018, 2019, "Before district opening", "Public opening", "The opening affected access and demand context around 34 St-Hudson Yards; this card does not claim causality.")),
      demoEvent("nyc", "nyc-2025-congestion-pricing", 2025, "Congestion pricing launched in Manhattan", "transport", "traffic", [-73.9857, 40.758], "Manhattan Central Business District", ["nyc-open-data"], "https://congestionreliefzone.mta.info/", "The Central Business District Tolling Program began as a traffic-management and transit-funding policy for Manhattan south of 60th Street.", ["This is a policy/event record. Before/after traffic numbers should be checked against official MTA/DOT releases for the exact measurement window."], trafficMetrics(2024, 2025, "Before tolling", "Tolling launched", "Official program evidence supports the policy change; measured traffic deltas are treated as source-dependent evidence, not a model output.")),
    ],
  };

  const state = {
    index: null,
    cityId: "london",
    city: null,
    availability: null,
    sources: null,
    eventsIndex: null,
    year: CURRENT_YEAR,
    startYear: 2007,
    endYear: CURRENT_YEAR,
    lens: "all",
    search: "",
    eventsByYear: new Map(),
    selectedEventId: null,
    selectedEvent: null,
    compareBefore: 2025,
    compareAfter: 2026,
    mapMode: "3d",
    mapLayer: "observed",
    detailTab: "observed",
    overlayOpacity: 60,
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    collectElements();
    wireEvents();
    renderLensButtons();
    setMapLayer(state.mapLayer);
    state.cityId = getUrlParam("city") || state.cityId;
    await loadIndex();
    await loadCity(state.cityId);
    exposeTestApi();
  }

  function collectElements() {
    for (const id of [
      "citySelect",
      "coverageBadge",
      "trustBadge",
      "buildBadge",
      "sourcesButton",
      "impactButton",
      "closeImpactButton",
      "eventSearch",
      "lensGroup",
      "eventCountPill",
      "listMeta",
      "eventList",
      "timelineRange",
      "timelineStart",
      "timelineEnd",
      "mapTitle",
      "placeSubtitle",
      "mapStage",
      "mapTileLayer",
      "mapAttribution",
      "markerLayer",
      "mapEmpty",
      "staticMap",
      "mapCallout",
      "calloutYear",
      "calloutTitle",
      "calloutMeta",
      "mapMode2d",
      "mapMode3d",
      "mapLayerGroup",
      "opacitySlider",
      "opacityValue",
      "trafficCompareCard",
      "trafficCompareTitle",
      "trafficBeforeYear",
      "trafficBeforeValue",
      "trafficBeforeLabel",
      "trafficAfterYear",
      "trafficAfterValue",
      "trafficAfterLabel",
      "trafficCompareNote",
      "zoomInButton",
      "zoomOutButton",
      "locateButton",
      "targetButton",
      "yearSlider",
      "yearValue",
      "timelineYears",
      "prevYearButton",
      "nextYearButton",
      "fitMapButton",
      "shareButton",
      "detailTitle",
      "detailSubtitle",
      "detailConfidence",
      "detailBody",
      "detailTabGroup",
      "clearSelectionButton",
      "confidenceText",
      "sourceSummary",
      "sourceChips",
      "openEvidenceButton",
      "compareBefore",
      "compareAfter",
      "compareSelectedEvent",
      "beforeMiniLabel",
      "afterMiniLabel",
      "deltaGrid",
      "impactPanel",
      "impactForm",
      "proposalCategory",
      "proposalTitle",
      "proposalLocation",
      "proposalScale",
      "proposalDescription",
      "impactResults",
      "sourceDrawer",
      "sourceDrawerBody",
      "closeSourcesButton",
      "toast",
    ]) {
      els[id] = document.getElementById(id);
    }
  }

  function wireEvents() {
    els.citySelect.addEventListener("change", () => loadCity(els.citySelect.value));
    els.eventSearch.addEventListener("input", () => {
      state.search = els.eventSearch.value.trim().toLowerCase();
      renderEvents();
    });
    els.yearSlider.addEventListener("input", () => setYear(Number(els.yearSlider.value)));
    if (els.prevYearButton) els.prevYearButton.addEventListener("click", () => setYear(state.year - 1));
    if (els.nextYearButton) els.nextYearButton.addEventListener("click", () => setYear(state.year + 1));
    els.fitMapButton.addEventListener("click", () => toast("Showing all mappable records within the city bounds."));
    if (els.zoomInButton) els.zoomInButton.addEventListener("click", () => setMapZoomed(true));
    if (els.zoomOutButton) els.zoomOutButton.addEventListener("click", () => setMapZoomed(false));
    if (els.locateButton) els.locateButton.addEventListener("click", () => state.selectedEvent ? focusMapOnEvent(state.selectedEvent) : toast("Select an event first."));
    if (els.targetButton) els.targetButton.addEventListener("click", () => setMapZoomed(false));
    if (els.mapMode2d) els.mapMode2d.addEventListener("click", () => setMapMode("2d"));
    if (els.mapMode3d) els.mapMode3d.addEventListener("click", () => setMapMode("3d"));
    if (els.mapLayerGroup) {
      els.mapLayerGroup.querySelectorAll("[data-map-layer]").forEach((button) => {
        button.addEventListener("click", () => setMapLayer(button.dataset.mapLayer));
      });
    }
    if (els.opacitySlider) els.opacitySlider.addEventListener("input", () => {
      state.overlayOpacity = Number(els.opacitySlider.value);
      els.opacityValue.textContent = `${state.overlayOpacity}%`;
      els.mapStage.style.setProperty("--overlay-opacity", String(state.overlayOpacity / 100));
    });
    els.shareButton.addEventListener("click", shareView);
    els.sourcesButton.addEventListener("click", openSources);
    if (els.openEvidenceButton) els.openEvidenceButton.addEventListener("click", openSources);
    els.closeSourcesButton.addEventListener("click", closeSources);
    if (els.clearSelectionButton) els.clearSelectionButton.addEventListener("click", clearSelection);
    els.sourceDrawer.addEventListener("click", (event) => {
      if (event.target.hasAttribute("data-close-drawer")) closeSources();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.sourceDrawer.hidden) closeSources();
    });
    els.compareBefore.addEventListener("change", () => {
      state.compareBefore = Number(els.compareBefore.value);
      renderCompare();
    });
    els.compareAfter.addEventListener("change", () => {
      state.compareAfter = Number(els.compareAfter.value);
      renderCompare();
    });
    els.compareSelectedEvent.addEventListener("click", compareAroundSelectedEvent);
    els.impactButton.addEventListener("click", () => {
      els.impactPanel.hidden = false;
      els.proposalTitle.focus();
    });
    if (els.closeImpactButton) els.closeImpactButton.addEventListener("click", closeImpact);
    els.impactPanel.addEventListener("click", (event) => {
      if (event.target.hasAttribute("data-close-impact")) closeImpact();
    });
    els.impactForm.addEventListener("submit", runImpactSketch);
    els.detailTabGroup.querySelectorAll("[data-detail-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        state.detailTab = button.dataset.detailTab;
        renderDetailTabs();
        if (state.selectedEvent) renderDetail(state.selectedEvent);
      });
    });
  }

  async function loadIndex() {
    try {
      state.index = await fetchJson("/data/city-atlas/index.json");
      if (!CITY_VIEW_CONFIG[state.cityId]) state.cityId = "london";
      renderCitySelect();
    } catch (error) {
      renderFatal(`Could not load the city atlas index: ${error.message}`);
    }
  }

  function renderCitySelect() {
    const cities = selectableCities();
    els.citySelect.innerHTML = cities.map((city) => (
      `<option value="${escapeHtml(city.city_id)}">${escapeHtml(city.display_name)}</option>`
    )).join("");
    els.citySelect.value = state.cityId;
  }

  async function loadCity(cityId) {
    state.cityId = CITY_VIEW_CONFIG[cityId] ? cityId : "london";
    state.selectedEventId = null;
    state.selectedEvent = null;
    state.eventsByYear = new Map();
    const cityMeta = selectableCities().find((city) => city.city_id === state.cityId);
    if (!cityMeta) return renderFatal(`Unknown city: ${state.cityId}`);

    setLoadingState(cityMeta);
    try {
      const paths = cityMeta.artifact_paths || {};
      const [city, availability, eventsIndex, sources] = await Promise.all([
        fetchJson(dataPathToUrl(paths.city)),
        fetchJson(dataPathToUrl(paths.availability)),
        fetchJson(dataPathToUrl(paths.events)),
        fetchJson(dataPathToUrl(paths.sources)),
      ]);
      state.city = city;
      state.availability = availability;
      state.eventsIndex = eventsIndex;
      state.sources = sources;
      const years = getAvailableYears();
      state.startYear = years[0] || city.available_years?.demo_observed_start || 2007;
      state.endYear = Math.min(years[years.length - 1] || city.available_years?.demo_observed_end || CURRENT_YEAR, CURRENT_YEAR);
      const yearParam = getUrlParam("year");
      const urlYear = Number(yearParam);
      const hasUrlYear = yearParam !== null && Number.isFinite(urlYear);
      const cityView = CITY_VIEW_CONFIG[state.cityId] || {};
      const preferredYear = cityView.defaultYear || DEFAULT_DEMO_YEAR;
      state.year = clamp(hasUrlYear ? urlYear : preferredYear, state.startYear, state.endYear);
      state.compareBefore = clamp(state.year - 1, state.startYear, state.endYear);
      state.compareAfter = state.year;
      state.lens = getUrlParam("lens") || cityView.defaultLens || DEFAULT_DEMO_LENS;
      renderChrome(cityMeta);
      renderLensButtons();
      renderTimeline();
      renderCompareControls();
      renderEmptyDetail();
      await loadEventsForYear(state.year);
      if (!hasUrlYear) selectInitialFeaturedEvent();
      await renderCompare();
    } catch (error) {
      renderFatal(`Could not load ${cityMeta.display_name}: ${error.message}`);
    }
  }

  function setLoadingState(cityMeta) {
    if (els.coverageBadge) els.coverageBadge.textContent = `${cityMeta.display_name} loading`;
    els.eventList.innerHTML = `<div class="empty-state">Loading event chunks and source records.</div>`;
    els.detailBody.className = "detail-body empty-state";
    els.detailBody.textContent = "Loading city detail.";
    els.markerLayer.innerHTML = "";
  }

  function renderChrome(cityMeta) {
    const status = state.availability?.summary?.status || cityMeta.availability_status || "unknown";
    const count = cityEventCount(state.cityId, cityMeta);
    if (els.coverageBadge) els.coverageBadge.textContent = `${formatNumber(count)} events - ${status.replace(/_/g, " ")}`;
    if (els.trustBadge) els.trustBadge.textContent = `${formatNumber(cityMeta.source_count || state.sources?.source_count || 0)} source records`;
    if (els.buildBadge) els.buildBadge.textContent = `Built ${formatDateTime(state.index?.generated_at || state.sources?.generated_at)}`;
    const cityView = CITY_VIEW_CONFIG[state.cityId] || {};
    els.mapTitle.textContent = cityView.displayPlace || displayPlaceName(state.city.display_name);
    els.placeSubtitle.textContent = cityView.subtitle || state.city.display_name;
    renderCityLabels();
    renderImageryTiles();
    els.sourceSummary.textContent = `${formatNumber(count)} records, ${formatNumber(cityMeta.source_count || state.sources?.source_count || 0)} source records, ${status.replace(/_/g, " ")} coverage.`;
    els.sourceChips.innerHTML = (state.sources?.sources || []).slice(0, 5).map((source) => `<span>${escapeHtml(source.source_id || source.provider || "source")}</span>`).join("") + `<span>+${Math.max(0, (state.sources?.source_count || 0) - 5)}</span>`;
    document.title = `${displayPlaceName(state.city.display_name)} - Open Citylog`;
  }

  function renderTimeline() {
    const years = getAvailableYears();
    els.yearSlider.min = String(state.startYear);
    els.yearSlider.max = String(state.endYear);
    els.yearSlider.value = String(state.year);
    if (els.yearValue) els.yearValue.textContent = String(state.year);
    if (els.timelineRange) els.timelineRange.textContent = `Explore ${state.startYear}-${state.endYear}`;
    if (els.timelineStart) els.timelineStart.textContent = String(state.startYear);
    if (els.timelineEnd) els.timelineEnd.textContent = String(state.endYear);
    if (els.prevYearButton) els.prevYearButton.disabled = state.year <= state.startYear;
    if (els.nextYearButton) els.nextYearButton.disabled = state.year >= state.endYear;
    const shown = years.filter((year) => year === state.startYear || year === state.endYear || year % 3 === 0);
    if (els.timelineYears) els.timelineYears.innerHTML = shown.map((year) => `<span>${year}</span>`).join("");
  }

  function renderCompareControls() {
    const years = [];
    for (let year = state.startYear; year <= state.endYear; year += 1) years.push(year);
    const options = years.map((year) => `<option value="${year}">${year}</option>`).join("");
    els.compareBefore.innerHTML = options;
    els.compareAfter.innerHTML = options;
    els.compareBefore.value = String(state.compareBefore);
    els.compareAfter.value = String(state.compareAfter);
    els.beforeMiniLabel.textContent = String(state.compareBefore);
    els.afterMiniLabel.textContent = String(state.compareAfter);
  }

  function renderLensButtons() {
    els.lensGroup.innerHTML = LENSES.map((lens) => `
      <button class="lens-button" type="button" data-lens="${lens.id}" style="--lens-color:${lens.color}" aria-pressed="${lens.id === state.lens}">
        ${escapeHtml(lens.label)}
        <small>${escapeHtml(lens.hint)}</small>
      </button>
    `).join("");
    els.lensGroup.querySelectorAll(".lens-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.lens = button.dataset.lens;
        updateUrl();
        renderLensButtons();
        renderEvents();
        if (state.selectedEvent) renderTrafficCompare(state.selectedEvent);
        renderCompare();
      });
    });
  }

  async function setYear(year) {
    const nextYear = clamp(Number(year), state.startYear, state.endYear);
    if (nextYear === state.year && state.eventsByYear.has(nextYear)) return;
    state.year = nextYear;
    state.selectedEventId = null;
    state.selectedEvent = null;
    renderTimeline();
    renderEmptyDetail();
    updateUrl();
    await loadEventsForYear(nextYear);
  }

  async function loadEventsForYear(year) {
    els.listMeta.textContent = `Loading ${year} records`;
    if (!state.eventsByYear.has(year)) {
      const chunk = (state.eventsIndex?.chunks || []).find((item) => Number(item.year) === Number(year));
      if (!chunk || !chunk.event_count) {
        state.eventsByYear.set(year, demoEventsForYear(state.cityId, year));
      } else {
        const data = await fetchJson(dataPathToUrl(chunk.json_path));
        state.eventsByYear.set(year, (data.events || []).concat(demoEventsForYear(state.cityId, year)));
      }
    }
    renderEvents();
  }

  function renderEvents() {
    const allEvents = getCurrentEvents();
    const filtered = filterEvents(allEvents);
    const sorted = filtered.slice().sort(sortEvents);
    const shown = sorted.slice(0, MAX_LIST_EVENTS);
    els.eventCountPill.textContent = `${formatNumber(filtered.length)} records`;
    els.listMeta.textContent = filtered.length
      ? `Showing ${formatNumber(shown.length)} of ${formatNumber(filtered.length)} records for ${state.year}`
      : `No records match this lens for ${state.year}`;
    els.eventList.innerHTML = shown.length
      ? shown.map(renderEventCard).join("")
      : `<div class="empty-state">No matching events. Try another lens, year, or search term.</div>`;
    els.eventList.querySelectorAll(".event-card").forEach((button) => {
      button.addEventListener("click", () => selectEvent(button.dataset.eventId));
    });
    renderMapMarkers(sorted);
  }

  function renderEventCard(event) {
    const selected = state.selectedEventId === event.event_id;
    const confidence = event.confidence || "unknown";
    const area = event.affected_area?.label || "Mapped area";
    const lens = lensForEvent(event);
    return `
      <button class="event-card" type="button" role="listitem" data-event-id="${escapeAttr(event.event_id)}" aria-selected="${selected}">
        <span class="event-year">${escapeHtml(String(event.year || state.year))}</span>
        <strong>${escapeHtml(event.title || "Untitled event")}</strong>
        <span class="event-subline">${escapeHtml(area)} - ${escapeHtml(confidenceLabel(confidence))}</span>
        <span class="event-category" style="--lens-color:${lens.color}">${escapeHtml(categoryLabel(event.category))}</span>
        <span class="event-bookmark" aria-hidden="true"></span>
      </button>
    `;
  }

  function renderMapMarkers(events) {
    const mappable = events
      .map((event) => ({ event, point: eventPoint(event) }))
      .filter((item) => item.point)
      .slice(0, MAX_MAP_MARKERS);

    els.mapEmpty.hidden = mappable.length > 0;
    els.markerLayer.innerHTML = mappable.map(({ event, point }, index) => {
      const pos = project(point);
      const confidence = event.confidence || "unknown";
      const lens = lensForEvent(event);
      const color = lens.color || "#0f766e";
      const size = confidence === "documented" || confidence === "corroborated" ? 16 : 13;
      return `
        <button
          class="map-marker ${escapeAttr(confidence)}"
          style="left:${pos.x}%;top:${pos.y}%;--marker-color:${color};--marker-size:${size}px"
          type="button"
          data-event-id="${escapeAttr(event.event_id)}"
          aria-label="${escapeAttr(`${event.title || "Event"} (${confidence})`)}"
          aria-selected="${state.selectedEventId === event.event_id}"
          title="${escapeAttr(event.title || "Event")}"
        ></button>
      `;
    }).join("");
    els.markerLayer.querySelectorAll(".map-marker").forEach((button) => {
      button.addEventListener("click", () => selectEvent(button.dataset.eventId));
    });
  }

  function selectEvent(eventId) {
    const event = getCurrentEvents().find((item) => item.event_id === eventId);
    if (!event) return;
    state.selectedEventId = eventId;
    state.selectedEvent = event;
    state.detailTab = "observed";
    renderEvents();
    renderDetail(event);
    renderDetailTabs();
    focusMapOnEvent(event);
    renderTrafficCompare(event);
    compareAroundSelectedEvent(true);
  }

  function selectInitialFeaturedEvent() {
    const cityView = CITY_VIEW_CONFIG[state.cityId] || {};
    const filtered = filterEvents(getCurrentEvents()).sort(sortEvents);
    const featured = filtered.find((event) => event.event_id === (cityView.featuredEventId || DEFAULT_FEATURED_EVENT_ID))
      || filtered.find((event) => event.confidence === "corroborated" || event.confidence === "documented")
      || filtered[0];
    if (featured) selectEvent(featured.event_id);
  }

  function renderDetail(event) {
    els.detailTitle.textContent = event.title || "Untitled event";
    els.detailSubtitle.textContent = categoryLabel(event.category);
    els.detailConfidence.textContent = event.confidence || "unknown";
    els.confidenceText.textContent = confidenceText(event);
    renderConfidenceMeter(event.confidence);
    const point = eventPoint(event);
    const evidence = event.evidence || [];
    const caveats = event.caveats || [];
    const related = relatedEvents(event).slice(0, 4);
    els.detailBody.className = "detail-body";
    if (state.detailTab === "evidence") {
      els.detailBody.innerHTML = `
        <section class="detail-section">
          <h3>Evidence</h3>
          <ul class="evidence-list">${evidence.length ? evidence.map(renderEvidence).join("") : `<li>No evidence records supplied.</li>`}</ul>
        </section>
        <section class="detail-section">
          <h3>Source caveats</h3>
          <ul class="caveat-list">${caveats.length ? caveats.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : `<li>No caveats supplied for this record.</li>`}</ul>
        </section>
      `;
    } else if (state.detailTab === "details") {
      els.detailBody.innerHTML = `
        <section class="detail-section">
          <h3>Where and when</h3>
          <div class="event-tags">
            <span class="tag">${escapeHtml(event.affected_area?.label || "Mapped geometry")}</span>
            <span class="tag">${escapeHtml(formatEventDate(event))}</span>
            <span class="tag">${escapeHtml(event.date_precision || "unknown precision")}</span>
            ${point ? `<span class="tag">${point.lng.toFixed(4)}, ${point.lat.toFixed(4)}</span>` : `<span class="tag">No point geometry</span>`}
          </div>
        </section>
        <section class="detail-section">
          <h3>Related or similar events</h3>
          <ul class="related-list">${related.length ? related.map((item) => `<li><button class="toolbar-pill" type="button" data-related-id="${escapeAttr(item.event_id)}">${escapeHtml(item.title || item.event_id)}</button></li>`).join("") : `<li>No nearby related records loaded in this year.</li>`}</ul>
        </section>
      `;
    } else {
      els.detailBody.innerHTML = `
        <section class="detail-section">
          <h3>Observed change</h3>
          <p>${escapeHtml(event.explanation || event.title || "No summary supplied.")}</p>
        </section>
        <section class="detail-section">
          <h3>Affected signals</h3>
          <div class="signal-grid">${signalCards(event).join("") || `<div class="signal-card"><span class="signal-icon">i</span><div><strong>No signals supplied</strong><span>Review evidence directly.</span></div></div>`}</div>
        </section>
      `;
    }
    els.detailBody.querySelectorAll("[data-related-id]").forEach((button) => {
      button.addEventListener("click", () => selectEvent(button.dataset.relatedId));
    });
  }

  function renderEmptyDetail() {
    els.detailTitle.textContent = "Select a record";
    els.detailSubtitle.textContent = "Choose a timeline card or map marker";
    els.detailConfidence.textContent = "No event";
    els.confidenceText.textContent = "Select an event to see evidence strength.";
    renderConfidenceMeter(null);
    els.detailBody.className = "detail-body empty-state";
    els.detailBody.textContent = "Click an event to zoom the map and inspect observed changes, evidence, confidence, limitations, and source coverage.";
    els.mapStage.classList.remove("zoomed");
    els.mapCallout.hidden = true;
    if (els.trafficCompareCard) els.trafficCompareCard.hidden = true;
  }

  function renderEvidence(item) {
    const label = item.label || item.source_id || item.kind || "Evidence";
    const suffix = [item.kind, item.record_id].filter(Boolean).join(" - ");
    const href = item.url || "";
    const file = item.file_path || "";
    return `
      <li>
        ${href ? `<a href="${escapeAttr(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>` : `<strong>${escapeHtml(label)}</strong>`}
        <div class="event-meta">${escapeHtml(suffix || file || "Local source record")}</div>
      </li>
    `;
  }

  async function renderCompare() {
    if (!state.eventsIndex) return;
    const beforeYear = Number(state.compareBefore);
    const afterYear = Number(state.compareAfter);
    const [beforeEvents, afterEvents] = await Promise.all([
      getEventsForCompare(beforeYear),
      getEventsForCompare(afterYear),
    ]);
    const beforeFiltered = filterEvents(beforeEvents);
    const afterFiltered = filterEvents(afterEvents);
    els.beforeMiniLabel.textContent = String(beforeYear);
    els.afterMiniLabel.textContent = String(afterYear);
    renderDeltas(beforeFiltered, afterFiltered, beforeYear, afterYear);
  }

  async function getEventsForCompare(year) {
    if (state.eventsByYear.has(year)) return state.eventsByYear.get(year);
    const chunk = (state.eventsIndex?.chunks || []).find((item) => Number(item.year) === Number(year));
    if (!chunk || !chunk.event_count) {
      state.eventsByYear.set(year, []);
      return [];
    }
    const data = await fetchJson(dataPathToUrl(chunk.json_path));
    state.eventsByYear.set(year, data.events || []);
    return data.events || [];
  }

  function renderMiniMap(container, events, labelId) {
    const label = container.querySelector(`#${labelId}`);
    container.innerHTML = "";
    container.appendChild(label);
    events
      .map((event) => ({ event, point: eventPoint(event) }))
      .filter((item) => item.point)
      .slice(0, MAX_MINI_MARKERS)
      .forEach(({ event, point }) => {
        const dot = document.createElement("i");
        const pos = project(point);
        dot.className = "mini-dot";
        dot.style.left = `${pos.x}%`;
        dot.style.top = `${pos.y}%`;
        dot.style.setProperty("--marker-color", lensForEvent(event).color || "#0f766e");
        dot.title = event.title || event.event_id;
        container.appendChild(dot);
      });
  }

  function renderDeltas(beforeEvents, afterEvents, beforeYear, afterYear) {
    const beforeSummary = summarizeEvents(beforeEvents);
    const afterSummary = summarizeEvents(afterEvents);
    const rows = [
      ["All records", beforeSummary.total, afterSummary.total, "Records loaded for selected lens"],
      ["Documented", beforeSummary.documented, afterSummary.documented, "Higher-trust public or official evidence"],
      ["Inferred/mapped", beforeSummary.inferred, afterSummary.inferred, "Often OSM mapped visibility dates"],
      ["Mappable", beforeSummary.mappable, afterSummary.mappable, "Records with geometry"],
      ["Development", beforeSummary.categories.built_environment || 0, afterSummary.categories.built_environment || 0, "Planning or built form records"],
      ["Traffic", beforeSummary.categories.transport || 0, afterSummary.categories.transport || 0, "Mobility and route records"],
      ["Energy/infra", beforeSummary.categories.utilities || 0, afterSummary.categories.utilities || 0, "Utilities and grid records"],
      ["Services/equity", beforeSummary.categories.civic_services || 0, afterSummary.categories.civic_services || 0, "Civic-service records"],
    ];
    els.deltaGrid.innerHTML = rows.map(([label, before, after, note]) => {
      const delta = after - before;
      const sign = delta > 0 ? "+" : "";
      return `
        <div class="delta-card">
          <span>${escapeHtml(label)}</span>
          <strong>${sign}${formatNumber(delta)}</strong>
          <small>${formatNumber(before)} in ${beforeYear}; ${formatNumber(after)} in ${afterYear}. ${escapeHtml(note)}.</small>
        </div>
      `;
    }).join("");
  }

  function summarizeEvents(events) {
    return events.reduce((acc, event) => {
      acc.total += 1;
      acc.categories[event.category] = (acc.categories[event.category] || 0) + 1;
      if (event.confidence === "documented" || event.confidence === "corroborated") acc.documented += 1;
      if (event.confidence === "inferred") acc.inferred += 1;
      if (eventPoint(event)) acc.mappable += 1;
      return acc;
    }, { total: 0, documented: 0, inferred: 0, mappable: 0, categories: {} });
  }

  function compareAroundSelectedEvent(silent) {
    if (!state.selectedEvent) {
      if (!silent) toast("Select an event first, then compare the year before and after it.");
      return;
    }
    const year = Number(state.selectedEvent.year);
    state.compareBefore = clamp(year - 1, state.startYear, state.endYear);
    state.compareAfter = clamp(year, state.startYear, state.endYear);
    els.compareBefore.value = String(state.compareBefore);
    els.compareAfter.value = String(state.compareAfter);
    renderCompare();
  }

  function openSources() {
    renderSources();
    els.sourceDrawer.hidden = false;
    els.closeSourcesButton.focus();
  }

  function closeImpact() {
    els.impactPanel.hidden = true;
    els.impactButton.focus();
  }

  function clearSelection() {
    state.selectedEventId = null;
    state.selectedEvent = null;
    renderEvents();
    renderEmptyDetail();
  }

  function setMapMode(mode) {
    state.mapMode = mode;
    els.mapStage.classList.toggle("mode-2d", mode === "2d");
    els.mapStage.classList.toggle("mode-3d", mode === "3d");
    els.mapMode2d.classList.toggle("active", mode === "2d");
    els.mapMode3d.classList.toggle("active", mode === "3d");
    els.mapMode2d.setAttribute("aria-pressed", String(mode === "2d"));
    els.mapMode3d.setAttribute("aria-pressed", String(mode === "3d"));
  }

  function setMapLayer(layer) {
    state.mapLayer = layer || "observed";
    ["observed", "evidence", "compare"].forEach((name) => {
      els.mapStage.classList.toggle(`layer-${name}`, state.mapLayer === name);
    });
    if (els.mapLayerGroup) {
      els.mapLayerGroup.querySelectorAll("[data-map-layer]").forEach((button) => {
        const active = button.dataset.mapLayer === state.mapLayer;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }
    if (state.selectedEvent) renderTrafficCompare(state.selectedEvent);
  }

  function setMapZoomed(zoomed) {
    els.mapStage.classList.toggle("zoomed", zoomed);
  }

  function focusMapOnEvent(event) {
    const point = eventPoint(event);
    if (!point) return;
    const pos = project(point);
    els.mapStage.style.setProperty("--focus-x", `${pos.x}%`);
    els.mapStage.style.setProperty("--focus-y", `${pos.y}%`);
    els.mapStage.style.setProperty("--callout-x", `${clamp(pos.x, 18, 82)}%`);
    els.mapStage.style.setProperty("--callout-y", `${clamp(pos.y, 18, 70)}%`);
    els.calloutYear.textContent = `Observed ${event.year || state.year}`;
    els.calloutTitle.textContent = event.title || "Selected event";
    els.calloutMeta.textContent = event.affected_area?.label || categoryLabel(event.category);
    els.mapCallout.hidden = false;
    setMapLayer("observed");
    setMapZoomed(true);
  }

  function renderDetailTabs() {
    els.detailTabGroup.querySelectorAll("[data-detail-tab]").forEach((button) => {
      const active = button.dataset.detailTab === state.detailTab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function renderTrafficCompare(event) {
    if (!els.trafficCompareCard) return;
    const traffic = event?.traffic_metrics;
    const shouldShow = Boolean(traffic) && (state.lens === "transport" || state.mapLayer === "compare" || event?.category === "transport");
    els.trafficCompareCard.hidden = !shouldShow;
    if (!shouldShow) return;
    els.trafficCompareTitle.textContent = event.title || "Traffic event";
    els.trafficBeforeYear.textContent = `${traffic.beforeYear} before`;
    els.trafficAfterYear.textContent = `${traffic.afterYear} after`;
    els.trafficBeforeValue.textContent = traffic.beforeValue;
    els.trafficAfterValue.textContent = traffic.afterValue;
    els.trafficBeforeLabel.textContent = traffic.beforeLabel;
    els.trafficAfterLabel.textContent = traffic.afterLabel;
    els.trafficCompareNote.textContent = traffic.note;
  }

  function closeSources() {
    els.sourceDrawer.hidden = true;
    els.sourcesButton.focus();
  }

  function renderSources() {
    const availability = state.availability?.matrix || [];
    const sourceById = new Map((state.sources?.sources || []).map((source) => [source.source_id, source]));
    els.sourceDrawerBody.innerHTML = `
      <div class="source-card">
        <h3>${escapeHtml(state.city?.display_name || "Selected city")}</h3>
        <p>${escapeHtml(state.availability?.summary?.summary || "No availability summary supplied.")}</p>
        <div class="event-tags">
          <span class="tag">Build ${escapeHtml(formatDateTime(state.sources?.generated_at || state.index?.generated_at))}</span>
          <span class="tag">${formatNumber(state.eventsIndex?.event_count || 0)} event records</span>
          <span class="tag">${formatNumber(state.sources?.source_count || 0)} sources</span>
        </div>
      </div>
      ${availability.map((row) => renderAvailabilityRow(row, sourceById)).join("")}
      <h3>Source registry</h3>
      <div class="source-list">${(state.sources?.sources || []).map(renderSourceCard).join("")}</div>
    `;
  }

  function renderAvailabilityRow(row, sourceById) {
    const linkedSources = (row.source_ids || []).map((id) => sourceById.get(id)?.title || id).join(", ");
    return `
      <section class="source-card">
        <h3>${escapeHtml(row.label || row.family_id)}</h3>
        <div class="event-tags">
          <span class="tag">${escapeHtml(row.availability || "unknown")}</span>
          <span class="tag">${formatNumber(row.event_count || 0)} events</span>
          <span class="tag">${escapeHtml(yearRange(row.years))}</span>
        </div>
        <p>${escapeHtml(row.notes || "No notes supplied.")}</p>
        <p><strong>Sources:</strong> ${escapeHtml(linkedSources || "Not linked")}</p>
      </section>
    `;
  }

  function renderSourceCard(source) {
    const coverage = source.coverage_years ? `${source.coverage_years.start || "?"}-${source.coverage_years.end || "?"}` : "Coverage unknown";
    return `
      <article class="source-card">
        <h3>${escapeHtml(source.title || source.source_id)}</h3>
        <div class="event-tags">
          <span class="tag">${escapeHtml(source.provider || "Unknown provider")}</span>
          <span class="tag">${escapeHtml(coverage)}</span>
          <span class="tag ${escapeAttr(source.source_confidence || "")}">${escapeHtml(source.source_confidence || "unknown confidence")}</span>
        </div>
        <p><strong>Licence:</strong> ${escapeHtml(source.licence || "Licence not supplied")}</p>
        <p><strong>Attribution:</strong> ${escapeHtml(source.attribution_text || "Attribution not supplied")}</p>
        <p>${escapeHtml(source.provenance_notes || source.caveats?.[0] || "No provenance note supplied.")}</p>
        ${source.url ? `<a href="${escapeAttr(source.url)}" target="_blank" rel="noreferrer">Open source page</a>` : ""}
      </article>
    `;
  }

  async function runImpactSketch(event) {
    event.preventDefault();
    const [lngText, latText, label] = els.proposalLocation.value.split(",");
    const payload = {
      category: els.proposalCategory.value,
      title: els.proposalTitle.value.trim(),
      description: els.proposalDescription.value.trim(),
      scale: els.proposalScale.value,
      location: {
        lng: Number(lngText),
        lat: Number(latText),
        label,
      },
    };
    els.impactResults.innerHTML = `<div class="empty-state">Sketching affected signals from source-backed analogues.</div>`;
    try {
      const response = await fetch("/api/proposal-impact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ proposal: payload }),
      });
      const result = await response.json();
      if (!response.ok || result.ok === false) throw new Error(result.error || "Impact sketch failed");
      renderImpactResult(result);
    } catch (error) {
      els.impactResults.innerHTML = `<div class="empty-state">The impact sketch API is unavailable. Run with <code>npm start</code> to use proposal screening. ${escapeHtml(error.message)}</div>`;
    }
  }

  function renderImpactResult(result) {
    const signals = result.affected_signals || [];
    const similar = result.similar_events || [];
    const caveats = result.caveats || [];
    els.impactResults.innerHTML = `
      <div class="impact-summary">
        <strong>${escapeHtml(result.proposal?.title || "Proposal sketch")}</strong>
        <p>${escapeHtml(result.summary || "No summary returned.")}</p>
        <div class="event-tags">
          <span class="tag ${escapeAttr(result.confidence?.label || "")}">Confidence: ${escapeHtml(result.confidence?.label || "unknown")}</span>
          <span class="tag">${escapeHtml(result.mode || "proposal sketch")}</span>
        </div>
      </div>
      <section class="detail-section">
        <h3>Affected signals</h3>
        <ul class="impact-signal-list">
          ${signals.map((signal) => `
            <li class="impact-signal">
              <strong>${escapeHtml(signal.label || signal.signal)}</strong>
              <div class="event-tags">
                <span class="tag">${escapeHtml(signal.direction || "unknown")}</span>
                <span class="tag">Strength: ${escapeHtml(signal.strength || "unknown")}</span>
                <span class="tag ${escapeAttr(signal.confidence || "")}">Confidence: ${escapeHtml(signal.confidence || "unknown")}</span>
              </div>
              <p>${escapeHtml(signal.reason || "")}</p>
            </li>
          `).join("")}
        </ul>
      </section>
      <section class="detail-section">
        <h3>Similar events</h3>
        <ul class="impact-event-list">
          ${similar.slice(0, 6).map((item) => `
            <li class="impact-event">
              <strong>${escapeHtml(item.title || item.event_id)}</strong>
              <div class="event-meta">${escapeHtml([item.year, item.confidence, item.distance_m ? `${Math.round(item.distance_m)}m` : ""].filter(Boolean).join(" - "))}</div>
            </li>
          `).join("") || `<li class="impact-event">No similar events returned.</li>`}
        </ul>
      </section>
      <section class="detail-section">
        <h3>Caveats</h3>
        <ul class="caveat-list">${caveats.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
    `;
  }

  function getCurrentEvents() {
    return state.eventsByYear.get(state.year) || [];
  }

  function selectableCities() {
    return (state.index?.cities || []).filter((city) => city.city_id === "london" || city.city_id === "nyc");
  }

  function demoEventsForYear(cityId, year) {
    return (CITY_DEMO_EVENTS[cityId] || []).filter((event) => Number(event.year) === Number(year));
  }

  function cityEventCount(cityId, cityMeta) {
    const demoCount = (CITY_DEMO_EVENTS[cityId] || []).length;
    const indexed = cityMeta?.event_count || state.eventsIndex?.event_count || 0;
    return Math.max(indexed, demoCount);
  }

  function renderCityLabels() {
    const labels = (CITY_VIEW_CONFIG[state.cityId]?.labels || ["CITY", "CHANGE", "ATLAS"]);
    const nodes = [document.querySelector(".label-north"), document.querySelector(".label-core"), document.querySelector(".label-east")];
    nodes.forEach((node, index) => {
      if (node) node.textContent = labels[index] || "";
    });
  }

  function renderImageryTiles() {
    if (!els.mapTileLayer) return;
    const view = CITY_VIEW_CONFIG[state.cityId] || {};
    const [lng, lat] = view.center || state.city?.default_center || [0, 0];
    const z = view.zoom || 13;
    const center = lonLatToTile(lng, lat, z);
    const tiles = [];
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const x = center.x + dx;
        const y = center.y + dy;
        tiles.push(`<img alt="" src="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}" style="left:${(dx + 2) * 20}%;top:${(dy + 2) * 20}%">`);
      }
    }
    els.mapTileLayer.innerHTML = tiles.join("");
    if (els.mapAttribution) els.mapAttribution.textContent = "Esri World Imagery reference layer; event, evidence and traffic context from public sources";
  }

  function lonLatToTile(lng, lat, zoom) {
    const scale = 2 ** zoom;
    const x = Math.floor(((lng + 180) / 360) * scale);
    const rad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * scale);
    return { x, y };
  }

  function filterEvents(events) {
    const lens = LENSES.find((item) => item.id === state.lens) || LENSES[0];
    return events.filter((event) => {
      const matchesLens = lens.id === "all" || matchesLensDefinition(event, lens);
      if (!matchesLens) return false;
      if (!state.search) return true;
      return eventSearchText(event).includes(state.search);
    });
  }

  function matchesLensDefinition(event, lens) {
    const category = event.category || "";
    const eventLens = event.lens || "";
    const text = eventSearchText(event);
    const categoryMatch = (lens.categories || []).includes(category);
    const lensMatch = (lens.lenses || []).includes(eventLens);
    const keywordMatch = (lens.keywords || []).some((keyword) => text.includes(keyword));
    if (lens.id === "housing" || lens.id === "environment") return keywordMatch || lensMatch;
    return categoryMatch || lensMatch || keywordMatch;
  }

  function eventSearchText(event) {
    return [
      event.title,
      event.category,
      event.lens,
      event.affected_area?.label,
      event.explanation,
      ...(event.source_ids || []),
      ...(event.affected_signals || []),
      ...(event.caveats || []),
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function sortEvents(a, b) {
    const confDiff = (CONFIDENCE_WEIGHT[b.confidence] || 0) - (CONFIDENCE_WEIGHT[a.confidence] || 0);
    if (confDiff) return confDiff;
    return String(a.effective_date || a.year).localeCompare(String(b.effective_date || b.year));
  }

  function relatedEvents(event) {
    const point = eventPoint(event);
    return getCurrentEvents()
      .filter((item) => item.event_id !== event.event_id && item.category === event.category)
      .map((item) => ({ ...item, _distance: point ? pointDistance(point, eventPoint(item)) : 0 }))
      .sort((a, b) => a._distance - b._distance);
  }

  function eventPoint(event) {
    return geometryCenter(event.geometry);
  }

  function geometryCenter(geometry) {
    if (!geometry || typeof geometry !== "object") return null;
    if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) {
      const [lng, lat] = geometry.coordinates;
      return Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null;
    }
    const coords = collectCoordinatePairs(geometry.coordinates);
    if (!coords.length) return null;
    const sum = coords.reduce((acc, point) => ({ lng: acc.lng + point[0], lat: acc.lat + point[1] }), { lng: 0, lat: 0 });
    return { lng: sum.lng / coords.length, lat: sum.lat / coords.length };
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
    const bounds = CITY_VIEW_CONFIG[state.cityId]?.bounds || state.city?.bounds || [-6.12, 54.45, -5.74, 54.75];
    const [minLng, minLat, maxLng, maxLat] = bounds;
    const x = ((point.lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - ((point.lat - minLat) / (maxLat - minLat))) * 100;
    return {
      x: clamp(x, 2, 98),
      y: clamp(y, 2, 98),
    };
  }

  function pointDistance(a, b) {
    if (!a || !b) return Number.POSITIVE_INFINITY;
    return Math.hypot(a.lng - b.lng, a.lat - b.lat);
  }

  function lensForEvent(event) {
    return LENSES.find((lens) => lens.id !== "all" && matchesLensDefinition(event, lens)) || LENSES[0];
  }

  function signalTags(event) {
    return (event.affected_signals || []).map((signal) => `<span class="tag">${escapeHtml(SIGNAL_LABELS[signal] || signal)}</span>`);
  }

  function signalCards(event) {
    const signals = event.affected_signals && event.affected_signals.length ? event.affected_signals : [event.lens || event.category].filter(Boolean);
    return signals.slice(0, 6).map((signal) => {
      const color = signalColor(signal);
      return `
        <div class="signal-card" style="--signal-color:${color}">
          <span class="signal-icon">${escapeHtml(signalIcon(signal))}</span>
          <div>
            <strong>${escapeHtml(SIGNAL_LABELS[signal] || categoryLabel(signal))}</strong>
            <span>${escapeHtml(signalNote(signal))}</span>
          </div>
        </div>
      `;
    });
  }

  function signalColor(signal) {
    if (/housing|built|building|development/i.test(signal)) return "#ff8a1f";
    if (/transport|mobility|traffic/i.test(signal)) return "#2f7bff";
    if (/service|civic|public/i.test(signal)) return "#14a35a";
    if (/job|economy/i.test(signal)) return "#c47a13";
    if (/green|environment|air/i.test(signal)) return "#31a24c";
    if (/util|electric|energy/i.test(signal)) return "#14a4c7";
    return "#8b5cf6";
  }

  function signalIcon(signal) {
    if (/housing|built|building|development/i.test(signal)) return "h";
    if (/transport|mobility|traffic/i.test(signal)) return "t";
    if (/service|civic|public/i.test(signal)) return "p";
    if (/job|economy/i.test(signal)) return "e";
    if (/green|environment|air/i.test(signal)) return "g";
    if (/util|electric|energy/i.test(signal)) return "u";
    return "i";
  }

  function signalNote(signal) {
    if (/housing|built|building|development/i.test(signal)) return "Land use or development context changed.";
    if (/transport|mobility|traffic/i.test(signal)) return "Access or movement context changed.";
    if (/service|civic|public/i.test(signal)) return "Public service context changed.";
    if (/job|economy/i.test(signal)) return "Local activity or jobs context flagged.";
    if (/green|environment|air/i.test(signal)) return "Environmental context flagged.";
    if (/util|electric|energy/i.test(signal)) return "Infrastructure or utility context changed.";
    return "Review evidence before interpreting.";
  }

  function confidenceText(event) {
    const confidence = event.confidence || "unknown";
    if (confidence === "corroborated") return "Multiple independent evidence records support this change.";
    if (confidence === "documented") return "Documentary or public source evidence supports this change.";
    if (confidence === "inferred") return "Inferred from mapped or derived records; dates may not equal real-world completion.";
    if (confidence === "disputed") return "Evidence is disputed or incomplete.";
    return "Confidence criteria unavailable for this record.";
  }

  function confidenceLabel(confidence) {
    if (confidence === "corroborated") return "corroborated evidence";
    if (confidence === "documented") return "documented evidence";
    if (confidence === "inferred") return "inferred record";
    if (confidence === "disputed") return "disputed evidence";
    return "confidence unknown";
  }

  function renderConfidenceMeter(confidence) {
    const levels = { disputed: 1, inferred: 2, documented: 4, corroborated: 5 };
    const active = levels[confidence] || 0;
    document.querySelectorAll(".confidence-meter span").forEach((item, index) => {
      item.classList.toggle("active", index < active);
    });
  }

  function displayPlaceName(name) {
    if (/london/i.test(name || "")) return "Stratford / Olympic Park / Lower Lea Valley";
    if (/new york|nyc/i.test(name || "")) return "New York City / Borough Atlas";
    return name || "Open Citylog";
  }

  function categoryLabel(category) {
    return CATEGORY_LABELS[category] || (category || "Uncategorised").replace(/_/g, " ");
  }

  function formatEventDate(event) {
    if (event.effective_date_range) {
      return `${event.effective_date_range.start || "?"} to ${event.effective_date_range.end || "?"}`;
    }
    return event.effective_date || String(event.year || "Unknown date");
  }

  function getAvailableYears() {
    const years = [
      ...(state.eventsIndex?.event_years || []),
      ...(CITY_DEMO_EVENTS[state.cityId] || []).map((event) => event.year),
    ];
    return Array.from(new Set(years.map(Number).filter(Number.isFinite))).sort((a, b) => a - b);
  }

  function yearRange(years = []) {
    if (!years.length) return "Years unknown";
    return `${Math.min(...years)}-${Math.max(...years)}`;
  }

  function dataPathToUrl(filePath) {
    if (!filePath) return "";
    return "/" + String(filePath).replace(/\\/g, "/").replace(/^web\//, "").replace(/^\//, "");
  }

  function demoEvent(cityId, eventId, year, title, category, lens, coordinates, areaLabel, sourceIds, sourceUrl, explanation, caveats, traffic_metrics) {
    return {
      schema_version: "1.0.0",
      city_id: cityId,
      event_id: eventId,
      title,
      year,
      effective_date: String(year),
      date_precision: "year",
      category,
      lens,
      geometry: { type: "Point", coordinates },
      affected_area: { label: areaLabel },
      source_ids: sourceIds,
      evidence: sourceIds.map((sourceId) => ({
        source_id: sourceId,
        label: `${title} source record`,
        kind: "source_url",
        url: sourceUrl,
        record_id: eventId,
      })),
      confidence: "documented",
      affected_signals: lens === "traffic" ? ["traffic", "mobility"] : [lens],
      explanation,
      caveats,
      traffic_metrics,
      provenance: {
        method: "Curated public-source demo event for London/NY city atlas pilot.",
        accessed_at: "2026-04-28",
      },
    };
  }

  function trafficMetrics(beforeYear, afterYear, beforeLabel, afterLabel, note) {
    return {
      beforeYear,
      afterYear,
      beforeLabel,
      afterLabel,
      beforeValue: "Source context",
      afterValue: "Observed event",
      note,
    };
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
    return response.json();
  }

  function shareView() {
    const url = new URL(window.location.href);
    url.searchParams.set("city", state.cityId);
    url.searchParams.set("year", String(state.year));
    url.searchParams.set("lens", state.lens);
    navigator.clipboard?.writeText(url.toString())
      .then(() => toast("Atlas view link copied."))
      .catch(() => toast(url.toString()));
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("city", state.cityId);
    url.searchParams.set("year", String(state.year));
    url.searchParams.set("lens", state.lens);
    window.history.replaceState({}, "", url);
  }

  function getUrlParam(name) {
    return new URL(window.location.href).searchParams.get(name);
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 3600);
  }

  function renderFatal(message) {
    els.eventList.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
    els.detailBody.className = "detail-body empty-state";
    els.detailBody.textContent = message;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-GB").format(Number(value) || 0);
  }

  function formatDateTime(value) {
    if (!value) return "unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "short", day: "numeric" }).format(date);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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
      setYear,
      setLens: (lens) => {
        state.lens = lens;
        renderLensButtons();
        renderEvents();
        return renderCompare();
      },
      selectFirstEvent: () => {
        const event = filterEvents(getCurrentEvents()).sort(sortEvents)[0];
        if (event) selectEvent(event.event_id);
        return event || null;
      },
      openSources,
      runImpactSketch: () => els.impactForm.requestSubmit(),
      setMapLayer,
      filteredEvents: () => filterEvents(getCurrentEvents()),
    };
  }
})();
