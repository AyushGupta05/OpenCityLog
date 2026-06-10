const fs = require("fs");
const path = require("path");
const {
  LENS_DEFINITIONS,
  eventWithholdsMapGeometry,
  licenseNeedsReview,
  sourceHasMinimumLicense,
  sourceWithholdsMapGeometry,
} = require("../lib/atlas-lenses");

const rootDir = path.resolve(__dirname, "..");
const atlasIndexPath = path.join(rootDir, "web", "data", "city-atlas", "index.json");

const CATEGORY_COLORS = {
  built_environment: "#d8a64e",
  transport: "#62d3d7",
  environment: "#75c69b",
  civic_services: "#74bddb",
  economy: "#a58bd4",
  utilities: "#d28a8a",
};

const LENS_CATEGORIES = new Set([
  "built_environment",
  "transport",
  "environment",
  "civic_services",
  "economy",
  "utilities",
]);

const HOTSPOT_CELL_DEG = 0.01;
const BOUNDARY_EDGE_INDEX_CELL_DEG = 0.01;
const ROAD_INDEX_CELL_DEG = 0.018;
const TRAFFIC_EVENT_RADIUS_KM = 0.85;
const TRAFFIC_WINDOW_YEARS = 2;
const LENS_CELL_CONFIGS = {
  built_environment: {
    layer: "planning_cell",
    sizeM: 95,
    label: "planning and built",
    kindField: "lifecycle_status",
  },
  civic_services: {
    layer: "civic_coverage_cell",
    sizeM: 260,
    label: "civic service",
    kindField: "service_type",
  },
  economy: {
    layer: "economy_activity_cell",
    sizeM: 120,
    label: "economy",
    kindField: "sector",
  },
};
const FRONTAGE_TRACE_RADIUS_KM = 0.55;
const UTILITY_TRACE_RADIUS_KM = 0.62;
const LENS_YEAR_CONTRACT_START = 2007;
const LENS_YEAR_CONTRACT_END = 2026;
const CITY_SCOPE_BOUNDARY_SOURCES = {
  belfast: {
    path: "data/raw/boundaries/belfast_osni_lgd_boundary_2012.geojson",
    source_name: "OSNI Open Data - Largescale Boundaries - Local Government Districts (2012)",
    source_url: "https://ckan.publishing.service.gov.uk/dataset/osni-open-data-largescale-boundaries-local-government-districts-20123",
    licence: "UK Open Government Licence (OGL) v3.0; contains Ordnance Survey of Northern Ireland data.",
  },
  london: {
    path: "data/raw/boundaries/london_ons_region_boundary_2024.geojson",
    source_name: "Regions (December 2024) Boundaries EN BGC",
    source_url: "https://ckan.publishing.service.gov.uk/dataset/regions-december-2024-boundaries-en-bgc",
    licence: "Open Government Licence v3.0; contains Ordnance Survey and ONS intellectual property rights.",
  },
  nyc: {
    path: "data/raw/boundaries/nyc_borough_boundaries_2026.geojson",
    source_name: "Borough Boundaries",
    source_url: "https://catalog.data.gov/dataset/borough-boundaries",
    licence: "NYC Open Data Terms of Use.",
  },
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  const text = `${JSON.stringify(value)}\n`;
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      fs.writeFileSync(tmpPath, text, "utf8");
      try {
        fs.renameSync(tmpPath, filePath);
      } catch (renameError) {
        if (!["EPERM", "EACCES", "EEXIST"].includes(renameError.code)) {
          throw renameError;
        }
        fs.copyFileSync(tmpPath, filePath);
        fs.unlinkSync(tmpPath);
      }
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

function sourceByIdFromCity(paths) {
  const sourcesPath = paths.sources ? path.join(rootDir, paths.sources) : null;
  if (!sourcesPath || !fs.existsSync(sourcesPath)) return new Map();
  const payload = readJson(sourcesPath);
  return new Map((payload.sources || []).map((source) => [source.source_id, source]));
}

function eventHasCompatibleSources(event, sourceById) {
  const ids = event.sourceIds || event.source_ids || [];
  const sources = ids.map((sourceId) => sourceById.get(sourceId));
  return sources.length > 0
    && sources.every((source) => sourceHasMinimumLicense(source) && !licenseNeedsReview(source));
}

function eventHasMapEligibleSources(event, sourceById) {
  const ids = event.sourceIds || event.source_ids || [];
  return eventHasCompatibleSources(event, sourceById)
    && !eventWithholdsMapGeometry(event)
    && ids.every((sourceId) => !sourceWithholdsMapGeometry(sourceById.get(sourceId)));
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function categoryFromText(value) {
  const text = String(value || "").toLowerCase();
  if (!text) return "";
  if (text === "traffic" || text === "mobility" || text === "transport" || text === "public_transport") return "transport";
  if (text === "planning" || text === "buildings" || text === "building" || text === "built_environment") return "built_environment";
  if (text === "services" || text === "public_services" || text === "civic" || text === "civic_services") return "civic_services";
  if (text === "jobs" || text === "business" || text === "economy") return "economy";
  if (text === "green_space" || text === "environment") return "environment";
  if (text === "electricity" || text === "utilities") return "utilities";
  return "";
}

function normalizeCategory(value, lens, signals = []) {
  const explicitCategory = categoryFromText(value);
  if (explicitCategory) return explicitCategory;
  const lensCategory = categoryFromText(lens);
  if (lensCategory) return lensCategory;
  const transportSignals = ["traffic", "mobility", "transport", "public_transport", "bus", "rail", "service_activity", "service_reliability", "punctuality", "passenger_charter", "bus_kilometres", "passenger_journeys"];
  if (transportSignals.some((signal) => signals.includes(signal))) return "transport";
  return "built_environment";
}

function confidenceWeight(confidence) {
  const key = String(confidence || "").toLowerCase();
  if (key === "corroborated") return 1.12;
  if (key === "documented") return 1;
  if (key === "inferred") return 0.58;
  if (key === "disputed") return 0.22;
  return 0.72;
}

function coordinateValid(coord) {
  return Array.isArray(coord)
    && coord.length >= 2
    && Number.isFinite(Number(coord[0]))
    && Number.isFinite(Number(coord[1]));
}

function walkCoords(coords, visitor) {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === "number") {
    visitor(coords);
    return;
  }
  coords.forEach((item) => walkCoords(item, visitor));
}

function pointOrCentroid(geometry) {
  if (!geometry) return null;
  if (geometry.type === "Point" && coordinateValid(geometry.coordinates)) {
    return [Number(geometry.coordinates[0]), Number(geometry.coordinates[1])];
  }
  let sx = 0;
  let sy = 0;
  let count = 0;
  walkCoords(geometry.coordinates, (coord) => {
    if (!coordinateValid(coord)) return;
    sx += Number(coord[0]);
    sy += Number(coord[1]);
    count += 1;
  });
  return count ? [sx / count, sy / count] : null;
}

function distanceKm(a, b) {
  if (!coordinateValid(a) || !coordinateValid(b)) return Infinity;
  const lat = ((Number(a[1]) + Number(b[1])) / 2) * Math.PI / 180;
  const dx = (Number(a[0]) - Number(b[0])) * 111.32 * Math.cos(lat);
  const dy = (Number(a[1]) - Number(b[1])) * 110.57;
  return Math.hypot(dx, dy);
}

function lineRepresentativePoint(geometry) {
  if (!geometry) return null;
  let bestLine = [];
  const lines = [];
  if (geometry.type === "LineString") lines.push(geometry.coordinates);
  if (geometry.type === "MultiLineString") lines.push(...geometry.coordinates);
  for (const line of lines) {
    if (Array.isArray(line) && line.length > bestLine.length) bestLine = line;
  }
  if (!bestLine.length) return pointOrCentroid(geometry);
  return pointOrCentroid({ type: "LineString", coordinates: bestLine });
}

function bboxForCoordinates(coords) {
  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  walkCoords(coords, (coord) => {
    if (!coordinateValid(coord)) return;
    bbox[0] = Math.min(bbox[0], Number(coord[0]));
    bbox[1] = Math.min(bbox[1], Number(coord[1]));
    bbox[2] = Math.max(bbox[2], Number(coord[0]));
    bbox[3] = Math.max(bbox[3], Number(coord[1]));
  });
  return Number.isFinite(bbox[0]) ? bbox : null;
}

function bboxesOverlap(a, b) {
  return Boolean(a && b && a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]);
}

