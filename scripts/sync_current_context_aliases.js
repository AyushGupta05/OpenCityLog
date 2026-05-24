const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const atlasRoot = path.join(rootDir, "web", "data", "city-atlas");
const citiesRoot = path.join(atlasRoot, "cities");
const cityIds = ["belfast", "london", "nyc"];

const aliasSpecs = {
  london: [
    {
      from: "economy_context_2026.geojson",
      to: "economy_anchors_2026.geojson",
      kind: "economy",
      artifactRole: "current economy anchor/context layer",
      limitations: [
        "This alias preserves the source-backed GLA economy context under the city-atlas economy anchor contract.",
      ],
    },
    {
      from: "utility_context_2026.geojson",
      to: "utility_network_2026.geojson",
      kind: "utility",
      artifactRole: "current utility works context; not a surveyed utility network",
      limitations: [
        "This artifact is named for frontend contract compatibility; features are works/disruption context, not a surveyed utility network map.",
      ],
    },
  ],
  nyc: [
    {
      from: "economy_context_2026.geojson",
      to: "economy_anchors_2026.geojson",
      kind: "economy",
      artifactRole: "current economy anchor/context layer",
      limitations: [
        "This alias preserves the source-backed NYC SBS economy context under the city-atlas economy anchor contract.",
      ],
    },
    {
      from: "utility_context_2026.geojson",
      to: "utility_network_2026.geojson",
      kind: "utility",
      artifactRole: "current utility works permit context; not a surveyed utility network",
      limitations: [
        "This artifact is named for frontend contract compatibility; features are permit/work-location context, not a surveyed utility network map.",
      ],
    },
  ],
};

const artifactFiles = {
  transport_stops: "transport_stops_2026.geojson",
  economy_anchors: "economy_anchors_2026.geojson",
  economy_anchors_2026: "economy_anchors_2026.geojson",
  economy_context_2026: "economy_context_2026.geojson",
  utility_network: "utility_network_2026.geojson",
  utility_network_2026: "utility_network_2026.geojson",
  utility_context_2026: "utility_context_2026.geojson",
  civic_services_context: "civic_services_2026.geojson",
};

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function relativeFromRoot(filePath) {
  return toPosix(path.relative(rootDir, filePath));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  const text = `${JSON.stringify(value, null, 2)}\n`;
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

function unique(values) {
  return [...new Set((values || []).map((item) => String(item || "").trim()).filter(Boolean))];
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : text;
}

function utilityTypeFromProps(props = {}) {
  const text = [
    props.utility_type,
    props.utility_signal,
    props.permitteename,
    props.permittypedesc,
    props.permitseriesshortdesc,
    props.name,
    props.context_type,
  ].filter(Boolean).join(" ").toLowerCase();
  if (/water|main|hydrant|pump/.test(text)) return "water";
  if (/telecom|fiber|fibre|phone|broadband|cabinet|antenna/.test(text)) return "telecoms";
  if (/gas/.test(text)) return "gas";
  if (/drain|sewer|storm|catch basin|flood/.test(text)) return "drainage";
  if (/electric|con ?ed|consolidated edison|steam|power|substation|shunt|manhole/.test(text)) return "electricity";
  return "electricity";
}

function economySectorFromProps(props = {}) {
  const text = [
    props.sector,
    props.context_type,
    props.name,
    props.f_all_bi_1,
    props.f_all_bi_2,
    props.lad_name,
    props.borough,
  ].filter(Boolean).join(" ").toLowerCase();
  if (/hospitality|hotel|restaurant|bar|pub|night/.test(text)) return "hospitality";
  if (/culture|visitor|touris|museum|gallery|theatre|cinema|venue/.test(text)) return "culture_visitor";
  if (/office|business|bid|improvement district|town centre|high street|retail|market/.test(text)) return "retail";
  if (/industrial|warehouse|manufactur/.test(text)) return "industrial";
  return "commercial_activity";
}

function economyAnchorRank(props = {}) {
  const text = [props.name, props.f_all_bi_2, props.context_type].filter(Boolean).join(" ").toLowerCase();
  let rank = /business_improvement|bid|town centre|high street/.test(text) ? 2.6 : 2;
  if (/central|city|westminster|manhattan|downtown|market|theatre|museum|university/.test(text)) rank += 0.35;
  return Number(Math.min(4.2, rank).toFixed(2));
}

function coordinatePoints(value, points = []) {
  if (!Array.isArray(value)) return points;
  if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
    points.push(value);
    return points;
  }
  for (const item of value) coordinatePoints(item, points);
  return points;
}

function centroidPointGeometry(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) return geometry;
  const points = coordinatePoints(geometry.coordinates);
  if (!points.length) return geometry;
  let lng = 0;
  let lat = 0;
  for (const point of points) {
    lng += point[0];
    lat += point[1];
  }
  return {
    type: "Point",
    coordinates: [
      Number((lng / points.length).toFixed(6)),
      Number((lat / points.length).toFixed(6)),
    ],
  };
}

