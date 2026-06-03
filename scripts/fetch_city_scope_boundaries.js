const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "data", "raw", "boundaries");
const fetchedAt = process.env.BIMS_BOUNDARY_FETCHED_AT || new Date().toISOString();

const BOUNDARY_SOURCES = {
  london: {
    city_id: "london",
    output: "london_ons_region_boundary_2024.geojson",
    source_name: "Regions (December 2024) Boundaries EN BGC",
    source_id: "ons-regions-december-2024-boundaries-en-bgc",
    publisher: "Office for National Statistics",
    source_url: "https://ckan.publishing.service.gov.uk/dataset/regions-december-2024-boundaries-en-bgc",
    download_url: "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Regions_December_2024_Boundaries_EN_BGC/FeatureServer/0/query?where=RGN24CD%3D%27E12000007%27&outFields=*&returnGeometry=true&f=geojson&outSR=4326",
    licence: "Open Government Licence v3.0; contains Ordnance Survey and ONS intellectual property rights.",
    licence_url: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
    boundary_scope: "Greater London region E12000007, December 2024, generalised 20m and clipped to coastline.",
  },
  nyc: {
    city_id: "nyc",
    output: "nyc_borough_boundaries_2026.geojson",
    source_name: "Borough Boundaries",
    source_id: "nyc-dcp-borough-boundaries-gthc-hcne",
    publisher: "NYC Department of City Planning",
    source_url: "https://catalog.data.gov/dataset/borough-boundaries",
    download_url: "https://data.cityofnewyork.us/resource/gthc-hcne.geojson?$limit=5000",
    licence: "NYC Open Data Terms of Use.",
    licence_url: "https://opendata.cityofnewyork.us/faq/",
    boundary_scope: "New York City borough boundaries, water areas excluded, current version 26a.",
  },
};

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function normalizeFeatureCollection(payload, source) {
  if (!payload || payload.type !== "FeatureCollection" || !Array.isArray(payload.features)) {
    throw new Error(`${source.city_id}: expected a GeoJSON FeatureCollection`);
  }
  if (!payload.features.length) {
    throw new Error(`${source.city_id}: boundary source returned no features`);
  }
  return {
    type: "FeatureCollection",
    name: `${source.city_id}_official_city_scope_boundary`,
    metadata: {
      schema_version: "1.0.0",
      city_id: source.city_id,
      source_name: source.source_name,
      source_id: source.source_id,
      publisher: source.publisher,
      source_url: source.source_url,
      download_url: source.download_url,
      fetched_at: fetchedAt,
      licence: source.licence,
      licence_url: source.licence_url,
      boundary_scope: source.boundary_scope,
      method: "Official administrative boundary geometry is stored as raw scope data for clipping or filtering derived citywide context layers. It is not itself a change event.",
    },
    features: payload.features,
  };
}

async function fetchBoundary(source) {
  const response = await fetch(source.download_url, {
    headers: {
      "user-agent": "OpenCityLog/0.1 city-scope-boundary-fetch contact=local-codex",
      "accept": "application/geo+json, application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`${source.city_id}: boundary fetch failed ${response.status}: ${await response.text()}`);
  }
  const payload = await response.json();
  const outPath = path.join(outDir, source.output);
  const normalized = normalizeFeatureCollection(payload, source);
  writeJson(outPath, normalized);
  console.log(`${source.city_id}: wrote ${normalized.features.length} official boundary feature(s) to ${path.relative(rootDir, outPath)}`);
}

async function main() {
  const only = new Set(String(process.env.ONLY || "").split(",").map((item) => item.trim()).filter(Boolean));
  for (const source of Object.values(BOUNDARY_SOURCES)) {
    if (only.size && !only.has(source.city_id)) continue;
    await fetchBoundary(source);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
