const fs = require("fs");
const path = require("path");
const {
  loadCityScopeBoundary,
  pointInBoundary,
} = require("./build_lens_overlays");

const ROOT = path.resolve(__dirname, "..");

const CITY_INPUTS = {
  belfast: {
    displayName: "Belfast",
    output: "web/data/city-atlas/cities/belfast/civic_services_2026.geojson",
    inputs: [
      {
        path: "data/2026/belfasteducation2026.geojson",
        sourceName: "Belfast education amenities from OpenStreetMap",
        publisher: "OpenStreetMap contributors",
        sourceType: "current mapped civic-service context",
        defaultType: "civic_services",
      },
      {
        path: "data/2026/belfasthealthcare2026.geojson",
        sourceName: "Belfast healthcare amenities from OpenStreetMap",
        publisher: "OpenStreetMap contributors",
        sourceType: "current mapped civic-service context",
        defaultType: "health",
      },
      {
        path: "data/2026/belfastpublicservices2026.geojson",
        sourceName: "Belfast public-service amenities from OpenStreetMap",
        publisher: "OpenStreetMap contributors",
        sourceType: "current mapped civic-service context",
        defaultType: "council",
      },
      {
        path: "data/derived/2026/belfast_ni_green_spaces_osm_2026.geojson",
        sourceName: "Belfast green and leisure spaces from OpenStreetMap",
        publisher: "OpenStreetMap contributors",
        sourceType: "current mapped leisure/open-space context",
        defaultType: "leisure",
      },
      {
        path: "data/derived/2026/belfast_ni_services_osm_2026.geojson",
        sourceName: "Belfast named service points from OpenStreetMap",
        publisher: "OpenStreetMap contributors",
        sourceType: "current mapped service context",
        defaultType: "",
      },
    ],
  },
  london: {
    displayName: "London",
    output: "web/data/city-atlas/cities/london/civic_services_2026.geojson",
    maxAnchorsBySublayer: {
      civic_services: 3000,
      health: 3000,
      leisure: 4500,
      libraries: 900,
      council: 900,
      safety: 700,
    },
    inputs: [
      {
        path: "data/derived/2026/london_civic_services_osm_2026.geojson",
        sourceName: "London civic-service amenities from OpenStreetMap",
        publisher: "OpenStreetMap contributors",
        sourceType: "current mapped civic-service context",
        defaultType: "",
      },
    ],
  },
  nyc: {
    displayName: "New York City",
    output: "web/data/city-atlas/cities/nyc/civic_services_2026.geojson",
    maxAnchorsBySublayer: {
      civic_services: 3000,
      health: 3000,
      leisure: 4500,
      libraries: 900,
      council: 900,
      safety: 700,
    },
    inputs: [
      {
        path: "data/derived/2026/nyc_civic_services_osm_2026.geojson",
        sourceName: "New York City civic-service amenities from OpenStreetMap",
        publisher: "OpenStreetMap contributors",
        sourceType: "current mapped civic-service context",
        defaultType: "",
      },
    ],
  },
};

const SERVICE_LABELS = {
  civic_services: "School or education service",
  health: "Health service",
  libraries: "Library or cultural service",
  leisure: "Leisure or open-space service",
  council: "Council or public office",
  safety: "Safety service",
};

