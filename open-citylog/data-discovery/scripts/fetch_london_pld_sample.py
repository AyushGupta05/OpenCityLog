#!/usr/bin/env python3
"""Fetch Planning London Datahub discovery metadata and small Stratford/Olympic Park samples."""
from __future__ import annotations
import json
import pathlib
import urllib.request

OUT = pathlib.Path(__file__).resolve().parents[1] / "raw_metadata"
OUT.mkdir(parents=True, exist_ok=True)


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "OpenCitylogDiscovery/0.1"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read()

# Public Elasticsearch-compatible guest API root.
root = json.loads(get("https://planningdata.london.gov.uk/api-guest/").decode("utf-8"))
(OUT / "london_pld_api_root.json").write_text(json.dumps(root, indent=2), encoding="utf-8")
print("ok PLD root", root.get("cluster_name"), root.get("version", {}).get("number"))

# Official docs/schema linked from London City Hall page.
for url in [
    "https://www.london.gov.uk/sites/default/files/planninglondondatahub_api_connection_technical_documentation_v1.pdf",
    "https://www.london.gov.uk/sites/default/files/planninglondondatahub_public_technical_schemav2.1.xlsx",
    "https://www.london.gov.uk/sites/default/files/planning_london_datahub_questions_nov20.pdf",
]:
    name = url.rsplit("/", 1)[-1]
    data = get(url)
    (OUT / name).write_bytes(data)
    print("ok doc", name, len(data), "bytes")

# Focused Stratford/Olympic Park query. This is discovery evidence, not a finished city adapter.
query = {
    "size": 25,
    "query": {
        "query_string": {
            "query": "(Stratford OR Olympic OR Westfield OR \"East Village\" OR \"East Wick\" OR Sweetwater)",
            "default_operator": "OR"
        }
    },
    "_source": [
        "lpa_name", "lpa_app_no", "application_type", "description", "site_name", "postcode",
        "decision", "status", "actual_commencement_date", "actual_completion_date", "decision_issued_date",
        "valid_date", "application_details", "polygon", "geometry", "centroid_easting", "centroid_northing",
        "last_updated", "url_planning_app"
    ]
}
body = json.dumps(query).encode("utf-8")
req = urllib.request.Request(
    "https://planningdata.london.gov.uk/api-guest/applications/_search",
    data=body,
    headers={"Content-Type": "application/json", "User-Agent": "OpenCitylogDiscovery/0.1"},
)
with urllib.request.urlopen(req, timeout=60) as r:
    payload = json.loads(r.read().decode("utf-8"))
(OUT / "london_pld_stratford_olympic_search_sample.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
print("ok Stratford sample hits", payload.get("hits", {}).get("total"))