function bboxCellKeys(bbox, size) {
  if (!bbox) return [];
  const minX = Math.floor(bbox[0] / size);
  const maxX = Math.floor(bbox[2] / size);
  const minY = Math.floor(bbox[1] / size);
  const maxY = Math.floor(bbox[3] / size);
  const keys = [];
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      keys.push(`${x}|${y}`);
    }
  }
  return keys;
}

function ringBbox(ring) {
  return bboxForCoordinates(ring);
}

function pointWithinBbox(point, bbox) {
  return Boolean(bbox && point[0] >= bbox[0] && point[0] <= bbox[2] && point[1] >= bbox[1] && point[1] <= bbox[3]);
}

function pointOnSegment(point, a, b) {
  if (!coordinateValid(point) || !coordinateValid(a) || !coordinateValid(b)) return false;
  const x = Number(point[0]);
  const y = Number(point[1]);
  const x1 = Number(a[0]);
  const y1 = Number(a[1]);
  const x2 = Number(b[0]);
  const y2 = Number(b[1]);
  const lenSq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (lenSq <= 1e-24) return Math.abs(x - x1) <= 1e-12 && Math.abs(y - y1) <= 1e-12;
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1);
  if (Math.abs(cross) > 1e-10) return false;
  const dot = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1);
  if (dot < -1e-10) return false;
  return dot <= lenSq + 1e-10;
}

function indexedRing(ring) {
  const clean = (ring || []).filter(coordinateValid).map((coord) => [Number(coord[0]), Number(coord[1])]);
  return {
    coordinates: clean,
    bbox: ringBbox(clean),
    edges: clean.map((coord, index) => {
      const previous = clean[index === 0 ? clean.length - 1 : index - 1];
      return {
        a: previous,
        b: coord,
        bbox: bboxForCoordinates([previous, coord]),
      };
    }),
  };
}

function pointInIndexedRing(point, ring) {
  if (!ring?.coordinates?.length || ring.coordinates.length < 3 || !coordinateValid(point) || !pointWithinBbox(point, ring.bbox)) return false;
  let inside = false;
  const x = Number(point[0]);
  const y = Number(point[1]);
  for (const edge of ring.edges) {
    if (!pointWithinBbox(point, edge.bbox) && !((Number(edge.a[1]) > y) !== (Number(edge.b[1]) > y))) continue;
    if (pointWithinBbox(point, edge.bbox) && pointOnSegment(point, edge.a, edge.b)) return true;
    const xi = Number(edge.b[0]);
    const yi = Number(edge.b[1]);
    const xj = Number(edge.a[0]);
    const yj = Number(edge.a[1]);
    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function polygonsFromGeometry(geometry) {
  if (!geometry) return [];
  const rawPolygons = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.type === "MultiPolygon"
      ? geometry.coordinates
      : [];
  return rawPolygons
    .map((rings) => {
      const cleanRings = (rings || [])
        .map((ring) => (ring || []).filter(coordinateValid))
        .filter((ring) => ring.length >= 3);
      if (!cleanRings.length) return null;
      const outer = indexedRing(cleanRings[0]);
      return {
        outer,
        holes: cleanRings.slice(1).map(indexedRing),
        bbox: outer.bbox,
      };
    })
    .filter((polygon) => polygon && polygon.bbox);
}

function boundaryIndexFromGeoJson(payload, source = {}) {
  const features = payload?.type === "FeatureCollection" ? payload.features || [] : [payload].filter(Boolean);
  const polygons = [];
  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const feature of features) {
    for (const polygon of polygonsFromGeometry(feature.geometry || feature)) {
      polygons.push(polygon);
      bbox[0] = Math.min(bbox[0], polygon.bbox[0]);
      bbox[1] = Math.min(bbox[1], polygon.bbox[1]);
      bbox[2] = Math.max(bbox[2], polygon.bbox[2]);
      bbox[3] = Math.max(bbox[3], polygon.bbox[3]);
    }
  }
  if (!polygons.length) throw new Error(`${source.city_id || "city"}: official boundary has no Polygon/MultiPolygon geometry`);
  const edges = [];
  for (const polygon of polygons) {
    for (const ring of [polygon.outer, ...polygon.holes]) {
      edges.push(...ring.edges);
    }
  }
  const edgeGrid = new Map();
  edges.forEach((edge, index) => {
    for (const key of bboxCellKeys(edge.bbox, BOUNDARY_EDGE_INDEX_CELL_DEG)) {
      const bucket = edgeGrid.get(key) || [];
      bucket.push(index);
      edgeGrid.set(key, bucket);
    }
  });
  return {
    city_id: source.city_id || payload?.metadata?.city_id || "",
    source_path: source.path || "",
    source_name: payload?.metadata?.source_name || source.source_name || "",
    source_url: payload?.metadata?.source_url || source.source_url || "",
    licence: payload?.metadata?.licence || source.licence || "",
    boundary_scope: payload?.metadata?.boundary_scope || "",
    feature_count: features.length,
    polygon_count: polygons.length,
    bbox,
    polygons,
    edges,
    edgeGrid,
  };
}

function pointInBoundary(point, boundary) {
  if (!boundary || !coordinateValid(point) || !pointWithinBbox(point, boundary.bbox)) return false;
  for (const polygon of boundary.polygons) {
    if (!pointWithinBbox(point, polygon.bbox)) continue;
    if (!pointInIndexedRing(point, polygon.outer)) continue;
    if (polygon.holes.some((hole) => pointInIndexedRing(point, hole))) continue;
    return true;
  }
  return false;
}

function geometryHasCoordinateInBoundary(geometry, boundary) {
  let inside = false;
  walkCoords(geometry?.coordinates, (coord) => {
    if (!inside && pointInBoundary(coord, boundary)) inside = true;
  });
  return inside;
}

function loadCityScopeBoundary(cityId) {
  const source = CITY_SCOPE_BOUNDARY_SOURCES[cityId];
  if (!source) return null;
  const absolutePath = path.join(rootDir, source.path);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`${cityId}: missing official city-scope boundary ${source.path}; run npm run fetch:city-boundaries`);
  }
  return boundaryIndexFromGeoJson(readJson(absolutePath), Object.assign({ city_id: cityId }, source));
}

function roadFeatureWithinCityScope(feature, boundary) {
  if (!boundary) return true;
  const featureBbox = bboxForCoordinates(feature.geometry?.coordinates);
  if (!bboxesOverlap(featureBbox, boundary.bbox)) return false;
  const representative = lineRepresentativePoint(feature.geometry);
  if (representative && pointInBoundary(representative, boundary)) return true;
  return geometryHasCoordinateInBoundary(feature.geometry, boundary)
    || geometryHasBoundaryIntersection(feature.geometry, boundary);
}

function midpoint(a, b) {
  return [(Number(a[0]) + Number(b[0])) / 2, (Number(a[1]) + Number(b[1])) / 2];
}

function sameCoord(a, b) {
  return coordinateValid(a)
    && coordinateValid(b)
    && Math.abs(Number(a[0]) - Number(b[0])) < 1e-12
    && Math.abs(Number(a[1]) - Number(b[1])) < 1e-12;
}

function pushCoord(line, coord) {
  if (!coordinateValid(coord)) return;
  if (!line.length || !sameCoord(line[line.length - 1], coord)) {
    line.push([Number(coord[0]), Number(coord[1])]);
  }
}

function finishLine(parts, line) {
  if (line.length >= 2) parts.push(line);
  return [];
}

function segmentParam(coord, a, b) {
  const dx = Number(b[0]) - Number(a[0]);
  const dy = Number(b[1]) - Number(a[1]);
  const lenSq = dx ** 2 + dy ** 2;
  if (lenSq <= Number.EPSILON) return 0;
  return clamp(((Number(coord[0]) - Number(a[0])) * dx + (Number(coord[1]) - Number(a[1])) * dy) / lenSq, 0, 1);
}

function approximateInsideBoundaryPoint(insidePoint, outsidePoint, boundary) {
  if (!pointInBoundary(insidePoint, boundary)) return null;
  if (pointInBoundary(outsidePoint, boundary)) return outsidePoint;
  let inside = insidePoint;
  let outside = outsidePoint;
  for (let i = 0; i < 28; i += 1) {
    const mid = midpoint(inside, outside);
    if (pointInBoundary(mid, boundary)) inside = mid;
    else outside = mid;
  }
  return inside;
}

function coordAtParam(a, b, t) {
  return [
    Number(a[0]) + (Number(b[0]) - Number(a[0])) * t,
    Number(a[1]) + (Number(b[1]) - Number(a[1])) * t,
  ];
}