const SERVICE_COLORS = {
  civic_services: "#178f8f",
  health: "#e85b1e",
  libraries: "#79419d",
  leisure: "#347db5",
  council: "#26858a",
  safety: "#8c5b3a",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function round(value, precision = 7) {
  const factor = 10 ** precision;
  return Math.round(Number(value) * factor) / factor;
}

function stableUnit(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function textFor(props) {
  return [
    props.name,
    props.amenity,
    props.healthcare,
    props.social_facility,
    props.office,
    props.government,
    props.building,
    props.leisure,
    props.landuse,
    props.shop,
    props.tourism,
    props.school,
    props.operator,
  ].filter(Boolean).join(" ").toLowerCase();
}

function classifyService(props, fallback) {
  const text = textFor(props);
  const amenity = String(props.amenity || "").toLowerCase();
  const healthcare = String(props.healthcare || "").toLowerCase();
  const leisure = String(props.leisure || "").toLowerCase();
  const office = String(props.office || "").toLowerCase();
  const building = String(props.building || "").toLowerCase();
  const landuse = String(props.landuse || "").toLowerCase();
  const shop = String(props.shop || "").toLowerCase();
  const tourism = String(props.tourism || "").toLowerCase();

  if (/\b(police|fire_station|ambulance_station|emergency|rescue|coast_guard|courthouse|prison)\b/.test(text)) return "safety";
  if (amenity === "hospital" || amenity === "clinic" || amenity === "doctors" || amenity === "dentist" || amenity === "pharmacy" || healthcare || /\b(health|hospital|clinic|gp|doctor|dentist|pharmacy|care|nursing|social_facility|trust)\b/.test(text)) return "health";
  if (amenity === "library" || tourism === "museum" || tourism === "gallery" || /\b(library|museum|arts_centre|arts centre|gallery|theatre|culture|cultural|heritage)\b/.test(text)) return "libraries";
  if (amenity === "school" || amenity === "college" || amenity === "university" || amenity === "kindergarten" || amenity === "childcare" || /\b(school|college|university|education|campus|nursery|academy|primary|childcare)\b/.test(text) || ["school", "college", "university", "kindergarten"].includes(building)) return "civic_services";
  if (/\b(police|fire)\b/.test(amenity)) return "safety";
  if (["sports_centre", "pitch", "playground", "park", "garden", "recreation_ground", "swimming_pool"].includes(leisure) || ["recreation_ground", "village_green", "grass"].includes(landuse) || /\b(leisure|sports?|park|playground|recreation|swimming|playing fields|garden|greenway)\b/.test(text)) return "leisure";
  if (office === "government" || amenity === "townhall" || amenity === "post_office" || /\b(council|city hall|municipal|government|ministry|public office|registry|community centre|community center)\b/.test(text)) return "council";

  if (fallback && SERVICE_LABELS[fallback] && !["post_box", "bench", "waste_basket", "atm", "telephone"].includes(amenity) && !shop) return fallback;
  return "";
}

function flattenCoordinates(geometry, output = []) {
  if (!geometry) return output;
  const coords = geometry.coordinates;
  if (!Array.isArray(coords)) return output;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    output.push(coords);
    return output;
  }
  for (const part of coords) flattenCoordinates({ coordinates: part }, output);
  return output;
}

function ringCentroid(ring) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  if (Math.abs(area) < 1e-12) return null;
  return [cx / (3 * area), cy / (3 * area)];
}

function geometryPoint(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates)) return geometry.coordinates;
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates?.[0])) {
    const centroid = ringCentroid(geometry.coordinates[0]);
    if (centroid) return centroid;
  }
  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
    let best = null;
    let bestCount = 0;
    for (const polygon of geometry.coordinates) {
      const ring = polygon?.[0] || [];
      if (ring.length > bestCount) {
        const centroid = ringCentroid(ring);
        if (centroid) {
          best = centroid;
          bestCount = ring.length;
        }
      }
    }
    if (best) return best;
  }
  const flat = flattenCoordinates(geometry);
  if (!flat.length) return null;
  const sum = flat.reduce((acc, coord) => [acc[0] + Number(coord[0] || 0), acc[1] + Number(coord[1] || 0)], [0, 0]);
  return [sum[0] / flat.length, sum[1] / flat.length];
}

function rankAnchor(props, serviceType, geometryType) {
  let rank = 1;
  if (props.name) rank += 1.15;
  if (props.operator) rank += 0.25;
  if (geometryType && geometryType !== "Point") rank += 0.5;
  if (serviceType === "health" && /\b(hospital|trust|clinic)\b/i.test(textFor(props))) rank += 0.9;
  if (serviceType === "civic_services" && /\b(university|college|campus)\b/i.test(textFor(props))) rank += 0.75;
  if (serviceType === "libraries" && /\b(library|museum|theatre)\b/i.test(textFor(props))) rank += 0.65;
  if (serviceType === "leisure" && /\b(park|sports centre|leisure)\b/i.test(textFor(props))) rank += 0.55;
  if (serviceType === "council" && /\b(city hall|council|government|ministry)\b/i.test(textFor(props))) rank += 0.7;
  if (serviceType === "safety" && /\b(police|fire)\b/i.test(textFor(props))) rank += 0.8;
  return round(Math.min(5, rank), 3);
}

function sourceIdFor(feature, input, index) {
  const props = feature.properties || {};
  return props.source_id || props.id || props["@id"] || `${input.path}#${index}`;
}

