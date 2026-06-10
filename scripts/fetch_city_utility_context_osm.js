const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OBSERVED_YEAR = 2026;
const ATLAS_INDEX = path.join(ROOT, "web", "data", "city-atlas", "index.json");
const OUT_DIR = path.join(ROOT, "data", "derived", String(OBSERVED_YEAR));
const OVERPASS_URL = process.env.OVERPASS_ENDPOINT || "https://overpass-api.de/api/interpreter";
const BELFAST_MIXED_UTILITY_BOUNDS = [-6.08, 54.5, -5.76, 54.68];
const PRESERVED_OSM_TAG_KEYS = [
  "power",
  "voltage",
  "operator",
  "cables",
  "circuits",
  "frequency",
  "route",
  "substation",
  "generator:source",
  "plant:source",
  "utility",
  "pipeline",
  "substance",
  "waterway",
  "man_made",
  "telecom",
  "communication",
  "tower:type",
  "water",
  "natural",
  "ref",
  "location",
  "material",
  "diameter",
];

const BOUNDARY_SOURCES = {
  belfast: {
    path: "data/raw/boundaries/belfast_osni_lgd_boundary_2012.geojson",
    name: "OSNI Local Government District boundary for Belfast",
    source_url: "https://www.opendatani.gov.uk/",
    license: "Open Government Licence v3.0.",
    scope: "Belfast Local Government District boundary used to scope current OSM utility context.",
  },
  london: {
    path: "data/raw/boundaries/london_ons_region_boundary_2024.geojson",
    name: "Regions (December 2024) Boundaries EN BGC",
    source_url: "https://ckan.publishing.service.gov.uk/dataset/regions-december-2024-boundaries-en-bgc",
    license: "Open Government Licence v3.0; contains Ordnance Survey and ONS intellectual property rights.",
    scope: "Greater London region E12000007, December 2024, generalised 20m and clipped to coastline.",
  },
  nyc: {
    path: "data/raw/boundaries/nyc_borough_boundaries_2026.geojson",
    name: "Borough Boundaries",
    source_url: "https://catalog.data.gov/dataset/borough-boundaries",
    license: "NYC Open Data Terms of Use.",
    scope: "New York City borough boundaries, water areas excluded, current version 26a.",
  },
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function relativePath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function outputPathForCity(cityId) {
  const name = cityId === "belfast"
    ? `belfast_ni_utility_context_osm_${OBSERVED_YEAR}.geojson`
    : `${cityId}_utility_context_osm_${OBSERVED_YEAR}.geojson`;
  return path.join(OUT_DIR, name);
}

function overpassQuery(bounds, cityId) {
  const [west, south, east, north] = bounds.map(Number);
  const bbox = `${south},${west},${north},${east}`;
  if (cityId === "belfast") {
    return `[out:json][timeout:240];
(
  nwr["telecom"](${bbox});
  nwr["communication"](${bbox});
  nwr["tower:type"="communication"](${bbox});
  nwr["man_made"="communications_tower"](${bbox});
  nwr["pipeline"~"gas|sewer|drain"](${bbox});
  nwr["substance"="gas"](${bbox});
  nwr["utility"="gas"](${bbox});
  nwr["waterway"~"drain|ditch"](${bbox});
  nwr["man_made"~"wastewater_plant|storm_drain|sewerage"](${bbox});
);
out tags meta geom qt;`;
  }
  return `[out:json][timeout:240];
(
  nwr["power"~"^(line|minor_line|cable|substation|transformer|plant|generator|tower|portal|terminal)$"](${bbox});
  nwr["utility"~"^(water|gas|sewer|drain|telecom|power)$"](${bbox});
  nwr["pipeline"~"^(water|gas|sewer|drain)$"](${bbox});
  nwr["substance"~"^(water|gas|sewage)$"](${bbox});
  nwr["waterway"~"^(drain|ditch|canal|stream|river)$"](${bbox});
  nwr["man_made"~"^(water_works|wastewater_plant|reservoir_covered|storage_tank|communications_tower|mast|water_tower|storm_drain|sewerage)$"](${bbox});
  nwr["telecom"](${bbox});
  nwr["communication"](${bbox});
  nwr["tower:type"="communication"](${bbox});
);
out tags meta geom qt;`;
}

async function postOverpass(query) {
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent": "OpenCityLog/0.1 citywide-utility-context contact=local-codex",
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!response.ok) throw new Error(`Overpass ${response.status}: ${await response.text()}`);
  return response.json();
}

