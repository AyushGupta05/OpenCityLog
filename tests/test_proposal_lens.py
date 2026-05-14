import json
import re
import subprocess
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


class ProposalImpactTests(unittest.TestCase):
    def run_proposal(self, payload: dict) -> dict:
        script = """
const proposalImpact = require('./lib/proposal-impact');
const payload = JSON.parse(process.argv[1]);
const result = proposalImpact.assessProposal(payload, { rootDir: process.cwd() });
console.log(JSON.stringify(result));
"""
        completed = subprocess.run(
            ["node", "-e", script, json.dumps(payload)],
            cwd=REPO_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(completed.stdout)

    def test_proposal_schema_validation_accepts_aliases(self) -> None:
        script = """
const proposalImpact = require('./lib/proposal-impact');
const good = proposalImpact.validateProposalInput({
  category: 'building',
  title: 'Fixture proposal',
  location: { lng: -5.93, lat: 54.597 },
  scale: 'medium'
});
const bad = proposalImpact.validateProposalInput({ category: 'unsupported_category' });
console.log(JSON.stringify({ good, bad }));
"""
        completed = subprocess.run(
            ["node", "-e", script],
            cwd=REPO_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        data = json.loads(completed.stdout)
        self.assertTrue(data["good"]["ok"])
        self.assertEqual(data["good"]["proposal"]["category"], "building_development")
        self.assertFalse(data["bad"]["ok"])
        self.assertIn("category must be one of", data["bad"]["errors"][0])

    def test_similar_event_retrieval_uses_distance_and_evidence(self) -> None:
        result = self.run_proposal(
            {
                "category": "road_transport_change",
                "title": "Bus priority junction change",
                "description": "A small transport proposal near the station district.",
                "location": {"lng": -5.9391, "lat": 54.5943},
                "scale": "small",
            }
        )
        self.assertEqual(result["mode"], "proposal_analogue_lens")
        self.assertEqual(result["framing"]["label"], "Historical analogue lens")
        self.assertTrue(result["framing"]["not_a_forecast"])
        self.assertGreaterEqual(len(result["similar_events"]), 1)
        nearest = result["similar_events"][0]
        self.assertIn("distance_m", nearest)
        self.assertTrue(nearest["evidence"])
        self.assertIn(nearest["confidence"], {"documented", "corroborated", "inferred", "disputed"})
        self.assertIn("score_breakdown", nearest)
        self.assertIn("category", nearest["score_breakdown"])
        self.assertIn("source_quality", nearest["score_breakdown"])
        self.assertIn("semantic_relevance", nearest["score_breakdown"])
        self.assertIn("match_factors", nearest)
        self.assertTrue(any(item["factor"] == "distance" for item in nearest["match_factors"]))

    def test_current_context_and_signal_caveats_are_present(self) -> None:
        result = self.run_proposal(
            {
                "category": "building_development",
                "title": "Mixed-use building",
                "description": "A medium mixed-use development proposal.",
                "location": {"lng": -5.93, "lat": 54.597},
                "scale": "medium",
            }
        )
        self.assertTrue(result["local_context"]["current_signals"])
        self.assertGreaterEqual(len(result["observed_patterns"]), 1)
        self.assertIn("before_window", result["observed_patterns"][0])
        self.assertIn("after_window", result["observed_patterns"][0])
        self.assertIn(result["observed_patterns"][0]["evidence_strength"], {"ready_to_review", "thin_evidence", "gap"})
        self.assertTrue(result["observed_patterns"][0]["caveat"])
        top_titles = " ".join(item["title"].lower() for item in result["similar_events"][:3])
        self.assertRegex(top_titles, r"mixed|residential|dwelling|development|office|commercial")
        self.assertNotRegex(result["similar_events"][0]["title"].lower(), r"\b(sign|signage|totem|hoarding|advertising)\b")
        self.assertIn(result["local_context"].get("context_basis"), {"nearby_historical_event_density", "grid_and_nearby_historical_events"})
        self.assertTrue(result["local_context"].get("nearby_event_sample"))
        signal_ids = {item["signal"] for item in result["affected_signals"]}
        self.assertIn("mobility", signal_ids)
        self.assertIn("utilities", signal_ids)
        for signal in result["affected_signals"]:
            self.assertIn(signal["direction"], {"positive", "negative", "mixed", "unknown"})
            self.assertIn(signal["strength"], {"low", "medium", "high"})
            self.assertIn(signal["confidence"], {"low", "medium", "high"})
            self.assertTrue(signal["evidence"])
            self.assertIsInstance(signal["caveats"], list)
        self.assertGreaterEqual(len(result["design_review_basis"]), 4)
        self.assertTrue(any(item["theme"] == "connectivity" for item in result["design_review_basis"]))
        brief = result["proposal_brief"]
        self.assertEqual(brief["persona"], "city_architect")
        self.assertGreaterEqual(len(brief["evidence_readiness"]), 4)
        self.assertGreaterEqual(len(brief["historical_patterns"]), 3)
        self.assertGreaterEqual(len(brief["observed_patterns"]), 1)
        self.assertGreaterEqual(len(brief["fieldwork_plan"]), 3)
        self.assertGreaterEqual(len(brief["review_questions"]), 3)
        self.assertGreaterEqual(len(brief["next_evidence_to_find"]), 2)
        readiness_statuses = {item["status"] for item in brief["evidence_readiness"]}
        self.assertTrue(readiness_statuses <= {"ready_to_review", "thin_evidence", "gap"})
        pathway = result["proposal_pathway"]
        self.assertEqual(pathway["mode"], "evidence_backed_proposal_pathway")
        self.assertEqual(pathway["site_screening"]["buildability_label"], "Not determined")
        self.assertGreaterEqual(len(pathway["site_screening"]["checks"]), 6)
        self.assertGreaterEqual(len(pathway["review_years"]), 4)
        self.assertTrue(any("not a planning permission" in item for item in pathway["limits"]))

    def test_missing_location_lowers_confidence_and_says_why(self) -> None:
        result = self.run_proposal(
            {
                "category": "service_civic_infrastructure",
                "title": "Community service idea",
                "description": "A civic service proposal without a mapped site.",
            }
        )
        self.assertNotEqual(result["confidence"]["label"], "high")
        self.assertTrue(any("No usable location" in item for item in result["warnings"]))
        self.assertTrue(any("Missing location" in item for item in result["caveats"]))
        self.assertEqual(result["local_context"]["current_signals"], [])
        self.assertEqual(result["proposal_pathway"]["status"], "evidence_gap")

    def test_public_output_avoids_overclaiming_language(self) -> None:
        result = self.run_proposal(
            {
                "category": "green_public_space",
                "title": "Pocket park",
                "description": "A small public-space and planting intervention.",
                "location": {"lng": -5.934, "lat": 54.584},
                "scale": "small",
            }
        )
        text = json.dumps(result).lower()
        text = text.replace("does not prove", "does not establish")
        text = text.replace("not proof", "not evidence")
        text = text.replace("not a forecast", "not a future estimate")
        banned = [
            r"\bwill\s+(increase|decrease|reduce|improve|worsen|cause)\b",
            r"\bcaused?\b",
            r"\bproves?\b",
            r"\bpredicts?\b",
            r"\bprediction\b",
            r"\bforecast(ed|s|ing)?\b",
            r"\bsimulation result\b",
        ]
        for pattern in banned:
            self.assertIsNone(re.search(pattern, text), pattern)
        self.assertIn("not a forecast", result["summary"])
        self.assertIn("evidence strength", result["summary"].lower())
        self.assertTrue(any("not a calibrated outcome model" in item for item in result["caveats"]))


if __name__ == "__main__":
    unittest.main()
