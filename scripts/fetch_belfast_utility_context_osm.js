const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CITY_ID = "belfast";
const OBSERVED_YEAR = 2026;
const OUTPUT = path.join(ROOT, "data", "derived", "2026", "belfast_ni_utility_context_osm_2026.geojson");
const BBOX = [54.5, -6.08, 54.68, -5.76];
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function overpassQuery() {
  const bbox = BBOX.join(",");
  return `[out:json][timeout:60];
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
out body geom;`;
}

function classifyUtility(tags = {}) {
  const text = Object.entries(tags)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ")
    .toLowerCase();
  if (/substance=gas|pipeline=gas|utility=gas|\bgas=/.test(text)) {
    return { utilityType: "gas", role: tags.pipeline || tags.substance || tags.utility || "gas" };
  }
  if (/waterway=(drain|ditch)|pipeline=(sewer|drain)|wastewater|storm_drain|sewerage/.test(text)) {
    return {
      utilityType: "drainage",
      role: tags.waterway || tags.pipeline || tags.man_made || tags.substance || "drainage",
    };
  }
  if (/telecom|communication|communications_tower/.test(text)) {
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

function ringFromWayGeometry(geometry) {
  const coords = geometry.map((point) => [point.lon, point.lat]);
  if (!coords.length) return [];
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
  return coords;
}

function geometryFromElement(element, classification) {
  if (element.type === "node" && Number.isFinite(element.lon) && Number.isFinite(element.lat)) {
    return { type: "Point", coordinates: [element.lon, element.lat] };
  }
  if (Array.isArray(element.geometry) && element.geometry.length >= 2) {
    const coords = element.geometry.map((point) => [point.lon, point.lat]);
    const first = coords[0];
    const last = coords[coords.length - 1];
    const isClosed = first && last && first[0] === last[0] && first[1] === last[1];
    const tags = element.tags || {};
    const isArea = isClosed && (
      tags.area === "yes"
      || /plant|substation|exchange|central_office/.test(String(classification.role || ""))
      || ["Polygon", "MultiPolygon"].includes(String(tags.type || ""))
    );
    if (isArea) return { type: "Polygon", coordinates: [ringFromWayGeometry(element.geometry)] };
    return { type: "LineString", coordinates: coords };
  }
  if (element.bounds) {
    const lon = (Number(element.bounds.minlon) + Number(element.bounds.maxlon)) / 2;
    const lat = (Number(element.bounds.minlat) + Number(element.bounds.maxlat)) / 2;
    if (Number.isFinite(lon) && Number.isFinite(lat)) return { type: "Point", coordinates: [lon, lat] };
  }
  return null;
}

function normaliseElement(element, index) {
  const tags = element.tags || {};
  const classification = classifyUtility(tags);
  if (!classification) return null;
  const geometry = geometryFromElement(element, classification);
  if (!geometry) return null;
  const sourceId = osmSourceId(element);
  const name = tags.name || tags.operator || tags.ref || classification.role;
  return {
    type: "Feature",
    id: `utility-context-${CITY_ID}-${OBSERVED_YEAR}-${index}`,
    properties: {
      id: `utility-context-${CITY_ID}-${OBSERVED_YEAR}-${index}`,
      source_id: sourceId,
      source_name: "OpenStreetMap telecom, gas, and drainage utility context via local derived extract",
      publisher: "OpenStreetMap contributors",
      source_url: osmUrl(element),
      source_type: "open geospatial extract",
      license: "ODbL-1.0",
      city_id: CITY_ID,
      observed_year: OBSERVED_YEAR,
      context_year: OBSERVED_YEAR,
      category: "utilities",
      utility_type: classification.utilityType,
      network_role: String(classification.role || "").toLowerCase(),
      name: name || "",
      osm_type: element.type,
      osm_id: element.id,
      confidence: "inferred",
      caveat: "Current OSM mapped context; not a confirmed installation date, capacity measurement, outage state, or service-availability claim.",
    },
    geometry,
  };
}

async function main() {
  const url = `${OVERPASS_URL}?data=${encodeURIComponent(overpassQuery())}`;
  const response = await fetch(url, {
    headers: { "user-agent": "OpenCityLog-Bims-5 utility context builder" },
  });
  if (!response.ok) {
    throw new Error(`Overpass request failed: ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  const features = (payload.elements || [])
    .map((element, index) => normaliseElement(element, index))
    .filter(Boolean);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify({
    type: "FeatureCollection",
    name: `${CITY_ID}_utility_context_${OBSERVED_YEAR}`,
    metadata: {
      schema_version: "1.0.0",
      city_id: CITY_ID,
      observed_year: OBSERVED_YEAR,
      generated_at: new Date().toISOString(),
      source: "OpenStreetMap via Overpass API",
      source_url: OVERPASS_URL,
      overpass_timestamp_osm_base: payload.osm3s?.timestamp_osm_base || null,
      bbox: BBOX,
      method: "Fetched OSM telecom, gas, and drainage utility context tags for the Belfast utility lenses. These records supplement the existing local OSM water and power extracts.",
      caveats: [
        "OSM mapped visibility is not a confirmed installation/opening date.",
        "The artifact does not contain measured utility capacity, outage state, or service availability.",
        "Point utility assets may be used by the frontend to derive nearby inspection traces along mapped streets; those traces are visual context only.",
      ],
    },
    features,
  }));
  console.log(`[utility-context-osm] wrote ${features.length} features -> ${path.relative(ROOT, OUTPUT)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