function cross2(a, b) {
  return Number(a[0]) * Number(b[1]) - Number(a[1]) * Number(b[0]);
}

function subtractCoord(a, b) {
  return [Number(a[0]) - Number(b[0]), Number(a[1]) - Number(b[1])];
}

function segmentIntersectionBreakpoints(a, b, c, d) {
  const r = subtractCoord(b, a);
  const s = subtractCoord(d, c);
  const qMinusP = subtractCoord(c, a);
  const denominator = cross2(r, s);
  const epsilon = 1e-12;

  if (Math.abs(denominator) <= epsilon) {
    if (Math.abs(cross2(qMinusP, r)) > epsilon) return [];
    return [a, b, c, d]
      .filter((coord) => pointOnSegment(coord, a, b) && pointOnSegment(coord, c, d))
      .map((coord) => ({ t: segmentParam(coord, a, b), coord: [Number(coord[0]), Number(coord[1])] }));
  }

  const t = cross2(qMinusP, s) / denominator;
  const u = cross2(qMinusP, r) / denominator;
  if (t < -epsilon || t > 1 + epsilon || u < -epsilon || u > 1 + epsilon) return [];
  const clampedT = clamp(t, 0, 1);
  return [{ t: clampedT, coord: coordAtParam(a, b, clampedT) }];
}

function segmentBoundaryBreakpoints(a, b, boundary) {
  const points = [
    { t: 0, coord: [Number(a[0]), Number(a[1])] },
    { t: 1, coord: [Number(b[0]), Number(b[1])] },
  ];
  const segmentBox = bboxForCoordinates([a, b]);
  const edgeIndexes = new Set();
  for (const key of bboxCellKeys(segmentBox, BOUNDARY_EDGE_INDEX_CELL_DEG)) {
    for (const index of boundary?.edgeGrid?.get(key) || []) edgeIndexes.add(index);
  }
  const edges = boundary?.edges || [];
  for (const index of edgeIndexes) {
    const edge = edges[index];
    if (!bboxesOverlap(segmentBox, edge.bbox)) continue;
    points.push(...segmentIntersectionBreakpoints(a, b, edge.a, edge.b));
  }
  points.sort((left, right) => left.t - right.t);
  const deduped = [];
  for (const point of points) {
    const previous = deduped[deduped.length - 1];
    if (previous && Math.abs(previous.t - point.t) < 1e-10) continue;
    deduped.push({ t: point.t, coord: coordAtParam(a, b, point.t) });
  }
  return deduped;
}

function geometryLines(geometry) {
  if (geometry?.type === "LineString") return [geometry.coordinates];
  if (geometry?.type === "MultiLineString") return geometry.coordinates || [];
  return [];
}

function geometryHasBoundaryIntersection(geometry, boundary) {
  for (const line of geometryLines(geometry)) {
    const clean = (line || []).filter(coordinateValid);
    for (let i = 0; i < clean.length - 1; i += 1) {
      const breakpoints = segmentBoundaryBreakpoints(clean[i], clean[i + 1], boundary);
      if (breakpoints.some((point) => point.t > 1e-10 && point.t < 1 - 1e-10)) return true;
    }
  }
  return false;
}

function clipLineStringToBoundary(coords, boundary) {
  const clean = (coords || []).filter(coordinateValid).map((coord) => [Number(coord[0]), Number(coord[1])]);
  if (clean.length < 2) return [];
  const parts = [];
  let current = [];

  for (let i = 0; i < clean.length - 1; i += 1) {
    const a = clean[i];
    const b = clean[i + 1];
    const breakpoints = segmentBoundaryBreakpoints(a, b, boundary);
    for (let j = 0; j < breakpoints.length - 1; j += 1) {
      const left = breakpoints[j];
      const right = breakpoints[j + 1];
      if (right.t - left.t < 1e-12) continue;
      const mid = coordAtParam(a, b, (left.t + right.t) / 2);
      if (pointInBoundary(mid, boundary)) {
        const leftCoord = pointInBoundary(left.coord, boundary)
          ? left.coord
          : approximateInsideBoundaryPoint(mid, left.coord, boundary);
        const rightCoord = pointInBoundary(right.coord, boundary)
          ? right.coord
          : approximateInsideBoundaryPoint(mid, right.coord, boundary);
        pushCoord(current, leftCoord);
        pushCoord(current, rightCoord);
      } else {
        current = finishLine(parts, current);
      }
    }
  }

  finishLine(parts, current);
  return parts;
}

function clipGeometryToBoundary(geometry, boundary) {
  if (!boundary) return { geometry, clipped: false };
  const parts = geometryLines(geometry).flatMap((line) => clipLineStringToBoundary(line, boundary));
  if (!parts.length) return { geometry: null, clipped: false };
  const geometryType = parts.length === 1 ? "LineString" : "MultiLineString";
  return {
    geometry: geometryType === "LineString"
      ? { type: "LineString", coordinates: parts[0] }
      : { type: "MultiLineString", coordinates: parts },
    clipped: true,
  };
}

function cellKey(coord, size) {
  return `${Math.floor(Number(coord[0]) / size)}|${Math.floor(Number(coord[1]) / size)}`;
}

function nearbyCellKeys(coord, size, radius = 2) {
  const x = Math.floor(Number(coord[0]) / size);
  const y = Math.floor(Number(coord[1]) / size);
  const cells = [];
  for (let dx = -radius; dx <= radius; dx += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      cells.push(`${x + dx}|${y + dy}`);
    }
  }
  return cells;
}

function loadEvents(city, eventsIndex, sourceById = new Map()) {
  const out = [];
  for (const chunk of eventsIndex.chunks || []) {
    if (!chunk.json_path) continue;
    const chunkPath = path.join(rootDir, chunk.json_path);
    const payload = readJson(chunkPath);
    for (const event of payload.events || []) {
      const signals = Array.isArray(event.affected_signals) ? event.affected_signals.map((item) => String(item).toLowerCase()) : [];
      const coord = pointOrCentroid(event.geometry);
      const category = normalizeCategory(event.category, event.lens, signals);
      if (!coord || !LENS_CATEGORIES.has(category)) continue;
      const year = Number(event.year || chunk.year);
      if (!Number.isFinite(year)) continue;
      const confidence = String(event.confidence || "documented").toLowerCase();
      const sourceIds = Array.isArray(event.source_ids) ? event.source_ids : [];
      const excludedLensSlugs = [
        ...(Array.isArray(event.excluded_lens_slugs) ? event.excluded_lens_slugs : []),
        ...(Array.isArray(event.excludedLensSlugs) ? event.excludedLensSlugs : []),
        ...(Array.isArray(event.lens_exclusions) ? event.lens_exclusions : []),
      ].map((item) => String(item).trim()).filter(Boolean);
      if (!eventHasMapEligibleSources(event, sourceById)) continue;
      const evidence = Array.isArray(event.evidence) ? event.evidence : [];
      const provenance = event.provenance || {};
      const text = [
        event.title,
        event.short_description,
        event.explanation,
        event.affected_area?.label,
        event.source_date_field,
        provenance.source_basis,
        provenance.geometry_precision,
      ].filter(Boolean).join(" ");
      out.push({
        id: event.event_id || event.id || `${city.city_id}-${category}-${year}-${out.length}`,
        title: event.title || "Source-backed city record",
        description: event.short_description || "",
        area: event.affected_area?.label || "",
        effectiveDate: event.effective_date || "",
        datePrecision: event.date_precision || "",
        sourceDateField: event.source_date_field || provenance.source_date_field || "",
        geometryPrecision: provenance.geometry_precision || "",
        geometrySource: provenance.geometry_source || "",
        sourceBasis: provenance.source_basis || "",
        evidenceCount: evidence.length,
        year,
        category,
        confidence,
        sourceIds,
        sourceUrls: evidence.map((item) => item.url).filter(Boolean).slice(0, 4),
        signals,
        excludedLensSlugs,
        excludeTransportRoadScoring: event.exclude_transport_road_scoring === true,
        text,
        weight: confidenceWeight(confidence),
        coord,
      });
    }
  }
  out.sort((a, b) => a.year - b.year || a.category.localeCompare(b.category) || a.id.localeCompare(b.id));
  return out;
}

