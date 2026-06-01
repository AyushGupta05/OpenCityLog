import json
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.expand_london_nyc_events_from_open_sources import (
    GENERATED_PREFIXES,
    fetch_planning_entities,
    first_date,
    hmlr_price_paid_candidate,
    make_fhrs_event,
    make_hmlr_price_paid_event,
    make_ukhpi_event,
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
            "lon_hmlr_price_paid_",
            "lon_hmlr_ukhpi_",
            "lon_fsa_fhrs_rating_",
            "nyc_dob_now_approved_permit_",
            "nyc_hpd_affordable_housing_building_",
            "nyc_capital_project_tracker_",
            "nyc_street_closure_construction_",
            "nyc_parks_property_",
            "nyc_street_tree_census_",
        }

        self.assertTrue(expected.issubset(set(GENERATED_PREFIXES)))

    def test_hmlr_price_paid_event_omits_address_and_exact_price(self):
        row = [
            "{ABC-123}",
            "625000",
            "2020-02-03 00:00",
            "SW1A 1AA",
            "F",
            "N",
            "L",
            "10",
            "FLAT 1",
            "TEST STREET",
            "WESTMINSTER",
            "LONDON",
            "CITY OF WESTMINSTER",
            "GREATER LONDON",
            "A",
        ]
        candidate = hmlr_price_paid_candidate(row, 2020, "https://price-paid-data.publicdata.landregistry.gov.uk/pp-2020.csv")
        event = make_hmlr_price_paid_event(
            candidate,
            {"latitude": 51.501, "longitude": -0.142, "outcode": "SW1A", "admin_district": "Westminster"},
            "2026-05-08T00:00:00Z",
        )

        rendered = json.dumps(event)
        self.assertIsNotNone(event)
        self.assertIn("GBP 500k-750k", event["summary"])
        self.assertNotIn("SW1A 1AA", rendered)
        self.assertNotIn("TEST STREET", rendered)
        self.assertNotIn("FLAT 1", rendered)
        self.assertNotIn("625000", rendered)
        self.assertEqual(event["source_date_field"], "transfer deed date")

    def test_ukhpi_event_is_aggregate_not_address_level(self):
        event = make_ukhpi_event(
            {
                "Date": "01/02/2026",
                "RegionName": "Camden",
                "AreaCode": "E09000007",
                "AveragePrice": "620123",
                "Index": "145.6",
                "1m%Change": "0.8",
                "12m%Change": "2.3",
                "SalesVolume": "123",
            },
            "https://publicdata.landregistry.gov.uk/market-trend-data/house-price-index-data/UK-HPI-full-file-2026-02.csv",
            "2026-05-08T00:00:00Z",
        )

        self.assertIsNotNone(event)
        self.assertEqual(event["event_id"], "lon_hmlr_ukhpi_e09000007-2026-02")
        self.assertEqual(event["source_date_field"], "Date")
        self.assertIn("borough-level", event["observed_change"])
        self.assertIn("not a parcel or address point", event["geometry_precision"])
        self.assertIn("Do not use it as evidence", event["limitations"])

    def test_fhrs_event_omits_establishment_identity_fields(self):
        event = make_fhrs_event(
            {
                "FHRSID": 1824267,
                "BusinessName": "1 REBEL",
                "BusinessType": "Restaurant/Cafe/Canteen",
                "AddressLine1": "1 REBEL",
                "AddressLine2": "Lancing Street",
                "AddressLine4": "London",
                "PostCode": "NW1 1NA",
                "Phone": "020 0000 0000",
                "LocalAuthorityName": "Camden",
                "RatingDate": "2026-03-18T00:00:00",
                "RatingValue": "5",
                "NewRatingPending": False,
                "geocode": {"longitude": "-0.1314354", "latitude": "51.528421"},
                "scores": {"Hygiene": 5, "Structural": 5, "ConfidenceInManagement": 5},
            },
            {"Name": "Camden"},
            "2026-05-08T00:00:00Z",
        )

        rendered = json.dumps(event)
        self.assertIsNotNone(event)
        self.assertEqual(event["event_id"], "lon_fsa_fhrs_rating_1824267")
        self.assertEqual(event["source_date_field"], "RatingDate")
        self.assertEqual(event["atlas_category"], "civic_services")
        self.assertEqual(event["atlas_lens"], "services")
        self.assertIn("public_health", event["affected_signals"])
        self.assertIn("5 out of 5", event["summary"])
        self.assertNotIn("1 REBEL", rendered)
        self.assertNotIn("Lancing Street", rendered)
        self.assertNotIn("NW1 1NA", rendered)
        self.assertNotIn("020 0000 0000", rendered)

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
