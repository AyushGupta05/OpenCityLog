const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const atlasRoot = path.join(rootDir, "web", "data", "city-atlas");
const citiesRoot = path.join(atlasRoot, "cities");
const cityIds = ["belfast", "london", "nyc"];
const atlasYears = Array.from({ length: 20 }, (_, index) => 2007 + index);

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
    props.business_category,
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

function sourceMapForCity(cityId) {
  const sourcesPath = path.join(citiesRoot, cityId, "sources.json");
  if (!fs.existsSync(sourcesPath)) return new Map();
  const payload = readJson(sourcesPath);
  const sources = Array.isArray(payload.sources) ? payload.sources : [];
  return new Map(sources.map((source) => [source.source_id, source]));
}

function evidenceSourceUrl(record = {}) {
  const evidence = Array.isArray(record.evidence) ? record.evidence : [];
  return evidence.find((item) => item && item.url)?.url || record.source_url || "";
}

function parseFhrsBusinessType(title = "") {
  const match = String(title).match(/Food hygiene rating record:\s*(.*?)\s+in\s+/i);
  return match ? match[1].trim() : "food business";
}

function loadLondonFhrsEconomyAnchors() {
  const cityId = "london";
  const cityDir = path.join(citiesRoot, cityId);
  const sourceMap = sourceMapForCity(cityId);
  const source = sourceMap.get("lon-extra-food-hygiene-rating-scheme-api") || {};
  const features = [];
  for (const year of atlasYears) {
    const eventsPath = path.join(cityDir, `events_${year}.json`);
    if (!fs.existsSync(eventsPath)) continue;
    const events = readJson(eventsPath).events || [];
    for (const event of events) {
      const sourceIds = Array.isArray(event.source_ids) ? event.source_ids : [];
      if (!sourceIds.includes("lon-extra-food-hygiene-rating-scheme-api")) continue;
      if (event.geometry?.type !== "Point") continue;
      const businessType = parseFhrsBusinessType(event.title);
      const recordId = event.provenance?.source_record_id || event.event_id;
      const caveats = unique([
        ...(event.caveats || []),
        "FHRS records are food-business/public-health context, not evidence of opening, closure, commercial performance, demand, or causality.",
        "Current context may post-date the selected year; use the source rating date where year-specific evidence is needed.",
      ]);
      features.push(
        normalizeEconomyFeature({
          type: "Feature",
          id: `london-fhrs-economy-anchor-${event.event_id}`,
          geometry: event.geometry,
          properties: {
            source_id: "lon-extra-food-hygiene-rating-scheme-api",
            source_ids: ["lon-extra-food-hygiene-rating-scheme-api"],
            source_record_id: recordId,
            stable_source_id: recordId,
            label: event.title,
            name: event.title,
            context_type: "food_hygiene_business_context",
            business_category: businessType,
            category: "economy",
            lens: "economy",
            source_year: year,
            effective_date: event.effective_date,
            date_precision: event.date_precision,
            source_name: source.title || "Food Hygiene Rating Scheme API",
            source_url: evidenceSourceUrl(event) || source.url || source.source_url || "",
            license: source.licence || source.license || "Requires source-level licence review",
            license_url: source.licence_url || source.license_url || "",
            attribution: source.attribution_text || source.attribution || source.provider || "Food Standards Agency",
            confidence: event.confidence || "documented",
            source_kind: "source_event_context",
            evidence_role: "administrative_food_hygiene_business_record_context",
            geometry_precision: event.provenance?.geometry_precision || "source-supplied FHRS point; may be incomplete or approximate",
            generated_by: "scripts/sync_current_context_aliases.js#loadLondonFhrsEconomyAnchors",
            caveats,
          },
        })
      );
    }
  }
  features.sort((a, b) => {
    const ap = a.properties || {};
    const bp = b.properties || {};
    return String(ap.effective_date || "").localeCompare(String(bp.effective_date || "")) || String(ap.source_record_id || "").localeCompare(String(bp.source_record_id || ""));
  });
  return features;
}

