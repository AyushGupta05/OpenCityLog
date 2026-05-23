import json
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


class DataFoundationTests(unittest.TestCase):
    def test_build_and_verify_normalized_belfast_fixture(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root)

            run_node(root, "scripts/build_data.js")
            coverage = run_node(root, "scripts/build_city_coverage_report.js")
            self.assertIn("Coverage report ready", coverage.stdout)
            schema = run_node(root, "scripts/validate_city_atlas_schema.js")
            self.assertIn("Schema validation OK", schema.stdout)
            completed = run_node(root, "scripts/verify_data.js")
            self.assertIn("Data verification OK", completed.stdout)

            atlas = root / "web" / "data" / "city-atlas" / "cities" / "belfast"
            index = read_json(atlas / "events.json")
            self.assertEqual(index["event_count"], 2)
            self.assertEqual(index["event_years"], [2021, 2024])

            year_payload = read_json(atlas / "events_2024.json")
            event = year_payload["events"][0]
            self.assertEqual(event["city_id"], "belfast")
            self.assertEqual(event["confidence"], "inferred")
            self.assertTrue(event["short_description"])
            self.assertLessEqual(len(event["short_description"]), 220)
            self.assertEqual(event["source_ids"], ["osm-overpass"])
            self.assertEqual(event["geometry"]["type"], "Point")
            self.assertIn("not a confirmed real-world opening", event["explanation"])
            self.assertTrue(event["evidence"])

            geojson = read_json(atlas / "events_2024.geojson")
            self.assertEqual(geojson["type"], "FeatureCollection")
            self.assertEqual(geojson["features"][0]["properties"]["event_id"], event["event_id"])

            coverage_report = read_json(root / "web" / "data" / "city-atlas" / "coverage-report.json")
            self.assertEqual(coverage_report["summary"]["total_events"], 2)
            self.assertEqual(coverage_report["summary"]["source_year_layer_row_count"], 2)
            self.assertTrue(
                any(
                    row["city_id"] == "belfast"
                    and row["source_id"] == "osm-overpass"
                    and row["year"] == 2024
                    and row["layer"] == "transport"
                    and row["event_count"] == 1
                    for row in coverage_report["coverage_rows"]
                )
            )
            self.assertEqual(coverage_report["cities"][0]["target_coverage_gap"]["gap_events"], 99998)
            self.assertTrue((root / "docs" / "data_coverage_report.md").exists())
            atlas_index = read_json(root / "web" / "data" / "city-atlas" / "index.json")
            self.assertEqual(atlas_index["coverage_report_path"], "web/data/city-atlas/coverage-report.json")

    def test_verify_rejects_missing_source_attribution(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root, missing_attribution=True)
            run_node(root, "scripts/build_data.js")
            run_node(root, "scripts/build_city_coverage_report.js")

            completed = run_node(root, "scripts/verify_data.js", check=False)
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("missing attribution_text", completed.stderr)

    def test_verify_rejects_bad_event_source_reference(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root)
            run_node(root, "scripts/build_data.js")
            run_node(root, "scripts/build_city_coverage_report.js")

            chunk_path = root / "web" / "data" / "city-atlas" / "cities" / "belfast" / "events_2024.json"
            payload = read_json(chunk_path)
            payload["events"][0]["source_ids"] = ["missing-source"]
            payload["events"][0]["evidence"][0]["source_id"] = "missing-source"
            chunk_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

            completed = run_node(root, "scripts/verify_data.js", check=False)
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("references unknown source missing-source", completed.stderr)

    def test_verify_rejects_overclaiming_event_caveat(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root)
            run_node(root, "scripts/build_data.js")
            run_node(root, "scripts/build_city_coverage_report.js")

            chunk_path = root / "web" / "data" / "city-atlas" / "cities" / "belfast" / "events_2024.json"
            payload = read_json(chunk_path)
            payload["events"][0]["caveats"] = ["This source caused a measurable local outcome."]
            chunk_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

            completed = run_node(root, "scripts/verify_data.js", check=False)
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("caveats contain overclaiming language", completed.stderr)

    def test_verify_rejects_missing_geometry_provenance(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root)
            run_node(root, "scripts/build_data.js")
            run_node(root, "scripts/build_city_coverage_report.js")

            chunk_path = root / "web" / "data" / "city-atlas" / "cities" / "belfast" / "events_2024.json"
            payload = read_json(chunk_path)
            payload["events"][0]["provenance"].pop("geometry_source", None)
            chunk_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

            completed = run_node(root, "scripts/verify_data.js", check=False)
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("missing provenance.geometry_source", completed.stderr)

    def test_verify_rejects_missing_short_description(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root)
            run_node(root, "scripts/build_data.js")
            run_node(root, "scripts/build_city_coverage_report.js")

            chunk_path = root / "web" / "data" / "city-atlas" / "cities" / "belfast" / "events_2024.json"
            payload = read_json(chunk_path)
            payload["events"][0].pop("short_description", None)
            chunk_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

            completed = run_node(root, "scripts/verify_data.js", check=False)
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("missing short_description", completed.stderr)

    def test_verify_rejects_duplicate_event_ids(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root)
            run_node(root, "scripts/build_data.js")
            run_node(root, "scripts/build_city_coverage_report.js")

            chunk_path = root / "web" / "data" / "city-atlas" / "cities" / "belfast" / "events_2024.json"
            payload = read_json(chunk_path)
            payload["events"][0]["event_id"] = "official-2021-test-service"
            chunk_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

            completed = run_node(root, "scripts/verify_data.js", check=False)
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("Duplicate event id in belfast", completed.stderr)

    def test_verify_rejects_duplicate_source_record_events(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root)
            run_node(root, "scripts/build_data.js")
            run_node(root, "scripts/build_city_coverage_report.js")

            chunk_path = root / "web" / "data" / "city-atlas" / "cities" / "belfast" / "events_2024.json"
            payload = read_json(chunk_path)
            duplicate = dict(payload["events"][0])
            duplicate["event_id"] = "osm-traffic-way-duplicate"
            payload["events"].append(duplicate)
            payload["event_count"] = len(payload["events"])
            chunk_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

            index_path = root / "web" / "data" / "city-atlas" / "cities" / "belfast" / "events.json"
            index = read_json(index_path)
            for chunk in index["chunks"]:
                if chunk["year"] == 2024:
                    chunk["event_count"] = len(payload["events"])
            index["event_count"] += 1
            index_path.write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")

            completed = run_node(root, "scripts/verify_data.js", check=False)
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("Duplicate source-record event in belfast", completed.stderr)

    def test_verify_rejects_advertised_overlay_without_limitations(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root)
            run_node(root, "scripts/build_data.js")
            run_node(root, "scripts/build_city_coverage_report.js")

            overlay_path = root / "web" / "data" / "city-atlas" / "cities" / "belfast" / "lens_overlays.geojson"
            write_json(
                overlay_path,
                {
                    "type": "FeatureCollection",
                    "metadata": {
                        "schema_version": "1.0.0",
                        "city_id": "belfast",
                        "method": "Fixture source-backed aggregation.",
                    },
                    "features": [],
                },
            )
            relative_overlay = "web/data/city-atlas/cities/belfast/lens_overlays.geojson"
            city_path = root / "web" / "data" / "city-atlas" / "cities" / "belfast" / "city.json"
            city = read_json(city_path)
            city["artifact_paths"]["lens_overlays"] = relative_overlay
            write_json(city_path, city)
            index_path = root / "web" / "data" / "city-atlas" / "index.json"
            index = read_json(index_path)
            index["cities"][0]["artifact_paths"]["lens_overlays"] = relative_overlay
            write_json(index_path, index)

            completed = run_node(root, "scripts/verify_data.js", check=False)
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("belfast lens_overlays missing coverage/caveat metadata", completed.stderr)

    def test_build_promotes_local_belfast_air_quality_csv(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root, include_air_quality=True)

            run_node(root, "scripts/build_data.js")
            run_node(root, "scripts/build_city_coverage_report.js")
            completed = run_node(root, "scripts/verify_data.js")
            self.assertIn("Data verification OK", completed.stdout)

            atlas = root / "web" / "data" / "city-atlas" / "cities" / "belfast"
            index = read_json(atlas / "events.json")
            self.assertEqual(index["event_count"], 3)

            year_payload = read_json(atlas / "events_2021.json")
            air_event = next(
                event
                for event in year_payload["events"]
                if event["event_id"] == "ni_air_belfast_centre_2021_hourly_observations"
            )
            self.assertEqual(air_event["category"], "environment")
            self.assertEqual(air_event["source_ids"], ["ni-air-belfast-centre-hourly-2021-2024"])
            self.assertEqual(air_event["confidence"], "documented")
            self.assertEqual(air_event["observed_summary"]["station_code"], "BEL2")
            self.assertEqual(air_event["observed_summary"]["pollutants"]["no2"]["valid_hours"], 2)
            self.assertIn("one monitoring station", " ".join(air_event["caveats"]).lower())

            availability = read_json(atlas / "availability.json")
            environment = next(row for row in availability["matrix"] if row["family_id"] == "environment")
            self.assertEqual(environment["availability"], "partial_local")
            self.assertEqual(environment["event_count"], 1)


