const fs = require("fs");
const path = require("path");
const {
  eventWithholdsMapGeometry: eventWithholdsMapGeometryByStatus,
  licenseNeedsReview,
  sourceHasMinimumLicense,
  sourceWithholdsMapGeometry,
} = require("../lib/atlas-lenses");

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

const LENS_DETAIL_SITE_LAYERS = new Set(["planning_cell", "civic_coverage_cell", "economy_activity_cell", "economy_frontage", "civic_facility", "utility_trace", "utility_asset"]);
const UTILITY_NETWORK_TYPES = new Set(["water", "electricity", "telecoms", "gas", "drainage", "district_energy"]);
const UTILITY_NETWORK_GEOMETRIES = new Set(["asset", "line", "area"]);
const LENS_DETAIL_BAD_SOURCE_PATTERN = /\buk[-_\s]?hpi\b|\bhpi monthly\b|house[-_\s]?price[-_\s]?index|uk[-_\s]?house[-_\s]?price[-_\s]?index|market[-_\s]?trend|lon-extra-uk-house-price-index/i;
const LENS_DETAIL_BAD_PRECISION_PATTERN = /\bborough aggregate\b|\baggregate,\s*not\b|\barea\/city reference\b|\bcitywide\b|\bnot an exact event geometry\b|^(approximate\s+)?district(?:-extension)?(?:\s+approximate|\s+centroid)?\b|^(approximate\s+)?neighbou?rhood(?:\s+approximate|\s+centroid)?\b|^(rail[-\s])?corridor(?:\s+approximate|\s+centroid)?\b|^(multiple sites|multi[-\s]?site|programme approximate)\b/i;
const REQUIRED_LENS_DETAIL_EVENT_IDS = {
  belfast: {
    2022: ["bfs_arch_aster_house_student_accommodation_completion_2022"],
  },
  london: {
    2020: ["lon_arch_poplar_works_opening_2020"],
    2021: ["lon_arch_one_park_drive_residential_opening_2021"],
  },
  nyc: {
    2019: ["nyc_arch_35_hudson_yards_completion_2019"],
  },
};

function lensDetailSiteText(feature) {
  const props = feature.properties || {};
  return {
    source: String(props.source_ids || ""),
    precision: [
    props.geometry_precision,
    props.geometry_precision_mix,
    ].filter(Boolean).join(" "),
  };
}

function hasNonSiteLensDetail(feature) {
  if (feature.properties?.coverage_status === "no_same_category_records") return false;
  const siteText = lensDetailSiteText(feature);
  return LENS_DETAIL_SITE_LAYERS.has(feature.properties?.layer)
    && (LENS_DETAIL_BAD_SOURCE_PATTERN.test(siteText.source) || LENS_DETAIL_BAD_PRECISION_PATTERN.test(siteText.precision));
}

