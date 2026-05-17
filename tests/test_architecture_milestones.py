import json
import re
import unittest
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MILESTONES = ROOT / "data" / "manual_drops" / "architecture_milestones" / "architecture_milestones_2008_2026.json"


class ArchitectureMilestoneTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.payload = json.loads(MILESTONES.read_text(encoding="utf-8"))
        cls.sources = {source["source_id"]: source for source in cls.payload["sources"]}

    def test_package_covers_all_target_cities(self) -> None:
        counts = Counter(event["city_id"] for event in self.payload["events"])

        self.assertGreaterEqual(counts["london"], 411)
        self.assertGreaterEqual(counts["nyc"], 419)
        self.assertGreaterEqual(counts["belfast"], 386)

    def test_events_have_provenance_and_limits(self) -> None:
        for event in self.payload["events"]:
            with self.subTest(event_id=event.get("event_id")):
                self.assertRegex(event["event_id"], r"^(lon|nyc|bfs)_arch_")
                self.assertTrue(event["title"])
                self.assertTrue(event["summary"])
                self.assertTrue(event["observed_change"])
                self.assertTrue(event["source_ids"])
                self.assertTrue(event["source_url"].startswith("http"))
                self.assertTrue(event["source_retrieved_at"])
                self.assertTrue(event["source_date_field"])
                self.assertTrue(event["limitations"])
                self.assertIn(event["confidence"], {"documented", "corroborated", "inferred", "disputed"})
                self.assertTrue(-180 <= float(event["longitude"]) <= 180)
                self.assertTrue(-90 <= float(event["latitude"]) <= 90)

                for source_id in event["source_ids"]:
                    self.assertIn(source_id, self.sources)

    def test_events_stay_in_current_coverage_window(self) -> None:
        for event in self.payload["events"]:
            year = int(str(event["date"])[:4])
            with self.subTest(event_id=event["event_id"]):
                self.assertGreaterEqual(year, 2008)
                self.assertLessEqual(year, 2026)

    def test_curated_text_does_not_overclaim(self) -> None:
        banned = re.compile(r"\b(caused|proves?|predicts?|forecasts?|simulates?|will increase|will decrease)\b", re.I)
        checked_fields = ["title", "summary", "observed_change", "limitations"]

        for event in self.payload["events"]:
            combined = " ".join(str(event.get(field, "")) for field in checked_fields)
            with self.subTest(event_id=event["event_id"]):
                self.assertIsNone(banned.search(combined))


if __name__ == "__main__":
    unittest.main()