function classifyUtility(tags = {}) {
  const text = Object.entries(tags)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ")
    .toLowerCase();
  if (/power=|utility=power/.test(text)) {
    return { utilityType: "electricity", role: tags.power || tags.utility || tags.route || "power" };
  }
  if (/substance=gas|pipeline=gas|utility=gas|\bgas=/.test(text)) {
    return { utilityType: "gas", role: tags.pipeline || tags.substance || tags.utility || "gas" };
  }
  if (/waterway=(drain|ditch)|pipeline=(sewer|drain)|utility=(sewer|drain)|substance=sewage|wastewater|storm_drain|sewerage/.test(text)) {
    return {
      utilityType: "drainage",
      role: tags.waterway || tags.pipeline || tags.utility || tags.man_made || tags.substance || "drainage",
    };
  }
  if (/pipeline=water|substance=water|utility=water|water_works|water_tower|reservoir_covered/.test(text)) {
    return { utilityType: "water", role: tags.pipeline || tags.substance || tags.man_made || tags.water || "water" };
  }
  if (/waterway=(canal|stream|river)/.test(text)) {
    return { utilityType: "water", role: tags.waterway || "waterway" };
  }
  if (/telecom|communication|communications_tower|man_made=mast/.test(text)) {
    return {
      utilityType: "telecoms",
      role: tags.telecom || tags.communication || tags["tower:type"] || tags.man_made || "telecoms",
    };
  }
  return null;
}

function osmSourceId(element) {
  return `${element.type}/${element.id}`;
}

function osmUrl(element) {
  return `https://www.openstreetmap.org/${osmSourceId(element)}`;
}

function preservedOsmTags(tags = {}) {
  const preserved = {};
  for (const key of PRESERVED_OSM_TAG_KEYS) {
    if (tags[key] !== undefined && tags[key] !== null && String(tags[key]).trim() !== "") {
      preserved[key] = tags[key];
    }
  }
  return preserved;
}

function ringFromWayGeometry(geometry) {
  const coords = geometry.map((point) => [Number(point.lon), Number(point.lat)])
    .filter((coord) => Number.isFinite(coord[0]) && Number.isFinite(coord[1]));
  if (!coords.length) return [];
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
  return coords;
}

function coordinatesFromOverpassGeometry(geometry) {
  return (geometry || [])
    .map((point) => [Number(point.lon), Number(point.lat)])
    .filter((coord) => Number.isFinite(coord[0]) && Number.isFinite(coord[1]));
}

function isClosedLine(coords) {
  if (!Array.isArray(coords) || coords.length < 4) return false;
  const first = coords[0];
  const last = coords[coords.length - 1];
  return first?.[0] === last?.[0] && first?.[1] === last?.[1];
}

function coordinateKey(coord) {
  return Array.isArray(coord) ? `${coord[0]},${coord[1]}` : "";
}

function joinableLineEndpoints(a, b) {
  return {
    aStart: coordinateKey(a[0]),
    aEnd: coordinateKey(a[a.length - 1]),
    bStart: coordinateKey(b[0]),
    bEnd: coordinateKey(b[b.length - 1]),
  };
}

function stitchedClosedMembers(members) {
  const remaining = members.map((member) => ({
    role: member.role,
    coords: member.coords.slice(),
  }));
  const closed = [];
  while (remaining.length) {
    const current = remaining.shift();
    let coords = current.coords.slice();
    let changed = true;
    while (!isClosedLine(coords) && changed) {
      changed = false;
      for (let index = 0; index < remaining.length; index += 1) {
        const candidate = remaining[index];
        if (candidate.role !== current.role) continue;
        const endpoints = joinableLineEndpoints(coords, candidate.coords);
        if (endpoints.aEnd && endpoints.aEnd === endpoints.bStart) {
          coords = coords.concat(candidate.coords.slice(1));
        } else if (endpoints.aEnd && endpoints.aEnd === endpoints.bEnd) {
          coords = coords.concat(candidate.coords.slice(0, -1).reverse());
        } else if (endpoints.aStart && endpoints.aStart === endpoints.bEnd) {
          coords = candidate.coords.slice(0, -1).concat(coords);
        } else if (endpoints.aStart && endpoints.aStart === endpoints.bStart) {
          coords = candidate.coords.slice(1).reverse().concat(coords);
        } else {
          continue;
        }
        remaining.splice(index, 1);
        changed = true;
        break;
      }
    }
    if (isClosedLine(coords)) closed.push({ role: current.role, coords });
  }
  return closed;
}