function buildHotspotFeatures(cityId, events) {
  const buckets = new Map();
  for (const event of events) {
    if (event.excludeTransportRoadScoring) continue;
    const key = `${event.year}|${event.category}|${cellKey(event.coord, HOTSPOT_CELL_DEG)}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        year: event.year,
        category: event.category,
        sx: 0,
        sy: 0,
        weight: 0,
        confidenceWeight: 0,
        count: 0,
        sourceIds: new Set(),
        confidenceCounts: {},
      };
      buckets.set(key, bucket);
    }
    bucket.sx += event.coord[0] * event.weight;
    bucket.sy += event.coord[1] * event.weight;
    bucket.weight += event.weight;
    bucket.confidenceWeight += event.weight;
    bucket.count += 1;
    bucket.confidenceCounts[event.confidence] = (bucket.confidenceCounts[event.confidence] || 0) + 1;
    for (const id of event.sourceIds) {
      if (bucket.sourceIds.size < 8) bucket.sourceIds.add(id);
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.year - b.year || a.category.localeCompare(b.category) || b.count - a.count)
    .map((bucket, index) => {
      const coord = bucket.weight > 0
        ? [bucket.sx / bucket.weight, bucket.sy / bucket.weight]
        : [bucket.sx / Math.max(1, bucket.count), bucket.sy / Math.max(1, bucket.count)];
      const confidence = Object.entries(bucket.confidenceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "documented";
      return {
        type: "Feature",
        properties: {
          id: `lens-hotspot-${cityId}-${bucket.year}-${bucket.category}-${index}`,
          layer: "lens_event",
          category: bucket.category,
          category_color: CATEGORY_COLORS[bucket.category] || CATEGORY_COLORS.built_environment,
          year: bucket.year,
          title: `${bucket.count} source-backed ${bucket.category.replace(/_/g, " ")} record${bucket.count === 1 ? "" : "s"}`,
          confidence,
          heat_weight: round(clamp(Math.log1p(bucket.count) * 0.85 + (bucket.confidenceWeight / Math.max(1, bucket.count)) * 0.55, 0.4, 8)),
          event_count: bucket.count,
          source_count: bucket.sourceIds.size,
          source_ids: Array.from(bucket.sourceIds).join(","),
          representation: "source-backed hotspot cell",
          timing_note: "Filtered by event effective year; administrative and OSM-mapped dates are evidence dates, not guaranteed physical completion dates.",
        },
        geometry: { type: "Point", coordinates: coord },
      };
    });
}

function roadSourcePath(city, paths) {
  if (city.city_id === "belfast" && paths.detail_layers) return path.join(rootDir, paths.detail_layers);
  const majorRoadsPath = path.join(rootDir, "data", "raw", "overpass", `${city.city_id}_major_roads_osm_2026.geojson`);
  return fs.existsSync(majorRoadsPath) ? majorRoadsPath : null;
}

function loadRawRoadFeatures(city, paths) {
  const sourcePath = roadSourcePath(city, paths);
  if (!sourcePath || !fs.existsSync(sourcePath)) return { sourcePath, roads: [] };
  const payload = readJson(sourcePath);
  const roads = (payload.features || [])
    .filter((feature) => feature.geometry && (feature.geometry.type === "LineString" || feature.geometry.type === "MultiLineString"))
    .filter((feature) => city.city_id !== "belfast" || feature.properties?.layer === "road")
    .map((feature, index) => ({ feature, index, coord: lineRepresentativePoint(feature.geometry) }))
    .filter((item) => item.coord);
  return { sourcePath, roads };
}

function loadScopedRoadFeatures(city, paths) {
  const { sourcePath, roads } = loadRawRoadFeatures(city, paths);
  const boundary = loadCityScopeBoundary(city.city_id);
  if (!boundary) return { roads, scopeFilter: null };
  let boundaryScopedFeatureCount = 0;
  const scopedRoads = [];
  for (const road of roads) {
    const featureBbox = bboxForCoordinates(road.feature.geometry?.coordinates);
    if (!bboxesOverlap(featureBbox, boundary.bbox)) continue;
    const clipped = clipGeometryToBoundary(road.feature.geometry, boundary);
    if (!clipped.geometry) continue;
    if (clipped.clipped) boundaryScopedFeatureCount += 1;
    const feature = Object.assign({}, road.feature, { geometry: clipped.geometry });
    const coord = lineRepresentativePoint(feature.geometry);
    if (!coord) continue;
    scopedRoads.push({ feature, index: road.index, coord });
  }
  const scopeFilter = {
    boundary_source_path: boundary.source_path,
    boundary_source_name: boundary.source_name,
    boundary_source_url: boundary.source_url,
    boundary_licence: boundary.licence,
    boundary_scope: boundary.boundary_scope,
    method: "Retains current OSM major-road features only where they intersect the official city boundary polygon, then splits or truncates line geometry at the boundary using source vertices and approximate crossing points. The boundary scopes the visual context; OSM remains the road-geometry source.",
    input_feature_count: roads.length,
    kept_feature_count: scopedRoads.length,
    dropped_out_of_scope_feature_count: roads.length - scopedRoads.length,
    boundary_scoped_feature_count: boundaryScopedFeatureCount,
    boundary_feature_count: boundary.feature_count,
    boundary_polygon_count: boundary.polygon_count,
    road_source_path: sourcePath ? path.relative(rootDir, sourcePath) : "",
  };
  console.log(`${city.city_id}: city-scope road filter kept ${scopedRoads.length}/${roads.length} OSM road feature(s) using ${boundary.source_path}`);
  return { roads: scopedRoads, scopeFilter };
}

function loadRoadFeatures(city, paths) {
  return loadScopedRoadFeatures(city, paths).roads;
}

function buildRoadIndex(roads) {
  const index = new Map();
  for (const road of roads) {
    const key = cellKey(road.coord, ROAD_INDEX_CELL_DEG);
    const bucket = index.get(key) || [];
    bucket.push(road);
    index.set(key, bucket);
  }
  return index;
}

function nearbyRoads(index, coord) {
  const out = [];
  for (const key of nearbyCellKeys(coord, ROAD_INDEX_CELL_DEG, 3)) {
    const bucket = index.get(key);
    if (bucket) out.push(...bucket);
  }
  return out;
}

function transportEvents(events) {
  return events.filter((event) => !event.excludeTransportRoadScoring && (event.category === "transport" || event.signals.includes("traffic") || event.signals.includes("mobility")));
}

function transportRoadEvidenceYears(events, years) {
  const yearSet = new Set(years);
  const out = new Set();
  for (const event of transportEvents(events)) {
    if (yearSet.has(event.year)) out.add(event.year);
  }
  return out;
}

function accumulateRoadScores(city, roads, events, years) {
  const yearSet = new Set(years);
  const scoresByYear = new Map(years.map((year) => [year, new Map()]));
  const roadIndex = buildRoadIndex(roads);
  const transport = transportEvents(events);
  const roadEvidenceYears = transportRoadEvidenceYears(events, years);

  for (const event of transport) {
    const candidates = nearbyRoads(roadIndex, event.coord);
    for (const road of candidates) {
      const km = distanceKm(event.coord, road.coord);
      if (km > TRAFFIC_EVENT_RADIUS_KM) continue;
      const distanceWeight = 1 - (km / TRAFFIC_EVENT_RADIUS_KM);
      for (let offset = 0; offset <= TRAFFIC_WINDOW_YEARS; offset += 1) {
        const year = event.year + offset;
        if (!yearSet.has(year)) continue;
        const ageWeight = offset === 0 ? 1 : offset === 1 ? 0.58 : 0.34;
        const yearScores = scoresByYear.get(year);
        const current = yearScores.get(road.index) || { raw: 0, count: 0 };
        current.raw += event.weight * ageWeight * distanceWeight;
        current.count += 1;
        yearScores.set(road.index, current);
      }
    }
  }

  if (city.city_id === "belfast") {
    for (const road of roads) {
      const props = road.feature.properties || {};
      const visibleYear = Number(props.visible_year || years[0]);
      for (let offset = 0; offset <= TRAFFIC_WINDOW_YEARS; offset += 1) {
        const year = visibleYear + offset;
        if (!yearSet.has(year)) continue;
        if (!roadEvidenceYears.has(year)) continue;
        const rankWeight = clamp(Number(props.rank || 1) / 4, 0.25, 1);
        const yearScores = scoresByYear.get(year);
        const current = yearScores.get(road.index) || { raw: 0, count: 0 };
        current.raw += rankWeight * (offset === 0 ? 0.72 : offset === 1 ? 0.38 : 0.2);
        current.count += 1;
        yearScores.set(road.index, current);
      }
    }
  }

  return scoresByYear;
}

function roadOutputFeature(city, road, score, maxRaw, year, scopeFilter = null) {
  const props = road.feature.properties || {};
  const stableRoadId = props.source_id || props.id || props.name || `road-${road.index}`;
  const activity = maxRaw > 0 ? clamp(score.raw / maxRaw, 0, 1) : 0;
  return {
    type: "Feature",
    properties: {
      id: `lens-traffic-road-${city.city_id}-${stableRoadId}`,
      layer: "traffic_road",
      category: "transport",
      year,
      visible_year: Number(props.visible_year || year),
      rank: Number(props.rank || 1),
      name: props.name || props.ref || "mapped road segment",
      source_id: stableRoadId,
      source_url: props.source_url || "",
      license: props.license || "ODbL",
      city_scope_status: scopeFilter ? "inside_official_city_boundary" : "not_boundary_filtered",
      transport_raw: round(score.raw),
      transport_count: score.count,
      transport_activity: round(activity),
      representation: city.city_id === "belfast" ? "mapped road-change and transport-event activity" : "official-boundary-scoped major-road transport-event activity",
      timing_note: city.city_id === "belfast"
        ? "Road color is a three-year mapped road-change and transport-event activity surface, not measured traffic volume or congestion."
        : "Road color is a three-year transport-event activity surface on current OSM major road geometry retained inside the official city boundary, not measured traffic volume or congestion.",
    },
    geometry: road.feature.geometry,
  };
}

function roadBaseOutputFeature(city, road, scopeFilter = null) {
  const props = road.feature.properties || {};
  const stableRoadId = props.source_id || props.id || props.name || `road-${road.index}`;
  return {
    type: "Feature",
    properties: {
      id: `lens-traffic-road-base-${city.city_id}-${stableRoadId}`,
      layer: "traffic_road_base",
      category: "transport",
      rank: Number(props.rank || 1),
      highway: props.highway || "",
      name: props.name || props.ref || "mapped road segment",
      source_id: stableRoadId,
      source_url: props.source_url || "",
      license: props.license || "ODbL",
      city_scope_status: scopeFilter ? "inside_official_city_boundary" : "not_boundary_filtered",
      representation: city.city_id === "belfast" ? "current OSM road geometry from the Belfast detail layer" : "current OSM major road geometry retained inside the official city boundary",
      timing_note: scopeFilter
        ? "Base roads are always-on current OSM geometry filtered to the official city boundary for orientation; they are not measured traffic volume, congestion, or guaranteed construction timing."
        : "Base roads are always-on current OSM geometry for citywide orientation; they are not measured traffic volume, congestion, or guaranteed construction timing.",
    },
    geometry: road.feature.geometry,
  };
}

function writeTransportRoadBase(city, roads, outDir, scopeFilter = null) {
  const base = `web/data/city-atlas/cities/${city.city_id}/transport_roads_base.geojson`;
  const features = roads
    .map((road) => roadBaseOutputFeature(city, road, scopeFilter))
    .sort((a, b) => Number(b.properties.rank) - Number(a.properties.rank) || String(a.properties.id).localeCompare(String(b.properties.id)));
  writeJson(path.join(outDir, "transport_roads_base.geojson"), {
    type: "FeatureCollection",
    name: `${city.city_id}_transport_roads_base`,
    metadata: {
      schema_version: "1.0.0",
      city_id: city.city_id,
      road_source: city.city_id === "belfast" ? "web/data/city-atlas/cities/belfast/detail_layers.geojson" : `data/raw/overpass/${city.city_id}_major_roads_osm_2026.geojson`,
      city_scope_filter: scopeFilter,
      method: scopeFilter
        ? "Current OSM road geometry is loaded as a base layer after official city-boundary scope filtering; selected-year activity files color the subset near source-backed transport records."
        : "Current OSM road geometry is loaded citywide as a required base layer; selected-year activity files color the subset near source-backed transport records.",
      caveat: "Base road lines are citywide OSM context and are not measured traffic counts, live congestion, or historical construction proof.",
    },
    features,
  });
  return base;
}

function writeTransportRoadYears(city, paths, events, years, outDir) {
  const { roads, scopeFilter } = loadScopedRoadFeatures(city, paths);
  const template = `web/data/city-atlas/cities/${city.city_id}/transport_roads_{year}.geojson`;
  if (!roads.length) {
    throw new Error(`${city.city_id}: missing required OSM road source for transport overlays; run npm run fetch:city-roads for non-Belfast cities.`);
  }

  const base = writeTransportRoadBase(city, roads, outDir, scopeFilter);
  const scoresByYear = accumulateRoadScores(city, roads, events, years);
  const roadEvidenceYears = transportRoadEvidenceYears(events, years);
  const roadByIndex = new Map(roads.map((road) => [road.index, road]));

  for (const year of years) {
    const scores = scoresByYear.get(year) || new Map();
    const maxRaw = Math.max(0, ...Array.from(scores.values()).map((score) => score.raw));
    const features = roadEvidenceYears.has(year)
      ? Array.from(scores.entries())
        .filter(([, score]) => score.raw > 0)
        .map(([roadIndex, score]) => roadOutputFeature(city, roadByIndex.get(roadIndex), score, maxRaw, year, scopeFilter))
        .sort((a, b) => Number(b.properties.transport_activity) - Number(a.properties.transport_activity) || String(a.properties.id).localeCompare(String(b.properties.id)))
      : [];
    writeJson(path.join(outDir, `transport_roads_${year}.geojson`), {
      type: "FeatureCollection",
      name: `${city.city_id}_transport_roads_${year}`,
      metadata: {
        schema_version: "1.0.0",
        city_id: city.city_id,
        year,
        road_source: city.city_id === "belfast" ? "detail_layers.geojson" : `data/raw/overpass/${city.city_id}_major_roads_osm_2026.geojson`,
        city_scope_filter: scopeFilter,
        method: scopeFilter
          ? "Road features inside the official city boundary are colored from nearby source-backed transport records in a rolling three-year window."
          : "Road features are colored from nearby source-backed transport records in a rolling three-year window.",
        caveat: "Transport road colors are activity hotspots, not measured traffic counts or live congestion.",
        suppressed: !roadEvidenceYears.has(year),
        suppression_reason: roadEvidenceYears.has(year) ? null : "No same-year source-backed, road-scorable transport event records support a selected-year transport activity overlay.",
      },
      features,
    });
  }

  return { base, template, roadCount: roads.length };
}

function lowerText(event) {
  return String(event.text || `${event.title || ""} ${event.description || ""}`).toLowerCase();
}

function lensDetailSkipReason(event) {
  if (!coordinateValid(event.coord)) return "missing_point_geometry";
  const precision = String(event.geometryPrecision || "").toLowerCase();
  const sourceBasis = String(event.sourceBasis || "").toLowerCase();
  const geometrySource = String(event.geometrySource || "").toLowerCase();
  const sourceIds = (event.sourceIds || []).join(" ").toLowerCase();
  const text = lowerText(event);
  const combined = `${precision} ${sourceBasis} ${geometrySource} ${sourceIds} ${text}`;
  const geometryScope = precision.trim();

  if (/\buk[-_\s]?hpi\b|\bhpi monthly\b|house[-_\s]?price[-_\s]?index|uk[-_\s]?house[-_\s]?price[-_\s]?index|market[-_\s]?trend|lon-extra-uk-house-price-index/.test(combined)) {
    return "statistical_housing_market_record";
  }
  if (/\bborough aggregate\b|\baggregate,\s*not\b|\baggregate record\b/.test(combined)) {
    return "aggregate_record";
  }
  if (/\barea\/city reference\b|\bcitywide\b|\bnot an exact event geometry\b/.test(geometryScope)
    || /^(approximate\s+)?district(?:-extension)?(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
    || /^(approximate\s+)?neighbou?rhood(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
    || /^(rail[-\s])?corridor(?:\s+approximate|\s+centroid)?\b/.test(geometryScope)
    || /^(multiple sites|multi[-\s]?site|programme approximate)\b/.test(geometryScope)) {
    return "non_site_scope";
  }
  if (/^area(?:\s+approximate)?$/.test(precision.trim())) {
    return "area_scope";
  }
  return "";
}

function isLensDetailEligibleEvent(event) {
  return !lensDetailSkipReason(event);
}

function lensDetailSkipSummary(yearEvents) {
  const reasons = {};
  for (const event of yearEvents) {
    if (!["built_environment", "civic_services", "economy", "utilities"].includes(event.category)) continue;
    const reason = lensDetailSkipReason(event);
    if (reason) incrementCounter(reasons, reason);
  }
  return reasons;
}

function matchKind(text, entries, fallback) {
  for (const [kind, pattern] of entries) {
    if (pattern.test(text)) return kind;
  }
  return fallback;
}

function classifyPlanningLifecycle(event) {
  const text = lowerText(event);
  if (event.confidence === "inferred" || /osm|mapped[- ]visibility|mapped[- ]event|mapped in osm/.test(text)) return "inferred";
  return matchKind(text, [
    ["demolished", /\bdemolish(ed|ition)?\b|\bdemolition\b|\bremoved\b/],
    ["construction", /\bunder construction\b|\bconstruction\b|\bworks start(ed)?\b|\bstarted\b|\benabling works\b/],
    ["completed", /\bcompleted\b|\bopened\b|\bdelivered\b|\boccupied\b|\boperational\b/],
    ["permitted", /\bapproved\b|\bpermission\b|\bconsent\b|\bcondition variation\b|\bpermitted\b/],
    ["proposed", /\bpropos(ed|al)\b|\bapplication\b|\bsubmitted\b|\bconsultation\b/],
    ["planned", /\bplanned\b|\bstage\s*1\b|\bemerging\b|\bprogramme\b|\bmasterplan\b/],
  ], "uncertain");
}

function classifyCivicServiceType(event) {
  const text = lowerText(event);
  return matchKind(text, [
    ["health", /\bhealth\b|\bhospital\b|\bclinic\b|\bgp\b|\bmedical\b|\bcare\b/],
    ["education", /\bschool\b|\beducation\b|\buniversity\b|\bcollege\b|\bcampus\b|\bstudent\b/],
    ["library", /\blibrary\b|\blibraries\b/],
    ["leisure", /\bleisure\b|\bsport\b|\bpool\b|\bpark\b|\bplay\b|\brecreation\b/],
    ["community", /\bcommunity\b|\bcivic\b|\bcouncil\b|\bpublic service\b|\bservice centre\b/],
    ["safety", /\bpolice\b|\bfire\b|\bemergency\b|\bsafety\b/],
  ], "service");
}

function classifyCivicStatus(event) {
  const text = lowerText(event);
  if (event.confidence === "inferred") return "inferred";
  return matchKind(text, [
    ["planned", /\bplanned\b|\bproposed\b|\bstage\s*1\b|\bprogramme\b/],
    ["opened", /\bopened\b|\bcompleted\b|\boperational\b/],
    ["changed", /\brelocat(ed|ion)\b|\bupgrade(d)?\b|\bextension\b|\bchange\b/],
  ], "documented");
}

function classifyEconomySector(event) {
  const text = lowerText(event);
  return matchKind(text, [
    ["hospitality", /\bhotel\b|\brestaurant\b|\bcafe\b|\bbar\b|\bhospitality\b/],
    ["retail", /\bretail\b|\bshop\b|\bstore\b|\bmarket\b/],
    ["office", /\boffice\b|\bworkspace\b|\bbusiness\b|\bemployment\b/],
    ["industrial", /\bindustrial\b|\bfactory\b|\blogistics\b|\bwarehouse\b|\bclass b3\b/],
    ["culture_visitor", /\bvisitor\b|\bculture\b|\btouris[mt]\b|\bmuseum\b|\bvenue\b|\bhotel\b/],
    ["education_health", /\buniversity\b|\beducation\b|\bhealth\b|\bhospital\b|\bcampus\b/],
    ["residential_change", /\bresidential\b|\bstudent accommodation\b|\bhmo\b|\bhousing\b/],
    ["vacancy", /\bvacan(t|cy)\b|\bderelict\b|\bmeanwhile\b|\bclosed\b/],
  ], "commercial_activity");
}

function classifyEconomyStatus(event) {
  const text = lowerText(event);
  if (event.confidence === "inferred") return "inferred";
  return matchKind(text, [
    ["opening", /\bopened\b|\bopening\b|\blaunched\b/],
    ["closure", /\bclosed\b|\bclosure\b|\bvacan(t|cy)\b/],
    ["permitted", /\bapproved\b|\bpermission\b|\bconsent\b|\bpermitted\b/],
    ["planned", /\bplanned\b|\bproposed\b|\bstage\s*1\b|\bprogramme\b/],
  ], "documented");
}

function classifyUtilityType(event) {
  const text = lowerText(event);
  return matchKind(text, [
    ["electricity", /\belectricity\b|\bpower\b|\bgenerator\b|\bsubstation\b|\btransformer\b/],
    ["telecom", /\btelecom\b|\bbroadband\b|\bfibre\b|\bfiber\b|\bcable\b|\bcommunications?\b/],
    ["water", /\bwater\b|\bsewer\b|\bwastewater\b|\bdrain(age)?\b/],
    ["gas", /\bgas\b/],
    ["streetworks", /\bstreet\s*works\b|\broad\s*works\b|\bworks\b|\bclosure\b|\bdisruption\b/],
  ], "infrastructure");
}

function classifyUtilityStatus(event) {
  const text = lowerText(event);
  if (event.confidence === "inferred" || /osm|mapped[- ]visibility|mapped[- ]event|mapped in osm/.test(text)) return "mapped_asset";
  return matchKind(text, [
    ["repair", /\brepair\b|\bmaintenance\b|\breinstatement\b/],
    ["disruption", /\bdisruption\b|\bclosure\b|\bclosed\b|\boutage\b/],
    ["planned", /\bplanned\b|\bproposed\b|\bprogramme\b|\bpermit\b/],
    ["current", /\bopened\b|\boperational\b|\bcompleted\b/],
  ], "documented");
}

function classifyLensEvent(event) {
  if (event.category === "built_environment") {
    return { primary: classifyPlanningLifecycle(event), secondary: event.confidence === "inferred" ? "inferred" : "source_record" };
  }
  if (event.category === "civic_services") {
    return { primary: classifyCivicServiceType(event), secondary: classifyCivicStatus(event) };
  }
  if (event.category === "economy") {
    return { primary: classifyEconomySector(event), secondary: classifyEconomyStatus(event) };
  }
  if (event.category === "utilities") {
    return { primary: classifyUtilityType(event), secondary: classifyUtilityStatus(event) };
  }
  return { primary: "record", secondary: event.confidence || "documented" };
}

function incrementCounter(target, key, amount = 1) {
  target[key] = (target[key] || 0) + amount;
}

function dominantKey(counts, fallback = "documented") {
  const entries = Object.entries(counts || {});
  if (!entries.length) return fallback;
  return entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function counterText(counts) {
  return Object.entries(counts || {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}:${value}`)
    .join(",");
}

