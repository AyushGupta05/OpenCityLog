const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "data", "derived", "2026");
const atlasIndexPath = path.join(rootDir, "web", "data", "city-atlas", "index.json");
const endpoint = process.env.OVERPASS_ENDPOINT || "https://overpass-api.de/api/interpreter";

const TRANSPORT_SELECTORS = [
  'nwr["highway"="bus_stop"]',
  'nwr["amenity"~"^(bus_station|ferry_terminal)$"]',
  'nwr["public_transport"~"^(platform|station|stop_position)$"]',
  'nwr["railway"~"^(station|halt|tram_stop|subway_entrance)$"]',
  'nwr["station"~"^(subway|train|light_rail|monorail)$"]',
  'nwr["bus"="yes"]',
  'nwr["ferry"="yes"]',
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function onlySet() {
  return new Set(
    String(process.env.ONLY || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function queryForBounds(bounds) {
  const [west, south, east, north] = bounds.map(Number);
  const bbox = `${south},${west},${north},${east}`;
  const body = TRANSPORT_SELECTORS.map((selector) => `${selector}(${bbox});`).join("\n");
  return `[out:json][timeout:240];(${body});out tags center meta qt;`;
}

async function postOverpass(query) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent": "OpenCityLog/0.1 transport-stop-context contact=local-codex",
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) throw new Error(`Overpass ${response.status}: ${await response.text()}`);
  return response.json();
}

function round(value, precision = 7) {
  const factor = 10 ** precision;
  return Math.round(Number(value) * factor) / factor;
}

function pointForElement(element) {
  const point = element.type === "node"
    ? { lon: element.lon, lat: element.lat }
    : element.center;
  const lon = Number(point?.lon);
  const lat = Number(point?.lat);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return [round(lon), round(lat)];
}

function osmSourceId(element) {
  return `${element.type}/${element.id}`;
}

function elementToFeature(element) {
  const point = pointForElement(element);
  if (!point) return null;
  const tags = element.tags || {};
  const sourceId = osmSourceId(element);
  const elementType = String(element.type || "");
  const geometrySource = elementType === "node"
    ? "Source OSM node coordinate."
    : `Overpass center point derived from OSM ${elementType}; original source object geometry was not stored in this snapshot.`;
  return {
    type: "Feature",
    id: sourceId,
    properties: {
      source_registry_id: "osm-overpass",
      source_id: sourceId,
      source_object_id: sourceId,
      source_url: `https://www.openstreetmap.org/${sourceId}`,
      osm_element_type: elementType,
      original_geometry_type: elementType === "node" ? "OSM node point" : `OSM ${elementType} center proxy`,
      geometry_source: geometrySource,
      name: tags.name || null,
      public_transport: tags.public_transport || null,
      highway: tags.highway || null,
      railway: tags.railway || null,
      station: tags.station || null,
      amenity: tags.amenity || null,
      bus: tags.bus || null,
      train: tags.train || null,
      subway: tags.subway || null,
      tram: tags.tram || null,
      ferry: tags.ferry || null,
      route_ref: tags.route_ref || tags.route || null,
      ref: tags.ref || null,
      local_ref: tags.local_ref || null,
      network: tags.network || null,
      operator: tags.operator || null,
      osm_timestamp: element.timestamp || "",
      osm_version: element.version || null,
      osm_changeset: element.changeset || null,
      changeset_url: element.changeset ? `https://www.openstreetmap.org/changeset/${element.changeset}` : "",
    },
    geometry: { type: "Point", coordinates: point },
  };
}

async function fetchCity(city) {
  const cityConfig = readJson(path.join(rootDir, city.artifact_paths.city));
  if (!Array.isArray(cityConfig.bounds) || cityConfig.bounds.length !== 4) {
    throw new Error(`${city.city_id} is missing bounds`);
  }
  const outputPath = path.join(outDir, `${city.city_id}_transport_stops_osm_2026.geojson`);
  if (fs.existsSync(outputPath) && process.env.FORCE !== "1") {
    const cached = readJson(outputPath);
    console.log(`${city.city_id}: cached ${cached.features?.length || 0} transport stop/station feature(s)`);
    return;
  }
  console.log(`${city.city_id}: querying Overpass transport stop/station context`);
  const query = queryForBounds(cityConfig.bounds);
  const payload = await postOverpass(query);
  const seen = new Set();
  const features = [];
  for (const element of payload.elements || []) {
    const feature = elementToFeature(element);
    if (!feature) continue;
    const key = `${feature.properties.source_id}|${feature.geometry.coordinates.join(",")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    features.push(feature);
  }
  features.sort((a, b) => String(a.properties.source_id).localeCompare(String(b.properties.source_id)));
  const collection = {
    type: "FeatureCollection",
    name: `${city.city_id}_transport_stops_osm_2026`,
    metadata: {
      schema_version: "1.0.0",
      city_id: city.city_id,
      display_name: city.display_name,
      source: "OpenStreetMap via Overpass API",
      source_registry_id: "osm-overpass",
      endpoint,
      fetched_at: new Date().toISOString(),
      context_data_year: "2026",
      bounds: cityConfig.bounds,
      overpass_query: query,
      overpass_timestamp_osm_base: payload.osm3s?.timestamp_osm_base || "",
      license: "Open Data Commons Open Database License 1.0; attribution required for OpenStreetMap contributors.",
      caveats: [
        "Current mapped public-transport stop/station context only; OSM mapped visibility may post-date selected timeline years.",
        "Overpass center points for OSM ways and relations are geometry proxies, not surveyed stop-platform polygons.",
        "These anchors are not official GTFS, timetable, frequency, reliability, journey-time, or accessibility-service coverage.",
      ],
    },
    features,
  };
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(collection)}\n`);
  console.log(`${city.city_id}: wrote ${features.length} transport stop/station feature(s)`);
}

async function main() {
  const atlas = readJson(atlasIndexPath);
  const only = onlySet();
  for (const city of atlas.cities || []) {
    if (city.city_id === "belfast") continue;
    if (only.size && !only.has(city.city_id)) continue;
    await fetchCity(city);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