function ringContainsPoint(point, ring) {
  const x = Number(point?.[0]);
  const y = Number(point?.[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Array.isArray(ring) || ring.length < 4) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = Number(ring[i]?.[0]);
    const yi = Number(ring[i]?.[1]);
    const xj = Number(ring[j]?.[0]);
    const yj = Number(ring[j]?.[1]);
    if (![xi, yi, xj, yj].every(Number.isFinite)) continue;
    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function relationGeometryFromMembers(element, classification) {
  if (element.type !== "relation" || !Array.isArray(element.members)) return null;
  const tags = element.tags || {};
  const memberLines = element.members
    .map((member) => ({
      role: String(member.role || "").toLowerCase(),
      coords: coordinatesFromOverpassGeometry(member.geometry),
    }))
    .filter((member) => member.coords.length >= 2);
  const lines = memberLines.map((member) => member.coords);
  if (!lines.length) return null;
  const closedMembers = stitchedClosedMembers(memberLines);
  const isArea = closedMembers.length && (
    tags.type === "multipolygon"
    || /plant|substation|exchange|central_office|reservoir|works|water_tower|storage_tank/.test(String(classification.role || ""))
  );
  if (isArea) {
    const outers = closedMembers.filter((member) => member.role !== "inner");
    const inners = closedMembers.filter((member) => member.role === "inner");
    const polygons = (outers.length ? outers : closedMembers).map((member) => [member.coords]);
    for (const inner of inners) {
      const point = inner.coords[0];
      const containing = polygons.find((polygon) => ringContainsPoint(point, polygon[0]));
      if (containing) containing.push(inner.coords);
    }
    if (polygons.length === 1) return { type: "Polygon", coordinates: polygons[0] };
    return { type: "MultiPolygon", coordinates: polygons };
  }
  if (lines.length === 1) return { type: "LineString", coordinates: lines[0] };
  return { type: "MultiLineString", coordinates: lines };
}

function geometryFromElement(element, classification) {
  if (element.type === "node" && Number.isFinite(element.lon) && Number.isFinite(element.lat)) {
    return { type: "Point", coordinates: [element.lon, element.lat] };
  }
  if (Array.isArray(element.geometry) && element.geometry.length >= 2) {
    const coords = element.geometry
      .map((point) => [Number(point.lon), Number(point.lat)])
      .filter((coord) => Number.isFinite(coord[0]) && Number.isFinite(coord[1]));
    if (coords.length < 2) return null;
    const first = coords[0];
    const last = coords[coords.length - 1];
    const isClosed = first && last && first[0] === last[0] && first[1] === last[1];
    const tags = element.tags || {};
    const isArea = isClosed && (
      tags.area === "yes"
      || /plant|substation|exchange|central_office|reservoir|works|water_tower|storage_tank/.test(String(classification.role || ""))
      || ["Polygon", "MultiPolygon"].includes(String(tags.type || ""))
    );
    if (isArea) return { type: "Polygon", coordinates: [ringFromWayGeometry(element.geometry)] };
    return { type: "LineString", coordinates: coords };
  }
  const relationGeometry = relationGeometryFromMembers(element, classification);
  if (relationGeometry) return relationGeometry;
  if (element.bounds) {
    const lon = (Number(element.bounds.minlon) + Number(element.bounds.maxlon)) / 2;
    const lat = (Number(element.bounds.minlat) + Number(element.bounds.maxlat)) / 2;
    if (Number.isFinite(lon) && Number.isFinite(lat)) return { type: "Point", coordinates: [lon, lat] };
  }
  return null;
}

function polygonRings(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return Array.isArray(geometry.coordinates) ? [geometry.coordinates] : [];
  if (geometry.type === "MultiPolygon") return Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
  return [];
}

function boundaryRings(cityId) {
  const source = BOUNDARY_SOURCES[cityId];
  if (!source) return [];
  const payload = readJson(path.join(ROOT, source.path));
  return (payload.features || []).flatMap((feature) => polygonRings(feature.geometry));
}

function pointInRing(point, ring) {
  return ringContainsPoint(point, ring);
}

function pointInPolygon(point, rings) {
  const outer = rings?.[0];
  if (!pointInRing(point, outer)) return false;
  return !rings.slice(1).some((ring) => pointInRing(point, ring));
}

function pointInBoundary(point, polygons) {
  return polygons.some((rings) => pointInPolygon(point, rings));
}

function geometryCoordinates(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Point") return [geometry.coordinates];
  if (geometry.type === "MultiPoint" || geometry.type === "LineString") return geometry.coordinates || [];
  if (geometry.type === "MultiLineString" || geometry.type === "Polygon") return (geometry.coordinates || []).flat();
  if (geometry.type === "MultiPolygon") return (geometry.coordinates || []).flat(2);
  return [];
}

function lineSegments(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return [];
  const segments = [];
  for (let index = 1; index < coordinates.length; index += 1) {
    const start = coordinates[index - 1];
    const end = coordinates[index];
    if (Array.isArray(start) && Array.isArray(end)) segments.push([start, end]);
  }
  return segments;
}

function geometrySegments(geometry) {
  if (!geometry) return [];
  if (geometry.type === "LineString") return lineSegments(geometry.coordinates || []);
  if (geometry.type === "MultiLineString") return (geometry.coordinates || []).flatMap(lineSegments);
  if (geometry.type === "Polygon") return (geometry.coordinates || []).flatMap(lineSegments);
  if (geometry.type === "MultiPolygon") return (geometry.coordinates || []).flatMap((polygon) => polygon.flatMap(lineSegments));
  return [];
}

function orientation(a, b, c) {
  const ax = Number(a?.[0]);
  const ay = Number(a?.[1]);
  const bx = Number(b?.[0]);
  const by = Number(b?.[1]);
  const cx = Number(c?.[0]);
  const cy = Number(c?.[1]);
  if (![ax, ay, bx, by, cx, cy].every(Number.isFinite)) return NaN;
  const value = (by - ay) * (cx - bx) - (bx - ax) * (cy - by);
  if (Math.abs(value) < 1e-12) return 0;
  return value > 0 ? 1 : 2;
}

function onSegment(a, b, c) {
  const ax = Number(a?.[0]);
  const ay = Number(a?.[1]);
  const bx = Number(b?.[0]);
  const by = Number(b?.[1]);
  const cx = Number(c?.[0]);
  const cy = Number(c?.[1]);
  if (![ax, ay, bx, by, cx, cy].every(Number.isFinite)) return false;
  return bx <= Math.max(ax, cx) + 1e-12
    && bx + 1e-12 >= Math.min(ax, cx)
    && by <= Math.max(ay, cy) + 1e-12
    && by + 1e-12 >= Math.min(ay, cy);
}

function segmentsIntersect(a, b, c, d) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);
  if (![o1, o2, o3, o4].every(Number.isFinite)) return false;
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(a, c, b)) return true;
  if (o2 === 0 && onSegment(a, d, b)) return true;
  if (o3 === 0 && onSegment(c, a, d)) return true;
  if (o4 === 0 && onSegment(c, b, d)) return true;
  return false;
}

