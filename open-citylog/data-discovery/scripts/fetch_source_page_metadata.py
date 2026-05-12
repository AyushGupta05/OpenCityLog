#!/usr/bin/env python3
"""Fetch lightweight metadata snapshots for discovery sources.

Writes one JSON file per source under ../raw_metadata with:
- requested_url / final_url
- status / content_type / content_length / last_modified
- page title / h1 / meta description when HTML
- optional binary note for PDFs/ZIPs/etc.

This is intentionally lightweight and repeatable: it captures enough provenance to
re-find official pages without downloading every dataset payload.
"""
from __future__ import annotations

import datetime as dt
import json
import pathlib
import re
import urllib.request
from html import unescape

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "raw_metadata"
RAW.mkdir(parents=True, exist_ok=True)

OVERRIDE_URLS = {
    # Current official replacements / migrated URLs discovered during live fetches.
    "lon_london_plan_2021": "https://www.london.gov.uk/programmes-strategies/planning/london-plan/london-plan-2021",
    "lon_opportunity_areas": "https://www.london.gov.uk/programmes-strategies/planning/implementing-london-plan/londons-opportunity-areas",
    "lon_lldc_local_plan": "https://www.queenelizabetholympicpark.co.uk/planning-policy",
    # Current nyc.gov planning paths returned 404 during discovery; these are live official replacements.
    "nyc_hudson_yards_dcp_plan": "https://www.nyc.gov/content/planning/pages/our-work/plans/manhattan/hudson-yards",
    "nyc_west_chelsea_dcp_plan": "https://www.nyc.gov/content/planning/pages/our-work/plans/manhattan/west-chelsea",
}

UA = "OpenCitylogDiscovery/0.2 (+https://github.com/AyushGupta05/OpenCityLog; metadata snapshot)"
HTML_RE = re.compile(r"<title>(.*?)</title>", re.I | re.S)
H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.I | re.S)
DESC_RE = re.compile(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', re.I | re.S)


def clean(text: str | None) -> str:
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    return re.sub(r"\s+", " ", text).strip()



def fetch_snapshot(source: dict) -> tuple[str, dict]:
    source_id = source["source_id"]
    url = OVERRIDE_URLS.get(source_id, source["access_url"])
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,application/json,application/pdf,*/*"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read(250_000)
        content_type = (resp.headers.get("Content-Type") or "").lower()
        snapshot = {
            "source_id": source_id,
            "title": source.get("title", ""),
            "requested_url": source["access_url"],
            "fetched_url": url,
            "final_url": resp.geturl(),
            "status": getattr(resp, "status", 200),
            "content_type": resp.headers.get("Content-Type", ""),
            "content_length": resp.headers.get("Content-Length", ""),
            "last_modified": resp.headers.get("Last-Modified", ""),
            "etag": resp.headers.get("ETag", ""),
            "retrieved_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
        if "html" in content_type:
            text = raw.decode("utf-8", "ignore")
            snapshot.update(
                {
                    "page_title": clean((HTML_RE.search(text) or [None, ""])[1] if HTML_RE.search(text) else ""),
                    "h1": clean((H1_RE.search(text) or [None, ""])[1] if H1_RE.search(text) else ""),
                    "meta_description": clean((DESC_RE.search(text) or [None, ""])[1] if DESC_RE.search(text) else ""),
                }
            )
        else:
            snapshot["binary_note"] = "Non-HTML official resource; headers captured without storing full payload here."
        return url, snapshot



def main() -> None:
    counts = {"ok": 0, "warn": 0}
    for city in ["london", "new_york"]:
        catalog_path = ROOT / city / "source_catalog.json"
        sources = json.loads(catalog_path.read_text(encoding="utf-8"))
        for source in sources:
            if source.get("raw_metadata_file"):
                continue
            out_name = f"{source['source_id']}_page_metadata.json"
            out_path = RAW / out_name
            try:
                url, snapshot = fetch_snapshot(source)
                out_path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")
                print(f"ok {source['source_id']} -> {out_name} ({snapshot['status']}) {url}")
                counts["ok"] += 1
            except Exception as exc:
                warning = {
                    "source_id": source["source_id"],
                    "title": source.get("title", ""),
                    "requested_url": source["access_url"],
                    "fetched_url": OVERRIDE_URLS.get(source["source_id"], source["access_url"]),
                    "retrieved_at": dt.datetime.now(dt.timezone.utc).isoformat(),
                    "error": repr(exc),
                }
                out_path.write_text(json.dumps(warning, indent=2, ensure_ascii=False), encoding="utf-8")
                print(f"WARN {source['source_id']} -> {out_name}: {exc}")
                counts["warn"] += 1
    print(json.dumps(counts, indent=2))


if __name__ == "__main__":
    main()
