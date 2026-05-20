const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "web/data/city-atlas/cities/belfast/civic_services_2026.geojson");

const INPUTS = [
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
];

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

  if (/\b(police|fire_station|ambulance_station|emergency|rescue|coast_guard|courthouse|prison)\b/.test(text)) return "safety";
  if (amenity === "hospital" || amenity === "clinic" || amenity === "doctors" || amenity === "dentist" || healthcare || /\b(health|hospital|clinic|gp|doctor|dentist|pharmacy|care|nursing|social_facility|trust)\b/.test(text)) return "health";
  if (amenity === "library" || /\b(library|museum|arts_centre|arts centre|gallery|theatre|culture|cultural|heritage)\b/.test(text)) return "libraries";
  if (amenity === "school" || amenity === "college" || amenity === "university" || amenity === "kindergarten" || /\b(school|college|university|education|campus|nursery|academy|primary)\b/.test(text) || ["school", "college", "university", "kindergarten"].includes(building)) return "civic_services";
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

function build() {
  const seen = new Set();
  const features = [];
  const sourcePaths = [];

  for (const input of INPUTS) {
    const absolute = path.join(ROOT, input.path);
    if (!fs.existsSync(absolute)) continue;
    sourcePaths.push(input.path);
    const payload = readJson(absolute);
    for (const [index, feature] of (payload.features || []).entries()) {
      const props = feature.properties || {};
      const serviceType = classifyService(props, input.defaultType);
      if (!serviceType) continue;
      const point = geometryPoint(feature.geometry);
      if (!point || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) continue;
      const sourceId = sourceIdFor(feature, input, index);
      const label = String(props.name || props.operator || SERVICE_LABELS[serviceType]).trim();
      const key = `${sourceId}|${serviceType}|${round(point[0], 6)}|${round(point[1], 6)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const rank = rankAnchor(props, serviceType, feature.geometry?.type || "");
      features.push({
        type: "Feature",
        properties: {
          id: `belfast-civic-service-${features.length + 1}`,
          layer: "civic_service_anchor",
          category: "civic_services",
          sublayer_id: serviceType,
          service_type: serviceType,
          label,
          name: label,
          color: SERVICE_COLORS[serviceType],
          source_id: sourceId,
          source_name: input.sourceName,
          publisher: input.publisher,
          source_type: input.sourceType,
          license: "Open Database License (ODbL); attribution required for OpenStreetMap contributors.",
          accessed_at: "2026-05-20",
          rank,
          original_geometry_type: feature.geometry?.type || "",
          geometry_source: feature.geometry?.type === "Point" ? "source point" : "centroid derived from source geometry",
          transformation_method: "Classified current mapped civic/service features into lens service groups, deduplicated by source id/type/location, and represented polygons/lines by centroid for dynamic catchment-guide generation.",
          caveat: "Current mapped service anchor only; not an official catchment, capacity, opening-date, quality, or entitlement boundary.",
        },
        geometry: { type: "Point", coordinates: [round(point[0]), round(point[1])] },
      });
    }
  }

  features.sort((a, b) =>
    String(a.properties.sublayer_id).localeCompare(String(b.properties.sublayer_id))
    || Number(b.properties.rank) - Number(a.properties.rank)
    || String(a.properties.label).localeCompare(String(b.properties.label)));

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify({
    type: "FeatureCollection",
    name: "belfast_civic_services_2026",
    metadata: {
      schema_version: "1.0.0",
      city_id: "belfast",
      generated_at: new Date().toISOString(),
      source_paths: sourcePaths,
      method: "Current OSM/public-service context anchors for the civic catchment lens. The frontend derives selected-event guide catchments from anchor proximity, service class, current-year event records, and active lens filters.",
      caveats: [
        "These are mapped current-service anchors, not official school, health, library, leisure, council, or emergency-service catchments.",
        "OSM mapped visibility may post-date selected timeline years.",
        "Centroids for polygons and lines are used only for dynamic guide geometry and labels.",
        "No capacity, demand, service quality, entitlement, or causal impact is inferred.",
      ],
      feature_layers: features.reduce((acc, feature) => {
        const key = feature.properties.sublayer_id;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    },
    features,
  }));

  console.log(`Wrote ${features.length} civic service anchors to ${path.relative(ROOT, OUTPUT)}`);
}

build();