function boundarySegments(polygons) {
  return polygons.flatMap((polygon) => polygon.flatMap(lineSegments));
}

function boundaryOuterVertices(polygons) {
  return polygons.flatMap((polygon) => polygon[0] || []);
}

function geometryContainsBoundaryVertex(geometry, boundaryPolygons) {
  const sourcePolygons = polygonRings(geometry);
  if (!sourcePolygons.length) return false;
  return boundaryOuterVertices(boundaryPolygons).some((coord) => pointInBoundary(coord, sourcePolygons));
}

function geometryIntersectsBoundary(geometry, polygons) {
  if (!polygons.length) return true;
  if (geometryCoordinates(geometry).some((coord) => pointInBoundary(coord, polygons))) return true;
  const segments = geometrySegments(geometry);
  if (segments.length) {
    const edges = boundarySegments(polygons);
    if (segments.some(([start, end]) => edges.some(([edgeStart, edgeEnd]) => segmentsIntersect(start, end, edgeStart, edgeEnd)))) return true;
  }
  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") return geometryContainsBoundaryVertex(geometry, polygons);
  return false;
}

function normaliseElement(cityId, element, index, rings, accessedAt) {
  const tags = element.tags || {};
  const classification = classifyUtility(tags);
  if (!classification) return null;
  const geometry = geometryFromElement(element, classification);
  if (!geometry || !geometryIntersectsBoundary(geometry, rings)) return null;
  const sourceId = osmSourceId(element);
  const name = tags.name || tags.operator || tags.ref || classification.role;
  return {
    type: "Feature",
    id: `utility-context-${cityId}-${OBSERVED_YEAR}-${index}`,
    properties: {
      id: `utility-context-${cityId}-${OBSERVED_YEAR}-${index}`,
      source_id: sourceId,
      source_registry_id: "osm-overpass",
      source_object_id: sourceId,
      source_name: "OpenStreetMap utility context via local derived extract",
      publisher: "OpenStreetMap contributors",
      source_url: osmUrl(element),
      source_type: "open geospatial extract",
      license: "ODbL-1.0",
      accessed_at: accessedAt,
      transformation_method: "scripts/fetch_city_utility_context_osm.js#normaliseElement",
      geometry_source: "OpenStreetMap element geometry retained when at least one source vertex falls inside, or a source segment crosses, the official city boundary.",
      original_geometry_type: geometry.type,
      city_id: cityId,
      observed_year: OBSERVED_YEAR,
      context_year: OBSERVED_YEAR,
      category: "utilities",
      utility_type: classification.utilityType,
      network_role: String(classification.role || "").toLowerCase(),
      name: name || "",
      osm_type: element.type,
      osm_element_type: element.type,
      osm_id: element.id,
      osm_timestamp: element.timestamp || "",
      osm_version: element.version || null,
      osm_changeset: element.changeset || null,
      changeset_url: element.changeset ? `https://www.openstreetmap.org/changeset/${element.changeset}` : "",
      confidence: "inferred",
      caveat: "Current OSM mapped context; not a confirmed installation date, capacity measurement, outage state, or service-availability claim.",
      ...preservedOsmTags(tags),
    },
    geometry,
  };
}

