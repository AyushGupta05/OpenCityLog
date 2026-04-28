#!/usr/bin/env python3
"""Fetch NYC Open Data metadata/sample rows for Open Citylog discovery sources.
Run from repo root or this directory. Writes to ../raw_metadata by default."""
from __future__ import annotations
import json
import pathlib
import sys
import urllib.parse
import urllib.request

OUT = pathlib.Path(__file__).resolve().parents[1] / "raw_metadata"
OUT.mkdir(parents=True, exist_ok=True)

DATASET_IDS = {
    "pluto": "64uk-42ks",
    "zap_project_data": "hgx4-8ukb",
    "zap_bbl": "2iga-a6mk",
    "dob_permit_issuance": "ipu4-2q9a",
    "dob_historical_permits": "bty7-2jhb",
    "dob_now_certificate_of_occupancy": "pkdm-hqz6",
    "hpd_affordable_housing_projects": "hq68-rnsi",
    "hpd_affordable_housing_buildings": "hg8x-zxpr",
    "borough_boundaries": "gthc-hcne",
    "community_districts": "5crt-au7u",
    "nta_2020": "9nt8-h7nd",
    "census_tracts_2020": "63ge-mke6",
    "census_blocks_2020": "wmsu-5muw",
    "bike_routes": "mzxg-pwib",
    "parks_properties": "enfh-gkve",
    "air_quality_health_impacts": "c3uy-2p5r",
    "street_tree_census_2015": "uvpi-gqnh",
    "centerline": "inkn-q76z",
    "building_footprints": "5zhs-2jue",
    "zoning_tax_lot_database": "fdkv-4t4z",
    "facilities_database": "ji82-xba5",
    "facilities_database_shapefile": "2fpa-bnsx",
    "schools_locations": "3bkj-34v2",
    "waterfront_public_access": "388s-pnvc",
    "flood_vulnerability_index": "mrjc-v9pm",
    "issued_business_licenses": "w7w3-xahh",
}


def get_json(url: str):
    with urllib.request.urlopen(url, timeout=45) as r:
        return json.loads(r.read().decode("utf-8"))

for name, dsid in DATASET_IDS.items():
    meta_url = f"https://data.cityofnewyork.us/api/views/{dsid}"
    sample_url = f"https://data.cityofnewyork.us/resource/{dsid}.json?$limit=1"
    try:
        meta = get_json(meta_url)
        (OUT / f"nyc_socrata_{dsid}_{name}_metadata.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
        sample = get_json(sample_url)
        (OUT / f"nyc_socrata_{dsid}_{name}_sample.json").write_text(json.dumps(sample, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"ok {dsid} {meta.get('name')}")
    except Exception as exc:
        print(f"WARN {dsid} {name}: {exc}", file=sys.stderr)

# Focused candidate evidence for Hudson Yards / West Chelsea.
queries = {
    "zap_hudson_projects": ("hgx4-8ukb", {"$limit": "25", "$where": "upper(project_name) like '%HUDSON%'"}),
    "pluto_zip_10001": ("64uk-42ks", {"$limit": "25", "zipcode": "10001"}),
    "pluto_zip_10011": ("64uk-42ks", {"$limit": "25", "zipcode": "10011"}),
}
for out_name, (dsid, params) in queries.items():
    url = f"https://data.cityofnewyork.us/resource/{dsid}.json?" + urllib.parse.urlencode(params)
    try:
        data = get_json(url)
        (OUT / f"nyc_{out_name}.json").write_text(json.dumps({"url": url, "rows": data}, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"ok query {out_name}: {len(data)} rows")
    except Exception as exc:
        print(f"WARN query {out_name}: {exc}", file=sys.stderr)
