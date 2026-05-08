import json
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.expand_london_nyc_events_from_open_sources import (
    GENERATED_PREFIXES,
    fetch_planning_entities,
    first_date,
    nyc_borough_name,
    point_from_geojson,
    socrata_row_url,
)

ROOT = Path(__file__).resolve().parents[1]


class OpenSourceExpansionHelpersTest(unittest.TestCase):
    def test_point_from_geojson_centers_nested_geometry(self):
        geometry = {
            "type": "MultiLineString",
            "coordinates": [
                [[-74.0, 40.7], [-73.9, 40.8]],
                [[-73.8, 40.9], [-73.7, 41.0]],
            ],
        }

        self.assertEqual(point_from_geojson(geometry), (-73.85, 40.85))

    def test_first_date_normalizes_source_date_shapes(self):
        self.assertEqual(first_date("2026-04-28T00:00:00.000"), "2026-04-28")
        self.assertEqual(first_date("09/02/25  1:24 PM"), "2025-09-02")
        self.assertEqual(first_date("", "2015"), "2015")
        self.assertIsNone(first_date("", None, "not a date"))

    def test_planning_fetch_follows_next_links(self):
        pages = {
            "first": {
                "entities": [{"entity": 1}],
                "count": 2,
                "links": {"next": "next"},
            },
            "next": {
                "entities": [{"entity": 2}],
                "count": 2,
                "links": {},
            },
        }

        def fake_fetch(url, timeout=90):
            return pages["first" if "offset" not in url and url != "next" else "next"]

        with patch("scripts.expand_london_nyc_events_from_open_sources.fetch_json", side_effect=fake_fetch):
            rows, summary = fetch_planning_entities(
                "listed-building-outline",
                {"entity": 626188, "name": "Camden"},
                relation="intersects",
            )

        self.assertEqual([row["entity"] for row in rows], [1, 2])
        self.assertEqual(summary["sample_count"], 2)
        self.assertFalse(summary["truncated"])

    def test_socrata_row_url_points_to_dataset_record_filter(self):
        self.assertEqual(
            socrata_row_url("rbx6-tga4", "work_permit", "M123"),
            "https://data.cityofnewyork.us/resource/rbx6-tga4.json?work_permit=M123",
        )

    def test_nyc_borough_name_expands_common_codes(self):
        self.assertEqual(nyc_borough_name("M"), "Manhattan")
        self.assertEqual(nyc_borough_name("S"), "Staten Island")
        self.assertEqual(nyc_borough_name("Queens"), "Queens")

    def test_generated_prefixes_cover_new_row_families(self):
        expected = {
            "lon_planning_designation_",
            "nyc_dob_now_approved_permit_",
            "nyc_hpd_affordable_housing_building_",
            "nyc_capital_project_tracker_",
            "nyc_street_closure_construction_",
            "nyc_parks_property_",
            "nyc_street_tree_census_",
        }

        self.assertTrue(expected.issubset(set(GENERATED_PREFIXES)))

    def test_generated_atlas_preserves_row_level_provenance(self):
        index_path = ROOT / "web/data/city-atlas/cities/london/events.json"
        index = json.loads(index_path.read_text(encoding="utf-8"))
        event = None
        for chunk in index["chunks"]:
            payload = json.loads((ROOT / chunk["json_path"]).read_text(encoding="utf-8"))
            event = next((row for row in payload["events"] if row["event_id"].startswith("lon_brownfield_")), None)
            if event:
                break

        self.assertIsNotNone(event)
        self.assertTrue(event["evidence"][0]["url"].startswith("https://www.planning.data.gov.uk/entity/"))
        self.assertTrue(event["provenance"]["source_url"].startswith("https://www.planning.data.gov.uk/entity/"))
        self.assertIn("source_retrieved_at", event["provenance"])


if __name__ == "__main__":
    unittest.main()
