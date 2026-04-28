import json
import subprocess
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


class EnergyInfrastructureProposalTests(unittest.TestCase):
    def test_transformer_proposal_is_screening_context_not_grid_approval(self) -> None:
        script = """
const proposalImpact = require('./lib/proposal-impact');
const result = proposalImpact.assessProposal({
  category: 'transformer_energy_infrastructure',
  title: 'Secondary transformer near York Street',
  description: 'A secondary transformer proposal for local connection needs.',
  location: { lng: -5.9238, lat: 54.6092 },
  scale: 'small',
  details: { asset_class: 'secondary' }
}, { rootDir: process.cwd() });
console.log(JSON.stringify(result));
"""
        completed = subprocess.run(
            ["node", "-e", script],
            cwd=REPO_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        result = json.loads(completed.stdout)

        utilities = next(item for item in result["affected_signals"] if item["signal"] == "utilities")
        self.assertEqual(utilities["direction"], "mixed")
        self.assertIn(utilities["strength"], {"medium", "high"})
        self.assertTrue(any("not an engineering approval" in caveat for caveat in utilities["caveats"]))
        self.assertGreaterEqual(len(result["similar_events"]), 1)
        self.assertTrue(result["evidence"]["source_ids"])

    def test_category_rules_cover_all_requested_proposal_types(self) -> None:
        script = """
const proposalImpact = require('./lib/proposal-impact');
console.log(JSON.stringify({
  categories: Array.from(proposalImpact.VALID_CATEGORIES),
  rules: Object.keys(proposalImpact.CATEGORY_RULES)
}));
"""
        completed = subprocess.run(
            ["node", "-e", script],
            cwd=REPO_ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        data = json.loads(completed.stdout)
        self.assertEqual(set(data["categories"]), set(data["rules"]))
        self.assertEqual(
            set(data["categories"]),
            {
                "building_development",
                "road_transport_change",
                "transformer_energy_infrastructure",
                "green_public_space",
                "service_civic_infrastructure",
            },
        )


if __name__ == "__main__":
    unittest.main()
