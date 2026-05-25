(function () {
  "use strict";

  const DEFAULT_CITY = "belfast";
  const DEFAULT_YEAR = 2024;
  const MAPLIBRE_JS = "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js";
  const ATLAS_JS = "/atlas.js?v=paper-atlas-31";
  const LAYERS = [
    { id: "transport", color: "#1B7A85" },
    { id: "built_environment", color: "#C8472E" },
    { id: "civic_services", color: "#D89A1D" },
    { id: "economy", color: "#7B3A8F" },
    { id: "environment", color: "#3E8D4E" },
    { id: "utilities", color: "#4B6FA9" },
  ];
  const LAYER_BY_ID = new Map(LAYERS.map((layer) => [layer.id, layer]));
  const jsonCache = Object.create(null);

  const $ = (id) => document.getElementById(id);
  const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const esc = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[ch]));
  const truncate = (value, length) => {
    const text = clean(value);
    return text.length > length ? `${text.slice(0, length - 3).trimEnd()}...` : text;
  };
  const dataUrl = (value) => {
    const text = String(value || "");
    if (!text) return "";
    if (/^https?:\/\//i.test(text) || text.startsWith("/")) return text;
    return text.startsWith("web/") ? `/${text.slice(4)}` : `/${text}`;
  };

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value == null ? "" : String(value);
  }

  async function fetchJson(url) {
    const key = jsonCacheKey(url);
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    const payload = await res.json();
    jsonCache[key] = payload;
    return payload;
  }

  function jsonCacheKey(url) {
    try {
      const parsed = new URL(url, location.href);
      return `${parsed.pathname}${parsed.search}`;
    } catch (_error) {
      return String(url || "");
    }
  }

  function script(src) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((item) => item.src === new URL(src, location.href).href);
      if (existing?.dataset.loaded === "true") {
        resolve();
        return;
      }
      const el = existing || document.createElement("script");
      el.src = src;
      el.async = false;
      el.onload = () => {
        el.dataset.loaded = "true";
        resolve();
      };
      el.onerror = () => reject(new Error(`Could not load ${src}`));
      if (!existing) document.body.appendChild(el);
    });
  }

  function selectedCity(index, params) {
    const requested = params.get("city") || DEFAULT_CITY;
    const cities = Array.isArray(index?.cities) ? index.cities : [];
    return cities.find((city) => city.id === requested) || cities.find((city) => city.id === DEFAULT_CITY) || cities[0] || null;
  }

  function yearFor(eventsIndex, params) {
    const years = (eventsIndex.event_years || []).map(Number).filter(Number.isFinite);
    const requested = Number(params.get("year"));
    if (years.includes(requested)) return requested;
    if (years.includes(DEFAULT_YEAR)) return DEFAULT_YEAR;
    return years[years.length - 1] || DEFAULT_YEAR;
  }

  function previewUrl(chunk) {
    const configured = chunk?.preview_json_path || chunk?.preview_path;
    if (configured) return dataUrl(configured);
    return chunk?.json_path ? dataUrl(String(chunk.json_path).replace(/\.json$/i, ".summary.preview.json")) : "";
  }

  function expand(row, fields) {
    if (!Array.isArray(row) || !Array.isArray(fields)) return row || {};
    const record = {};
    fields.forEach((field, index) => {
      if (row[index] !== undefined && row[index] !== null && row[index] !== "") record[field] = row[index];
    });
    return record;
  }

  function normalize(raw, year, index) {
    const props = raw.properties || raw || {};
    const lng = Number(props.lng ?? props.longitude);
    const lat = Number(props.lat ?? props.latitude);
    return {
      id: String(props.event_id || props.id || `${year}-${index}`),
      title: clean(props.title) || "Untitled change",
      year: Number(props.year || year),
      category: props.category || "built_environment",
      confidence: props.confidence || "documented",
      summary: clean(props.short_description || props.summary || ""),
      area: clean(props.affected_area_label || props.affected_area?.label || ""),
      lngLat: Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null,
    };
  }

  function renderLabels(city, year, eventsIndex, previewCount) {
    const name = clean(city.display_name || city.name || city.id || "Belfast");
    setText("cityNameLabel", name);
    setText("welcomeCity", name);
    setText("emptyCityName", name);
    setText("tlCity", name);
    setText("tlYear", year);
    const chunk = (eventsIndex.chunks || []).find((item) => Number(item.year) === Number(year));
    setText("tlVisible", previewCount ? previewCount.toLocaleString() : "0");
    setText("tlTotal", Number(chunk?.event_count || previewCount || 0).toLocaleString());
  }

  function renderList(events, cityName, year) {
    const list = $("eventList");
    if (!list) return;
    list.innerHTML = events.slice(0, 24).map((event) => {
      const layer = LAYER_BY_ID.get(event.category) || LAYERS[1];
      return `
        <article class="event-row" role="listitem" data-event-id="${esc(event.id)}" tabindex="0" style="--accent:${esc(layer.color)}">
          <div class="event-row-main">
            <h4>${esc(event.title)}</h4>
            <p>${esc(event.summary || event.area || "Source-backed city change record.")}</p>
          </div>
          <div class="event-row-meta">
            <span>${esc(event.year)}</span>
            <span>${esc(event.confidence)}</span>
          </div>
        </article>`;
    }).join("");
    setText("eventListCount", `${events.length.toLocaleString()} previewed`);
    setText("eventListMeta", `${cityName} records in ${year}. Full event set is loading.`);
  }

  function project(lngLat, center, zoom, viewport) {
    const scale = 256 * (2 ** zoom);
    const mercator = ([lng, lat]) => {
      const sin = Math.sin((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180);
      return {
        x: ((lng + 180) / 360) * scale,
        y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
      };
    };
    const point = mercator(lngLat);
    const origin = mercator(center);
    return {
      x: viewport.width / 2 + point.x - origin.x,
      y: viewport.height / 2 + point.y - origin.y,
    };
  }

  function renderPins(events, city) {
    const map = $("map");
    if (!map) return;
    document.getElementById("staticPinLayer")?.remove();
    const viewport = map.getBoundingClientRect();
    if (!viewport.width || !viewport.height) return;
    const center = Array.isArray(city.default_center) ? city.default_center : [-5.9301, 54.5973];
    const zoom = Number(city.default_zoom || 11.5);
    const selected = events.find((event) => /grand central/i.test(event.title)) || events.find((event) => event.lngLat);
    const candidates = [selected, ...events.filter((event) => event.lngLat && event.id !== selected?.id)].filter(Boolean).slice(0, 18);
    const layer = document.createElement("div");
    layer.id = "staticPinLayer";
    layer.className = "static-pin-layer";
    for (const event of candidates) {
      const point = project(event.lngLat, center, zoom, viewport);
      const x = Math.max(28, Math.min(viewport.width - 28, point.x));
      const y = Math.max(96, Math.min(viewport.height - 44, point.y));
      const color = (LAYER_BY_ID.get(event.category) || LAYERS[1]).color;
      const wrap = document.createElement("div");
      wrap.className = "pin-wrap";
      wrap.style.left = `${Math.round(x - 11)}px`;
      wrap.style.top = `${Math.round(y - 11)}px`;
      wrap.style.zIndex = event.id === selected?.id ? "30" : "12";
      wrap.innerHTML = `
        <div class="pin" data-active="${event.id === selected?.id}" data-lens="${esc(event.category)}" style="--accent:${esc(color)}" role="button" tabindex="0" aria-pressed="${event.id === selected?.id}" aria-label="${esc(`${event.title}, ${event.year}`)}">
          <div class="pin-label">${esc(truncate(event.title, 60))} - ${event.year}</div>
        </div>`;
      layer.appendChild(wrap);
    }
    map.appendChild(layer);
  }

  async function tryDirectBoot(params) {
    const cityId = String(params.get("city") || DEFAULT_CITY);
    if (!/^[A-Za-z0-9_-]+$/.test(cityId)) return false;
    const requestedYear = Number(params.get("year") || DEFAULT_YEAR);
    const year = Number.isFinite(requestedYear) ? requestedYear : DEFAULT_YEAR;
    const [city, preview] = await Promise.all([
      fetchJson(`/data/city-atlas/cities/${cityId}/city.json`),
      fetchJson(`/data/city-atlas/cities/${cityId}/events_${year}.summary.preview.json`),
    ]);
    const fields = Array.isArray(preview.fields) ? preview.fields : null;
    const events = (Array.isArray(preview.events) ? preview.events : [])
      .map((row, index) => normalize(expand(row, fields), year, index));
    const eventsIndex = {
      event_years: [year],
      chunks: [{ year, event_count: Number(preview.event_count || events.length) }],
    };
    renderLabels(city, year, eventsIndex, events.length);
    renderList(events, clean(city.display_name || city.name || cityId), year);
    renderPins(events, city);
    setText("appStatus", "");
    window.BimsAtlasBoot = {
      ready: true,
      city: cityId,
      year,
      eventCount: events.length,
      readyAt: performance.now(),
      direct: true,
      jsonCache,
    };
    return true;
  }

  async function loadFullAtlas() {
    try {
      if (!window.maplibregl) await script(MAPLIBRE_JS);
      await script(ATLAS_JS);
    } catch (error) {
      console.error("[atlas-boot] full atlas failed", error);
      setText("appStatus", `Failed to load atlas: ${error.message}`);
    }
  }

  async function boot() {
    const params = new URL(location.href).searchParams;
    try {
      try {
        if (await tryDirectBoot(params)) return;
      } catch (error) {
        console.warn("[atlas-boot] direct preview failed; trying indexed preview", error);
      }
      const index = await fetchJson("/data/city-atlas/index.json");
      const cityMeta = selectedCity(index, params);
      if (!cityMeta) throw new Error("No city metadata available");
      const paths = cityMeta.artifact_paths || {};
      const [city, eventsIndex] = await Promise.all([
        fetchJson(dataUrl(paths.city)),
        fetchJson(dataUrl(paths.events)),
      ]);
      const year = yearFor(eventsIndex, params);
      const chunk = (eventsIndex.chunks || []).find((item) => Number(item.year) === Number(year));
      const preview = await fetchJson(previewUrl(chunk));
      const fields = Array.isArray(preview.fields) ? preview.fields : null;
      const events = (Array.isArray(preview.events) ? preview.events : [])
        .map((row, index) => normalize(expand(row, fields), year, index));
      renderLabels(city, year, eventsIndex, events.length);
      renderList(events, clean(city.display_name || city.name || city.id), year);
      renderPins(events, city);
      setText("appStatus", "");
      window.BimsAtlasBoot = {
        ready: true,
        city: cityMeta.id,
        year,
        eventCount: events.length,
        readyAt: performance.now(),
        jsonCache,
      };
    } catch (error) {
      console.warn("[atlas-boot] preview failed; loading full atlas", error);
      window.BimsAtlasBoot = { ready: false, error: error.message, readyAt: performance.now(), jsonCache };
    } finally {
      setTimeout(loadFullAtlas, window.BimsAtlasBoot?.ready ? 180 : 0);
    }
  }

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