function addEventToBucket(bucket, event, classification) {
  bucket.count += 1;
  bucket.weight += event.weight || 1;
  bucket.sx += event.coord[0];
  bucket.sy += event.coord[1];
  bucket.distance += event.distanceKm || 0;
  incrementCounter(bucket.confidenceCounts, event.confidence || "documented");
  incrementCounter(bucket.primaryCounts, classification.primary);
  incrementCounter(bucket.secondaryCounts, classification.secondary);
  incrementCounter(bucket.geometryPrecisionCounts, event.geometryPrecision || "unspecified");
  for (const id of event.sourceIds || []) {
    if (bucket.sourceIds.size < 12) bucket.sourceIds.add(id);
  }
  bucket.eventIdsAll.push(event.id);
  if (bucket.eventIds.length < 10) bucket.eventIds.push(event.id);
  if (bucket.titles.length < 3) bucket.titles.push(event.title);
  for (const url of event.sourceUrls || []) {
    if (bucket.sourceUrls.size < 4) bucket.sourceUrls.add(url);
  }
  for (const slug of event.excludedLensSlugs || []) {
    bucket.excludedLensSlugs.add(slug);
  }
}

function meterFactors(refLat) {
  const latRad = Number(refLat || 0) * Math.PI / 180;
  return {
    lon: Math.max(1, 111320 * Math.cos(latRad)),
    lat: 110574,
  };
}

