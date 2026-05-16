const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outPath = path.join(rootDir, "web", "data", "city-atlas", "cities", "belfast", "detail_layers.geojson");
const cityPath = path.join(rootDir, "web", "data", "city-atlas", "cities", "belfast", "city.json");
const indexPath = path.join(rootDir, "web", "data", "city-atlas", "index.json");
const roadsPath = path.join(rootDir, "data", "derived", "2026", "belfast_ni_roads_osm_2026.geojson");
const buildingsPath = path.join(rootDir, "data", "derived", "2026", "belfast_ni_buildings_3d_core.geojson");
const roadMetaPath = path.join(rootDir, "data", "raw", "overpass", "belfast_road_assets_overpass_meta_2026.json");

const MIN_YEAR = 2016;
const MAX_YEAR = 2026;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  const text = JSON.stringify(payload);
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.writeFileSync(tmpPath, text, "utf8");
      fs.renameSync(tmpPath, filePath);
      return;
    } catch (error) {
      lastError = error;
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch (_) {
        // Best-effort cleanup before retrying a generated artifact write.
      }
      sleep(150 * (attempt + 1));
    }
  }
  throw lastError;
}

function relativeOutPath(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}

function clampYear(value, fallback = MAX_YEAR) {
  const year = Number(value);
  if (!Number.isFinite(year)) return fallback;
  return Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.trunc(year)));
}

function yearFromTimestamp(timestamp, fallback = MAX_YEAR) {
  const year = Number(String(timestamp || "").slice(0, 4));
  return clampYear(year, fallback);
}

function sourceUrl(sourceId) {
  const [type, id] = String(sourceId || "").split("/");
  if (!["node", "way", "relation"].includes(type) || !/^\d+$/.test(id || "")) return "";
  return `https://www.openstreetmap.org/${type}/${id}`;
}

function changesetUrl(changeset) {
  return changeset ? `https://www.openstreetmap.org/changeset/${changeset}` : "";
}

function metaMap(filePath) {
  if (!fs.existsSync(filePath)) return new Map();
  const payload = readJson(filePath);
  return new Map((payload.elements || []).map((element) => [`${element.type}/${element.id}`, element]));
}

function cleanProperties(value) {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined && item !== null && item !== "")
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

function roadRank(highway) {
  if (/motorway|trunk/i.test(highway || "")) return 4;
  if (/primary|secondary/i.test(highway || "")) return 3;
  if (/tertiary|unclassified/i.test(highway || "")) return 2;
  return 1;
}

function buildRoadFeatures() {
  const roads = readJson(roadsPath);
  const metas = metaMap(roadMetaPath);
  let missingMetadata = 0;
  const features = [];

  for (const feature of roads.features || []) {
    const sourceId = feature.properties?.source_id || feature.id;
    const meta = metas.get(sourceId);
    if (!meta) missingMetadata += 1;
    const tags = meta?.tags || {};
    const highway = tags.highway || feature.properties?.highway || "road";
    const timestamp = meta?.timestamp || "";
    const visibleYear = yearFromTimestamp(timestamp);
    features.push({
      type: "Feature",
      id: `road-${sourceId}`,
      properties: cleanProperties({
        layer: "road",
        source_id: sourceId,
        name: tags.name || feature.properties?.name,
        kind: highway,
        rank: roadRank(highway),
        visible_year: visibleYear,
        original_osm_year: Number(String(timestamp || "").slice(0, 4)) || null,
        osm_timestamp: timestamp,
        osm_version: meta?.version,
        osm_changeset: meta?.changeset,
        source_url: sourceUrl(sourceId),
        changeset_url: changesetUrl(meta?.changeset),
        timing_basis: "osm_last_edit_timestamp",
        timing_note: "OSM edit metadata is mapped-visibility evidence and does not prove the real-world construction or opening date.",
      }),
      geometry: feature.geometry,
    });
  }

  return { features, missingMetadata };
}

function buildBuildingFeatures() {
  const buildings = readJson(buildingsPath);
  let proxyCount = 0;
  const features = [];

  for (const feature of buildings.features || []) {
    const props = feature.properties || {};
    const visibleYear = clampYear(props.replay_first_visible_year, MAX_YEAR);
    proxyCount += 1;
    features.push({
      type: "Feature",
      id: `building-${props.source_id || feature.id || features.length}`,
      properties: cleanProperties({
        layer: "building",
        source_id: props.source_id || feature.id,
        name: props.name,
        kind: props.building || "building",
        visible_year: visibleYear,
        original_visible_year: props.replay_first_visible_year,
        height_m: props.replay_height_m,
        footprint_area_m2: props.footprint_area_m2,
        source_url: "https://www.openstreetmap.org/copyright",
        timing_basis: "derived_replay_first_visible_year_proxy",
        timing_note: "Building footprint timing is a generated visibility proxy from current OSM-derived geometry, not a confirmed construction date.",
        confidence: props.building_change_confidence || "proxy from current OSM footprint and local evidence",
      }),
      geometry: feature.geometry,
    });
  }

  return { features, proxyCount };
}

const roadResult = buildRoadFeatures();
const buildingResult = buildBuildingFeatures();
const features = [...roadResult.features, ...buildingResult.features]
  .filter((feature) => feature.geometry)
  .sort((a, b) => {
    const layerSort = String(a.properties.layer).localeCompare(String(b.properties.layer));
    if (layerSort) return layerSort;
    return Number(a.properties.visible_year || 0) - Number(b.properties.visible_year || 0)
      || String(a.properties.source_id || "").localeCompare(String(b.properties.source_id || ""));
  });

writeJson(outPath, {
  type: "FeatureCollection",
  name: "belfast_osm_detail_layers",
  metadata: {
    schema_version: "1.0.0",
    city_id: "belfast",
    generated_at: new Date().toISOString(),
    source: "OpenStreetMap-derived local GeoJSON plus Overpass metadata",
    license: "ODbL",
    feature_count: features.length,
    road_count: roadResult.features.length,
    building_count: buildingResult.features.length,
    missing_road_metadata_count: roadResult.missingMetadata,
    building_proxy_count: buildingResult.proxyCount,
    coverage_note: "Road geometry is current OSM-derived centerline geometry with last-edit metadata. Building geometry is current OSM-derived footprint geometry with generated first-visible proxy years. These are mapped-visibility layers, not certified construction histories.",
    source_paths: [
      path.relative(rootDir, roadsPath).replace(/\\/g, "/"),
      path.relative(rootDir, roadMetaPath).replace(/\\/g, "/"),
      path.relative(rootDir, buildingsPath).replace(/\\/g, "/"),
    ],
  },
  features,
});

const detailPath = relativeOutPath(outPath);
if (fs.existsSync(cityPath)) {
  const city = readJson(cityPath);
  city.artifact_paths = { ...(city.artifact_paths || {}), detail_layers: detailPath };
  writeJson(cityPath, city);
}
if (fs.existsSync(indexPath)) {
  const index = readJson(indexPath);
  for (const city of index.cities || []) {
    if (city.city_id !== "belfast") continue;
    city.artifact_paths = { ...(city.artifact_paths || {}), detail_layers: detailPath };
  }
  writeJson(indexPath, index);
}

console.log(`Wrote ${detailPath} with ${features.length} detailed OSM road/building features.`);
