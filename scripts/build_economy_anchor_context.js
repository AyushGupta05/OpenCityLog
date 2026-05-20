const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const inputPaths = [
  path.join(rootDir, "data", "2026", "belfastcommercial2026.geojson"),
  path.join(rootDir, "data", "derived", "2026", "belfast_ni_services_osm_2026.geojson"),
  path.join(rootDir, "data", "2026", "belfastlandmarks2026.geojson"),
];
const outputPath = path.join(rootDir, "web", "data", "city-atlas", "cities", "belfast", "economy_anchors_2026.geojson");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload), "utf8");
}

function sourceUrl(sourceId) {
  const [type, id] = String(sourceId || "").split("/");
  if (!["node", "way", "relation"].includes(type) || !/^\d+$/.test(id || "")) return "https://www.openstreetmap.org/copyright";
  return `https://www.openstreetmap.org/${type}/${id}`;
}

function flattenCoordinates(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Point") return [geometry.coordinates];
  if (geometry.type === "LineString" || geometry.type === "MultiPoint") return geometry.coordinates || [];
  if (geometry.type === "Polygon" || geometry.type === "MultiLineString") return (geometry.coordinates || []).flat();
  if (geometry.type === "MultiPolygon") return (geometry.coordinates || []).flat(2);
  return [];
}

function geometryPoint(geometry) {
  const coords = flattenCoordinates(geometry)
    .filter((coord) => Number.isFinite(coord?.[0]) && Number.isFinite(coord?.[1]));
  if (!coords.length) return null;
  let lng = 0;
  let lat = 0;
  for (const coord of coords) {
    lng += coord[0];
    lat += coord[1];
  }
  return [Number((lng / coords.length).toFixed(6)), Number((lat / coords.length).toFixed(6))];
}

function textFor(props) {
  return [
    props.name,
    props.amenity,
    props.shop,
    props.office,
    props.tourism,
    props.leisure,
    props.historic,
    props.building,
    props.landuse,
    props.government,
    props.cuisine,
  ].filter(Boolean).join(" ").toLowerCase();
}

function sectorFor(props) {
  const text = textFor(props);
  if (/nightclub|night club|\blate\b/.test(text)) return "night";
  if (/marketplace|market|venue|arena|concert/.test(text)) return "markets";
  if (/pub|bar|restaurant|cafe|fast_food|food|hotel|hostel|guest_house|tourism hotel/.test(text)) return "hospitality";
  if (/museum|gallery|theatre|cinema|attraction|viewpoint|university|college|library|arts_centre|historic|monument|memorial|tourism/.test(text)) return "visitor";
  if (/office|company|government|commercial|industrial|warehouse|business|coworking|employment/.test(text)) return "office";
  if (/shop|retail|mall|supermarket|convenience|department_store|bank|atm|service/.test(text)) return "economy";
  return "";
}

function labelFor(props, sector) {
  if (props.name) return String(props.name).trim();
  const fallback = {
    economy: "Retail/service anchor",
    office: "Office/business anchor",
    hospitality: "Hospitality anchor",
    visitor: "Visitor/culture anchor",
    night: "Night-economy anchor",
    markets: "Market/venue anchor",
  };
  return fallback[sector] || "Economy anchor";
}

function anchorRank(props, sector, geometry) {
  let rank = 1;
  if (props.name) rank += 0.55;
  if (geometry?.type && geometry.type !== "Point") rank += 0.22;
  if (props.wikidata || props.wikipedia || props.website || props.url) rank += 0.25;
  if (props.tourism || props.historic || props.amenity === "university") rank += 0.22;
  if (["visitor", "markets", "hospitality"].includes(sector)) rank += 0.16;
  if (/mall|department_store|cinema|theatre|museum|hotel|marketplace|government|company/.test(textFor(props))) rank += 0.18;
  return Number(Math.min(3.2, rank).toFixed(2));
}

function cleanProperties(value) {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined && item !== null && item !== "")
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

function featureSourceId(feature) {
  const props = feature.properties || {};
  return props.source_id || props.id || feature.id || "";
}

function main() {
  const features = [];
  const seen = new Set();
  const sourcePaths = [];
  for (const filePath of inputPaths) {
    if (!fs.existsSync(filePath)) continue;
    sourcePaths.push(path.relative(rootDir, filePath).replace(/\\/g, "/"));
    const payload = readJson(filePath);
    for (const feature of payload.features || []) {
      const props = feature.properties || {};
      const point = geometryPoint(feature.geometry);
      if (!point) continue;
      const sector = sectorFor(props);
      if (!sector) continue;
      const sourceId = featureSourceId(feature);
      const label = labelFor(props, sector);
      const key = `${sourceId || label}:${point[0]}:${point[1]}:${sector}`;
      if (seen.has(key)) continue;
      seen.add(key);
      features.push({
        type: "Feature",
        properties: cleanProperties({
          id: `economy-anchor-${features.length + 1}`,
          layer: "economy_anchor",
          category: "economy",
          sector,
          sublayer_id: sector,
          label,
          source_id: sourceId,
          source_name: "OpenStreetMap economy/service context",
          publisher: "OpenStreetMap contributors",
          source_url: sourceUrl(sourceId),
          source_type: "osm_current_context",
          license: "ODbL-1.0",
          confidence: "inferred",
          observed_year: 2026,
          context_year: 2026,
          geometry_method: feature.geometry?.type === "Point" ? "OSM point geometry" : `centroid derived from OSM ${feature.geometry?.type || "geometry"}`,
          timing_note: "Current OSM context; the mapped feature does not prove opening date, trading status, footfall, spending, or causal impact.",
          original_geometry_type: feature.geometry?.type,
          osm_amenity: props.amenity,
          osm_shop: props.shop,
          osm_office: props.office,
          osm_tourism: props.tourism,
          osm_leisure: props.leisure,
          osm_historic: props.historic,
          osm_building: props.building,
          anchor_rank: anchorRank(props, sector, feature.geometry),
        }),
        geometry: { type: "Point", coordinates: point },
      });
    }
  }

  features.sort((a, b) =>
    String(a.properties.sector).localeCompare(String(b.properties.sector))
    || Number(b.properties.anchor_rank || 0) - Number(a.properties.anchor_rank || 0)
    || String(a.properties.label || "").localeCompare(String(b.properties.label || ""))
  );

  writeJson(outputPath, {
    type: "FeatureCollection",
    name: "belfast_economy_anchor_context_2026",
    metadata: {
      schema_version: "1.0.0",
      city_id: "belfast",
      generated_at: new Date().toISOString(),
      source: "OpenStreetMap-derived Belfast commercial, services, and landmark context",
      source_paths: sourcePaths,
      license: "ODbL-1.0",
      feature_count: features.length,
      method: "Classifies named OSM commercial, service, hospitality, visitor, office, market, and night-time economy features into gravity-lens anchors. Polygon and line anchors use centroid points for map callouts and flow links.",
      caveats: [
        "Current OSM context is not evidence of opening date, trading status, footfall, spending, or causal impact.",
        "Anchor sectors are tag-derived and may be incomplete where OSM tags are sparse.",
        "These anchors provide destination context; dated evidence records remain the year-changing source-backed layer.",
      ],
    },
    features,
  });
  console.log(`Wrote ${path.relative(rootDir, outputPath)} with ${features.length} economy anchor feature(s).`);
}

main();