function sourceUrlFor(feature, sourceId) {
  const props = feature.properties || {};
  if (props.source_url) return props.source_url;
  const [type, id] = String(sourceId || "").split("/");
  if (/^(node|way|relation)$/.test(type || "") && /^\d+$/.test(id || "")) {
    return `https://www.openstreetmap.org/${type}/${id}`;
  }
  return "";
}

function originalGeometryTypeFor(feature) {
  const props = feature.properties || {};
  if (props.original_geometry_type) return props.original_geometry_type;
  if (props.osm_element_type) return `OSM ${props.osm_element_type}`;
  return feature.geometry?.type || "";
}

function geometrySourceFor(feature) {
  const props = feature.properties || {};
  if (props.geometry_source) return props.geometry_source;
  if (props.osm_element_type && props.osm_element_type !== "node") {
    return `Overpass center point derived from OSM ${props.osm_element_type}; original source object geometry was not stored in this snapshot.`;
  }
  return feature.geometry?.type === "Point" ? "source point" : "centroid derived from source geometry";
}

function selectedCities() {
  const selectors = [
    ...process.argv.slice(2),
    ...String(process.env.ONLY || "").split(","),
  ].map((item) => item.trim()).filter(Boolean);
  if (!selectors.length) return Object.keys(CITY_INPUTS);
  const selected = new Set(selectors);
  return Object.keys(CITY_INPUTS).filter((cityId) => selected.has(cityId));
}

function inputGeneratedAt(payload) {
  const meta = payload.metadata || {};
  return meta.fetched_at || meta.generatedAt || meta.generated_at || "";
}

function inputAccessedAt(payload) {
  const generatedAt = inputGeneratedAt(payload);
  return generatedAt ? String(generatedAt).slice(0, 10) : "";
}

function cityBoundsFor(config) {
  const cityPath = path.join(path.dirname(path.join(ROOT, config.output)), "city.json");
  if (!fs.existsSync(cityPath)) return null;
  const doc = readJson(cityPath);
  if (!Array.isArray(doc.bounds) || doc.bounds.length !== 4) return null;
  const [west, south, east, north] = doc.bounds.map(Number);
  if (![west, south, east, north].every(Number.isFinite)) return null;
  return { west, south, east, north };
}

function pointInBounds(point, bounds) {
  if (!bounds) return true;
  return point[0] >= bounds.west && point[0] <= bounds.east && point[1] >= bounds.south && point[1] <= bounds.north;
}

function cityScopeFilterMetadata(boundary, stats) {
  if (!boundary) return null;
  return {
    boundary_source_path: boundary.source_path,
    boundary_source_name: boundary.source_name,
    boundary_source_url: boundary.source_url,
    boundary_licence: boundary.licence,
    boundary_scope: boundary.boundary_scope,
    method: "Retains current mapped civic-service anchor points only when their normalized source point or centroid falls inside the official city boundary. Atlas bounds are used as a retrieval prefilter; the official boundary controls published city scope.",
    input_feature_count: stats.inputFeatureCount,
    classified_feature_count: stats.classifiedFeatureCount,
    usable_anchor_count_before_bounds: stats.usableAnchorCountBeforeBounds,
    dropped_out_of_bounds_feature_count: stats.droppedOutOfBoundsFeatureCount,
    candidate_anchor_count_before_boundary: stats.candidateAnchorCountBeforeBoundary,
    dropped_out_of_scope_feature_count: stats.droppedOutOfScopeFeatureCount,
    duplicate_anchor_count: stats.duplicateAnchorCount,
    kept_feature_count: stats.keptFeatureCount,
    emitted_feature_count: stats.emittedFeatureCount,
    boundary_feature_count: boundary.feature_count,
    boundary_polygon_count: boundary.polygon_count,
  };
}

