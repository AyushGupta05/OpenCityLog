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
    make_nyc_business_license_event,
    make_nyc_pluto_land_use_event,
    make_ukhpi_event,
    nyc_generated_event_metadata,
    nyc_borough_name,
    nyc_pluto_land_use_signals,
    point_from_geojson,
    socrata_row_url,
    street_permit_is_utility_work,
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
            "nyc_pluto_land_use_",
            "nyc_business_license_",
        }

        self.assertTrue(expected.issubset(set(GENERATED_PREFIXES)))

    def test_nyc_generated_metadata_reproduces_source_specific_counts(self):
        with patch("scripts.expand_london_nyc_events_from_open_sources.utc_now_iso", return_value="2026-06-02T10:00:00Z"):
            metadata = nyc_generated_event_metadata(
                [{"event_id": "nyc_pluto_land_use_yearbuilt_2007_1"}, {"event_id": "nyc_business_license_2"}],
                [{"event_id": "manual"}, {"event_id": "nyc_pluto_land_use_yearbuilt_2007_1"}, {"event_id": "nyc_business_license_2"}],
                {
                    "sources": {
                        "64uk-42ks": {"retrieved_at": "2026-06-02T08:38:33Z", "event_count": 2379},
                        "w7w3-xahh": {"retrieved_at": "2026-06-02T08:39:44Z", "fetched": 1996},
                    }
                },
            )

        self.assertEqual(metadata["expanded_from_official_rows_at"], "2026-06-02T10:00:00Z")
        self.assertEqual(metadata["generated_event_count"], 2)
        self.assertEqual(metadata["total_chronology_milestones"], 3)
        self.assertEqual(metadata["nyc_land_use_economy_expanded_from_official_rows_at"], "2026-06-02T08:39:44Z")
        self.assertEqual(metadata["nyc_pluto_land_use_event_count"], 2379)
        self.assertEqual(metadata["nyc_business_license_event_count"], 1996)

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
        self.assertEqual(event["atlas_category"], "economy")
        self.assertEqual(event["atlas_lens"], "jobs")
        self.assertIn("residential", event["affected_signals"])

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
        self.assertEqual(event["atlas_category"], "economy")
        self.assertEqual(event["atlas_lens"], "jobs")
        self.assertIn("high_street_activity", event["affected_signals"])
        self.assertIn("public_health", event["affected_signals"])
        self.assertIn("5 out of 5", event["summary"])
        self.assertNotIn("1 REBEL", rendered)
        self.assertNotIn("Lancing Street", rendered)
        self.assertNotIn("NW1 1NA", rendered)
        self.assertNotIn("020 0000 0000", rendered)

    def test_nyc_pluto_land_use_event_omits_owner_and_address(self):
        event = make_nyc_pluto_land_use_event(
            {
                "borough": "BX",
                "borocode": "2",
                "bbl": "2054800111.00000000",
                "address": "761 CLARENCE AVENUE",
                "ownername": "RODRIGUEZ, JOSE R",
                "landuse": "05",
                "bldgarea": "1683",
                "comarea": "400",
                "resarea": "1122",
                "unitstotal": "1",
                "yearbuilt": "1950",
                "yearalter1": "2020",
                "yearalter2": "0",
                "latitude": "40.8309530",
                "longitude": "-73.8165508",
                "version": "26v1",
            },
            2020,
            "2026-05-08T00:00:00Z",
        )

        rendered = json.dumps(event)
        self.assertIsNotNone(event)
        self.assertEqual(event["event_id"], "nyc_pluto_land_use_yearalter1_2020_2054800111")
        self.assertEqual(event["source_date_field"], "yearalter1")
        self.assertEqual(event["atlas_category"], "economy")
        self.assertEqual(event["atlas_lens"], "jobs")
        self.assertIn("commercial", event["affected_signals"])
        self.assertIn("land use 'commercial and office'", event["summary"])
        self.assertNotIn("RODRIGUEZ", rendered)
        self.assertNotIn("CLARENCE", rendered)

    def test_nyc_pluto_snapshot_event_uses_release_date_basis(self):
        event = make_nyc_pluto_land_use_event(
            {
                "borough": "BK",
                "borocode": "3",
                "bbl": "3012340056",
                "landuse": "04",
                "bldgarea": "3200",
                "comarea": "800",
                "resarea": "2400",
                "unitstotal": "6",
                "yearbuilt": "1920",
                "yearalter1": "0",
                "yearalter2": "0",
                "latitude": "40.684",
                "longitude": "-73.95",
                "version": "26v1",
            },
            2026,
            "2026-05-08T00:00:00Z",
            snapshot_release=True,
        )

        self.assertIsNotNone(event)
        self.assertEqual(event["event_id"], "nyc_pluto_land_use_snapshot_2026_3012340056")
        self.assertEqual(event["source_date_field"], "PLUTO release/version")
        self.assertIn("mixed_use", event["affected_signals"])
        self.assertIn("not a claim that land use changed in 2026", event["observed_change"])

    def test_nyc_pluto_land_use_signals_follow_source_class(self):
        self.assertIn("commercial", nyc_pluto_land_use_signals("05"))
        self.assertIn("office", nyc_pluto_land_use_signals("05"))
        self.assertIn("civic_services", nyc_pluto_land_use_signals("08"))
        self.assertNotIn("commercial", nyc_pluto_land_use_signals("08"))
        self.assertIn("green_space", nyc_pluto_land_use_signals("09"))
        self.assertIn("utilities", nyc_pluto_land_use_signals("07"))

    def test_nyc_business_license_event_omits_identity_and_contact_fields(self):
        event = make_nyc_business_license_event(
            {
                "license_nbr": "0002902-DCA",
                "business_name": "GEM FINANCIAL SERVICES, INC.",
                "dba_trade_name": "GEM PAWNBROKERS",
                "business_unique_id": "BA-1216876-2022",
                "business_category": "Pawnbroker",
                "license_type": "Premises",
                "license_status": "Active",
                "license_creation_date": "2007-04-18T00:00:00.000",
                "contact_phone": "7182371166",
                "address_building": "608",
                "address_street_name": "8TH AVE",
                "address_borough": "Manhattan",
                "bbl": "1007890005",
                "nta": "MN17",
                "latitude": "40.755613",
                "longitude": "-73.990962",
            },
            "2026-05-08T00:00:00Z",
        )

        rendered = json.dumps(event)
        self.assertIsNotNone(event)
        self.assertEqual(event["event_id"], "nyc_business_license_0002902-dca")
        self.assertEqual(event["area"], "Manhattan")
        self.assertEqual(event["atlas_category"], "economy")
        self.assertEqual(event["atlas_lens"], "jobs")
        self.assertIn("business", event["affected_signals"])
        self.assertIn("Pawnbroker", event["summary"])
        self.assertNotIn("GEM", rendered)
        self.assertNotIn("7182371166", rendered)
        self.assertNotIn("8TH AVE", rendered)

    def test_street_permit_utility_detector_only_matches_utility_work_fields(self):
        self.assertTrue(street_permit_is_utility_work({
            "permittypedesc": "REPAIR SEWER - PROTECTED",
            "onstreetname": "WARREN STREET",
        }))
        self.assertTrue(street_permit_is_utility_work({
            "permittypedesc": "UTILITY MANHOLE EMBARGO PERMIT",
            "permitpurposecomments": "OA 16M66",
        }))
        self.assertFalse(street_permit_is_utility_work({
            "permittypedesc": "MISCELLANEOUS - MINOR SALES",
            "permitpurposecomments": "sidewalk protection",
            "onstreetname": "WATER STREET",
        }))

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
