#!/usr/bin/env python3
"""Fetch lightweight metadata/page snapshots for the London/NYC civic data discovery package.

Stdlib only; safe to re-run. It does not download full datasets. It captures official
metadata endpoints, Socrata views/sample rows where available, and page title/header
snapshots or error records for each catalog source.
"""
from __future__ import annotations

import argparse
import json
import re
import socket
import ssl
import sys
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw_metadata"
UA = "Bims-5 civic data discovery bot/0.1 (+https://github.com/AyushGupta05/OpenCityLog); contact: local research package"
TIMEOUT = 12

class TitleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.in_h1 = False
        self.title = []
        self.h1 = []
        self.meta_description = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag.lower() == "title":
            self.in_title = True
        if tag.lower() == "h1":
            self.in_h1 = True
        if tag.lower() == "meta" and attrs.get("name", "").lower() == "description":
            self.meta_description = attrs.get("content")
    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self.in_title = False
        if tag.lower() == "h1":
            self.in_h1 = False
    def handle_data(self, data):
        if self.in_title:
            self.title.append(data.strip())
        if self.in_h1:
            self.h1.append(data.strip())

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def slugify(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
    return s[:90] or "source"

def fetch_url(url: str, max_bytes: int = 250000):
    req = Request(url, headers={"User-Agent": UA, "Accept": "application/json,text/html,*/*"})
    out = {"requested_url": url, "retrieved_at": now_iso()}
    try:
        with urlopen(req, timeout=TIMEOUT, context=ssl.create_default_context()) as resp:
            body = resp.read(max_bytes)
            headers = dict(resp.headers.items())
            out.update({
                "final_url": resp.geturl(),
                "status": getattr(resp, "status", None),
                "content_type": headers.get("Content-Type"),
                "last_modified": headers.get("Last-Modified"),
                "etag": headers.get("ETag"),
                "content_length_header": headers.get("Content-Length"),
                "bytes_captured": len(body),
            })
            ctype = (headers.get("Content-Type") or "").lower()
            text = body.decode("utf-8", errors="replace")
            if "json" in ctype or text.lstrip()[:1] in "[{":
                try:
                    parsed = json.loads(text)
                    if isinstance(parsed, dict):
                        out["json_keys"] = sorted(list(parsed.keys()))[:100]
                        for k in ["name", "title", "description", "attribution", "license", "rowsUpdatedAt", "metadata"]:
                            if k in parsed and isinstance(parsed[k], (str, int, float, type(None))):
                                out[k] = parsed[k]
                    elif isinstance(parsed, list):
                        out["json_list_count_captured"] = len(parsed)
                        if parsed and isinstance(parsed[0], dict):
                            out["sample_keys"] = sorted(list(parsed[0].keys()))[:100]
                    out["json_sample"] = parsed if len(text) < 20000 else None
                except Exception as e:
                    out["json_parse_error"] = str(e)
                    out["text_sample"] = text[:2000]
            else:
                parser = TitleParser()
                parser.feed(text[:100000])
                out["page_title"] = " ".join(t for t in parser.title if t).strip() or None
                out["h1"] = " ".join(h for h in parser.h1 if h).strip() or None
                out["meta_description"] = parser.meta_description
                out["text_sample"] = re.sub(r"\s+", " ", text[:3000]).strip()
    except HTTPError as e:
        out.update({"status": e.code, "error": f"HTTPError: {e.reason}", "final_url": e.geturl(), "content_type": e.headers.get("Content-Type")})
    except (URLError, socket.timeout, TimeoutError) as e:
        out.update({"status": None, "error": f"NetworkError: {e}"})
    except Exception as e:
        out.update({"status": None, "error": f"UnexpectedError: {type(e).__name__}: {e}"})
    return out

def load_sources(city: str):
    path = ROOT / city / "source_catalog.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return data, data.get("sources", [])

def source_id(city: str, idx: int, src: dict):
    return src.get("source_id") or src.get("id") or src.get("socrata_id") or f"{city[:3]}-{idx:03d}-{slugify(src.get('title','source'))}"

def normalise_catalog(city: str):
    path = ROOT / city / "source_catalog.json"
    data, sources = load_sources(city)
    changed = False
    for i, src in enumerate(sources, 1):
        sid = source_id(city, i, src)
        if src.get("source_id") != sid:
            src["source_id"] = sid
            changed = True
        if "retrieved_at" not in src:
            src["retrieved_at"] = now_iso()
            changed = True
        raw_file = f"raw_metadata/{city}__{slugify(sid)}__page.json"
        if src.get("raw_metadata_file") != raw_file:
            src["raw_metadata_file"] = raw_file
            changed = True
        if "access_url" not in src:
            src["access_url"] = src.get("url") or src.get("metadata_url") or src.get("api_endpoint")
            changed = True
        if "licence" not in src:
            src["licence"] = "Requires source-level review; many official sources use OGL/UK Open Government Licence, TfL terms, NYC Open Data Terms, or agency-specific terms."
            changed = True
    if changed:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return sources

def fetch_city(city: str, limit: int | None = None):
    RAW.mkdir(exist_ok=True)
    sources = normalise_catalog(city)
    results = []
    for i, src in enumerate(sources[:limit] if limit else sources, 1):
        sid = source_id(city, i, src)
        urls = []
        # Prefer Socrata metadata endpoint if present, otherwise metadata_url/api/url.
        if src.get("metadata_url"):
            urls.append(src["metadata_url"])
        if src.get("socrata_id") and "data.cityofnewyork.us" in (src.get("url") or src.get("api_endpoint") or ""):
            dsid = src["socrata_id"]
            urls.append(f"https://data.cityofnewyork.us/api/views/{dsid}")
            urls.append(f"https://data.cityofnewyork.us/resource/{dsid}.json?$limit=1")
        for field in ["api_endpoint", "url", "access_url"]:
            v = src.get(field)
            if isinstance(v, str) and v.startswith("http") and v not in urls and ";" not in v and " " not in v:
                urls.append(v)
        snapshots = []
        for url in urls[:3]:
            snapshots.append(fetch_url(url))
            time.sleep(0.15)
        record = {
            "source_id": sid,
            "city": city,
            "title": src.get("title"),
            "publisher": src.get("publisher"),
            "bucket": src.get("bucket"),
            "retrieved_at": now_iso(),
            "snapshots": snapshots,
        }
        out = ROOT / src["raw_metadata_file"]
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        ok = any((s.get("status") or 0) and int(s.get("status") or 0) < 400 for s in snapshots)
        results.append((sid, ok, len(snapshots)))
        print(f"{city} {i:02d}/{len(sources)} {sid}: {'ok' if ok else 'warn'} ({len(snapshots)} snapshots)")
    return results

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--city", choices=["london", "new_york", "all"], default="all")
    ap.add_argument("--limit", type=int)
    args = ap.parse_args()
    cities = ["london", "new_york"] if args.city == "all" else [args.city]
    summary = {}
    for city in cities:
        res = fetch_city(city, args.limit)
        summary[city] = {"sources_attempted": len(res), "ok": sum(1 for _, ok, _ in res if ok), "warnings": sum(1 for _, ok, _ in res if not ok)}
    (RAW / "fetch_summary.json").write_text(json.dumps({"retrieved_at": now_iso(), "summary": summary}, indent=2) + "\n")
    print(json.dumps(summary, indent=2))

if __name__ == "__main__":
    main()