function featureCountsBySublayer(features) {
  return features.reduce((acc, feature) => {
    const key = feature.properties?.sublayer_id || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function featurePoint(feature) {
  const coords = feature?.geometry?.coordinates;
  if (!Array.isArray(coords)) return null;
  const lon = Number(coords[0]);
  const lat = Number(coords[1]);
  return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null;
}

function thinningPriority(feature) {
  const props = feature.properties || {};
  const label = String(props.label || props.name || "");
  const generic = /^(school or|health service|leisure or|council or|library or|safety service)/i.test(label);
  const namedBoost = label && !generic ? 1 : 0;
  return Number(props.rank || 1) + namedBoost + stableUnit(props.source_id) * 0.01;
}

function thinFeatureGroup(group, limit) {
  if (!limit || group.length <= limit) return group;
  const points = group.map((feature) => featurePoint(feature)).filter(Boolean);
  if (!points.length) return group.slice(0, limit);
  const bounds = points.reduce((acc, point) => ({
    west: Math.min(acc.west, point[0]),
    east: Math.max(acc.east, point[0]),
    south: Math.min(acc.south, point[1]),
    north: Math.max(acc.north, point[1]),
  }), { west: Infinity, east: -Infinity, south: Infinity, north: -Infinity });
  const ranked = group.slice().sort((a, b) =>
    thinningPriority(b) - thinningPriority(a)
    || String(a.properties?.source_id || "").localeCompare(String(b.properties?.source_id || "")));
  const cells = Math.max(14, Math.ceil(Math.sqrt(limit * 1.55)));
  const selected = [];
  const selectedIds = new Set();
  const usedCells = new Set();
  const width = Math.max(1e-9, bounds.east - bounds.west);
  const height = Math.max(1e-9, bounds.north - bounds.south);
  for (const feature of ranked) {
    if (selected.length >= limit) break;
    const point = featurePoint(feature);
    if (!point) continue;
    const cellX = Math.max(0, Math.min(cells - 1, Math.floor(((point[0] - bounds.west) / width) * cells)));
    const cellY = Math.max(0, Math.min(cells - 1, Math.floor(((point[1] - bounds.south) / height) * cells)));
    const cellKey = `${cellX}:${cellY}`;
    if (usedCells.has(cellKey)) continue;
    usedCells.add(cellKey);
    selected.push(feature);
    selectedIds.add(feature.properties?.id);
  }
  for (const feature of ranked) {
    if (selected.length >= limit) break;
    if (selectedIds.has(feature.properties?.id)) continue;
    selected.push(feature);
    selectedIds.add(feature.properties?.id);
  }
  return selected;
}

function applyCitywideThinning(features, config) {
  const limits = config.maxAnchorsBySublayer || {};
  if (!Object.keys(limits).length) return { features, before: featureCountsBySublayer(features), after: featureCountsBySublayer(features), applied: false };
  const output = [];
  for (const [sublayerId, group] of Object.entries(features.reduce((acc, feature) => {
    const key = feature.properties?.sublayer_id || "unknown";
    acc[key] = acc[key] || [];
    acc[key].push(feature);
    return acc;
  }, {}))) {
    output.push(...thinFeatureGroup(group, Number(limits[sublayerId] || 0)));
  }
  output.sort(featureSort);
  return { features: output, before: featureCountsBySublayer(features), after: featureCountsBySublayer(output), applied: true };
}

function featureSort(a, b) {
  return String(a.properties.sublayer_id).localeCompare(String(b.properties.sublayer_id))
    || Number(b.properties.rank) - Number(a.properties.rank)
    || String(a.properties.label).localeCompare(String(b.properties.label));
}

function buildCity(cityId, config) {
  const seen = new Set();
  const features = [];
  const sourcePaths = [];
  const inputGeneratedAts = [];
  const sourceMetadata = [];
  const bounds = cityBoundsFor(config);
  const boundary = loadCityScopeBoundary(cityId);
  const output = path.join(ROOT, config.output);
  const stats = {
    inputFeatureCount: 0,
    classifiedFeatureCount: 0,
    usableAnchorCountBeforeBounds: 0,
    droppedOutOfBoundsFeatureCount: 0,
    candidateAnchorCountBeforeBoundary: 0,
    droppedOutOfScopeFeatureCount: 0,
    duplicateAnchorCount: 0,
    keptFeatureCount: 0,
    emittedFeatureCount: 0,
  };

  for (const input of config.inputs) {
    const absolute = path.join(ROOT, input.path);
    if (!fs.existsSync(absolute)) continue;
    sourcePaths.push(input.path);
    const payload = readJson(absolute);
    if (payload.metadata) sourceMetadata.push(payload.metadata);
    const generatedAt = inputGeneratedAt(payload);
    const accessedAt = inputAccessedAt(payload);
    if (generatedAt) inputGeneratedAts.push(generatedAt);
    for (const [index, feature] of (payload.features || []).entries()) {
      stats.inputFeatureCount += 1;
      const props = feature.properties || {};
      const serviceType = classifyService(props, input.defaultType);
      if (!serviceType) continue;
      stats.classifiedFeatureCount += 1;
      const point = geometryPoint(feature.geometry);
      if (!point || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) continue;
      stats.usableAnchorCountBeforeBounds += 1;
      if (!pointInBounds(point, bounds)) {
        stats.droppedOutOfBoundsFeatureCount += 1;
        continue;
      }
      stats.candidateAnchorCountBeforeBoundary += 1;
      if (boundary && !pointInBoundary(point, boundary)) {
        stats.droppedOutOfScopeFeatureCount += 1;
        continue;
      }
      const sourceId = sourceIdFor(feature, input, index);
      const sourceUrl = sourceUrlFor(feature, sourceId);
      const label = String(props.name || props.operator || SERVICE_LABELS[serviceType]).trim();
      const key = `${sourceId}|${serviceType}|${round(point[0], 6)}|${round(point[1], 6)}`;
      if (seen.has(key)) {
        stats.duplicateAnchorCount += 1;
        continue;
      }
      seen.add(key);
      const rank = rankAnchor(props, serviceType, feature.geometry?.type || "");
      features.push({
        type: "Feature",
        properties: {
          id: `${cityId}-civic-service-${features.length + 1}`,
          layer: "civic_service_anchor",
          category: "civic_services",
          sublayer_id: serviceType,
          service_type: serviceType,
          label,
          name: label,
          color: SERVICE_COLORS[serviceType],
          source_id: sourceId,
          source_object_id: props.source_object_id || sourceId,
          source_registry_id: props.source_registry_id || "osm-overpass",
          source_url: sourceUrl,
          osm_element_type: props.osm_element_type || "",
          source_name: input.sourceName,
          publisher: input.publisher,
          source_type: input.sourceType,
          license: "Open Database License (ODbL); attribution required for OpenStreetMap contributors.",
          accessed_at: accessedAt || "2026-05-20",
          rank,
          original_geometry_type: originalGeometryTypeFor(feature),
          geometry_source: geometrySourceFor(feature),
          transformation_method: "Classified current mapped civic/service features into lens service groups, deduplicated by source id/type/location, and represented non-point source objects by the source snapshot's center or centroid proxy for dynamic catchment-guide generation.",
          caveat: "Current mapped service anchor only; not an official catchment, capacity, opening-date, quality, or entitlement boundary.",
        },
        geometry: { type: "Point", coordinates: [round(point[0]), round(point[1])] },
      });
    }
  }

  if (!sourcePaths.length) {
    if (fs.existsSync(output)) {
      console.log(`Preserving existing ${path.relative(ROOT, output)}; source input(s) missing. Run npm run fetch:civic-services-osm first to refresh this artifact.`);
      return;
    }
    throw new Error(`${cityId} civic-service context source input(s) are missing: ${config.inputs.map((input) => input.path).join(", ")}`);
  }

  features.sort(featureSort);
  stats.keptFeatureCount = features.length;
  const thinning = applyCitywideThinning(features, config);
  stats.emittedFeatureCount = thinning.features.length;

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify({
    type: "FeatureCollection",
    name: `${cityId}_civic_services_2026`,
    metadata: {
      schema_version: "1.0.0",
      city_id: cityId,
      generated_at: inputGeneratedAts.sort().at(-1) || new Date().toISOString(),
      context_data_year: "2026",
      source_paths: sourcePaths,
      source_metadata: sourceMetadata,
      city_scope_filter: cityScopeFilterMetadata(boundary, stats),
      method: `Current OSM/public-service context anchors for the ${config.displayName} civic catchment lens. The frontend derives selected-event guide catchments from anchor proximity, service class, current-year event records, and active lens filters.`,
      caveats: [
        "These are mapped current-service anchors, not official school, health, library, leisure, council, or emergency-service catchments.",
        "OSM mapped visibility may post-date selected timeline years.",
        "Centroids for polygons and lines are used only for dynamic guide geometry and labels.",
        "No capacity, demand, service quality, entitlement, or causal impact is inferred.",
      ],
      feature_layers: thinning.after,
      feature_layers_before_thinning: thinning.before,
      thinning_method: thinning.applied
        ? "Deterministic citywide grid-and-rank thinning keeps source-backed anchors distributed across the whole city while avoiding chaotic frontend density; selected anchors remain real OSM source objects."
        : "",
    },
    features: thinning.features,
  }));

  console.log(`Wrote ${thinning.features.length} civic service anchors to ${path.relative(ROOT, output)}`);
}

for (const cityId of selectedCities()) {
  buildCity(cityId, CITY_INPUTS[cityId]);
}