async function fetchCity(city) {
  const cityId = city.city_id;
  const cityConfig = readJson(path.join(ROOT, city.artifact_paths.city));
  if (!Array.isArray(cityConfig.bounds) || cityConfig.bounds.length !== 4) {
    throw new Error(`${cityId} is missing bounds`);
  }
  const queryBounds = cityId === "belfast" ? BELFAST_MIXED_UTILITY_BOUNDS : cityConfig.bounds;
  const outputPath = outputPathForCity(cityId);
  if (fs.existsSync(outputPath) && process.env.CACHE === "1" && process.env.FORCE !== "1") {
    const cached = readJson(outputPath);
    console.log(`${cityId}: cached ${cached.features?.length || 0} utility context feature(s)`);
    return;
  }
  const rings = cityId === "belfast" ? [] : boundaryRings(cityId);
  console.log(`${cityId}: querying Overpass utility context`);
  const payload = await postOverpass(overpassQuery(queryBounds, cityId));
  const rawElements = Array.isArray(payload.elements) ? payload.elements : [];
  const accessedAt = new Date().toISOString();
  const features = rawElements
    .map((element, index) => normaliseElement(cityId, element, index, rings, accessedAt))
    .filter(Boolean)
    .sort((a, b) => String(a.properties.source_id).localeCompare(String(b.properties.source_id)));
  const boundary = BOUNDARY_SOURCES[cityId] || null;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({
    type: "FeatureCollection",
    name: `${cityId}_utility_context_osm_${OBSERVED_YEAR}`,
    metadata: {
      schema_version: "1.0.0",
      city_id: cityId,
      observed_year: OBSERVED_YEAR,
      generated_at: accessedAt,
      source: "OpenStreetMap via Overpass API",
      source_url: OVERPASS_URL,
      overpass_timestamp_osm_base: payload.osm3s?.timestamp_osm_base || null,
      bounds: queryBounds,
      input_element_count: rawElements.length,
      kept_feature_count: features.length,
      dropped_out_of_scope_or_unusable_count: rawElements.length - features.length,
      city_scope_filter: boundary ? {
        boundary_source_path: boundary.path,
        boundary_source_name: boundary.name,
        boundary_source_url: boundary.source_url,
        boundary_licence: boundary.license,
        boundary_scope: boundary.scope,
        method: cityId === "belfast"
          ? "Belfast retains the established mixed utility sidecar from the city bounds query, while dedicated Belfast water and power extracts are combined separately. The boundary metadata scopes atlas interpretation; OSM remains the utility-geometry source."
          : "Retains current OSM utility features when at least one source geometry vertex falls inside the official city boundary. The boundary scopes visual context; OSM remains the utility-geometry source.",
      } : null,
      method: "Fetched current OSM utility context tags for OpenCityLog utility lenses. These records are current mapped context only and do not create selected-year utility events.",
      caveats: [
        "OSM mapped visibility is not a confirmed installation/opening date.",
        "The artifact does not contain measured utility capacity, outage state, or service availability.",
        "Point utility assets may be used by the frontend to derive nearby inspection traces along mapped streets; those traces are visual context only.",
      ],
    },
    features,
  })}\n`);
  console.log(`${cityId}: wrote ${features.length}/${rawElements.length} utility context feature(s) -> ${relativePath(outputPath)}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const atlas = readJson(ATLAS_INDEX);
  const only = new Set(String(process.env.ONLY || "").split(",").map((item) => item.trim()).filter(Boolean));
  for (const city of atlas.cities || []) {
    if (only.size && !only.has(city.city_id)) continue;
    await fetchCity(city);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  classifyUtility,
  geometryFromElement,
  geometryIntersectsBoundary,
  pointInBoundary,
  pointInRing,
  pointInPolygon,
  polygonRings,
};
