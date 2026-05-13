const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "data", "raw", "overpass");
const atlasIndexPath = path.join(rootDir, "web", "data", "city-atlas", "index.json");
const endpoint = process.env.OVERPASS_ENDPOINT || "https://overpass-api.de/api/interpreter";
const roadClassPattern = "^(motorway|trunk|primary|secondary|tertiary)$";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function clampYearFromTimestamp(timestamp, years) {
  const parsed = timestamp ? new Date(timestamp) : null;
  const year = parsed && Number.isFinite(parsed.getTime()) ? parsed.getUTCFullYear() : Math.min(...years);
  if (!years.length) return year;
  if (year < years[0]) return years[0];
  if (year > years[years.length - 1]) return years[years.length - 1];
  return year;
}

function roadRank(highway) {
  const value = String(highway || "").toLowerCase();
  if (value === "motorway") return 5;
  if (value === "trunk") return 4.5;
  if (value === "primary") return 4;
  if (value === "secondary") return 3;
  if (value === "tertiary") return 2;
  return 1;
}

function queryForBounds(bounds) {
  const [west, south, east, north] = bounds.map(Number);
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:240];(way["highway"~"${roadClassPattern}"](${bbox}););out tags meta geom qt;`;
}

async function postOverpass(query) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent": "OpenCityLog/0.1 citywide-road-overlay contact=local-codex",
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) throw new Error(`Overpass ${response.status}: ${await response.text()}`);
  return response.json();
}

function wayToFeature(element, years) {
  const coords = (element.geometry || [])
    .map((point) => [Number(point.lon), Number(point.lat)])
    .filter((coord) => Number.isFinite(coord[0]) && Number.isFinite(coord[1]));
  if (coords.length < 2) return null;
  const tags = element.tags || {};
  const sourceId = `way/${element.id}`;
  return {
    type: "Feature",
    properties: {
      layer: "road",
      source_id: sourceId,
      source_url: `https://www.openstreetmap.org/${sourceId}`,
      changeset_url: element.changeset ? `https://www.openstreetmap.org/changeset/${element.changeset}` : "",
      osm_timestamp: element.timestamp || "",
      osm_version: element.version || null,
      osm_changeset: element.changeset || null,
      visible_year: clampYearFromTimestamp(element.timestamp, years),
      highway: tags.highway || "",
      name: tags.name || tags.ref || "mapped road segment",
      ref: tags.ref || "",
      rank: roadRank(tags.highway),
      license: "ODbL",
      timing_note: "OSM timestamp is mapped/edit visibility evidence, not a confirmed real-world road opening date.",
    },
    geometry: { type: "LineString", coordinates: coords },
  };
}

async function fetchCity(city, years) {
  const cityConfigPath = path.join(rootDir, city.artifact_paths.city);
  const cityConfig = readJson(cityConfigPath);
  if (!Array.isArray(cityConfig.bounds) || cityConfig.bounds.length !== 4) {
    throw new Error(`${city.city_id} is missing bounds`);
  }
  const outputPath = path.join(outDir, `${city.city_id}_major_roads_osm_2026.geojson`);
  if (fs.existsSync(outputPath) && process.env.FORCE !== "1") {
    const cached = readJson(outputPath);
    console.log(`${city.city_id}: cached ${cached.features?.length || 0} road feature(s)`);
    return;
  }
  console.log(`${city.city_id}: querying Overpass major roads`);
  const payload = await postOverpass(queryForBounds(cityConfig.bounds));
  const features = (payload.elements || [])
    .filter((element) => element.type === "way")
    .map((element) => wayToFeature(element, years))
    .filter(Boolean)
    .sort((a, b) => String(a.properties.source_id).localeCompare(String(b.properties.source_id)));
  const collection = {
    type: "FeatureCollection",
    name: `${city.city_id}_major_roads_osm_2026`,
    metadata: {
      schema_version: "1.0.0",
      city_id: city.city_id,
      source: endpoint,
      fetched_at: new Date().toISOString(),
      bounds: cityConfig.bounds,
      highway_filter: roadClassPattern,
      license: "ODbL",
      caveat: "Current OSM major road geometry is used for visual context; OSM edit timestamps are not real-world construction dates.",
    },
    features,
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(collection)}\n`);
  console.log(`${city.city_id}: wrote ${features.length} road feature(s)`);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const atlas = readJson(atlasIndexPath);
  const only = new Set(String(process.env.ONLY || "").split(",").map((item) => item.trim()).filter(Boolean));
  for (const city of atlas.cities || []) {
    if (city.city_id === "belfast") continue;
    if (only.size && !only.has(city.city_id)) continue;
    const eventsManifest = readJson(path.join(rootDir, city.artifact_paths.events));
    const years = (eventsManifest.event_years || []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    await fetchCity(city, years);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
