import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class AtlasAuditGeometryTests(unittest.TestCase):
    def geometry_results(self):
        script = """
const { geometryIsValid } = require("./scripts/audit_city_atlas_full.js");
const cases = {
  point: { type: "Point", coordinates: [-5.93, 54.6] },
  emptyPoint: { type: "Point", coordinates: [] },
  shortLine: { type: "LineString", coordinates: [[-5.93, 54.6]] },
  line: { type: "LineString", coordinates: [[-5.93, 54.6], [-5.94, 54.61]] },
  openPolygon: { type: "Polygon", coordinates: [[[-5.93, 54.6], [-5.94, 54.6], [-5.94, 54.61], [-5.93, 54.61]]] },
  polygon: { type: "Polygon", coordinates: [[[-5.93, 54.6], [-5.94, 54.6], [-5.94, 54.61], [-5.93, 54.61], [-5.93, 54.6]]] },
  emptyCollection: { type: "GeometryCollection", geometries: [] },
  collection: { type: "GeometryCollection", geometries: [{ type: "Point", coordinates: [-5.93, 54.6] }] },
};
console.log(JSON.stringify(Object.fromEntries(Object.entries(cases).map(([name, geometry]) => [name, geometryIsValid(geometry)]))));
"""
        completed = subprocess.run(
            ["node", "-e", script],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )
        return json.loads(completed.stdout)

    def test_geometry_validator_rejects_malformed_geojson_shapes(self):
        results = self.geometry_results()
        self.assertTrue(results["point"])
        self.assertTrue(results["line"])
        self.assertTrue(results["polygon"])
        self.assertTrue(results["collection"])
        self.assertFalse(results["emptyPoint"])
        self.assertFalse(results["shortLine"])
        self.assertFalse(results["openPolygon"])
        self.assertFalse(results["emptyCollection"])

    def test_event_text_tolerates_malformed_caveats(self):
        script = """
const { eventText } = require("./scripts/audit_city_atlas_full.js");
console.log(eventText({ title: "Sample", caveats: { text: "bad shape" } }));
"""
        completed = subprocess.run(
            ["node", "-e", script],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )
        self.assertEqual(completed.stdout.strip(), "Sample")

    def test_retrieval_trace_tolerates_malformed_evidence_and_source_ids(self):
        script = """
const { hasEventRetrievalTrace } = require("./scripts/audit_city_atlas_full.js");
const result = hasEventRetrievalTrace(
  { evidence: { accessed_at: "2026-01-01" }, source_ids: { source_id: "x" } },
  new Map()
);
console.log(JSON.stringify(result));
"""
        completed = subprocess.run(
            ["node", "-e", script],
            cwd=ROOT,
            check=True,
            text=True,
            capture_output=True,
        )
        self.assertFalse(json.loads(completed.stdout))


if __name__ == "__main__":
    unittest.main()
