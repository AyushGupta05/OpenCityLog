const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CITY_ID = "belfast";
const OBSERVED_YEAR = 2026;
const OUTPUT = path.join(ROOT, "web", "data", "city-atlas", "cities", CITY_ID, "utility_network_2026.geojson");

const SOURCES = [
  {
    path: path.join(ROOT, "data", "derived", "2026", "belfast_ni_water_osm_2026.geojson"),
    utilityType: "water",
    sourceName: "OpenStreetMap water features via local derived extract",
  },
  {
    path: path.join(ROOT, "data", "derived", "2026", "belfast_ni_power_grid_osm_2026.geojson"),
    utilityType: "electricity",
    sourceName: "OpenStreetMap power-grid features via local derived extract",
  },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function osmUrl(sourceId) {
  const id = String(sourceId || "");
  if (!/^(node|way|relation)\//.test(id)) return "";
  return `https://www.openstreetmap.org/${id}`;
}

function geometryClass(geometry) {
  if (!geometry) return "unknown";
  if (geometry.type === "Point" || geometry.type === "MultiPoint") return "asset";
  if (geometry.type === "LineString" || geometry.type === "MultiLineString") return "line";
  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") return "area";
  return "unknown";
}

function utilityRole(utilityType, props) {
  if (utilityType === "electricity") {
    return String(props.power || props.route || props.operator || "power_asset").toLowerCase();
  }
  if (props.waterway) return String(props.waterway).toLowerCase();
  if (props.water) return String(props.water).toLowerCase();
  if (props.natural) return String(props.natural).toLowerCase();
  if (props.man_made) return String(props.man_made).toLowerCase();
  return "water_context";
}

function numericVoltage(props) {
  const value = String(props.voltage || "").split(/[;,\s]+/).map(Number).filter(Number.isFinite)[0];
  return Number.isFinite(value) ? value : 0;
}

function assetPriority(utilityType, role, geometry, props) {
  const geomClass = geometryClass(geometry);
  if (geomClass !== "asset") return 0;
  if (utilityType === "electricity") {
    if (/substation|generator|plant|transformer|converter|switch/.test(role)) return 4;
    if (/tower|terminal|portal/.test(role)) return 2;
    if (numericVoltage(props) >= 33000) return 2;
    return 1;
  }
  if (/pump|reservoir|works|tank|station/.test(role)) return 4;
  return 1;
}

function rankFor(utilityType, role, geometry, props) {
  const geomClass = geometryClass(geometry);
  if (utilityType === "electricity") {
    if (numericVoltage(props) >= 110000) return 5;
    if (/substation|plant|generator/.test(role)) return 4;
    if (/line|cable|minor_line/.test(role)) return geomClass === "line" ? 3 : 2;
    if (/tower/.test(role)) return 2;
    return 1;
  }
  if (/river|canal|reservoir|dock|basin/.test(role)) return 4;
  if (/stream|drain|ditch|water/.test(role)) return geomClass === "line" ? 2 : 1;
  return 1;
}

function intensityFor(utilityType, role, geometry, props) {
  const rank = rankFor(utilityType, role, geometry, props);
  if (utilityType === "electricity" && numericVoltage(props) >= 110000) return 1;
  if (/substation|generator|plant|reservoir|river|canal|dock/.test(role)) return 0.82;
  if (geometryClass(geometry) === "line") return Math.min(0.86, 0.36 + rank * 0.12);
  if (geometryClass(geometry) === "area") return Math.min(0.72, 0.28 + rank * 0.1);
  return Math.min(0.78, 0.24 + rank * 0.12);
}

function normaliseFeature(feature, source, index) {
  const props = feature.properties || {};
  const geometry = feature.geometry;
  if (!geometry) return null;
  const geomClass = geometryClass(geometry);
  if (geomClass === "unknown") return null;
  const sourceId = props.source_id || props.id || `${source.utilityType}-${index}`;
  const role = utilityRole(source.utilityType, props);
  const name = props.name || props.operator || role.replace(/_/g, " ");
  const rank = rankFor(source.utilityType, role, geometry, props);
  return {
    type: "Feature",
    id: `${source.utilityType}-${sourceId}`,
    properties: {
      id: `utility-network-${CITY_ID}-${OBSERVED_YEAR}-${source.utilityType}-${index}`,
      layer: "utility_network",
      category: "utilities",
      utility_type: source.utilityType,
      network_role: role,
      network_geometry: geomClass,
      asset_priority: assetPriority(source.utilityType, role, geometry, props),
      title: `${source.utilityType === "electricity" ? "Power" : "Water"} ${role.replace(/_/g, " ")} context`,
      name: name || "",
      source_id: sourceId,
      source_name: source.sourceName,
      publisher: "OpenStreetMap contributors",
      source_url: osmUrl(sourceId),
      source_type: "open geospatial extract",
      license: "ODbL-1.0",
      observed_year: OBSERVED_YEAR,
      context_year: OBSERVED_YEAR,
      confidence: "inferred",
      rank,
      intensity: Number(intensityFor(source.utilityType, role, geometry, props).toFixed(3)),
      caveat: "Current OSM mapped context; not a confirmed installation date, capacity measurement, or service-availability claim.",
    },
    geometry,
  };
}

function main() {
  const features = [];
  for (const source of SOURCES) {
    if (!fs.existsSync(source.path)) {
      console.warn(`[utility-network] missing ${path.relative(ROOT, source.path)}`);
      continue;
    }
    const payload = readJson(source.path);
    const sourceFeatures = Array.isArray(payload.features) ? payload.features : [];
    sourceFeatures.forEach((feature, index) => {
      const normalised = normaliseFeature(feature, source, index);
      if (normalised) features.push(normalised);
    });
  }
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify({
    type: "FeatureCollection",
    name: `${CITY_ID}_utility_network_${OBSERVED_YEAR}`,
    metadata: {
      schema_version: "1.0.0",
      city_id: CITY_ID,
      observed_year: OBSERVED_YEAR,
      generated_at: new Date().toISOString(),
      source_paths: SOURCES.map((source) => path.relative(ROOT, source.path).replace(/\\/g, "/")),
      method: "Normalised current OSM water and power context for OpenCityLog utility lens rendering. Dated event records still drive year-specific changes.",
      caveats: [
        "OSM mapped visibility is not a confirmed installation/opening date.",
        "The artifact does not contain measured utility capacity, outage state, or service availability.",
        "Water features include mapped waterways/water bodies where available; they are context geometry, not surveyed water-main records.",
      ],
    },
    features,
  }));
  console.log(`[utility-network] wrote ${features.length} features -> ${path.relative(ROOT, OUTPUT)}`);
}

main();
