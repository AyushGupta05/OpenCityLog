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

    def test_tfl_open_data_registry_keeps_ogl_terms_compatible(self):
        source = source_to_registry("london", {
            "source_id": "tfl-road-disruptions",
            "title": "TfL Road disruptions / planned works API",
            "publisher": "Transport for London",
            "bucket": "events/street closures",
            "access_url": "https://api.tfl.gov.uk/Road",
            "api_endpoint": "https://api.tfl.gov.uk/Road/all/Disruption",
            "licence": "TfL open data/API terms; public-sector information is available under Open Government Licence v3.0 with TfL attribution and API terms/caching requirements.",
            "licence_url": "https://tfl.gov.uk/info-for/open-data-users/",
            "limitations": "Live API; historic closures must be archived by user.",
            "retrieved_at": "2026-05-08T00:00:00Z",
        })

        self.assertIn("Open Government Licence", source["licence"])
        self.assertEqual(source["licence_url"], "https://tfl.gov.uk/info-for/open-data-users/")
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

    def test_london_tfl_utility_works_promote_without_generic_works(self):
        source_by_id = {
            "tfl-road-disruptions": {
                "source_id": "tfl-road-disruptions",
                "title": "TfL Road disruptions / planned works API",
                "access_url": "https://api.tfl.gov.uk/Road/all/Disruption",
            }
        }
        utility_event = normalize_seed(
            "london",
            {
                "event_id": "lon_tfl_disruption_tims-223032",
                "title": "TfL road disruption: [A1205] Burdett Road",
                "date": "2026-01-20",
                "bucket": "transport/traffic/roadworks",
                "source_dataset_id": "tfl-road-disruptions",
                "source_record_id": "TIMS-223032",
                "summary": "Lane restrictions in place to facilitate Thames Water works.",
            },
            1,
            source_by_id,
        )
        generic_event = normalize_seed(
            "london",
            {
                "event_id": "lon_tfl_disruption_tims-206772",
                "title": "TfL road disruption: Gallows Corner Flyover",
                "date": "2025-03-15",
                "bucket": "transport/traffic/roadworks",
                "source_dataset_id": "tfl-road-disruptions",
                "source_record_id": "TIMS-206772",
                "summary": "Restrictions to facilitate refurbishment of Gallows Corner Flyover.",
            },
            2,
            source_by_id,
        )

        self.assertEqual(utility_event["category"], "utilities")
        self.assertEqual(utility_event["lens"], "utilities")
        self.assertNotEqual(generic_event["category"], "utilities")

    def test_london_planning_utility_rows_promote_without_cable_street_false_positive(self):
        source_by_id = {
            "gla-planning-datahub-applications": {
                "source_id": "gla-planning-datahub-applications",
                "title": "Planning London Datahub - planning applications",
                "access_url": "https://planningdata.london.gov.uk/api-guest/",
            }
        }
        utility_event = normalize_seed(
            "london",
            {
                "event_id": "lon_planning_datahub_application_decided_barnet-26-0570-con",
                "title": "Planning decision recorded: Clitterhouse Playing Fields, Barnet",
                "date": "2026-04-24",
                "bucket": "planning/development",
                "source_dataset_id": "gla-planning-datahub-applications",
                "source_record_id": "Barnet-26_0570_CON",
                "summary": "Submission of details pursuant to Condition 47 (Surface Water Drainage).",
            },
            1,
            source_by_id,
        )
        generic_event = normalize_seed(
            "london",
            {
                "event_id": "lon_arch_round362_lon_pld_completion_tower_hamlets_pa_04_00447_2010_09_30",
                "title": "PLD completion date recorded for 226 Cable Street, E1",
                "date": "2010-09-30",
                "bucket": "planning/development",
                "source_dataset_id": "gla-planning-datahub-applications",
                "source_record_id": "PA/04/00447",
                "summary": "Planning London Datahub records source-reported administrative actual completion date field for 226 Cable Street.",
            },
            2,
            source_by_id,
        )

        self.assertEqual(utility_event["category"], "utilities")
        self.assertEqual(utility_event["lens"], "utilities")
        self.assertNotEqual(generic_event["category"], "utilities")

    def test_nyc_pluto_seed_promotes_to_economy_land_use(self):
        event = normalize_seed(
            "nyc",
            {
                "event_id": "nyc_pluto_land_use_yearalter1_2020_2054800111",
                "title": "PLUTO tax-lot land-use record: commercial and office in Bronx",
                "date": "2020",
                "bucket": "planning/development; land use",
                "source_dataset_id": "64uk-42ks",
                "source_record_id": "2054800111",
                "latitude": 40.830953,
                "longitude": -73.816551,
                "summary": "NYC DCP PLUTO tax-lot row records land use 'commercial and office'.",
            },
            1,
            {
                "64uk-42ks": {
                    "source_id": "64uk-42ks",
                    "title": "Primary Land Use Tax Lot Output (PLUTO)",
                    "access_url": "https://data.cityofnewyork.us/api/views/64uk-42ks",
                }
            },
        )

        self.assertEqual(event["category"], "economy")
        self.assertEqual(event["lens"], "jobs")
        self.assertIn("land_use", event["affected_signals"])
        self.assertIn("property_market", event["affected_signals"])

    def test_nyc_pluto_public_facility_seed_does_not_gain_generic_commercial_residential_signals(self):
        event = normalize_seed(
            "nyc",
            {
                "event_id": "nyc_pluto_land_use_snapshot_2026_1000010010",
                "title": "PLUTO tax-lot land-use record: public facilities and institutions in Manhattan",
                "date": "2026",
                "bucket": "economy/land-use/tax lot/property",
                "source_dataset_id": "64uk-42ks",
                "source_record_id": "1000010010",
                "latitude": 40.689,
                "longitude": -74.019,
                "affected_signals": ["economy", "economic_opportunity", "land_use", "property_market", "civic_services"],
                "summary": "NYC DCP PLUTO tax-lot row records land use 'public facilities and institutions'.",
            },
            1,
            {
                "64uk-42ks": {
                    "source_id": "64uk-42ks",
                    "title": "Primary Land Use Tax Lot Output (PLUTO)",
                    "access_url": "https://data.cityofnewyork.us/api/views/64uk-42ks",
                }
            },
        )

        self.assertEqual(event["category"], "economy")
        self.assertIn("civic_services", event["affected_signals"])
        self.assertNotIn("commercial", event["affected_signals"])
        self.assertNotIn("residential", event["affected_signals"])

    def test_nyc_business_license_seed_promotes_to_economy(self):
        event = normalize_seed(
            "nyc",
            {
                "event_id": "nyc_business_license_0002902-dca",
                "title": "NYC business premises licence: Pawnbroker in Manhattan",
                "date": "2007-04-18",
                "bucket": "business licenses/economy",
                "source_dataset_id": "w7w3-xahh",
                "source_record_id": "0002902-DCA",
                "latitude": 40.755613,
                "longitude": -73.990962,
                "summary": "NYC DCWP issued premises licence for business category Pawnbroker.",
            },
            1,
            {
                "w7w3-xahh": {
                    "source_id": "w7w3-xahh",
                    "title": "Issued Licenses",
                    "access_url": "https://data.cityofnewyork.us/api/views/w7w3-xahh",
                }
            },
        )

        self.assertEqual(event["category"], "economy")
        self.assertEqual(event["lens"], "jobs")
        self.assertIn("business", event["affected_signals"])
        self.assertNotIn("green_space", event["affected_signals"])


if __name__ == "__main__":
    unittest.main()