function normalizeEconomyFeature(feature) {
  const props = feature.properties || {};
  const sector = economySectorFromProps(props);
  const label = props.label || props.name || props.f_all_bi_2 || props.lad_name || "Economy context";
  const rank = economyAnchorRank(props);
  const sourceGeometryType = feature.geometry?.type || "";
  return {
    ...feature,
    geometry: centroidPointGeometry(feature.geometry),
    properties: {
      ...props,
      layer: "economy_anchor",
      category: "economy",
      lens: "economy",
      label,
      name: props.name || label,
      sector,
      sublayer_id: "economy",
      anchor_rank: rank,
      intensity: Number(Math.min(0.82, 0.34 + rank * 0.1).toFixed(2)),
      source_kind: "current_context",
      evidence_role: "context_not_year_specific_change_evidence",
      source_geometry_type: sourceGeometryType,
      geometry_precision: sourceGeometryType && sourceGeometryType !== "Point" ? "centroid_of_source_context_geometry" : "source_point",
      visible_year: 2026,
      source_name: props.source_name || props.sourceName || props.publisher || "",
      source_url: props.source_url || props.sourceUrl || "",
      caveats: unique([...(props.caveats || []), ...(props.limitations || []), "Current context may post-date the selected year; not year-specific change evidence.", "Polygon context is rendered as a centroid anchor for map legibility; see the source context artifact for the original geometry."]),
    },
  };
}

function normalizeUtilityFeature(feature) {
  const props = feature.properties || {};
  const geometryType = feature.geometry?.type || "";
  const isLine = geometryType === "LineString" || geometryType === "MultiLineString";
  const utilityType = utilityTypeFromProps(props);
  const currentOrPlanned = /active|current|issued|printed|planned|open/i.test([
    props.permitstatusshortdesc,
    props.status,
    props.name,
  ].filter(Boolean).join(" "));
  return {
    ...feature,
    properties: {
      ...props,
      layer: "utility_network",
      category: "utilities",
      lens: "utilities",
      network_geometry: isLine ? "line" : "asset",
      network_role: props.context_type || "utility_works_context",
      utility_type: utilityType,
      work_status: currentOrPlanned ? "current" : "planned",
      rank: Number((isLine ? 2.3 : 2).toFixed(2)),
      intensity: Number((isLine ? 0.56 : 0.48).toFixed(2)),
      asset_priority: isLine ? 1 : 2,
      visual_priority: isLine ? 0.7 : 0.62,
      source_kind: "current_context",
      evidence_role: "context_not_year_specific_change_evidence",
      visible_year: 2026,
      effective_date: normalizeDate(props.issuedworkstartdate || props.startDateTime || props.permitissuedate || props.createdon),
      effective_end_date: normalizeDate(props.issuedworkenddate || props.endDateTime),
      source_name: props.source_name || props.sourceName || props.publisher || "",
      source_url: props.source_url || props.sourceUrl || "",
      caveats: unique([...(props.caveats || []), ...(props.limitations || []), "Current works/permit context; not a surveyed utility network and not capacity or reliability evidence."]),
    },
  };
}

function normalizeAliasFeatures(payload, kind) {
  const features = Array.isArray(payload.features) ? payload.features : [];
  if (kind === "economy") return features.map(normalizeEconomyFeature);
  if (kind === "utility") return features.map(normalizeUtilityFeature);
  return features;
}

function syncAlias(cityId, spec) {
  const cityDir = path.join(citiesRoot, cityId);
  const sourcePath = path.join(cityDir, spec.from);
  const aliasPath = path.join(cityDir, spec.to);
  if (!fs.existsSync(sourcePath)) return false;
  const payload = readJson(sourcePath);
  const metadata = payload.metadata || {};
  const nextPayload = {
    ...payload,
    features: normalizeAliasFeatures(payload, spec.kind),
    metadata: {
      ...metadata,
      artifact_role: spec.artifactRole,
      alias_of: relativeFromRoot(sourcePath),
      limitations: unique([...(metadata.limitations || []), ...(spec.limitations || [])]),
    },
  };
  writeJson(aliasPath, nextPayload);
  return true;
}

function existingArtifactPaths(cityId) {
  const cityDir = path.join(citiesRoot, cityId);
  const paths = {};
  for (const [key, filename] of Object.entries(artifactFiles)) {
    const filePath = path.join(cityDir, filename);
    if (fs.existsSync(filePath)) paths[key] = relativeFromRoot(filePath);
  }
  return paths;
}

function updateCityArtifactPaths(cityId) {
  const cityPath = path.join(citiesRoot, cityId, "city.json");
  if (!fs.existsSync(cityPath)) return null;
  const payload = readJson(cityPath);
  payload.artifact_paths = {
    ...(payload.artifact_paths || {}),
    ...existingArtifactPaths(cityId),
  };
  writeJson(cityPath, payload);
  return payload.artifact_paths;
}

function updateIndexArtifactPaths(pathsByCity) {
  const indexPath = path.join(atlasRoot, "index.json");
  if (!fs.existsSync(indexPath)) return;
  const index = readJson(indexPath);
  for (const city of index.cities || []) {
    const additions = pathsByCity.get(city.city_id);
    if (!additions) continue;
    city.artifact_paths = {
      ...(city.artifact_paths || {}),
      ...additions,
    };
  }
  writeJson(indexPath, index);
}

function main() {
  for (const [cityId, specs] of Object.entries(aliasSpecs)) {
    for (const spec of specs) syncAlias(cityId, spec);
  }

  const pathsByCity = new Map();
  for (const cityId of cityIds) {
    const additions = updateCityArtifactPaths(cityId);
    if (additions) pathsByCity.set(cityId, additions);
  }
  updateIndexArtifactPaths(pathsByCity);
  console.log("Synced current context aliases and advertised source-backed current-context artifact paths.");
}

main();