function normalizeEconomyFeature(feature) {
  const props = feature.properties || {};
  const sector = economySectorFromProps(props);
  const label = props.label || props.name || props.f_all_bi_2 || props.lad_name || "Economy context";
  const rank = economyAnchorRank(props);
  const sourceGeometryType = feature.geometry?.type || "";
  const contextCaveats = ["Current context may post-date the selected year; not year-specific change evidence."];
  if (sourceGeometryType && sourceGeometryType !== "Point") {
    contextCaveats.push("Polygon context is rendered as a centroid anchor for map legibility; see the source context artifact for the original geometry.");
  }
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
      source_kind: props.source_kind || "current_context",
      evidence_role: props.evidence_role || "context_not_year_specific_change_evidence",
      source_geometry_type: sourceGeometryType,
      geometry_precision: sourceGeometryType && sourceGeometryType !== "Point" ? "centroid_of_source_context_geometry" : "source_point",
      visible_year: 2026,
      source_name: props.source_name || props.sourceName || props.publisher || "",
      source_url: props.source_url || props.sourceUrl || "",
      caveats: unique([...(props.caveats || []), ...(props.limitations || []), ...contextCaveats]),
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
      network_geometry: props.network_geometry || (isLine ? "line" : "asset"),
      network_role: props.network_role || props.context_type || "utility_works_context",
      utility_type: utilityType,
      work_status: currentOrPlanned ? "current" : "planned",
      rank: Number(Number(props.rank || (isLine ? 2.3 : 2)).toFixed(2)),
      intensity: Number(Number(props.intensity || (isLine ? 0.56 : 0.48)).toFixed(2)),
      asset_priority: isLine ? 1 : 2,
      visual_priority: props.visual_priority || (isLine ? 0.7 : 0.62),
      source_kind: props.source_kind || "current_context",
      evidence_role: props.evidence_role || "context_not_year_specific_change_evidence",
      visible_year: 2026,
      effective_date: normalizeDate(props.issuedworkstartdate || props.startDateTime || props.permitissuedate || props.createdon),
      effective_end_date: normalizeDate(props.issuedworkenddate || props.endDateTime),
      source_name: props.source_name || props.sourceName || props.publisher || "",
      source_url: props.source_url || props.sourceUrl || "",
      caveats: unique([...(props.caveats || []), ...(props.limitations || []), "Current works/permit context; not a surveyed utility network and not capacity or reliability evidence."]),
    },
  };
}

function asLineParts(geometry) {
  if (!geometry) return [];
  if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) return [geometry.coordinates];
  if (geometry.type === "MultiLineString" && Array.isArray(geometry.coordinates)) return geometry.coordinates;
  return [];
}

function scaledPoint(point, referenceLat) {
  const lonScale = Math.cos((referenceLat * Math.PI) / 180);
  return [point[0] * lonScale, point[1]];
}

function distanceSqToSegment(point, start, end, referenceLat) {
  const p = scaledPoint(point, referenceLat);
  const a = scaledPoint(start, referenceLat);
  const b = scaledPoint(end, referenceLat);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (dx === 0 && dy === 0) {
    const px = p[0] - a[0];
    const py = p[1] - a[1];
    return px * px + py * py;
  }
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  const x = a[0] + t * dx;
  const y = a[1] + t * dy;
  const px = p[0] - x;
  const py = p[1] - y;
  return px * px + py * py;
}

function distanceSqToLine(point, geometry) {
  let best = Infinity;
  for (const part of asLineParts(geometry)) {
    for (let index = 1; index < part.length; index += 1) {
      best = Math.min(best, distanceSqToSegment(point, part[index - 1], part[index], point[1]));
    }
  }
  return best;
}

function loadLondonRoadsForUtilityContext() {
  const roadsPath = path.join(citiesRoot, "london", "transport_roads_2026.geojson");
  if (!fs.existsSync(roadsPath)) return [];
  const payload = readJson(roadsPath);
  return (payload.features || [])
    .filter((feature) => asLineParts(feature.geometry).length)
    .filter((feature) => Number(feature.properties?.rank || 0) >= 2.5 || /primary|secondary|tertiary|trunk|motorway|road/i.test(String(feature.properties?.name || feature.properties?.representation || "")));
}