function cityReferenceLat(city, events) {
  if (Array.isArray(city.default_center) && Number.isFinite(Number(city.default_center[1]))) {
    return Number(city.default_center[1]);
  }
  const lat = events.find((event) => coordinateValid(event.coord))?.coord?.[1];
  return Number.isFinite(Number(lat)) ? Number(lat) : 0;
}

function gridForCoord(coord, sizeM, refLat) {
  const factors = meterFactors(refLat);
  const x = Math.floor((coord[0] * factors.lon) / sizeM);
  const y = Math.floor((coord[1] * factors.lat) / sizeM);
  const west = (x * sizeM) / factors.lon;
  const east = ((x + 1) * sizeM) / factors.lon;
  const south = (y * sizeM) / factors.lat;
  const north = ((y + 1) * sizeM) / factors.lat;
  return {
    key: `${x}|${y}`,
    polygon: [
      [
        [round(west, 7), round(south, 7)],
        [round(east, 7), round(south, 7)],
        [round(east, 7), round(north, 7)],
        [round(west, 7), round(north, 7)],
        [round(west, 7), round(south, 7)],
      ],
    ],
  };
}

function detailBaseProperties(cityId, layer, category, year, bucket, representation, caveat) {
  const confidence = dominantKey(bucket.confidenceCounts);
  const properties = {
    id: bucket.id,
    layer,
    category,
    year,
    visible_year: year,
    title: bucket.title,
    confidence,
    confidence_mix: counterText(bucket.confidenceCounts),
    event_count: bucket.count,
    source_count: bucket.sourceIds.size,
    source_ids: Array.from(bucket.sourceIds).join(","),
    event_ids: bucket.eventIds.join(","),
    event_ids_all: bucket.eventIdsAll.join(","),
    source_urls: Array.from(bucket.sourceUrls).join(","),
    geometry_precision_mix: counterText(bucket.geometryPrecisionCounts),
    representation,
    timing_note: "Filtered by event effective year. OSM mapped-visibility dates and administrative dates can differ from real-world physical change dates.",
    caveat,
    generated_from: `web/data/city-atlas/cities/${cityId}/events_${year}.json`,
  };
  if (bucket.excludedLensSlugs?.size) {
    properties.excluded_lens_slugs = Array.from(bucket.excludedLensSlugs).sort().join(",");
  }
  return properties;
}

