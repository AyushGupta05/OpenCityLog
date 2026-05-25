const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OBSERVED_YEAR = 2026;
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const CITY_CONFIG = {
  london: {
    label: "London",
    bbox: [51.47, -0.18, 51.55, -0.05],
    output: path.join(ROOT, "data", "derived", "2026", "london_utility_context_osm_2026.geojson"),
  },
  nyc: {
    label: "New York City",
    bbox: [40.7, -74.02, 40.78, -73.95],
    output: path.join(ROOT, "data", "derived", "2026", "nyc_utility_context_osm_2026.geojson"),
  },
};

function overpassQuery(bbox) {
  const box = bbox.join(",");
  return `[out:json][timeout:90];
(
  nwr["power"~"line|minor_line|cable|substation|transformer|plant|generator|tower|pole"](${box});
  nwr["utility"~"power|water|gas|sewer|telecom|telecommunications"](${box});
  nwr["pipeline"~"water|gas|sewer|drain"](${box});
  nwr["substance"~"water|gas|sewage|wastewater"](${box});
  nwr["waterway"~"drain|ditch"](${box});
  nwr["man_made"~"water_works|wastewater_plant|storage_tank|storm_drain|sewerage|communications_tower"](${box});
  nwr["telecom"](${box});
  nwr["communication"](${box});
  nwr["tower:type"="communication"](${box});
);
out body geom;`;
}

function classifyUtility(tags = {}) {
  const text = Object.entries(tags)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ")
    .toLowerCase();
  if (/power=(line|minor_line|cable|substation|transformer|plant|generator|tower|pole)|utility=power/.test(text)) {
    return { utilityType: "electricity", role: tags.power || tags.utility || "power" };
  }
  if (/pipeline=water|substance=water|utility=water|water_works|storage_tank/.test(text)) {
    return { utilityType: "water", role: tags.pipeline || tags.substance || tags.man_made || tags.utility || "water" };
  }
  if (/substance=gas|pipeline=gas|utility=gas|\bgas=/.test(text)) {
    return { utilityType: "gas", role: tags.pipeline || tags.substance || tags.utility || "gas" };
  }
  if (/waterway=(drain|ditch)|pipeline=(sewer|drain)|substance=(sewage|wastewater)|wastewater|storm_drain|sewerage/.test(text)) {
    return { utilityType: "drainage", role: tags.waterway || tags.pipeline || tags.man_made || tags.substance || "drainage" };
  }
  if (/telecom|communication|communications_tower|telecommunications/.test(text)) {
    return { utilityType: "telecoms", role: tags.telecom || tags.communication || tags["tower:type"] || tags.man_made || "telecoms" };
  }
  return null;
}

function osmSourceId(element) {
  return `${element.type}/${element.id}`;
}

function osmUrl(element) {
  return `https://www.openstreetmap.org/${osmSourceId(element)}`;
}

function ringFromWayGeometry(geometry) {
  const coords = geometry.map((point) => [point.lon, point.lat]);
  if (!coords.length) return [];
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
  return coords;
}

function geometryFromElement(element, classification) {
  if (element.type === "node" && Number.isFinite(element.lon) && Number.isFinite(element.lat)) {
    return { type: "Point", coordinates: [element.lon, element.lat] };
  }
  if (Array.isArray(element.geometry) && element.geometry.length >= 2) {
    const coords = element.geometry.map((point) => [point.lon, point.lat]);
    const first = coords[0];
    const last = coords[coords.length - 1];
    const tags = element.tags || {};
    const isClosed = first && last && first[0] === last[0] && first[1] === last[1];
    const isArea = isClosed && (
      tags.area === "yes"
      || /plant|substation|exchange|central_office|water_works|wastewater_plant|storage_tank/.test(String(classification.role || ""))
      || ["Polygon", "MultiPolygon"].includes(String(tags.type || ""))
    );
    if (isArea) return { type: "Polygon", coordinates: [ringFromWayGeometry(element.geometry)] };
    return { type: "LineString", coordinates: coords };
  }
  if (element.bounds) {
    const lon = (Number(element.bounds.minlon) + Number(element.bounds.maxlon)) / 2;
    const lat = (Number(element.bounds.minlat) + Number(element.bounds.maxlat)) / 2;
    if (Number.isFinite(lon) && Number.isFinite(lat)) return { type: "Point", coordinates: [lon, lat] };
  }
  return null;
}