function londonUtilityRoadContextTraces(normalizedUtilityFeatures) {
  const pointFeatures = normalizedUtilityFeatures.filter((feature) => feature.geometry?.type === "Point");
  if (!pointFeatures.length) return [];
  const roads = loadLondonRoadsForUtilityContext();
  if (!roads.length) return [];
  const traces = [];
  const usedTraceIds = new Set();
  for (const feature of pointFeatures) {
    const point = feature.geometry.coordinates;
    const candidates = [];
    for (const road of roads) {
      const roadPoints = coordinatePoints(road.geometry?.coordinates);
      if (!roadPoints.some((candidate) => Math.abs(candidate[0] - point[0]) <= 0.018 && Math.abs(candidate[1] - point[1]) <= 0.014)) continue;
      const distanceSq = distanceSqToLine(point, road.geometry);
      if (distanceSq <= 0.00018) candidates.push({ road, distanceSq });
    }
    candidates.sort((a, b) => a.distanceSq - b.distanceSq);
    for (const { road } of candidates.slice(0, 2)) {
      const props = feature.properties || {};
      const roadProps = road.properties || {};
      const traceId = `${props.source_record_id || props.stable_source_id || props.source_id || "utility"}-${roadProps.source_id || roadProps.id || roadProps.name || "road"}`;
      if (usedTraceIds.has(traceId)) continue;
      usedTraceIds.add(traceId);
      traces.push(
        normalizeUtilityFeature({
          type: "Feature",
          id: `london-utility-road-context-${traceId}`,
          geometry: road.geometry,
          properties: {
            ...props,
            source_id: `${props.source_id || "tfl-road-disruption"}:road-context:${roadProps.source_id || roadProps.name || traces.length}`,
            source_ids: unique([...(props.source_ids || []), "tfl-road-disruptions-utility-works", roadProps.source_id ? `osm:${roadProps.source_id}` : "osm-road-context"]),
            layer: "utility_trace",
            network_geometry: "road_context_trace",
            network_role: "nearest_mapped_street_context_for_utility_work",
            road_context_name: roadProps.name || "mapped road segment",
            road_context_source_id: roadProps.source_id || "",
            road_context_source_url: roadProps.source_url || "",
            source_name: "TfL Road Disruptions API; OpenStreetMap road context",
            source_url: props.source_url || props.sourceUrl || "",
            license: unique([props.license, roadProps.license || "ODbL"]).join("; "),
            geometry_precision: "nearest mapped road segment near the source utility-work point; not a surveyed utility alignment",
            evidence_role: "context_not_surveyed_utility_alignment",
            generated_by: "scripts/sync_current_context_aliases.js#londonUtilityRoadContextTraces",
            rank: 2.55,
            intensity: 0.58,
            visual_priority: 0.72,
            caveats: unique([
              ...(props.caveats || []),
              "Line trace is nearest mapped street context for a TfL utility-work/disruption point; it is not a surveyed utility asset, pipe, cable, capacity, outage, or reliability record.",
              "Road geometry is current OSM context and may post-date the selected replay year.",
            ]),
          },
        })
      );
    }
  }
  traces.sort((a, b) => String(a.id || "").localeCompare(String(b.id || "")));
  return traces;
}

function normalizeAliasFeatures(payload, kind) {
  const features = Array.isArray(payload.features) ? payload.features : [];
  if (kind === "economy") return features.map(normalizeEconomyFeature);
  if (kind === "utility") return features.map(normalizeUtilityFeature);
  return features;
}

function extraAliasFeatures(cityId, spec, normalizedFeatures) {
  if (cityId === "london" && spec.kind === "economy" && spec.to === "economy_anchors_2026.geojson") {
    return loadLondonFhrsEconomyAnchors();
  }
  if (cityId === "london" && spec.kind === "utility" && spec.to === "utility_network_2026.geojson") {
    return londonUtilityRoadContextTraces(normalizedFeatures);
  }
  return [];
}

function syncAlias(cityId, spec) {
  const cityDir = path.join(citiesRoot, cityId);
  const sourcePath = path.join(cityDir, spec.from);
  const aliasPath = path.join(cityDir, spec.to);
  if (!fs.existsSync(sourcePath)) return false;
  const payload = readJson(sourcePath);
  const metadata = payload.metadata || {};
  const normalizedFeatures = normalizeAliasFeatures(payload, spec.kind);
  const extraFeatures = extraAliasFeatures(cityId, spec, normalizedFeatures);
  const features = normalizedFeatures.concat(extraFeatures);
  const nextPayload = {
    ...payload,
    features,
    metadata: {
      ...metadata,
      artifact_role: spec.artifactRole,
      alias_of: relativeFromRoot(sourcePath),
      feature_count: features.length,
      extra_context_feature_count: extraFeatures.length,
      limitations: unique([
        ...(metadata.limitations || []),
        ...(spec.limitations || []),
        ...(extraFeatures.length && spec.kind === "economy" ? ["Additional point anchors come from source-backed administrative food-hygiene/business context and do not claim business opening, closure, demand, performance, or impact."] : []),
        ...(extraFeatures.length && spec.kind === "utility" ? ["Additional road-context traces are nearest mapped street context for utility-work points; they are not surveyed utility alignments, capacity, outage, or reliability evidence."] : []),
      ]),
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