function buildCellFeatures(city, yearEvents, refLat) {
  const buckets = new Map();
  for (const event of yearEvents) {
    const config = LENS_CELL_CONFIGS[event.category];
    if (!config) continue;
    if (!isLensDetailEligibleEvent(event)) continue;
    const grid = gridForCoord(event.coord, config.sizeM, refLat);
    const classification = classifyLensEvent(event);
    const key = `${event.year}|${event.category}|${grid.key}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        id: `lens-detail-${city.city_id}-${event.year}-${config.layer}-${buckets.size}`,
        year: event.year,
        category: event.category,
        layer: config.layer,
        sizeM: config.sizeM,
        polygon: grid.polygon,
        count: 0,
        weight: 0,
        sx: 0,
        sy: 0,
        distance: 0,
        confidenceCounts: {},
        primaryCounts: {},
        secondaryCounts: {},
        geometryPrecisionCounts: {},
        sourceIds: new Set(),
        sourceUrls: new Set(),
        excludedLensSlugs: new Set(),
        eventIds: [],
        eventIdsAll: [],
        titles: [],
      };
      buckets.set(key, bucket);
    }
    addEventToBucket(bucket, event, classification);
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.year - b.year || a.category.localeCompare(b.category) || b.count - a.count || a.id.localeCompare(b.id))
    .map((bucket) => {
      const config = LENS_CELL_CONFIGS[bucket.category];
      const primary = dominantKey(bucket.primaryCounts, "record");
      const secondary = dominantKey(bucket.secondaryCounts, "documented");
      bucket.title = `${bucket.count} source-backed ${config.label} record${bucket.count === 1 ? "" : "s"}`;
      const caveat = bucket.category === "built_environment"
        ? "Planning cells are derived from source-backed event locations; they are not parcel boundaries unless source geometry is separately present."
        : bucket.category === "civic_services"
          ? "Civic coverage cells are evidence grids around facility/service records, not surveyed catchment or capacity areas."
          : "Economy cells are evidence grids around source-backed activity records, not measured spend, vacancy, or footfall.";
      const properties = detailBaseProperties(
        city.city_id,
        bucket.layer,
        bucket.category,
        bucket.year,
        bucket,
        `${config.label} evidence grid cell`,
        caveat,
      );
      properties[config.kindField] = primary;
      properties.status = secondary;
      properties.cell_size_m = bucket.sizeM;
      properties.intensity = round(clamp(Math.log1p(bucket.count) / 2.4, 0.18, 1));
      properties.label = bucket.titles[0] || properties.title;
      return {
        type: "Feature",
        properties,
        geometry: { type: "Polygon", coordinates: bucket.polygon },
      };
    });
}

function buildPointDetailFeatures(city, yearEvents, category, layer, representation, caveat) {
  return yearEvents
    .filter((event) => event.category === category && isLensDetailEligibleEvent(event))
    .map((event, index) => {
      const classification = classifyLensEvent(event);
      const bucket = {
        id: `lens-detail-${city.city_id}-${event.year}-${layer}-${index}-${event.id}`,
        title: event.title,
        count: 1,
        sourceIds: new Set(event.sourceIds || []),
        sourceUrls: new Set(event.sourceUrls || []),
        excludedLensSlugs: new Set(event.excludedLensSlugs || []),
        eventIds: [event.id],
        eventIdsAll: [event.id],
        confidenceCounts: { [event.confidence || "documented"]: 1 },
        geometryPrecisionCounts: { [event.geometryPrecision || "unspecified"]: 1 },
      };
      const properties = detailBaseProperties(city.city_id, layer, category, event.year, bucket, representation, caveat);
      if (category === "civic_services") {
        properties.service_type = classification.primary;
        properties.status = classification.secondary;
      } else if (category === "utilities") {
        properties.utility_type = classification.primary;
        properties.work_status = classification.secondary;
      }
      properties.geometry_precision = event.geometryPrecision || "";
      return {
        type: "Feature",
        properties,
        geometry: { type: "Point", coordinates: event.coord },
      };
    });
}

function nearestRoad(index, coord, maxKm) {
  let best = null;
  let bestKm = Infinity;
  for (const road of nearbyRoads(index, coord)) {
    const km = distanceKm(coord, road.coord);
    if (km < bestKm) {
      best = road;
      bestKm = km;
    }
  }
  return best && bestKm <= maxKm ? { road: best, km: bestKm } : null;
}

function buildRoadTraceFeatures(city, yearEvents, roads, category, layer, radiusKm, representation, caveat) {
  if (!roads.length) return [];
  const index = buildRoadIndex(roads);
  const buckets = new Map();
  for (const event of yearEvents.filter((item) => item.category === category)) {
    if (!isLensDetailEligibleEvent(event)) continue;
    const nearest = nearestRoad(index, event.coord, radiusKm);
    if (!nearest) continue;
    const classification = classifyLensEvent(event);
    const roadProps = nearest.road.feature.properties || {};
    const stableRoadId = roadProps.source_id || roadProps.id || roadProps.name || `road-${nearest.road.index}`;
    const key = `${event.year}|${category}|${nearest.road.index}|${classification.primary}|${classification.secondary}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        id: `lens-detail-${city.city_id}-${event.year}-${layer}-${nearest.road.index}-${classification.primary}-${classification.secondary}`,
        title: roadProps.name || roadProps.ref || "Mapped street segment",
        year: event.year,
        category,
        layer,
        road: nearest.road,
        roadId: stableRoadId,
        roadName: roadProps.name || roadProps.ref || "mapped street segment",
        rank: Number(roadProps.rank || 1),
        count: 0,
        weight: 0,
        sx: 0,
        sy: 0,
        distance: 0,
        confidenceCounts: {},
        primaryCounts: {},
        secondaryCounts: {},
        geometryPrecisionCounts: {},
        sourceIds: new Set(),
        sourceUrls: new Set(),
        excludedLensSlugs: new Set(),
        eventIds: [],
        eventIdsAll: [],
        titles: [],
      };
      buckets.set(key, bucket);
    }
    addEventToBucket(bucket, { ...event, distanceKm: nearest.km }, classification);
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.year - b.year || b.count - a.count || a.id.localeCompare(b.id))
    .map((bucket) => {
      const primary = dominantKey(bucket.primaryCounts, "record");
      const secondary = dominantKey(bucket.secondaryCounts, "documented");
      bucket.title = `${bucket.count} source-backed ${category.replace(/_/g, " ")} record${bucket.count === 1 ? "" : "s"} near ${bucket.roadName}`;
      const properties = detailBaseProperties(city.city_id, layer, category, bucket.year, bucket, representation, caveat);
      properties.road_source_id = String(bucket.roadId);
      properties.road_name = bucket.roadName;
      properties.rank = bucket.rank;
      properties.nearest_event_distance_km = round(bucket.distance / Math.max(1, bucket.count), 3);
      properties.intensity = round(clamp(Math.log1p(bucket.count) / 2.2, 0.2, 1));
      if (category === "economy") {
        properties.sector = primary;
        properties.activity_status = secondary;
      } else if (category === "utilities") {
        properties.utility_type = primary;
        properties.work_status = secondary;
      }
      return {
        type: "Feature",
        properties,
        geometry: bucket.road.feature.geometry,
      };
    });
}

