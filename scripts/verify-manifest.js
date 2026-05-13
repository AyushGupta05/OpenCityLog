const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const failures = [];

function readJson(relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`Missing required atlas artifact: ${relativePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    failures.push(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const atlasIndexPath = "web/data/city-atlas/index.json";
const atlas = readJson(atlasIndexPath);

if (atlas) {
  assert(atlas.schema_version === "1.0.0", "City atlas index schema_version must be 1.0.0.");
  assert(Array.isArray(atlas.cities) && atlas.cities.length >= 3, "City atlas index must contain at least three cities.");
  assert(atlas.default_city_id && atlas.cities.some((city) => city.city_id === atlas.default_city_id), "Default city must exist in city atlas index.");

  for (const city of atlas.cities || []) {
    assert(city.city_id, "City entry is missing city_id.");
    assert(city.display_name, `City ${city.city_id || "unknown"} is missing display_name.`);
    const paths = city.artifact_paths || {};
    for (const key of ["city", "sources", "events", "availability"]) {
      assert(paths[key], `City ${city.city_id} is missing artifact_paths.${key}.`);
      if (paths[key]) assert(exists(paths[key]), `City ${city.city_id} artifact is missing: ${paths[key]}`);
    }

    const cityMeta = paths.city ? readJson(paths.city) : null;
    const sources = paths.sources ? readJson(paths.sources) : null;
    const eventsManifest = paths.events ? readJson(paths.events) : null;
    const availability = paths.availability ? readJson(paths.availability) : null;
    const currentState = paths.current_state ? readJson(paths.current_state) : null;
    const detailLayers = paths.detail_layers ? readJson(paths.detail_layers) : null;
    const lensOverlays = paths.lens_overlays ? readJson(paths.lens_overlays) : null;
    const transportRoadBase = paths.transport_roads_base ? readJson(paths.transport_roads_base) : null;

    for (const key of ["lens_overlays", "transport_roads_base", "transport_roads_template"]) {
      assert(paths[key], `City ${city.city_id} is missing required artifact_paths.${key}.`);
    }
    if (paths.lens_overlays) assert(exists(paths.lens_overlays), `City ${city.city_id} lens overlay artifact is missing: ${paths.lens_overlays}`);
    if (paths.transport_roads_base) assert(exists(paths.transport_roads_base), `City ${city.city_id} transport base road artifact is missing: ${paths.transport_roads_base}`);

    if (cityMeta) {
      assert(Array.isArray(cityMeta.default_center) && cityMeta.default_center.length === 2, `City ${city.city_id} must define a [lng, lat] default_center.`);
      assert(typeof cityMeta.default_zoom === "number", `City ${city.city_id} must define numeric default_zoom.`);
    }

    if (sources) {
      assert(Array.isArray(sources.sources), `City ${city.city_id} sources artifact must expose sources[].`);
      assert(sources.sources.length === city.source_count, `City ${city.city_id} source_count mismatch: index=${city.source_count}, artifact=${sources.sources.length}.`);
      assert(sources.sources.every((source) => source.source_id && source.title && source.provider), `City ${city.city_id} sources need source_id/title/provider.`);
    }

    if (eventsManifest) {
      assert(Array.isArray(eventsManifest.chunks) && eventsManifest.chunks.length > 0, `City ${city.city_id} events manifest needs chunks.`);
      const chunkTotal = (eventsManifest.chunks || []).reduce((sum, chunk) => sum + Number(chunk.event_count || 0), 0);
      assert(chunkTotal === eventsManifest.event_count, `City ${city.city_id} event_count mismatch across chunks.`);
      assert(eventsManifest.event_count === city.event_count, `City ${city.city_id} event_count mismatch: index=${city.event_count}, manifest=${eventsManifest.event_count}.`);

      for (const chunk of eventsManifest.chunks || []) {
        assert(Number.isInteger(chunk.year), `City ${city.city_id} chunk is missing numeric year.`);
        assert(chunk.json_path && exists(chunk.json_path), `City ${city.city_id} chunk JSON is missing for ${chunk.year}.`);
        assert(chunk.geojson_path && exists(chunk.geojson_path), `City ${city.city_id} chunk GeoJSON is missing for ${chunk.year}.`);
        assert(chunk.counts_by_confidence && typeof chunk.counts_by_confidence === "object", `City ${city.city_id} ${chunk.year} chunk is missing confidence counts for timeline filtering.`);
        assert(chunk.counts_by_category_confidence && typeof chunk.counts_by_category_confidence === "object", `City ${city.city_id} ${chunk.year} chunk is missing category/confidence counts for timeline filtering.`);
        const confidenceTotal = Object.values(chunk.counts_by_confidence || {}).reduce((sum, value) => sum + Number(value || 0), 0);
        const categoryConfidenceTotals = Object.values(chunk.counts_by_category_confidence || {})
          .flatMap((counts) => Object.values(counts || {}))
          .reduce((sum, value) => sum + Number(value || 0), 0);
        assert(confidenceTotal === chunk.event_count, `City ${city.city_id} ${chunk.year} confidence counts do not sum to event_count.`);
        assert(categoryConfidenceTotals === chunk.event_count, `City ${city.city_id} ${chunk.year} category/confidence counts do not sum to event_count.`);
        const eventChunk = chunk.json_path ? readJson(chunk.json_path) : null;
        if (eventChunk) {
          assert(Array.isArray(eventChunk.events), `City ${city.city_id} ${chunk.year} chunk must expose events[].`);
          assert(eventChunk.events.length === chunk.event_count, `City ${city.city_id} ${chunk.year} chunk event_count mismatch.`);
          assert(eventChunk.events.every((event) => event.event_id && event.title && event.year && event.geometry), `City ${city.city_id} ${chunk.year} events need id/title/year/geometry.`);
        }
      }

      if (paths.transport_roads_template) {
        assert(paths.transport_roads_template.includes("{year}"), `City ${city.city_id} transport_roads_template must include {year}.`);
        for (const year of eventsManifest.event_years || (eventsManifest.chunks || []).map((chunk) => chunk.year)) {
          const roadPath = paths.transport_roads_template.replace("{year}", String(year));
          assert(exists(roadPath), `City ${city.city_id} required transport road artifact is missing for ${year}: ${roadPath}`);
          const roadYear = exists(roadPath) ? readJson(roadPath) : null;
          if (roadYear) {
            assert(roadYear.type === "FeatureCollection", `City ${city.city_id} transport_roads_${year} must be a GeoJSON FeatureCollection.`);
            assert(Number(roadYear.metadata?.year) === Number(year), `City ${city.city_id} transport_roads_${year} metadata year mismatch.`);
            assert(/not measured traffic/i.test(String(roadYear.metadata?.caveat || "")), `City ${city.city_id} transport_roads_${year} must caveat traffic intensity.`);
            assert((roadYear.features || []).every((feature) => feature.properties?.layer === "traffic_road" && Number.isFinite(Number(feature.properties?.transport_activity))), `City ${city.city_id} transport_roads_${year} features need traffic_road layer and numeric transport_activity.`);
          }
        }
      }
    }

    if (availability) {
      assert(availability.city_id === city.city_id, `City ${city.city_id} availability city_id mismatch.`);
    }

    if (currentState) {
      assert(currentState.city_id === city.city_id, `City ${city.city_id} current_state city_id mismatch.`);
      assert(Array.isArray(currentState.layers) || Array.isArray(currentState.signals) || Array.isArray(currentState.cards), `City ${city.city_id} current_state needs layers[], signals[], or cards[].`);
    }

    if (detailLayers) {
      assert(detailLayers.type === "FeatureCollection", `City ${city.city_id} detail_layers must be a GeoJSON FeatureCollection.`);
      assert(detailLayers.metadata?.license === "ODbL", `City ${city.city_id} detail_layers must retain ODbL licence metadata.`);
      assert((detailLayers.features || []).some((feature) => feature.properties?.layer === "road"), `City ${city.city_id} detail_layers must include road features.`);
      assert((detailLayers.features || []).some((feature) => feature.properties?.layer === "building"), `City ${city.city_id} detail_layers must include building features.`);
      assert((detailLayers.features || []).every((feature) => Number.isInteger(Number(feature.properties?.visible_year))), `City ${city.city_id} detail layer features need visible_year.`);
    }

    if (lensOverlays) {
      assert(lensOverlays.type === "FeatureCollection", `City ${city.city_id} lens_overlays must be a GeoJSON FeatureCollection.`);
      assert(/not measured traffic/i.test((lensOverlays.metadata?.caveats || []).join(" ")), `City ${city.city_id} lens_overlays must caveat traffic/road intensity.`);
      assert((lensOverlays.features || []).some((feature) => feature.properties?.layer === "lens_event"), `City ${city.city_id} lens_overlays must include event heatmap points.`);
      assert((lensOverlays.features || []).filter((feature) => feature.properties?.layer === "lens_event").every((feature) => feature.properties?.category && Number.isInteger(Number(feature.properties?.year))), `City ${city.city_id} lens event overlays need category and year.`);
    }

    if (transportRoadBase) {
      assert(transportRoadBase.type === "FeatureCollection", `City ${city.city_id} transport_roads_base must be a GeoJSON FeatureCollection.`);
      assert(/not measured traffic/i.test(String(transportRoadBase.metadata?.caveat || "")), `City ${city.city_id} transport_roads_base must caveat traffic intensity.`);
      assert((transportRoadBase.features || []).length > 0, `City ${city.city_id} transport_roads_base must include citywide road features.`);
      assert((transportRoadBase.features || []).every((feature) => feature.properties?.layer === "traffic_road_base" && feature.geometry), `City ${city.city_id} transport_roads_base features need traffic_road_base layer and geometry.`);
    }
  }
}

if (failures.length) {
  console.error("City atlas manifest verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`City atlas manifest verification OK: ${atlas.cities.length} cities, ${atlas.cities.reduce((sum, city) => sum + city.event_count, 0)} source-backed events.`);
