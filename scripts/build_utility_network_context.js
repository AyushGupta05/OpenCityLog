const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OBSERVED_YEAR = 2026;
const ATLAS_INDEX = path.join(ROOT, "web", "data", "city-atlas", "index.json");

const SOURCE_OVERRIDES = {
  belfast: [
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
    {
      path: path.join(ROOT, "data", "derived", "2026", "belfast_ni_utility_context_osm_2026.geojson"),
      utilityType: "mixed",
      sourceName: "OpenStreetMap telecom, gas, and drainage utility context via local derived extract",
    },
  ],
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function relativePath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
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
  if (props.network_role) return String(props.network_role).toLowerCase();
  if (utilityType === "electricity") {
    return String(props.power || props.route || props.operator || "power_asset").toLowerCase();
  }
  if (utilityType === "telecoms") {
    return String(props.telecom || props.communication || props["tower:type"] || props.man_made || "telecom_context").toLowerCase();
  }
  if (utilityType === "gas") {
    return String(props.pipeline || props.substance || props.utility || "gas_context").toLowerCase();
  }
  if (utilityType === "drainage") {
    return String(props.waterway || props.pipeline || props.man_made || "drainage_context").toLowerCase();
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
  if (utilityType === "telecoms") {
    if (/exchange|central_office|data_center/.test(role)) return 4;
    if (/communication|mast|tower/.test(role)) return 3;
    return 2;
  }
  if (utilityType === "gas") {
    if (/substation|station|plant|pipeline/.test(role)) return 4;
    return 2;
  }
  if (utilityType === "drainage") {
    if (/wastewater|sewerage|storm_drain|station|plant/.test(role)) return 4;
    return 2;
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
  if (utilityType === "telecoms") {
    if (/exchange|central_office|data_center/.test(role)) return 5;
    if (/communication|mast|tower/.test(role)) return 3;
    if (geomClass === "line") return 3;
    return 2;
  }
  if (utilityType === "gas") {
    if (/pipeline|substation|station|plant/.test(role)) return geomClass === "line" ? 4 : 3;
    return 2;
  }
  if (utilityType === "drainage") {
    if (/wastewater|sewerage|storm_drain/.test(role)) return 4;
    if (/drain|ditch|sewer/.test(role)) return geomClass === "line" ? 3 : 2;
    return 2;
  }
  if (/river|canal|reservoir|dock|basin/.test(role)) return 4;
  if (/stream|drain|ditch|water/.test(role)) return geomClass === "line" ? 2 : 1;
  return 1;
}

function intensityFor(utilityType, role, geometry, props) {
  const rank = rankFor(utilityType, role, geometry, props);
  if (utilityType === "electricity" && numericVoltage(props) >= 110000) return 1;
  if (utilityType === "telecoms" && /exchange|central_office|data_center/.test(role)) return 0.88;
  if (utilityType === "gas" && /pipeline|substation|station|plant/.test(role)) return 0.78;
  if (utilityType === "drainage" && /wastewater|sewerage|storm_drain/.test(role)) return 0.82;
  if (/substation|generator|plant|reservoir|river|canal|dock/.test(role)) return 0.82;
  if (geometryClass(geometry) === "line") return Math.min(0.86, 0.36 + rank * 0.12);
  if (geometryClass(geometry) === "area") return Math.min(0.72, 0.28 + rank * 0.1);
  return Math.min(0.78, 0.24 + rank * 0.12);
}

function normaliseFeature(cityId, feature, source, index) {
  const props = feature.properties || {};
  const geometry = feature.geometry;
  if (!geometry) return null;
  const geomClass = geometryClass(geometry);
  if (geomClass === "unknown") return null;
  const utilityType = source.utilityType === "mixed" ? String(props.utility_type || "") : source.utilityType;
  if (!utilityType) return null;
  const sourceId = props.source_id || props.id || `${source.utilityType}-${index}`;
  const role = utilityRole(utilityType, props);
  const name = props.name || props.operator || role.replace(/_/g, " ");
  const rank = rankFor(utilityType, role, geometry, props);
  const accessedAt = props.accessed_at
    || source.metadata?.generated_at
    || source.metadata?.generatedAt
    || source.metadata?.fetched_at
    || source.metadata?.overpass_timestamp_osm_base
    || `${OBSERVED_YEAR}-01-01`;
  const labelByType = {
    electricity: "Power",
    water: "Water",
    telecoms: "Telecoms",
    gas: "Gas",
    drainage: "Drainage",
    district_energy: "District energy",
  };
  return {
    type: "Feature",
    id: `${utilityType}-${sourceId}`,
    properties: {
      id: `utility-network-${cityId}-${OBSERVED_YEAR}-${utilityType}-${index}`,
      layer: "utility_network",
      category: "utilities",
      utility_type: utilityType,
      network_role: role,
      network_geometry: geomClass,
      asset_priority: assetPriority(utilityType, role, geometry, props),
      title: `${labelByType[utilityType] || "Utility"} ${role.replace(/_/g, " ")} context`,
      name: name || "",
      source_id: sourceId,
      source_registry_id: props.source_registry_id || "osm-overpass",
      source_object_id: props.source_object_id || sourceId,
      source_name: props.source_name || source.sourceName,
      publisher: props.publisher || "OpenStreetMap contributors",
      source_url: props.source_url || osmUrl(sourceId),
      source_type: props.source_type || "open geospatial extract",
      license: props.license || "ODbL-1.0",
      accessed_at: accessedAt,
      transformation_method: props.transformation_method || "scripts/build_utility_network_context.js#normaliseFeature",
      geometry_source: props.geometry_source || "OpenStreetMap element geometry from the local utility context extract.",
      original_geometry_type: props.original_geometry_type || geometry.type,
      osm_element_type: props.osm_element_type || props.osm_type || String(sourceId).split("/")[0] || "",
      osm_timestamp: props.osm_timestamp || "",
      osm_version: props.osm_version || null,
      osm_changeset: props.osm_changeset || null,
      changeset_url: props.changeset_url || (props.osm_changeset ? `https://www.openstreetmap.org/changeset/${props.osm_changeset}` : ""),
      observed_year: OBSERVED_YEAR,
      context_year: props.context_year || OBSERVED_YEAR,
      confidence: "inferred",
      rank,
      intensity: Number(intensityFor(utilityType, role, geometry, props).toFixed(3)),
      caveat: "Current OSM mapped context; not a confirmed installation date, capacity measurement, outage state, or service-availability claim.",
    },
    geometry,
  };
}

function defaultSourcesForCity(cityId) {
  const utilityContextPath = path.join(ROOT, "data", "derived", String(OBSERVED_YEAR), `${cityId}_utility_context_osm_${OBSERVED_YEAR}.geojson`);
  return [
    {
      path: utilityContextPath,
      utilityType: "mixed",
      sourceName: "OpenStreetMap utility context via local derived extract",
    },
  ];
}

function sourceConfigsForCity(cityId) {
  return SOURCE_OVERRIDES[cityId] || defaultSourcesForCity(cityId);
}

function outputPathForCity(cityId) {
  return path.join(ROOT, "web", "data", "city-atlas", "cities", cityId, `utility_network_${OBSERVED_YEAR}.geojson`);
}

function buildCity(city) {
  const cityId = city.city_id;
  const features = [];
  const sourcePaths = [];
  const sourceMetadata = [];
  for (const source of sourceConfigsForCity(cityId)) {
    if (!fs.existsSync(source.path)) {
      console.warn(`[utility-network] ${cityId}: missing ${relativePath(source.path)}`);
      continue;
    }
    sourcePaths.push(relativePath(source.path));
    const payload = readJson(source.path);
    if (payload.metadata) sourceMetadata.push(payload.metadata);
    const featureSource = { ...source, metadata: payload.metadata || {} };
    const sourceFeatures = Array.isArray(payload.features) ? payload.features : [];
    sourceFeatures.forEach((feature, index) => {
      const normalised = normaliseFeature(cityId, feature, featureSource, index);
      if (normalised) features.push(normalised);
    });
  }
  if (!features.length) {
    console.warn(`[utility-network] ${cityId}: no utility context features available`);
    return null;
  }
  features.sort((a, b) => String(a.properties.id).localeCompare(String(b.properties.id)));
  const output = outputPathForCity(cityId);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify({
    type: "FeatureCollection",
    name: `${cityId}_utility_network_${OBSERVED_YEAR}`,
    metadata: {
      schema_version: "1.0.0",
      city_id: cityId,
      observed_year: OBSERVED_YEAR,
      generated_at: new Date().toISOString(),
      source_paths: sourcePaths,
      source_metadata: sourceMetadata,
      method: "Normalised current OSM utility context for OpenCityLog utility lens rendering. Dated event records still drive year-specific changes.",
      caveats: [
        "OSM mapped visibility is not a confirmed installation/opening date.",
        "The artifact does not contain measured utility capacity, outage state, or service availability.",
        "Water features include mapped waterways/water bodies where available; they are context geometry, not surveyed water-main records.",
        "Telecoms, gas, electricity and drainage records are current OSM tagged context. Where only asset points exist, frontend traces are nearest mapped-street guides, not surveyed utility routes.",
      ],
    },
    features,
  })}\n`);
  console.log(`[utility-network] ${cityId}: wrote ${features.length} features -> ${relativePath(output)}`);
  return output;
}

function main() {
  const atlas = readJson(ATLAS_INDEX);
  const only = new Set(String(process.env.ONLY || "").split(",").map((item) => item.trim()).filter(Boolean));
  const outputs = [];
  for (const city of atlas.cities || []) {
    if (only.size && !only.has(city.city_id)) continue;
    const output = buildCity(city);
    if (output) outputs.push(output);
  }
  if (!outputs.length) throw new Error("No utility network artifacts were written.");
}

main();