function normaliseElement(cityId, element, index) {
  const tags = element.tags || {};
  const classification = classifyUtility(tags);
  if (!classification) return null;
  const geometry = geometryFromElement(element, classification);
  if (!geometry) return null;
  const sourceId = osmSourceId(element);
  const geometryType = geometry.type || "";
  const name = tags.name || tags.operator || tags.ref || classification.role;
  return {
    type: "Feature",
    id: `utility-context-${cityId}-${OBSERVED_YEAR}-${index}`,
    properties: {
      id: `utility-context-${cityId}-${OBSERVED_YEAR}-${index}`,
      source_id: `osm:${sourceId}`,
      source_ids: [`osm:${sourceId}`, "openstreetmap-utility-context"],
      source_name: "OpenStreetMap utility context via Overpass API",
      publisher: "OpenStreetMap contributors",
      source_url: osmUrl(element),
      source_type: "open geospatial extract",
      license: "ODbL-1.0",
      city_id: cityId,
      observed_year: OBSERVED_YEAR,
      context_year: OBSERVED_YEAR,
      visible_year: OBSERVED_YEAR,
      category: "utilities",
      lens: "utilities",
      layer: "utility_network",
      network_geometry: geometryType === "Point" ? "asset" : "line",
      network_role: String(classification.role || "").toLowerCase(),
      utility_type: classification.utilityType,
      name: name || "",
      osm_type: element.type,
      osm_id: element.id,
      confidence: "inferred",
      source_kind: "current_context",
      evidence_role: "current_osm_context_not_capacity_or_reliability",
      geometry_precision: "current OSM mapped utility context geometry; not a surveyed network record or historical effective date",
      rank: geometryType === "Point" ? 2.1 : 2.65,
      intensity: geometryType === "Point" ? 0.5 : 0.66,
      visual_priority: geometryType === "Point" ? 0.62 : 0.8,
      caveats: [
        "Current OSM mapped context; not a confirmed installation/opening date.",
        "Not measured utility capacity, outage state, service availability, reliability, or engineering status.",
        "OSM edit timestamps are intentionally not used as construction/opening dates.",
      ],
    },
    geometry,
  };
}

async function fetchCity(cityId, config) {
  const url = `${OVERPASS_URL}?data=${encodeURIComponent(overpassQuery(config.bbox))}`;
  const response = await fetch(url, {
    headers: { "user-agent": "OpenCityLog-Bims-5 utility context builder" },
  });
  if (!response.ok) throw new Error(`Overpass request failed for ${cityId}: ${response.status} ${response.statusText}`);
  const payload = await response.json();
  const features = (payload.elements || [])
    .map((element, index) => normaliseElement(cityId, element, index))
    .filter(Boolean)
    .sort((a, b) => String(a.properties.source_id).localeCompare(String(b.properties.source_id)));
  fs.mkdirSync(path.dirname(config.output), { recursive: true });
  fs.writeFileSync(config.output, `${JSON.stringify({
    type: "FeatureCollection",
    name: `${cityId}_utility_context_osm_${OBSERVED_YEAR}`,
    metadata: {
      schema_version: "1.0.0",
      city_id: cityId,
      observed_year: OBSERVED_YEAR,
      generated_at: new Date().toISOString(),
      source: "OpenStreetMap via Overpass API",
      source_url: OVERPASS_URL,
      overpass_timestamp_osm_base: payload.osm3s?.timestamp_osm_base || null,
      bbox: config.bbox,
      method: `Fetched OSM power, water, telecom, gas, and drainage utility context tags for ${config.label}.`,
      license: "ODbL-1.0",
      attribution: "OpenStreetMap contributors",
      caveats: [
        "OSM mapped visibility is not a confirmed installation/opening date.",
        "The artifact does not contain measured utility capacity, outage state, service availability, reliability, or engineering status.",
        "OSM edit timestamps are not used as construction/opening dates.",
      ],
    },
    features,
  }, null, 2)}\n`);
  console.log(`[utility-context-osm] wrote ${features.length} ${cityId} features -> ${path.relative(ROOT, config.output)}`);
}

async function main() {
  const requested = process.argv.slice(2).filter((item) => !item.startsWith("--"));
  const cityIds = requested.length ? requested : Object.keys(CITY_CONFIG);
  for (const cityId of cityIds) {
    const config = CITY_CONFIG[cityId];
    if (!config) throw new Error(`Unknown city id: ${cityId}`);
    await fetchCity(cityId, config);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