def run_node(root: Path, script: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["node", str(REPO_ROOT / script), "--root", str(root)],
        cwd=REPO_ROOT,
        check=check,
        capture_output=True,
        text=True,
    )


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_fixture_project(root: Path, missing_attribution: bool = False, include_air_quality: bool = False) -> None:
    (root / "config" / "cities").mkdir(parents=True)
    (root / "data" / "derived" / "2026").mkdir(parents=True)

    city = {
        "schema_version": "1.0.0",
        "city_id": "belfast",
        "display_name": "Belfast, Northern Ireland",
        "bounds": [-6.12, 54.45, -5.74, 54.75],
        "default_center": [-5.93, 54.6],
        "default_zoom": 11,
        "available_years": {
            "schema_supported_start": 2000,
            "schema_supported_end": 2026,
            "demo_observed_start": 2021,
            "demo_observed_end": 2024,
        },
        "source_families": [
            {
                "family_id": "osm_history",
                "label": "OSM history",
                "source_ids": ["osm-overpass"],
                "availability": "partial_local",
                "years": [2024],
                "notes": "Mapped visibility only.",
            },
            {
                "family_id": "civic_services",
                "label": "Council pages",
                "source_ids": ["belfast-city-council-public-pages"],
                "availability": "partial_local",
                "years": [2021],
                "notes": "Public citation pages.",
            },
        ],
        "data_availability": {"summary": "Fixture", "status": "mvp_partial"},
    }
    if include_air_quality:
        city["source_families"].append(
            {
                "family_id": "environment",
                "label": "Air quality",
                "source_ids": ["ni-air-belfast-centre-hourly-2021-2024"],
                "availability": "partial_local",
                "years": [2021],
                "notes": "Station-level monitoring context only.",
            }
        )
    write_json(root / "config" / "cities" / "belfast.json", city)

    sources = [
        source("osm-overpass", ["*"], "osm_history", "" if missing_attribution else "Copyright OpenStreetMap contributors."),
        source(
            "belfast-city-council-public-pages",
            ["belfast"],
            "civic_services",
            "Source page: Belfast City Council.",
        ),
    ]
    if include_air_quality:
        sources.append(
            source(
                "ni-air-belfast-centre-hourly-2021-2024",
                ["belfast"],
                "environment",
                "Attribute Department of the Environment Northern Ireland and www.airqualityni.co.uk.",
            )
        )
    registry = {
        "schema_version": "1.0.0",
        "sources": sources,
    }
    write_json(root / "config" / "source_registry.json", registry)

    if include_air_quality:
        (root / "belfast_air_quality.csv").write_text(
            "\n".join(
                [
                    'Date,Time,"Belfast Centre/ Nitrogen dioxide","Belfast Centre/ Nitrogen dioxide/ Status","Belfast Centre/ PM2.5 particulate matter (Hourly measured)","Belfast Centre/ PM2.5 particulate matter (Hourly measured)/ Status"',
                    '01/01/2021,01:00,10.5,"V ug/m3",4.2,"V ug/m3"',
                    '01/01/2021,02:00,12.5,"V ug/m3",,"N ug/m3"',
                ]
            )
            + "\n",
            encoding="utf-8",
        )

    legacy = {
        "schemaVersion": "1.0.0",
        "kind": "belfast.infrastructureEventCatalog",
        "eventCount": 2,
        "basis": ["Fixture"],
        "events": [
            {
                "id": "official-2021-test-service",
                "year": 2021,
                "month": "Feb 2021",
                "signal": "services",
                "category": "services",
                "title": "Fixture service opened",
                "area": "Fixture area",
                "coordinates": [-5.93, 54.6],
                "confidence": "high",
                "sourceName": "Belfast City Council",
                "sourceUrl": "https://example.test/service",
                "sourceBasis": "official council project opening",
            },
            {
                "id": "osm-traffic-way-123",
                "sourceId": "way/123",
                "year": 2024,
                "signal": "traffic",
                "category": "traffic",
                "title": "Fixture road mapped in OSM",
                "area": "Fixture road",
                "coordinates": [-5.94, 54.61],
                "confidence": "medium",
                "sourceName": "OpenStreetMap / Overpass API",
                "sourceUrl": "https://www.openstreetmap.org/way/123",
                "osmChangesetUrl": "https://www.openstreetmap.org/changeset/456",
                "osmTimestamp": "2024-03-04T10:11:12Z",
                "osmVersion": 1,
                "osmChangeset": 456,
                "sourceBasis": "OSM mapped infrastructure event",
                "tags": {"highway": "residential", "name": "Fixture road"},
            },
        ],
    }
    write_json(root / "data" / "derived" / "2026" / "belfast_infrastructure_events_2016_2026.json", legacy)


def source(source_id: str, city_ids: list[str], family: str, attribution: str) -> dict:
    return {
        "source_id": source_id,
        "title": source_id,
        "provider": "Fixture provider",
        "source_family": family,
        "city_ids": city_ids,
        "licence": "Fixture licence",
        "licence_url": "https://example.test/licence",
        "coverage_years": {"start": 2000, "end": 2026},
        "update_frequency": "Fixture",
        "url": "https://example.test",
        "local_paths": [],
        "reliability": "usable_with_caveats",
        "source_confidence": "documented" if source_id != "osm-overpass" else "inferred",
        "attribution_text": attribution,
        "provenance_notes": "Fixture provenance.",
        "caveats": ["Fixture caveat."],
    }


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