function lensDetailEventIds(features) {
  const ids = new Set();
  for (const feature of features || []) {
    for (const field of ["event_ids_all", "event_ids"]) {
      String(feature.properties?.[field] || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((id) => ids.add(id));
    }
  }
  return ids;
}

function eventHasCompatibleSources(event, sourceById) {
  const ids = Array.isArray(event?.source_ids) ? event.source_ids : [];
  return ids.length > 0
    && ids.every((sourceId) => {
      const source = sourceById.get(sourceId);
      return sourceHasMinimumLicense(source) && !licenseNeedsReview(source);
    });
}

function eventWithholdsMapGeometry(event, sourceById) {
  const ids = Array.isArray(event?.source_ids) ? event.source_ids : [];
  return eventWithholdsMapGeometryByStatus(event)
    || ids.some((sourceId) => sourceWithholdsMapGeometry(sourceById.get(sourceId)));
}

function compatibleRequiredLensDetailEventIds(eventsManifest, year, requiredIds, sourceById) {
  if (!requiredIds?.length) return [];
  const chunk = (eventsManifest.chunks || []).find((item) => Number(item.year) === Number(year));
  if (!chunk?.json_path) return requiredIds;
  const payload = readJson(chunk.json_path);
  const eventById = new Map((payload?.events || []).map((event) => [event.event_id, event]));
  return requiredIds.filter((eventId) => {
    const event = eventById.get(eventId);
    return !event || eventHasCompatibleSources(event, sourceById);
  });
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
    const utilityNetwork = paths.utility_network ? readJson(paths.utility_network) : null;
    const sourceById = new Map((sources?.sources || []).map((source) => [source.source_id, source]));

    for (const key of ["lens_overlays", "lens_detail_template", "transport_roads_base", "transport_roads_template", "utility_network"]) {
      assert(paths[key], `City ${city.city_id} is missing required artifact_paths.${key}.`);
    }
    if (paths.lens_overlays) assert(exists(paths.lens_overlays), `City ${city.city_id} lens overlay artifact is missing: ${paths.lens_overlays}`);
    if (paths.transport_roads_base) assert(exists(paths.transport_roads_base), `City ${city.city_id} transport base road artifact is missing: ${paths.transport_roads_base}`);
    if (paths.utility_network) assert(exists(paths.utility_network), `City ${city.city_id} utility network artifact is missing: ${paths.utility_network}`);

    if (cityMeta) {
      assert(Array.isArray(cityMeta.default_center) && cityMeta.default_center.length === 2, `City ${city.city_id} must define a [lng, lat] default_center.`);
      assert(typeof cityMeta.default_zoom === "number", `City ${city.city_id} must define numeric default_zoom.`);
      assert(cityMeta.artifact_paths?.utility_network === paths.utility_network, `City ${city.city_id} utility_network path must match index and city artifact.`);
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
          assert(eventChunk.events.every((event) => event.event_id && event.title && event.year), `City ${city.city_id} ${chunk.year} events need id/title/year.`);
          const eventsWithBadGeometry = eventChunk.events.filter((event) => (
            eventWithholdsMapGeometry(event, sourceById)
              ? (event.geometry || !/^withheld_/.test(String(event.geometry_status || event.provenance?.geometry_status || "")))
              : !event.geometry
          ));
          assert(eventsWithBadGeometry.length === 0, `City ${city.city_id} ${chunk.year} events have invalid or undisclosed geometry state.`);
          const geojson = chunk.geojson_path && exists(chunk.geojson_path) ? readJson(chunk.geojson_path) : null;
          if (geojson) {
            const expectedMapFeatureCount = Number.isInteger(chunk.map_feature_count)
              ? chunk.map_feature_count
              : Number.isInteger(eventChunk.map_feature_count)
                ? eventChunk.map_feature_count
                : eventChunk.events.filter((event) => event.geometry).length;
            assert(geojson.type === "FeatureCollection", `City ${city.city_id} ${chunk.year} event GeoJSON must be a FeatureCollection.`);
            assert(Array.isArray(geojson.features) && geojson.features.length === expectedMapFeatureCount, `City ${city.city_id} ${chunk.year} event GeoJSON feature count must match map_feature_count.`);
          }
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

      if (paths.lens_detail_template) {
        assert(paths.lens_detail_template.includes("{year}"), `City ${city.city_id} lens_detail_template must include {year}.`);
        for (const year of eventsManifest.event_years || (eventsManifest.chunks || []).map((chunk) => chunk.year)) {
          const detailPath = paths.lens_detail_template.replace("{year}", String(year));
          assert(exists(detailPath), `City ${city.city_id} required lens detail artifact is missing for ${year}: ${detailPath}`);
          const lensDetail = exists(detailPath) ? readJson(detailPath) : null;
          if (lensDetail) {
            const layers = new Set((lensDetail.features || []).map((feature) => feature.properties?.layer).filter(Boolean));
            assert(lensDetail.type === "FeatureCollection", `City ${city.city_id} lens_detail_${year} must be a GeoJSON FeatureCollection.`);
            assert(Number(lensDetail.metadata?.year) === Number(year), `City ${city.city_id} lens_detail_${year} metadata year mismatch.`);
            assert(/evidence grids/i.test((lensDetail.metadata?.caveats || []).join(" ")), `City ${city.city_id} lens_detail_${year} must caveat derived evidence grids.`);
            assert(/no capacity data is inferred/i.test((lensDetail.metadata?.caveats || []).join(" ")), `City ${city.city_id} lens_detail_${year} must not imply utility capacity.`);
            assert(/excluded from site-like lens geometry/i.test((lensDetail.metadata?.caveats || []).join(" ")), `City ${city.city_id} lens_detail_${year} must disclose aggregate/non-site exclusions.`);
            assert(
              ["planning_cell", "civic_coverage_cell", "economy_activity_cell", "economy_frontage", "civic_facility", "utility_trace", "utility_asset"].some((layer) => layers.has(layer)) || (lensDetail.features || []).length === 0,
              `City ${city.city_id} lens_detail_${year} must include recognized lens-detail layers or be honestly empty.`,
            );
            assert((lensDetail.features || []).every((feature) => feature.properties?.category && Number.isInteger(Number(feature.properties?.year))), `City ${city.city_id} lens_detail_${year} features need category and year.`);
            assert(!(lensDetail.features || []).some(hasNonSiteLensDetail), `City ${city.city_id} lens_detail_${year} must not render aggregate/statistical/non-site records as lens geometry.`);
            const requiredIds = compatibleRequiredLensDetailEventIds(
              eventsManifest,
              year,
              REQUIRED_LENS_DETAIL_EVENT_IDS[city.city_id]?.[year] || [],
              sourceById,
            );
            if (requiredIds.length) {
              const emittedIds = lensDetailEventIds(lensDetail.features || []);
              for (const eventId of requiredIds) {
                assert(emittedIds.has(eventId), `City ${city.city_id} lens_detail_${year} must preserve source-backed approximate site event ${eventId}.`);
              }
            }
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
    if (utilityNetwork) {
      assert(utilityNetwork.type === "FeatureCollection", `City ${city.city_id} utility_network must be a GeoJSON FeatureCollection.`);
      assert(/does not contain measured utility capacity|no capacity/i.test((utilityNetwork.metadata?.caveats || []).join(" ")), `City ${city.city_id} utility_network must caveat utility capacity.`);
      assert(/service availability|service-availability/i.test((utilityNetwork.metadata?.caveats || []).join(" ")), `City ${city.city_id} utility_network must caveat service availability.`);
      assert((utilityNetwork.features || []).length > 0, `City ${city.city_id} utility_network must include citywide utility context features.`);
      for (const feature of utilityNetwork.features || []) {
        const props = feature.properties || {};
        assert(feature.geometry, `City ${city.city_id} utility_network feature ${props.id || "<unknown>"} needs geometry.`);
        assert(props.layer === "utility_network" && props.category === "utilities", `City ${city.city_id} utility_network feature ${props.id || "<unknown>"} needs utility layer/category.`);
        assert(UTILITY_NETWORK_TYPES.has(props.utility_type), `City ${city.city_id} utility_network feature ${props.id || "<unknown>"} has unsupported utility_type.`);
        assert(UTILITY_NETWORK_GEOMETRIES.has(props.network_geometry), `City ${city.city_id} utility_network feature ${props.id || "<unknown>"} has unsupported network_geometry.`);
        for (const field of ["source_id", "source_registry_id", "source_object_id", "publisher", "source_url", "license", "accessed_at", "transformation_method", "geometry_source", "context_year", "confidence", "caveat"]) {
          assert(props[field] !== undefined && String(props[field]).trim() !== "", `City ${city.city_id} utility_network feature ${props.id || "<unknown>"} missing ${field}.`);
        }
      }
    }
  }
}

if (failures.length) {
  console.error("City atlas manifest verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`City atlas manifest verification OK: ${atlas.cities.length} cities, ${atlas.cities.reduce((sum, city) => sum + city.event_count, 0)} source-backed events.`);
