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
            self.assertEqual(event["source_ids"], ["osm-overpass"])
            self.assertEqual(event["geometry"]["type"], "Point")
            self.assertIn("not a confirmed real-world opening", event["explanation"])
            self.assertTrue(event["evidence"])

            geojson = read_json(atlas / "events_2024.geojson")
            self.assertEqual(geojson["type"], "FeatureCollection")
            self.assertEqual(geojson["features"][0]["properties"]["event_id"], event["event_id"])

    def test_verify_rejects_missing_source_attribution(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root, missing_attribution=True)
            run_node(root, "scripts/build_data.js")

            completed = run_node(root, "scripts/verify_data.js", check=False)
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("missing attribution_text", completed.stderr)

    def test_verify_rejects_bad_event_source_reference(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write_fixture_project(root)
            run_node(root, "scripts/build_data.js")

            chunk_path = root / "web" / "data" / "city-atlas" / "cities" / "belfast" / "events_2024.json"
            payload = read_json(chunk_path)
            payload["events"][0]["source_ids"] = ["missing-source"]
            payload["events"][0]["evidence"][0]["source_id"] = "missing-source"
            chunk_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

            completed = run_node(root, "scripts/verify_data.js", check=False)
            self.assertNotEqual(completed.returncode, 0)
            self.assertIn("references unknown source missing-source", completed.stderr)


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


def write_fixture_project(root: Path, missing_attribution: bool = False) -> None:
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
    write_json(root / "config" / "cities" / "belfast.json", city)

    registry = {
        "schema_version": "1.0.0",
        "sources": [
            source("osm-overpass", ["*"], "osm_history", "" if missing_attribution else "Copyright OpenStreetMap contributors."),
            source(
                "belfast-city-council-public-pages",
                ["belfast"],
                "civic_services",
                "Source page: Belfast City Council.",
            ),
        ],
    }
    write_json(root / "config" / "source_registry.json", registry)

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
