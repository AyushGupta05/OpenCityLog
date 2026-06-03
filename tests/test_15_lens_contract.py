import json
import re
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
LENS_SLUGS = [
    "planning-pressure",
    "planning-parcels",
    "planning-delta",
    "transport-access",
    "transport-reliability",
    "transport-speed",
    "civic-access-gaps",
    "civic-catchment",
    "civic-demand",
    "economy-land-use",
    "economy-vitality",
    "economy-gravity",
    "utilities-capacity",
    "utilities-resilience",
    "utilities-works",
]
LICENSE_REVIEW_RE = re.compile(
    r"require(?:s)? source-level review|not specified|pending|verify before redistribution|terms vary|"
    r"review-required|unclear|non[-\s]?commercial|research/private|private study|"
    r"review publisher terms|bulk redistribution|formal (?:analytical )?reuse|pending rights review",
    re.IGNORECASE,
)


class FifteenLensContractTests(unittest.TestCase):
    def test_generated_lens_contract_verifies(self) -> None:
        completed = subprocess.run(
            ["node", "scripts/verify_15_lens_contract.js"],
            cwd=REPO_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertIn("15-lens contract OK", completed.stdout)

    def test_verifier_rejects_lens_source_without_license_url(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            atlas = Path(tmp) / "atlas"
            write_fixture_atlas(atlas)
            sources_path = atlas / "cities" / "fixture" / "sources.json"
            sources = read_json(sources_path)
            sources["sources"][0].pop("licence_url")
            write_json(sources_path, sources)

            completed = subprocess.run(
                ["node", "scripts/verify_15_lens_contract.js", "--atlas-dir", str(atlas)],
                cwd=REPO_ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("source fixture-source missing licence_url", completed.stderr)

    def test_verifier_rejects_noncommercial_source_as_review_required(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            atlas = Path(tmp) / "atlas"
            write_fixture_atlas(atlas)
            sources_path = atlas / "cities" / "fixture" / "sources.json"
            sources = read_json(sources_path)
            sources["sources"][0]["licence"] = "May be reproduced for non-commercial research/private study only."
            write_json(sources_path, sources)

            completed = subprocess.run(
                ["node", "scripts/verify_15_lens_contract.js", "--atlas-dir", str(atlas)],
                cwd=REPO_ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("source fixture-source still needs license review", completed.stderr)

    def test_verifier_rejects_missing_lens(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            atlas = Path(tmp) / "atlas"
            write_fixture_atlas(atlas, lens_slugs=LENS_SLUGS[:-1])

            completed = subprocess.run(
                ["node", "scripts/verify_15_lens_contract.js", "--atlas-dir", str(atlas)],
                cwd=REPO_ROOT,
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("fixture missing lens utilities-works", completed.stderr)

    def test_event_lens_exclusions_prevent_false_transport_matches(self) -> None:
        script = r"""
const { eventMatchesLens, eventDirectlyMatchesLensCategory } = require("./lib/atlas-lenses");
const sourceById = new Map([[
  "dfi-metro",
  {
    source_family: "transport",
    title: "Northern Ireland Transport Statistics 2007-2008: Ulsterbus/Metro tables",
    provider: "Department for Infrastructure",
    provenance_notes: "Metro bus service activity, passenger journeys and bus kilometres.",
  },
]]);
const metroActivity = {
  category: "transport",
  lens: "transport",
  title: "Metro 2007-08 service activity recorded in NI transport statistics",
  summary: "Metro bus service activity table, not punctuality or utilities.",
  affected_signals: ["transport", "bus", "service_activity", "passenger_journeys"],
  source_ids: ["dfi-metro"],
  excluded_lens_slugs: ["transport-access", "transport-reliability", "transport-speed", "utilities-capacity", "utilities-resilience", "utilities-works"],
};
if (eventMatchesLens(metroActivity, "transport-reliability", sourceById)) throw new Error("Metro activity matched reliability");
if (eventDirectlyMatchesLensCategory(metroActivity, "transport-reliability")) throw new Error("Metro activity directly matched reliability");
if (eventMatchesLens(metroActivity, "utilities-capacity", sourceById)) throw new Error("Metro activity matched utilities");
if (eventMatchesLens(metroActivity, "transport-access", sourceById)) throw new Error("Metro activity matched access");
if (eventMatchesLens(metroActivity, "transport-speed", sourceById)) throw new Error("Metro activity matched speed/activity");

const colinAccess = {
  category: "transport",
  lens: "transport",
  title: "Colin and west Belfast public-transport access context recorded in AIMS answers",
  summary: "AIMS written answers list existing Metro and Ulsterbus routes plus west Belfast bus-priority infrastructure.",
  affected_signals: ["transport", "bus", "route_access", "service_access", "transport_access", "priority_lane"],
  source_ids: ["assembly-colin-routes"],
  excluded_lens_slugs: ["transport-reliability", "transport-speed", "utilities-capacity", "utilities-resilience", "utilities-works"],
};
if (!eventMatchesLens(colinAccess, "transport-access", sourceById)) throw new Error("Colin access context should match access");
if (eventMatchesLens(colinAccess, "transport-speed", sourceById)) throw new Error("Colin access context matched speed/activity");
if (eventMatchesLens(colinAccess, "transport-reliability", sourceById)) throw new Error("Colin access context matched reliability");

const speedContext = {
  category: "transport",
  lens: "transport",
  title: "M1 Blacks Road to Stockmans Lane road scheme delay recorded in AIMS answer",
  summary: "AIMS written answer records road-scheme delay and temporary traffic-management context.",
  affected_signals: ["transport", "traffic", "road_activity", "road_scheme", "scheme_delay", "temporary_traffic_management"],
  source_ids: ["assembly-road-scheme"],
  excluded_lens_slugs: ["transport-access", "transport-reliability", "utilities-capacity", "utilities-resilience", "utilities-works"],
};
if (!eventMatchesLens(speedContext, "transport-speed", sourceById)) throw new Error("Road activity context should match transport speed/activity");
if (eventMatchesLens(speedContext, "transport-access", sourceById)) throw new Error("Road activity context matched access");
if (eventMatchesLens(speedContext, "transport-reliability", sourceById)) throw new Error("Road activity context matched reliability");

const metroPunctuality = {
  category: "transport",
  lens: "transport",
  title: "Metro 2007 punctuality recorded in Assembly written answer",
  summary: "Metro punctuality against the Passenger's Charter target.",
  affected_signals: ["transport", "bus", "service_reliability", "punctuality", "passenger_charter"],
  source_ids: ["assembly-punctuality"],
  excluded_lens_slugs: ["transport-access", "transport-speed", "utilities-capacity", "utilities-resilience", "utilities-works"],
};
if (!eventMatchesLens(metroPunctuality, "transport-reliability", sourceById)) throw new Error("Metro punctuality should match reliability");
if (!eventDirectlyMatchesLensCategory(metroPunctuality, "transport-reliability")) throw new Error("Metro punctuality should directly match reliability");
if (eventMatchesLens(metroPunctuality, "transport-access", sourceById)) throw new Error("Metro punctuality matched access");
if (eventMatchesLens(metroPunctuality, "transport-speed", sourceById)) throw new Error("Metro punctuality matched activity");
"""
        subprocess.run(["node", "-e", script], cwd=REPO_ROOT, check=True)

    def test_belfast_2007_service_wide_context_stays_out_of_hotspots(self) -> None:
        overlay_path = REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / "belfast" / "lens_overlays.geojson"
        overlay = read_json(overlay_path)
        metro_sources = {
            "ni_assembly_translink_metro_punctuality_2007",
        }
        matching = []
        for feature in overlay.get("features", []):
            props = feature.get("properties", {})
            source_ids = {part.strip() for part in str(props.get("source_ids", "")).split(",") if part.strip()}
            if source_ids & metro_sources:
                matching.append(props)
        self.assertEqual(
            matching,
            [],
            "Metro service-wide context records must not be emitted as localized Belfast hotspot cells",
        )

    def test_belfast_2007_event_geojson_preserves_lens_exclusions(self) -> None:
        geojson_path = REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / "belfast" / "events_2007.geojson"
        geojson = read_json(geojson_path)
        by_id = {
            feature.get("properties", {}).get("event_id"): feature.get("properties", {})
            for feature in geojson.get("features", [])
        }
        for event_id in [
            "belfast_colin_public_transport_access_context_2007",
            "belfast_m1_blacks_stockmans_road_scheme_delay_2007",
            "belfast_metro_punctuality_assembly_2007",
        ]:
            with self.subTest(event_id=event_id):
                props = by_id.get(event_id)
                self.assertIsNotNone(props)
                self.assertIsInstance(props.get("excluded_lens_slugs"), list)
                self.assertGreater(len(props.get("excluded_lens_slugs", [])), 0)
                self.assertTrue(props.get("exclude_transport_road_scoring"))

    def test_official_boundary_scope_clips_non_belfast_road_context(self) -> None:
        script = r"""
const {
  clipGeometryToBoundary,
  boundaryIndexFromGeoJson,
  loadCityScopeBoundary,
  loadScopedRoadFeatures,
  pointInBoundary,
} = require("./scripts/build_lens_overlays");

const squareBoundary = boundaryIndexFromGeoJson({
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [[
        [0, 0], [1, 0], [1, 1], [0, 1], [0, 0],
      ]],
    },
  }],
}, { city_id: "fixture" });
const concaveBoundary = boundaryIndexFromGeoJson({
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [[
        [0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2], [0, 0],
      ]],
    },
  }],
}, { city_id: "concave-fixture" });
if (!pointInBoundary([0.5, 1.5], concaveBoundary)) {
  throw new Error("Concave fixture rejected an interior point");
}
if (pointInBoundary([1.5, 1.5], concaveBoundary)) {
  throw new Error("Concave fixture accepted a bbox-only exterior point");
}
const clipped = clipGeometryToBoundary({
  type: "LineString",
  coordinates: [[-1, 0.5], [0.5, 0.5], [2, 0.5]],
}, squareBoundary);
if (!clipped.geometry) throw new Error("Fixture line did not clip into the square boundary");
for (const coord of clipped.geometry.coordinates) {
  if (!pointInBoundary(coord, squareBoundary)) {
    throw new Error(`Fixture clipped coordinate escaped boundary: ${coord.join(",")}`);
  }
}
const outsideEndpointClip = clipGeometryToBoundary({
  type: "LineString",
  coordinates: [[-10, 0.5], [2, 0.5]],
}, squareBoundary);
if (!outsideEndpointClip.geometry) {
  throw new Error("Boundary-crossing line with outside endpoints was dropped");
}
for (const coord of outsideEndpointClip.geometry.coordinates) {
  if (!pointInBoundary(coord, squareBoundary)) {
    throw new Error(`Outside-endpoint clipped coordinate escaped boundary: ${coord.join(",")}`);
  }
}

function assertScopedRoads(cityId, minimumDropped, paths = {}) {
  const boundary = loadCityScopeBoundary(cityId);
  const { roads, scopeFilter } = loadScopedRoadFeatures({ city_id: cityId }, paths);
  if (!scopeFilter) throw new Error(`${cityId} missing scope filter metadata`);
  if (scopeFilter.dropped_out_of_scope_feature_count < minimumDropped) {
    throw new Error(`${cityId} dropped too few bbox road features: ${scopeFilter.dropped_out_of_scope_feature_count}`);
  }
  if (!scopeFilter.boundary_source_url || !scopeFilter.boundary_licence) {
    throw new Error(`${cityId} missing official boundary provenance`);
  }
  let outside = 0;
  for (const road of roads) {
    const stack = [road.feature.geometry.coordinates];
    while (stack.length) {
      const item = stack.pop();
      if (!Array.isArray(item)) continue;
      if (typeof item[0] === "number") {
        if (!pointInBoundary(item, boundary)) outside += 1;
      } else {
        for (const child of item) stack.push(child);
      }
    }
  }
  if (outside) throw new Error(`${cityId} emitted ${outside} road coordinate(s) outside the official boundary`);
}

assertScopedRoads("nyc", 1000);
assertScopedRoads("london", 1);
assertScopedRoads("belfast", 1, { detail_layers: "web/data/city-atlas/cities/belfast/detail_layers.geojson" });
"""
        subprocess.run(["node", "-e", script], cwd=REPO_ROOT, check=True)

    def test_belfast_city_bounds_match_official_lgd_scope(self) -> None:
        city = read_json(REPO_ROOT / "config" / "cities" / "belfast.json")
        boundary = read_json(REPO_ROOT / "data" / "raw" / "boundaries" / "belfast_osni_lgd_boundary_2012.geojson")
        coords: list[list[float]] = []

        def walk(item: object) -> None:
            if not isinstance(item, list) or not item:
                return
            if isinstance(item[0], (int, float)):
                coords.append(item)  # type: ignore[arg-type]
                return
            for child in item:
                walk(child)

        for feature in boundary.get("features", []):
            walk(feature.get("geometry", {}).get("coordinates", []))

        self.assertGreater(len(coords), 0)
        lons = [coord[0] for coord in coords]
        lats = [coord[1] for coord in coords]
        expected_bounds = [min(lons), min(lats), max(lons), max(lats)]
        rounded_expected = [round(value, 6) for value in expected_bounds]
        self.assertEqual(city.get("bounds"), rounded_expected)
        self.assertEqual(city.get("default_center"), [
            round((expected_bounds[0] + expected_bounds[2]) / 2, 6),
            round((expected_bounds[1] + expected_bounds[3]) / 2, 6),
        ])

    def test_belfast_2007_access_event_preserves_per_source_evidence_urls(self) -> None:
        events_path = REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / "belfast" / "events_2007.json"
        events = read_json(events_path).get("events", [])
        access_event = next(
            event for event in events
            if event.get("event_id") == "belfast_colin_public_transport_access_context_2007"
        )
        evidence_by_source = {
            item.get("source_id"): item
            for item in access_event.get("evidence", [])
        }
        self.assertEqual(
            evidence_by_source["ni_assembly_colin_transport_infrastructure_2008"].get("url"),
            "https://data.niassembly.gov.uk/questions.asmx/GetQuestionDetails?documentId=17322",
        )
        self.assertEqual(
            evidence_by_source["ni_assembly_colin_public_transport_routes_2008"].get("url"),
            "https://data.niassembly.gov.uk/questions.asmx/GetQuestionDetails?documentId=17910",
        )

    def test_belfast_2007_metro_context_does_not_generate_transport_roads(self) -> None:
        roads_path = REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / "belfast" / "transport_roads_2007.geojson"
        roads = read_json(roads_path)
        self.assertEqual(
            len(roads.get("features", [])),
            0,
            "Representative citywide Metro table records must not create localized 2007 road linework",
        )
        self.assertTrue(roads.get("metadata", {}).get("suppressed"))

    def test_belfast_missing_transport_year_does_not_emit_transport_roads(self) -> None:
        coverage_path = REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / "belfast" / "lens_year_coverage.json"
        coverage = read_json(coverage_path)
        speed_2024 = next(
            row
            for row in coverage.get("rows", [])
            if row.get("lens_slug") == "transport-speed" and row.get("year") == 2024
        )
        self.assertEqual(speed_2024.get("status"), "adjacent_source_backed_records")
        self.assertEqual(speed_2024.get("direct_event_count"), 0)
        self.assertEqual(speed_2024.get("map_direct_event_count"), 0)
        self.assertGreater(speed_2024.get("withheld_geometry_event_count", 0), 0)

        roads_path = REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / "belfast" / "transport_roads_2024.geojson"
        roads = read_json(roads_path)
        self.assertEqual(
            len(roads.get("features", [])),
            0,
            "Missing Belfast transport lens-years must not expose OSM road activity filler",
        )
        self.assertTrue(roads.get("metadata", {}).get("suppressed"))

    def test_belfast_dfi_2024_25_planning_sources_withhold_map_geometry_not_evidence(self) -> None:
        source_registry = read_json(REPO_ROOT / "config" / "source_registry.json")
        sources = [
            source
            for source in source_registry.get("sources", [])
            if source.get("source_id", "").startswith("dfi-planning-statistics-2024-25-round")
        ]
        self.assertEqual(len(sources), 20)
        for source in sources:
            with self.subTest(source_id=source.get("source_id")):
                self.assertFalse(source_needs_review(source))
                self.assertTrue(source_map_geometry_withheld(source))
                self.assertIn("Open Government Licence v3.0", source.get("licence", ""))
                caveats = " ".join(source.get("caveats", []))
                self.assertIn("OSNI/LPS mapping-derived", caveats)
                self.assertIn("withheld from generated map geometry", caveats)
                self.assertNotIn("requires source-level review", caveats.lower())
                self.assertEqual(
                    source.get("url"),
                    "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-april-2024-march-2025",
                )
                self.assertEqual(source.get("retrieved_at"), "2026-06-03")
                self.assertEqual(source.get("accessed_at"), "2026-06-03")

        ni_source = next(source for source in source_registry.get("sources", []) if source.get("source_id") == "ni-planning-statistics")
        self.assertFalse(source_needs_review(ni_source))
        self.assertTrue(source_map_geometry_withheld(ni_source))

    def test_belfast_dfi_planning_2024_2025_stays_out_of_visible_map_geometry(self) -> None:
        coverage = read_json(
            REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / "belfast" / "lens_year_coverage.json"
        )
        for year in [2024, 2025]:
            for lens_slug in ["planning-pressure", "planning-delta", "planning-parcels"]:
                with self.subTest(year=year, lens_slug=lens_slug):
                    row = next(
                        row
                        for row in coverage.get("rows", [])
                        if row.get("lens_slug") == lens_slug and row.get("year") == year
                    )
                    self.assertEqual(row.get("status"), "source_backed_records")
                    self.assertFalse(row.get("visible_map_contract"))
                    self.assertGreater(row.get("direct_event_count", 0), 0)
                    self.assertEqual(row.get("map_direct_event_count"), 0)
                    self.assertEqual(row.get("direct_withheld_geometry_event_count"), row.get("direct_event_count"))
                    self.assertTrue(row.get("source_ids", []))
                    self.assertIn("withheld", " ".join(row.get("limitations", [])).lower())

            detail = read_json(
                REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / "belfast" / f"lens_detail_{year}.geojson"
            )
            dfi_features = [
                feature.get("properties", {}).get("id")
                for feature in detail.get("features", [])
                if any(
                    source_id == "ni-planning-statistics"
                    or source_id.startswith("dfi-planning-statistics-2024-25-round")
                    for source_id in source_ids_from_properties(feature.get("properties", {}))
                )
            ]
            self.assertEqual(dfi_features, [])

            geojson = read_json(
                REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / "belfast" / f"events_{year}.geojson"
            )
            dfi_event_features = [
                feature.get("properties", {}).get("event_id")
                for feature in geojson.get("features", [])
                if any(
                    source_id == "ni-planning-statistics"
                    or source_id.startswith("dfi-planning-statistics-2024-25-round")
                    for source_id in source_ids_from_properties(feature.get("properties", {}))
                )
            ]
            self.assertEqual(dfi_event_features, [])

        events = read_json(REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / "belfast" / "events_2024.json")
        dfi_event = next(
            event
            for event in events.get("events", [])
            if any(
                source_id.startswith("dfi-planning-statistics-2024-25-round")
                for source_id in event.get("source_ids", [])
            )
        )
        caveats = " ".join(dfi_event.get("caveats", [])).lower()
        self.assertEqual(dfi_event.get("source_date_field"), "DecisionIssuedDate")
        self.assertIn("approval is not evidence", caveats)
        self.assertIn("causal outcomes", caveats)
        self.assertIn("withheld", caveats)
        self.assertIsNone(dfi_event.get("geometry"))
        self.assertEqual(dfi_event.get("geometry_status"), "withheld_rights_review")
        self.assertEqual(dfi_event.get("provenance", {}).get("geometry_status"), "withheld_rights_review")
        self.assertEqual(
            dfi_event.get("provenance", {}).get("source_url"),
            "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-april-2024-march-2025",
        )

        dfi_evidence_urls = [
            item.get("url")
            for item in dfi_event.get("evidence", [])
            if item.get("source_id", "").startswith("dfi-planning-statistics-2024-25-round")
            and item.get("kind") == "source_url"
        ]
        self.assertEqual(
            set(dfi_evidence_urls),
            {
                "https://www.infrastructure-ni.gov.uk/publications/northern-ireland-planning-statistics-april-2024-march-2025",
            },
        )

    def test_nyc_pluto_economy_source_stays_out_of_transport_hotspots(self) -> None:
        overlay_path = REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / "nyc" / "lens_overlays.geojson"
        overlay = read_json(overlay_path)
        transport_pluto_features = []
        for feature in overlay.get("features", []):
            props = feature.get("properties", {})
            source_ids = {part.strip() for part in str(props.get("source_ids", "")).split(",") if part.strip()}
            if props.get("category") == "transport" and "64uk-42ks" in source_ids:
                transport_pluto_features.append(props.get("id"))
        self.assertEqual(
            transport_pluto_features,
            [],
            "NYC PLUTO economy records with secondary transport signals must not be emitted as transport hotspots",
        )

    def test_non_site_reference_geometry_is_evidence_only(self) -> None:
        cases = [
            (
                "nyc",
                1811,
                "nyc-milestone-1811-commissioners-plan-grid-adopted-0",
            ),
            (
                "london",
                1995,
                "lon_hmlr_ukhpi_e09000001-1995-01",
            ),
        ]
        for city_id, year, event_id in cases:
            with self.subTest(city_id=city_id, year=year, event_id=event_id):
                city_dir = REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / city_id
                events = read_json(city_dir / f"events_{year}.json")
                event = next(row for row in events.get("events", []) if row.get("event_id") == event_id)
                self.assertIsNone(event.get("geometry"))
                self.assertEqual(event.get("geometry_status"), "withheld_non_site_scope")
                self.assertEqual(event.get("provenance", {}).get("geometry_status"), "withheld_non_site_scope")
                self.assertGreater(events.get("withheld_geometry_event_count", 0), 0)

                geojson = read_json(city_dir / f"events_{year}.geojson")
                feature_ids = {feature.get("id") or feature.get("properties", {}).get("event_id") for feature in geojson.get("features", [])}
                self.assertNotIn(event_id, feature_ids)
                self.assertEqual(geojson.get("map_feature_count"), len(geojson.get("features", [])))

    def test_generated_lens_geometry_excludes_review_required_or_map_withheld_sources(self) -> None:
        detail_paths = {
            "belfast": ["lens_overlays.geojson", "lens_detail_2015.geojson", "lens_detail_2024.geojson", "lens_detail_2025.geojson"],
            "london": ["lens_overlays.geojson", "lens_detail_1827.geojson"],
            "nyc": ["lens_overlays.geojson", "lens_detail_1811.geojson"],
        }
        for city_id, paths in detail_paths.items():
            city_dir = REPO_ROOT / "web" / "data" / "city-atlas" / "cities" / city_id
            sources = {
                source["source_id"]: source
                for source in read_json(city_dir / "sources.json").get("sources", [])
            }
            for relative_path in paths:
                with self.subTest(city_id=city_id, relative_path=relative_path):
                    feature_collection = read_json(city_dir / relative_path)
                    offenders = []
                    for feature in feature_collection.get("features", []):
                        props = feature.get("properties", {})
                        for source_id in source_ids_from_properties(props):
                            source = sources.get(source_id)
                            if source and (source_needs_review(source) or source_map_geometry_withheld(source)):
                                offenders.append({
                                    "feature_id": props.get("id") or props.get("event_id"),
                                    "source_id": source_id,
                                })
                    self.assertEqual(offenders[:8], [])


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def source_needs_review(source: dict) -> bool:
    text = " ".join(
        str(value)
        for value in [
            source.get("licence"),
            source.get("license"),
            source.get("licence_url"),
            source.get("license_url"),
            " ".join(source.get("caveats") or []),
        ]
        if value
    )
    return bool(LICENSE_REVIEW_RE.search(text))


def source_map_geometry_withheld(source: dict) -> bool:
    return (
        source.get("map_geometry_review_required") is True
        or source.get("map_geometry_status") == "withheld_rights_review"
        or source.get("geometry_status") == "withheld_rights_review"
    )


def source_ids_from_properties(props: dict) -> set[str]:
    source_ids = props.get("source_ids", [])
    if isinstance(source_ids, str):
        return {part.strip() for part in source_ids.split(",") if part.strip()}
    if isinstance(source_ids, list):
        return {str(part).strip() for part in source_ids if str(part).strip()}
    return set()


def write_fixture_atlas(atlas: Path, lens_slugs: list[str] = LENS_SLUGS) -> None:
    source = {
        "source_id": "fixture-source",
        "title": "Fixture public source",
        "provider": "Fixture public agency",
        "source_family": "fixture-records",
        "city_ids": ["fixture"],
        "licence": "Open Government Licence v3.0",
        "licence_url": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
        "coverage_years": {"start": 2020, "end": 2026},
        "update_frequency": "Annual",
        "url": "https://example.test/source",
        "local_paths": [],
        "reliability": "strong",
        "source_confidence": "documented",
        "attribution_text": "Fixture attribution.",
        "provenance_notes": "Fixture row-level public source.",
        "caveats": ["Fixture caveat."],
        "accessed_at": "2026-05-25",
    }
    write_json(atlas / "cities" / "fixture" / "sources.json", {
        "schema_version": "1.0.0",
        "city_id": "fixture",
        "generated_at": "2026-05-25T00:00:00Z",
        "source_count": 1,
        "sources": [source],
    })
    chunks = []
    for year in range(2007, 2027):
        events = fixture_events_for_year(year)
        write_json(atlas / "cities" / "fixture" / f"events_{year}.json", {
            "schema_version": "1.0.0",
            "city_id": "fixture",
            "year": year,
            "event_count": len(events),
            "events": events,
        })
        write_json(atlas / "cities" / "fixture" / f"events_{year}.geojson", {
            "type": "FeatureCollection",
            "features": [{"type": "Feature", "properties": {"event_id": event["event_id"]}, "geometry": event["geometry"]} for event in events],
        })
        write_json(atlas / "cities" / "fixture" / f"lens_detail_{year}.geojson", {
            "type": "FeatureCollection",
            "metadata": {
                "schema_version": "1.0.0",
                "city_id": "fixture",
                "year": year,
                "method": "Fixture lens detail file.",
                "caveats": ["Fixture evidence grids caveat.", "Aggregate records are excluded from site-like lens geometry."],
            },
            "features": [],
        })
        chunks.append({
            "year": year,
            "event_count": len(events),
            "counts_by_category": {
                "built_environment": 1,
                "transport": 1,
                "civic_services": 1,
                "economy": 1,
                "utilities": 1,
            },
            "counts_by_confidence": {"documented": len(events)},
            "counts_by_category_confidence": {
                "built_environment": {"documented": 1},
                "transport": {"documented": 1},
                "civic_services": {"documented": 1},
                "economy": {"documented": 1},
                "utilities": {"documented": 1},
            },
            "area_facet_basis": "affected_area.label",
            "area_facet_count": 1,
            "area_facets": [{
                "key": "fixture ward",
                "label": "Fixture Ward",
                "search_text": "fixture ward",
                "basis": "affected_area.label",
                "count": len(events),
                "counts_by_category": {
                    "built_environment": 1,
                    "transport": 1,
                    "civic_services": 1,
                    "economy": 1,
                    "utilities": 1,
                },
                "counts_by_confidence": {"documented": len(events)},
                "counts_by_category_confidence": {
                    "built_environment": {"documented": 1},
                    "transport": {"documented": 1},
                    "civic_services": {"documented": 1},
                    "economy": {"documented": 1},
                    "utilities": {"documented": 1},
                },
            }],
            "json_path": str(atlas / "cities" / "fixture" / f"events_{year}.json"),
            "geojson_path": str(atlas / "cities" / "fixture" / f"events_{year}.geojson"),
        })

    write_json(atlas / "cities" / "fixture" / "events.json", {
        "schema_version": "1.0.0",
        "city_id": "fixture",
        "generated_at": "2026-05-25T00:00:00Z",
        "event_count": sum(chunk["event_count"] for chunk in chunks),
        "event_years": list(range(2007, 2027)),
        "chunks": chunks,
    })

    lenses = [lens_row(slug) for slug in lens_slugs]
    write_json(atlas / "cities" / "fixture" / "city.json", {
        "schema_version": "1.0.0",
        "city_id": "fixture",
        "display_name": "Fixture City",
        "bounds": [0, 0, 1, 1],
        "default_center": [0.5, 0.5],
        "available_years": {"schema_supported_start": 2007, "schema_supported_end": 2026},
        "artifact_paths": {
            "city": str(atlas / "cities" / "fixture" / "city.json"),
            "events": str(atlas / "cities" / "fixture" / "events.json"),
            "lens_detail_template": str(atlas / "cities" / "fixture" / "lens_detail_{year}.geojson"),
            "lens_manifest": str(atlas / "cities" / "fixture" / "lens_manifest.json"),
            "lens_year_coverage": str(atlas / "cities" / "fixture" / "lens_year_coverage.json"),
        },
    })
    write_json(atlas / "cities" / "fixture" / "lens_year_coverage.json", lens_year_coverage_rows(atlas))
    write_json(atlas / "cities" / "fixture" / "lens_manifest.json", {
        "schema_version": "1.0.0",
        "artifact_kind": "bims_15_lens_city_manifest",
        "generated_at": "2026-05-25T00:00:00Z",
        "city_id": "fixture",
        "display_name": "Fixture City",
        "contract_source": "docs/15_lens_city_design_contract.md",
        "visual_reference_set": "tmp/reference-screens",
        "launched_city": True,
        "official_scope": {
            "official_boundary": {
                "label": "Fixture official boundary",
                "source_name": "Fixture boundary",
                "publisher": "Fixture public agency",
                "source_url": "https://example.test/boundary",
                "source_type": "official boundary dataset",
                "licence": "Open Government Licence v3.0",
                "licence_url": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
                "attribution_text": "Fixture boundary attribution.",
                "accessed_at": "2026-05-25",
                "source_ids": ["fixture-source"],
            },
            "admin_overlays": ["Fixture wards."],
            "scope_note": "Fixture covers the full official boundary.",
        },
        "lens_year_coverage_path": str(atlas / "cities" / "fixture" / "lens_year_coverage.json"),
        "lens_count": len(lenses),
        "lenses": lenses,
    })
    write_json(atlas / "index.json", {
        "schema_version": "1.0.0",
        "generated_at": "2026-05-25T00:00:00Z",
        "default_city_id": "fixture",
        "city_count": 1,
        "cities": [{
            "city_id": "fixture",
            "display_name": "Fixture City",
            "event_count": 15,
            "source_count": 1,
            "availability_status": "ready",
            "artifact_paths": {
                "lens_manifest": str(atlas / "cities" / "fixture" / "lens_manifest.json"),
                "lens_year_coverage": str(atlas / "cities" / "fixture" / "lens_year_coverage.json"),
                "events": str(atlas / "cities" / "fixture" / "events.json"),
                "lens_detail_template": str(atlas / "cities" / "fixture" / "lens_detail_{year}.geojson"),
            },
        }],
        "contracts": {
            "lens_manifest_schema": "schemas/lens_manifest.schema.json",
            "lens_year_coverage_schema": "schemas/lens_year_coverage.schema.json",
        },
        "lens_manifest_path": "web/data/city-atlas/lens-manifest.json",
    })
    write_json(atlas / "lens-manifest.json", {
        "schema_version": "1.0.0",
        "artifact_kind": "bims_15_lens_manifest_index",
        "generated_at": "2026-05-25T00:00:00Z",
        "contract_source": "docs/15_lens_city_design_contract.md",
        "visual_reference_set": "tmp/reference-screens",
        "lens_count": len(lenses),
        "lenses": [{"slug": slug, "public_label": slug} for slug in lens_slugs],
        "cities": [{
            "city_id": "fixture",
            "lens_count": len(lenses),
            "lens_year_coverage_path": str(atlas / "cities" / "fixture" / "lens_year_coverage.json"),
        }],
    })


def fixture_events_for_year(year: int) -> list[dict]:
    categories = [
        ("built_environment", "built_environment"),
        ("transport", "mobility"),
        ("civic_services", "civic_services"),
        ("economy", "economy"),
        ("utilities", "utilities"),
    ]
    events = []
    for index, (category, lens) in enumerate(categories):
        title_category = "retail economy" if category == "economy" else category
        events.append({
            "schema_version": "1.0.0",
            "city_id": "fixture",
            "event_id": f"fixture-{year}-{category}",
            "title": f"Fixture {title_category} record {year}",
            "short_description": f"Fixture source-backed {title_category} row.",
            "year": year,
            "effective_date": f"{year}-01-01",
            "date_precision": "day",
            "source_date_field": "fixture_date",
            "category": category,
            "lens": lens,
            "geometry": {"type": "Point", "coordinates": [0.1 + index * 0.1, 0.1 + index * 0.1]},
            "affected_area": {"label": "Fixture Ward"},
            "source_ids": ["fixture-source"],
            "evidence": [{"source_id": "fixture-source", "label": "Fixture row", "kind": "source_record", "record_id": f"{year}-{category}"}],
            "confidence": "documented",
            "affected_signals": [lens],
            "explanation": "Fixture event for contract verification.",
            "caveats": ["Fixture caveat."],
            "provenance": {
                "transform": "tests/test_15_lens_contract.py#fixture_events_for_year",
                "source_record_id": f"{year}-{category}",
                "source_date_field": "fixture_date",
                "geometry_source": "fixture point",
                "geometry_precision": "fixture point",
            },
        })
    return events


def lens_year_coverage_rows(atlas: Path) -> dict:
    rows = []
    for slug in LENS_SLUGS:
        group = slug.split("-")[0]
        category = {
            "planning": "built_environment",
            "transport": "transport",
            "civic": "civic_services",
            "economy": "economy",
            "utilities": "utilities",
        }[group]
        for year in range(2007, 2027):
            rows.append({
                "city_id": "fixture",
                "display_name": "Fixture City",
                "lens_slug": slug,
                "public_label": slug,
                "group": group,
                "category": category,
                "year": year,
                "required_year": True,
                "visible_map_contract": True,
                "status": "source_backed_records",
                "event_count": 1,
                "compatible_event_count": 1,
                "broad_match_event_count": 1,
                "broad_match_compatible_event_count": 1,
                "direct_event_count": 1,
                "direct_compatible_event_count": 1,
                "detail_feature_count": 0,
                "coverage_context_feature_count": 0,
                "headline_count_included": 1,
                "headline_count_excluded_context_features": 0,
                "confidence_counts": {"documented": 1},
                "source_count": 1,
                "source_ids": ["fixture-source"],
                "compatible_source_ids": ["fixture-source"],
                "broad_match_source_count": 1,
                "broad_match_source_ids": ["fixture-source"],
                "direct_source_count": 1,
                "direct_source_ids": ["fixture-source"],
                "evidence_basis": "Fixture source-backed event row.",
                "map_artifacts": {
                    "events_json": str(atlas / "cities" / "fixture" / f"events_{year}.json"),
                    "events_geojson": str(atlas / "cities" / "fixture" / f"events_{year}.geojson"),
                    "lens_detail_geojson": str(atlas / "cities" / "fixture" / f"lens_detail_{year}.geojson"),
                },
                "limitations": ["Fixture caveat."],
                "exports": {
                    "markdown": True,
                    "csv": True,
                    "geojson": True,
                    "includes_uncertainty_confidence_limitations_licenses_transform_notes": True,
                },
            })
    return {
        "schema_version": "1.0.0",
        "artifact_kind": "bims_lens_year_coverage",
        "generated_at": "2026-05-25T00:00:00Z",
        "city_id": "fixture",
        "display_name": "Fixture City",
        "contract_source": "docs/15_lens_city_design_contract.md",
        "visual_reference_set": "tmp/reference-screens",
        "required_years": {"start": 2007, "end": 2026},
        "required_lens_count": 15,
        "required_row_count": 300,
        "row_count": 300,
        "status_counts": {"source_backed_records": 300},
        "rows": rows,
    }


def lens_row(slug: str) -> dict:
    group = slug.split("-")[0]
    if group == "transport":
        category = "transport"
    elif group == "civic":
        category = "civic_services"
    elif group == "economy":
        category = "economy"
    elif group == "utilities":
        category = "utilities"
    else:
        group = "planning"
        category = "built_environment"
    return {
        "slug": slug,
        "public_label": slug,
        "group": group,
        "category": category,
        "primary_selectable_object_type": "fixture source-backed object",
        "visual_metaphor": "fixture lens metaphor",
        "color_role": "fixture color role",
        "full_city_scope_required": True,
        "coverage": {
            "event_count": 1,
            "compatible_event_count": 1,
            "review_required_event_count": 0,
            "source_count": 1,
            "compatible_source_count": 1,
            "review_required_source_count": 0,
            "observed_years": {"start": 2020, "end": 2026},
            "confidence_counts": {"documented": 1},
            "caveats": ["Fixture caveat."],
            "year_contract": {
                "required_years": {"start": 2007, "end": 2026},
                "required_year_count": 20,
                "visible_year_count": 20,
                "missing_visible_years": [],
                "source_backed_record_year_count": 20,
                "source_backed_context_year_count": 0,
                "lens_year_coverage_path": "fixture/lens_year_coverage.json",
            },
        },
        "freshness": {
            "last_retrieved_or_reviewed": "2026-05-25",
            "source_coverage_period": "2020-2026",
            "update_cadence": "Annual",
        },
        "provenance": {
            "source_ids": ["fixture-source"],
            "compatible_source_ids": ["fixture-source"],
            "review_required_source_ids": [],
            "source_samples": [],
            "transformation_method": "tests/test_15_lens_contract.py#lens_row",
            "methodology_path": "docs/15_lens_source_audit.md#fixture",
            "correction_path": "CONTRIBUTING.md#correction-flow",
        },
        "exports": {
            "selected_object_markdown": True,
            "filtered_view_csv": True,
            "filtered_view_geojson": True,
            "includes_citations_licenses_dates_confidence_limitations": True,
        },
    }


if __name__ == "__main__":
    unittest.main()