function lensDetailLayerCounts(features) {
  const counts = {};
  for (const feature of features) {
    const layer = feature.properties?.layer || "unknown";
    counts[layer] = (counts[layer] || 0) + 1;
  }
  return counts;
}

function writeLensDetailYears(city, paths, events, years, outDir) {
  const roads = loadRoadFeatures(city, paths);
  const template = `web/data/city-atlas/cities/${city.city_id}/lens_detail_{year}.geojson`;
  const refLat = cityReferenceLat(city, events);

  for (const year of years) {
    const yearEvents = events.filter((event) => event.year === year);
    const skippedLensDetailRecords = lensDetailSkipSummary(yearEvents);
    const features = [
      ...buildCellFeatures(city, yearEvents, refLat),
      ...buildRoadTraceFeatures(
        city,
        yearEvents,
        roads,
        "economy",
        "economy_frontage",
        FRONTAGE_TRACE_RADIUS_KM,
        "nearest mapped street frontage trace from source-backed economy records",
        "Economy frontage traces use existing OSM street geometry nearest to source-backed event points; they are not measured footfall, spend, or vacancy data.",
      ),
      ...buildPointDetailFeatures(
        city,
        yearEvents,
        "civic_services",
        "civic_facility",
        "source-backed civic facility or service point",
        "Facility glyphs use event point geometry only; no catchment, capacity, or service quality is inferred.",
      ),
      ...buildRoadTraceFeatures(
        city,
        yearEvents,
        roads,
        "utilities",
        "utility_trace",
        UTILITY_TRACE_RADIUS_KM,
        "nearest mapped street or infrastructure-work trace from source-backed utility records",
        "Utility traces are nearest-road/work-location context from source-backed records and existing OSM geometry; no capacity data is inferred.",
      ),
      ...buildPointDetailFeatures(
        city,
        yearEvents,
        "utilities",
        "utility_asset",
        "source-backed utility asset or work point",
        "Utility glyphs show observed or mapped records only and do not imply network capacity.",
      ),
    ];

    writeJson(path.join(outDir, `lens_detail_${year}.geojson`), {
      type: "FeatureCollection",
      name: `${city.city_id}_lens_detail_${year}`,
      metadata: {
        schema_version: "1.0.0",
        city_id: city.city_id,
        year,
        generated_at: new Date().toISOString(),
        source_paths: [
          `web/data/city-atlas/cities/${city.city_id}/events_${year}.json`,
          `web/data/city-atlas/cities/${city.city_id}/events.json`,
          city.city_id === "belfast" && paths.detail_layers ? paths.detail_layers : null,
          paths.transport_roads_base || null,
        ].filter(Boolean),
        method: "Derived OpenCityLog lens geometry built from source-backed event points plus existing OSM road/detail geometry. Grid cells aggregate events by effective year. Trace lines reuse nearest mapped road geometry for context.",
        caveats: [
          "Derived cells are evidence grids, not surveyed parcels, catchments, zones, or administrative boundaries.",
          "Trace lines are nearest mapped street or work-location context, not surveyed utility networks, measured traffic speed, spend, vacancy, or service quality. No capacity data is inferred.",
          "When a lens/year has no same-category source-backed records, no coverage geometry is generated; sparse data remains sparse.",
          "Borough, citywide, statistical, corridor, and multi-site records are excluded from site-like lens geometry; they remain available in the event list and evidence records.",
          "OSM mapped-visibility dates and administrative decision dates can differ from real-world physical change dates.",
        ],
        feature_layers: lensDetailLayerCounts(features),
        excluded_non_site_record_count: Object.values(skippedLensDetailRecords).reduce((sum, value) => sum + value, 0),
        excluded_non_site_reasons: skippedLensDetailRecords,
      },
      features,
    });
  }

  return { template, roadCount: roads.length };
}

function updateArtifactPath(filePath, cityId, additions) {
  const json = readJson(filePath);
  if (Array.isArray(json.cities)) {
    for (const city of json.cities) {
      if (city.city_id !== cityId) continue;
      city.artifact_paths = Object.assign({}, city.artifact_paths, additions);
    }
  } else {
    json.artifact_paths = Object.assign({}, json.artifact_paths, additions);
  }
  writeJson(filePath, json);
}

function buildCity(city) {
  const summaryPaths = city.artifact_paths || {};
  const cityConfigPath = path.join(rootDir, summaryPaths.city);
  const cityArtifact = readJson(cityConfigPath);
  const paths = Object.assign({}, cityArtifact.artifact_paths || {}, summaryPaths);
  const buildCityRecord = Object.assign({}, cityArtifact, city, { artifact_paths: paths });
  const cityDir = path.dirname(path.join(rootDir, paths.city));
  const eventsIndex = readJson(path.join(rootDir, paths.events));
  const years = (eventsIndex.event_years || (eventsIndex.chunks || []).map((chunk) => Number(chunk.year)))
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  for (let year = LENS_YEAR_CONTRACT_START; year <= LENS_YEAR_CONTRACT_END; year += 1) {
    if (!years.includes(year)) years.push(year);
  }
  years.sort((a, b) => a - b);
  const sourceById = sourceByIdFromCity(paths);
  const events = loadEvents(buildCityRecord, eventsIndex, sourceById);
  const hotspotFeatures = buildHotspotFeatures(buildCityRecord.city_id, events);
  const overlayRelativePath = `web/data/city-atlas/cities/${buildCityRecord.city_id}/lens_overlays.geojson`;
  writeJson(path.join(cityDir, "lens_overlays.geojson"), {
    type: "FeatureCollection",
    name: `${buildCityRecord.city_id}_source_backed_lens_overlays`,
    metadata: {
      schema_version: "1.0.0",
      city_id: buildCityRecord.city_id,
      generated_at: new Date().toISOString(),
      years,
      categories: Array.from(LENS_CATEGORIES),
      source_paths: [
        `web/data/city-atlas/cities/${buildCityRecord.city_id}/events.json`,
        `web/data/city-atlas/cities/${buildCityRecord.city_id}/events_{year}.json`,
      ],
      method: "Lens heatmaps aggregate source-backed event points into citywide hotspot cells by category and effective year.",
      caveats: [
        "Hotspots are event-density surfaces, not causal outcome measurements.",
        "Transport road colors are hotspots of mapped or documented transport-change records, not measured traffic counts or live congestion.",
        "OSM edit or mapped-visibility dates can differ from real-world change dates.",
      ],
    },
    features: hotspotFeatures,
  });

  const transportRoads = writeTransportRoadYears(buildCityRecord, paths, events, years, cityDir);
  const lensDetail = writeLensDetailYears(buildCityRecord, paths, events, years, cityDir);
  const additions = {
    lens_overlays: overlayRelativePath,
    lens_detail_template: lensDetail.template,
    transport_roads_base: transportRoads.base,
    transport_roads_template: transportRoads.template,
  };
  updateArtifactPath(cityConfigPath, buildCityRecord.city_id, additions);
  console.log(`${buildCityRecord.city_id}: wrote ${hotspotFeatures.length} hotspot features, ${transportRoads.roadCount} road source features, ${years.length} transport-road year files, and ${years.length} lens-detail year files.`);
  return { city_id: buildCityRecord.city_id, additions };
}

function main() {
  const atlas = readJson(atlasIndexPath);
  const only = new Set(String(process.env.ONLY || "").split(",").map((item) => item.trim()).filter(Boolean));
  const additionsByCity = [];
  for (const city of atlas.cities || []) {
    if (only.size && !only.has(city.city_id)) continue;
    additionsByCity.push(buildCity(city));
  }
  const latestIndex = readJson(atlasIndexPath);
  for (const item of additionsByCity) {
    for (const city of latestIndex.cities || []) {
      if (city.city_id !== item.city_id) continue;
      city.artifact_paths = Object.assign({}, city.artifact_paths, item.additions);
    }
  }
  writeJson(atlasIndexPath, latestIndex);
}

if (require.main === module) {
  main();
}

module.exports = {
  boundaryIndexFromGeoJson,
  loadCityScopeBoundary,
  loadRoadFeatures,
  loadScopedRoadFeatures,
  pointInBoundary,
  clipGeometryToBoundary,
  roadFeatureWithinCityScope,
};
