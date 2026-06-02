import unittest

from scripts.build_discovery_city_atlas import normalize_seed, source_to_registry


class DiscoveryCityAtlasNormalizationTest(unittest.TestCase):
    def test_nyc_open_data_source_registry_uses_open_data_terms(self):
        source = source_to_registry("nyc", {
            "source_id": "tqtj-sjs8",
            "title": "Street Construction Permits (2022-Present)",
            "publisher": "NYC DOT",
            "bucket": "traffic/transport; street events/closures",
            "url": "https://data.cityofnewyork.us/api/views/tqtj-sjs8",
            "api_endpoint": "https://data.cityofnewyork.us/resource/tqtj-sjs8.json",
            "metadata_url": "https://data.cityofnewyork.us/api/views/tqtj-sjs8",
            "licence": "Requires source-level review; many official sources use NYC Open Data Terms.",
            "limitations": "Permits do not guarantee actual obstruction timing.",
        })

        self.assertIn("NYC Open Data", source["licence"])
        self.assertNotIn("dataset-specific", source["licence"].lower())
        self.assertEqual(source["licence_url"], "https://opendata.cityofnewyork.us/faq/")
        self.assertNotIn("requires source-level review", " ".join(source["caveats"]).lower())

    def test_hmlr_price_paid_seed_promotes_to_economy_without_hpi(self):
        event = normalize_seed(
            "london",
            {
                "event_id": "lon_hmlr_price_paid_abc123",
                "title": "HMLR residential property transaction: flat in Camden",
                "date": "2020-02-03",
                "bucket": "housing/property market/transaction",
                "source_dataset_id": "lon-extra-hm-land-registry-price-paid-data",
                "source_record_id": "ABC123",
                "latitude": 51.52,
                "longitude": -0.14,
                "summary": "HM Land Registry Price Paid row for a residential flat transfer.",
            },
            1,
            {
                "lon-extra-hm-land-registry-price-paid-data": {
                    "source_id": "lon-extra-hm-land-registry-price-paid-data",
                    "title": "HM Land Registry Price Paid Data",
                    "access_url": "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads",
                }
            },
        )

        self.assertEqual(event["category"], "economy")
        self.assertEqual(event["lens"], "jobs")
        self.assertIn("residential", event["affected_signals"])

    def test_fhrs_seed_overrides_stale_civic_category_to_economy(self):
        event = normalize_seed(
            "london",
            {
                "event_id": "lon_fsa_fhrs_rating_1824267",
                "title": "Food hygiene rating record: Restaurant/Cafe/Canteen in Camden",
                "date": "2026-03-18",
                "bucket": "civic services/public health/food hygiene/businesses",
                "source_dataset_id": "lon-extra-food-hygiene-rating-scheme-api",
                "source_record_id": "1824267",
                "atlas_category": "civic_services",
                "atlas_lens": "services",
                "latitude": 51.528421,
                "longitude": -0.1314354,
                "summary": "FHRS record for Restaurant/Cafe/Canteen.",
            },
            1,
            {
                "lon-extra-food-hygiene-rating-scheme-api": {
                    "source_id": "lon-extra-food-hygiene-rating-scheme-api",
                    "title": "Food Hygiene Rating Scheme API",
                    "access_url": "https://ratings.food.gov.uk/",
                }
            },
        )

        self.assertEqual(event["category"], "economy")
        self.assertEqual(event["lens"], "jobs")
        self.assertIn("high_street_activity", event["affected_signals"])
        self.assertIn("public_health", event["affected_signals"])

    def test_ukhpi_seed_stays_out_of_direct_economy_category(self):
        event = normalize_seed(
            "london",
            {
                "event_id": "lon_hmlr_ukhpi_e09000007-2026-02",
                "title": "UK HPI monthly housing-market record: Camden",
                "date": "2026-02-01",
                "bucket": "housing/property market/index",
                "source_dataset_id": "lon-extra-uk-house-price-index",
                "source_record_id": "E09000007|2026-02",
                "latitude": 51.5423,
                "longitude": -0.1426,
                "summary": "UK HPI aggregate row for Camden.",
            },
            1,
            {
                "lon-extra-uk-house-price-index": {
                    "source_id": "lon-extra-uk-house-price-index",
                    "title": "UK House Price Index",
                    "access_url": "https://landregistry.data.gov.uk/app/ukhpi",
                }
            },
        )

        self.assertNotEqual(event["category"], "economy")

    def test_nyc_street_permit_utility_override_ignores_street_name_only_match(self):
        source_by_id = {
            "tqtj-sjs8": {
                "source_id": "tqtj-sjs8",
                "title": "Street Construction Permits (2022-Present)",
                "access_url": "https://data.cityofnewyork.us/api/views/tqtj-sjs8",
            }
        }
        utility_event = normalize_seed(
            "nyc",
            {
                "event_id": "nyc_street_permit_x012022001a00",
                "title": "Street construction permit: PATTERSON AVENUE, BRONX",
                "date": "2022-01-01",
                "bucket": "transport/traffic/roadworks",
                "source_dataset_id": "tqtj-sjs8",
                "source_record_id": "X012022001A00",
                "summary": "REPAIR WATER on PATTERSON AVENUE; purpose: water relay.",
            },
            1,
            source_by_id,
        )
        generic_event = normalize_seed(
            "nyc",
            {
                "event_id": "nyc_street_permit_m012022999a00",
                "title": "Street construction permit: WATER STREET, MANHATTAN",
                "date": "2022-01-01",
                "bucket": "transport/traffic/roadworks",
                "source_dataset_id": "tqtj-sjs8",
                "source_record_id": "M012022999A00",
                "summary": "MISCELLANEOUS - MINOR SALES on WATER STREET; purpose: sidewalk protection.",
            },
            2,
            source_by_id,
        )

        self.assertEqual(utility_event["category"], "utilities")
        self.assertEqual(utility_event["lens"], "utilities")
        self.assertNotEqual(generic_event["category"], "utilities")


if __name__ == "__main__":
    unittest.main()
