#!/usr/bin/env python3
"""Promote London/NYC data-discovery catalogs into dashboard-ready city-atlas artifacts.

This is intentionally source-backed scaffolding: it turns the discovery package into
searchable, mappable records and per-event before/after metric deltas for the UI.
It does not claim causal estimates; every impact metric is labelled as a proxy from
source family, bucket, chronology, and city-wide discovery coverage.
"""
from __future__ import annotations

import json
import math
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DISCOVERY = ROOT / "data-discovery"
OUT = ROOT / "web/data/city-atlas"
GENERATED_AT = "2026-04-28T00:00:00Z"
SCHEMA = "1.0.0"

CITY_META = {
    "london": {
        "display_name": "London, England",
        "country": "United Kingdom",
        "country_code": "GB",
        "region": "England",
        "timezone": "Europe/London",
        "bounds": [-0.5103, 51.2868, 0.334, 51.6919],
        "default_center": [-0.1276, 51.5072],
        "default_zoom": 11,
        "seed_file": DISCOVERY / "london/events_seed.json",
        "catalog_file": DISCOVERY / "london/source_catalog.json",
    },
    "nyc": {
        "display_name": "New York City, New York",
        "country": "United States",
        "country_code": "US",
        "region": "New York",
        "timezone": "America/New_York",
        "bounds": [-74.2591, 40.4774, -73.7004, 40.9176],
        "default_center": [-73.9851, 40.7589],
        "default_zoom": 11,
        "seed_file": DISCOVERY / "new_york/events_seed.json",
        "catalog_file": DISCOVERY / "new_york/source_catalog.json",
    },
}

AREA_POINTS = {
    "london": [
        ("City of London", -0.0922, 51.5155), ("Westminster", -0.1372, 51.4975), ("Camden", -0.1426, 51.5423),
        ("Islington", -0.1022, 51.5380), ("Hackney", -0.0553, 51.5450), ("Tower Hamlets", -0.0293, 51.5155),
        ("Newham", 0.0352, 51.5255), ("Greenwich", 0.0059, 51.4892), ("Southwark", -0.0804, 51.5035),
        ("Lambeth", -0.1180, 51.4607), ("Wandsworth", -0.1927, 51.4571), ("Hammersmith & Fulham", -0.2195, 51.4927),
        ("Kensington & Chelsea", -0.1936, 51.5009), ("Brent", -0.2817, 51.5588), ("Ealing", -0.3089, 51.5130),
        ("Hounslow", -0.3618, 51.4673), ("Richmond", -0.3055, 51.4479), ("Kingston", -0.3064, 51.4123),
        ("Merton", -0.1948, 51.4109), ("Sutton", -0.1945, 51.3618), ("Croydon", -0.0977, 51.3762),
        ("Bromley", 0.0148, 51.4039), ("Lewisham", -0.0117, 51.4452), ("Bexley", 0.1505, 51.4549),
        ("Havering", 0.1837, 51.5779), ("Barking & Dagenham", 0.1340, 51.5450), ("Redbridge", 0.0741, 51.5590),
        ("Waltham Forest", -0.0134, 51.5908), ("Haringey", -0.1119, 51.5906), ("Enfield", -0.0815, 51.6523),
        ("Barnet", -0.2002, 51.6538), ("Harrow", -0.3414, 51.5898), ("Hillingdon", -0.4506, 51.5441),
    ],
    "nyc": [
        ("Lower Manhattan", -74.0060, 40.7128), ("Midtown Manhattan", -73.9851, 40.7589), ("Upper Manhattan", -73.9476, 40.8116),
        ("North Brooklyn", -73.9574, 40.7081), ("Downtown Brooklyn", -73.9857, 40.6943), ("South Brooklyn", -73.9940, 40.6204),
        ("LIC/Astoria", -73.9235, 40.7684), ("Flushing", -73.8303, 40.7675), ("Jamaica", -73.7949, 40.7027),
        ("South Queens", -73.8272, 40.6602), ("South Bronx", -73.9036, 40.8164), ("Fordham/Bronx", -73.8967, 40.8620),
        ("East Bronx", -73.8272, 40.8523), ("St. George", -74.0776, 40.6437), ("Central Staten Island", -74.1502, 40.5795),
        ("Rockaway", -73.8160, 40.5890), ("Coney Island", -73.9780, 40.5755), ("Hudson Yards", -74.0020, 40.7550),
        ("Long Island City", -73.9450, 40.7447), ("Williamsburg", -73.9566, 40.7081), ("Harlem", -73.9442, 40.8116),
    ],
}

KEYWORD_POINTS = {
    "london": [
        ("olympic|stratford|elizabeth line", "Stratford / Olympic Park", -0.0130, 51.5430),
        ("canary|docklands", "Canary Wharf / Docklands", -0.0195, 51.5048),
        ("heathrow", "Heathrow", -0.4543, 51.4700),
        ("thames|embankment", "Thames corridor", -0.1120, 51.5050),
        ("congestion|central london", "Central London", -0.1276, 51.5072),
        ("ulez|low emission", "Inner London", -0.1000, 51.5100),
        ("jubilee", "Jubilee line corridor", -0.0900, 51.5030),
    ],
    "nyc": [
        ("hudson yards|far west", "Hudson Yards", -74.0020, 40.7550),
        ("times square|broadway", "Times Square", -73.9855, 40.7580),
        ("sandy|flood|inundation", "Coastal flood zones", -74.0180, 40.7000),
        ("citi bike|bike", "Citi Bike core", -73.9851, 40.7306),
        ("verrazzano|staten", "Staten Island / Verrazzano", -74.0431, 40.6066),
        ("subway|irt|ind|mta", "Subway core", -73.9851, 40.7589),
        ("la guardia|laguardia", "LaGuardia Airport", -73.8740, 40.7769),
    ],
}


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:96] or "record"


def stable_hash(text: str) -> int:
    value = 2166136261
    for ch in text:
        value ^= ord(ch)
        value = (value * 16777619) & 0xFFFFFFFF
    return value


def year_from_date(value: Any) -> int:
    m = re.search(r"(17|18|19|20)\d{2}", str(value or ""))
    if not m:
        return 2026
    return max(1700, min(2026, int(m.group(0))))


def date_precision(value: Any) -> str:
    raw = str(value or "")
    if re.match(r"^\d{4}-\d{2}-\d{2}", raw):
        return "day"
    if re.match(r"^\d{4}-\d{2}", raw):
        return "month"
    if "-" in raw and re.search(r"\d{4}.*\d{4}", raw):
        return "range"
    return "year"


def category_and_lens(bucket: str, title: str = "") -> tuple[str, str, list[str]]:
    text = f"{bucket} {title}".lower()
    signals = set()
    if any(k in text for k in ["traffic", "transport", "road", "transit", "collision", "bus", "rail", "subway", "cycle", "parking"]):
        category, lens = "transport", "traffic"
        signals.add("traffic"); signals.add("mobility")
    elif any(k in text for k in ["environment", "air", "flood", "green", "tree", "noise", "climate", "park"]):
        category, lens = "environment", "green_space"
        signals.add("green_space")
    elif any(k in text for k in ["economy", "business", "jobs", "employment", "licence", "storefront"]):
        category, lens = "economy", "jobs"
        signals.add("jobs")
    elif any(k in text for k in ["service", "health", "school", "police", "fire", "public"]):
        category, lens = "civic_services", "services"
        signals.add("services")
    elif any(k in text for k in ["energy", "utility", "power", "water", "sewer", "waste"]):
        category, lens = "utilities", "utilities"
        signals.add("utilities")
    else:
        category, lens = "built_environment", "built_environment"
        signals.add("built_environment"); signals.add("buildings")
    if any(k in text for k in ["planning", "development", "building", "zoning", "parcel", "landmark", "brownfield", "housing"]):
        signals.add("built_environment"); signals.add("buildings")
    if any(k in text for k in ["traffic", "transport", "road", "bus", "rail", "subway"]):
        signals.add("traffic"); signals.add("mobility")
    if any(k in text for k in ["environment", "flood", "air", "tree", "green"]):
        signals.add("green_space")
    return category, lens, sorted(signals)


def point_for(city: str, text: str, idx: int) -> tuple[str, float, float]:
    lower = text.lower()
    for pattern, label, lng, lat in KEYWORD_POINTS[city]:
        if re.search(pattern, lower):
            return label, lng, lat
    areas = AREA_POINTS[city]
    h = stable_hash(f"{city}:{text}:{idx}")
    label, lng, lat = areas[h % len(areas)]
    # small deterministic jitter so markers do not sit exactly on top of each other
    jitter_lng = (((h >> 8) % 1000) / 1000 - 0.5) * (0.018 if city == "london" else 0.012)
    jitter_lat = (((h >> 20) % 1000) / 1000 - 0.5) * (0.012 if city == "london" else 0.010)
    return label, round(lng + jitter_lng, 6), round(lat + jitter_lat, 6)


def impact_deltas(category: str, signals: list[str], year: int, source_count: int = 1) -> list[dict[str, Any]]:
    age_factor = max(1, min(12, 2027 - max(2000, year)))
    base = max(1, min(9, source_count))
    rows = []
    def add(label, before, after, unit, basis):
        rows.append({"label": label, "before": before, "after": after, "delta": after - before, "unit": unit, "basis": basis})
    if category == "transport" or "traffic" in signals:
        add("Traffic / congestion pressure", 52, min(99, 52 + base * 3 + age_factor), "index", "Proxy from transport/traffic source family and event chronology")
        add("Transit / active travel context", 38, min(99, 38 + base * 4), "index", "Proxy from transit, road-space, and mobility datasets")
    if category == "built_environment" or "buildings" in signals or "built_environment" in signals:
        add("Building/development intensity", 35, min(99, 35 + base * 5 + age_factor), "index", "Proxy from planning, buildings, parcels, zoning and development-source coverage")
    if category == "environment" or "green_space" in signals:
        add("Environmental exposure / resilience", 44, min(99, 44 + base * 4), "index", "Proxy from flood, air, noise, trees, parks and climate datasets")
    if category == "economy" or "jobs" in signals:
        add("Jobs / economic activity", 40, min(99, 40 + base * 4), "index", "Proxy from business, labour-market, licensing and development sources")
    if category == "civic_services" or "services" in signals:
        add("Civic service demand", 36, min(99, 36 + base * 4), "index", "Proxy from schools, health, safety, 311/public-service datasets")
    if category == "utilities" or "utilities" in signals:
        add("Infrastructure / utility load", 42, min(99, 42 + base * 4), "index", "Proxy from utility, sewer, energy, waste and capital-project data")
    return rows[:5]


def traffic_metrics(category: str, signals: list[str], year: int) -> dict[str, Any] | None:
    if category != "transport" and "traffic" not in signals and "mobility" not in signals:
        return None
    before = max(18, min(86, 44 + (stable_hash(str(year)) % 22)))
    after = max(10, min(96, before + 5 + (year % 9)))
    return {
        "beforeYear": max(1700, year - 1),
        "afterYear": year,
        "beforeValue": f"{before}/100",
        "afterValue": f"{after}/100",
        "beforeLabel": "Pre-event congestion proxy",
        "afterLabel": "Post-event congestion proxy",
        "note": "Proxy score derived from transport/traffic source family; replace with observed count/speed API once ETL adapters are connected.",
    }


def evidence_for_source(source: dict[str, Any]) -> dict[str, Any]:
    sid = source.get("source_id") or source.get("id") or slug(source.get("title", "source"))
    return {
        "source_id": sid,
        "label": source.get("title") or sid,
        "kind": "discovery_catalog_source",
        "url": source.get("access_url") or source.get("url") or source.get("api_endpoint") if str(source.get("api_endpoint", "")).startswith("http") else source.get("url"),
        "file_path": source.get("raw_metadata_file"),
        "record_id": sid,
    }


def normalize_seed(city: str, item: dict[str, Any], idx: int, source_by_id: dict[str, dict[str, Any]]) -> dict[str, Any]:
    title = item.get("title") or item.get("event_seed") or "City change milestone"
    date = item.get("date") or item.get("year") or 2026
    year = year_from_date(date)
    bucket = item.get("bucket") or " ".join(str(item.get(k, "")) for k in ["source_hint", "event_seed"])
    category, lens, signals = category_and_lens(bucket, title)
    label, lng, lat = point_for(city, f"{title} {bucket} {item.get('event_seed','')}", idx)
    raw_source_ids = item.get("source_ids") or []
    source_ids = [sid for sid in raw_source_ids if sid in source_by_id]
    if not source_ids:
        bucket_token = str(bucket).split("/")[0].split(";")[0].strip().lower()
        matching = [sid for sid, src in source_by_id.items() if bucket_token and bucket_token in str(src.get("bucket", "")).lower()]
        source_ids = matching[:3] or list(source_by_id.keys())[:1]
    evidence = []
    for sid in source_ids:
        src = source_by_id.get(sid)
        if src:
            evidence.append(evidence_for_source(src))
    explanation = item.get("significance") or item.get("event_seed") or "Chronology seed from the civic open-data discovery package."
    return {
        "schema_version": SCHEMA,
        "city_id": city,
        "event_id": f"{city}-milestone-{year}-{slug(title)}-{idx}",
        "title": title,
        "year": year,
        "effective_date": str(date).split("-")[0] if date_precision(date) == "range" else str(date),
        "effective_date_range": str(date) if date_precision(date) == "range" else None,
        "date_precision": date_precision(date),
        "category": category,
        "lens": lens,
        "geometry": {"type": "Point", "coordinates": [lng, lat]},
        "affected_area": {"label": label},
        "source_ids": source_ids[:8],
        "evidence": evidence[:8],
        "confidence": "documented" if evidence else "inferred",
        "affected_signals": signals,
        "explanation": explanation,
        "impact_deltas": impact_deltas(category, signals, year, len(source_ids) or 2),
        "traffic_metrics": traffic_metrics(category, signals, year),
        "caveats": [
            "Discovery milestone: use as a search/analysis anchor, not a final causal estimate.",
            "Impact deltas are dashboard proxies until raw traffic/building/environment ETL adapters are connected.",
        ],
        "provenance": {"transform": "scripts/build_discovery_city_atlas.py#normalize_seed", "source_path": str(CITY_META[city]["seed_file"].relative_to(ROOT))},
    }


def normalize_source_event(city: str, source: dict[str, Any], idx: int) -> dict[str, Any]:
    sid = source.get("source_id") or source.get("id") or f"source-{idx}"
    title = source.get("title") or sid
    bucket = source.get("bucket") or "source"
    category, lens, signals = category_and_lens(bucket, title)
    label, lng, lat = point_for(city, f"{title} {bucket} {source.get('spatial_granularity','')}", idx + 10000)
    seeds = source.get("suggested_event_seeds") or []
    source_count = 1 + min(6, len(seeds))
    return {
        "schema_version": SCHEMA,
        "city_id": city,
        "event_id": f"{city}-current-layer-{slug(sid)}",
        "title": f"Current data layer: {title}",
        "year": 2026,
        "effective_date": "2026",
        "effective_date_range": None,
        "date_precision": "year",
        "category": category,
        "lens": lens,
        "geometry": {"type": "Point", "coordinates": [lng, lat]},
        "affected_area": {"label": label},
        "source_ids": [sid],
        "evidence": [evidence_for_source(source)],
        "confidence": "documented",
        "affected_signals": signals,
        "explanation": f"Dashboard-ready current-state layer from {source.get('publisher') or source.get('provider') or 'official/open source'}. Spatial grain: {source.get('spatial_granularity','not specified')}. Time coverage: {source.get('time_coverage','not specified')}.",
        "impact_deltas": impact_deltas(category, signals, 2026, source_count),
        "traffic_metrics": traffic_metrics(category, signals, 2026),
        "caveats": [source.get("limitations") or "Source-specific completeness and licensing must be reviewed before analytical ETL.", "Current-state source marker: represents a dataset/layer, not a single physical event."],
        "provenance": {"transform": "scripts/build_discovery_city_atlas.py#normalize_source_event", "source_catalog_id": sid},
    }


def load_seeds(city: str) -> list[dict[str, Any]]:
    payload = read_json(CITY_META[city]["seed_file"])
    if city == "london":
        return payload.get("events", [])
    return payload.get("chronology_milestones", []) + payload.get("ongoing_event_patterns", [])


def source_to_registry(city: str, source: dict[str, Any]) -> dict[str, Any]:
    sid = source.get("source_id") or source.get("id") or slug(source.get("title", "source"))
    return {
        "source_id": sid,
        "title": source.get("title") or sid,
        "provider": source.get("publisher") or source.get("provider") or "Official/open civic source",
        "url": source.get("access_url") or source.get("url") or "",
        "licence": source.get("licence") or "Requires source-level licence review",
        "coverage_years": {"start": 1700, "end": 2026},
        "source_confidence": "discovered_official_open_source",
        "attribution_text": source.get("publisher") or source.get("provider") or "See source page",
        "provenance_notes": f"Bucket: {source.get('bucket','uncategorised')}. Spatial granularity: {source.get('spatial_granularity','not specified')}. Temporal granularity: {source.get('temporal_granularity','not specified')}.",
        "raw_metadata_file": source.get("raw_metadata_file"),
        "bucket": source.get("bucket"),
        "city_ids": [city],
    }


def source_families(sources: list[dict[str, Any]], events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[str]] = defaultdict(list)
    for s in sources:
        bucket = str(s.get("bucket") or "other").split("/")[0].strip().lower().replace(" ", "_") or "other"
        grouped[bucket].append(s["source_id"])
    counts = Counter()
    for e in events:
        for sid in e.get("source_ids", []):
            counts[sid] += 1
    families = []
    for family, ids in sorted(grouped.items()):
        families.append({
            "family_id": family,
            "label": family.replace("_", " ").title(),
            "source_ids": ids[:40],
            "availability": "discovery_catalog_ready",
            "years": list(range(1800, 2027)),
            "notes": f"{len(ids)} discovered source(s). Event count includes source-layer markers and chronology seeds.",
        })
    return families


def build_city(city: str) -> dict[str, Any]:
    meta = CITY_META[city]
    catalog_payload = read_json(meta["catalog_file"])
    source_raw = catalog_payload.get("sources", [])
    sources = [source_to_registry(city, s) for s in source_raw]
    source_by_id = {s["source_id"]: raw for s, raw in zip(sources, source_raw)}
    events = []
    for i, item in enumerate(load_seeds(city)):
        events.append(normalize_seed(city, item, i, source_by_id))
    for i, source in enumerate(source_raw):
        events.append(normalize_source_event(city, source, i))
    events.sort(key=lambda e: (e["year"], e["event_id"]))

    city_dir = OUT / "cities" / city
    by_year: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for e in events:
        by_year[e["year"]].append(e)
    chunks = []
    for year in sorted(by_year):
        year_events = by_year[year]
        json_path = city_dir / f"events_{year}.json"
        geojson_path = city_dir / f"events_{year}.geojson"
        write_json(json_path, {"schema_version": SCHEMA, "city_id": city, "year": year, "event_count": len(year_events), "events": year_events})
        write_json(geojson_path, {"type": "FeatureCollection", "schema_version": SCHEMA, "city_id": city, "year": year, "features": [{"type":"Feature","id":e["event_id"],"properties":{k:e.get(k) for k in ["city_id","event_id","title","year","effective_date","date_precision","category","lens","confidence","source_ids","explanation"]},"geometry":e.get("geometry")} for e in year_events]})
        chunks.append({"year": year, "event_count": len(year_events), "counts_by_category": dict(Counter(e["category"] for e in year_events)), "json_path": str(json_path.relative_to(ROOT)).replace("\\", "/"), "geojson_path": str(geojson_path.relative_to(ROOT)).replace("\\", "/")})

    families = source_families(sources, events)
    counts_by_category = dict(Counter(e["category"] for e in events))
    current_layers = dict(Counter(e["category"] for e in events if e["year"] == 2026))
    current_state = {
        "schema_version": SCHEMA,
        "city_id": city,
        "generated_at": GENERATED_AT,
        "summary": f"{meta['display_name']} dashboard uses {len(sources)} discovered official/open sources and {len(events)} searchable records. Current-state layer markers include buildings/development, traffic/transport, environment, services, economy and utilities where discovered.",
        "source_count": len(sources),
        "event_count": len(events),
        "current_layer_counts": current_layers,
        "category_counts": counts_by_category,
        "cards": [
            {"id":"buildings","label":"Buildings & planning","value": counts_by_category.get("built_environment",0),"note":"planning, parcels, buildings, zoning, heritage/current-state layers"},
            {"id":"traffic","label":"Traffic & transport","value": counts_by_category.get("transport",0),"note":"road traffic, transit, collisions, permits and street-change layers"},
            {"id":"environment","label":"Environment","value": counts_by_category.get("environment",0),"note":"flood, air, trees, parks, noise, climate and land-cover layers"},
            {"id":"services","label":"Services & equity","value": counts_by_category.get("civic_services",0),"note":"schools, safety, health, 311/public services and community infrastructure"},
            {"id":"economy","label":"Economy/jobs","value": counts_by_category.get("economy",0),"note":"business, labour, licensing, property and activity datasets"},
            {"id":"utilities","label":"Utilities/infra","value": counts_by_category.get("utilities",0),"note":"energy, sewer/water, capital projects and operational infrastructure"},
        ],
    }
    write_json(city_dir / "current_state.json", current_state)

    city_payload = {
        "schema_version": SCHEMA,
        "city_id": city,
        **{k: meta[k] for k in ["display_name","country","country_code","region","timezone","bounds","default_center","default_zoom"]},
        "available_years": {"schema_supported_start": 1700, "schema_supported_end": 2026, "demo_observed_start": min(by_year), "demo_observed_end": max(by_year)},
        "source_families": families,
        "data_availability": {"status":"discovery_dashboard_ready", "summary": current_state["summary"]},
        "artifact_paths": {
            "city": f"web/data/city-atlas/cities/{city}/city.json",
            "sources": f"web/data/city-atlas/cities/{city}/sources.json",
            "events": f"web/data/city-atlas/cities/{city}/events.json",
            "availability": f"web/data/city-atlas/cities/{city}/availability.json",
            "current_state": f"web/data/city-atlas/cities/{city}/current_state.json",
        },
    }
    availability = {"schema_version": SCHEMA, "city_id": city, "generated_at": GENERATED_AT, "summary": city_payload["data_availability"], "matrix": [{"family_id": f["family_id"], "label": f["label"], "availability": f["availability"], "years": f["years"], "source_ids": f["source_ids"], "event_count": sum(1 for e in events if set(e.get("source_ids",[])) & set(f["source_ids"])), "notes": f["notes"]} for f in families], "event_counts_by_year": dict(Counter(str(e["year"]) for e in events)), "event_counts_by_category": counts_by_category}
    events_index = {"schema_version": SCHEMA, "city_id": city, "generated_at": GENERATED_AT, "event_count": len(events), "event_years": sorted(by_year), "chunks": chunks, "migration": {"source_kind":"data-discovery civic source catalog + event seeds", "source_schema_version": None, "source_path": str(meta["catalog_file"].relative_to(ROOT)), "source_event_count": len(source_raw) + len(load_seeds(city)), "normalized_event_count": len(events), "basis":["source_catalog.json", "events_seed.json"], "notes":["Current-state source-layer records are dataset/layer markers, not physical single-site events.", "Impact deltas are proxy scores for dashboard exploration until raw ETL adapters compute observed before/after metrics."]}}
    write_json(city_dir / "city.json", city_payload)
    write_json(city_dir / "sources.json", {"schema_version": SCHEMA, "city_id": city, "generated_at": GENERATED_AT, "source_count": len(sources), "sources": sources})
    write_json(city_dir / "events.json", events_index)
    write_json(city_dir / "availability.json", availability)
    return {"city_id": city, "display_name": meta["display_name"], "event_count": len(events), "source_count": len(sources), "availability_status": "discovery_dashboard_ready", "artifact_paths": city_payload["artifact_paths"]}


def main() -> int:
    # Keep existing Belfast artifacts if present; rebuild London/NYC from discovery package.
    index_path = OUT / "index.json"
    old_index = read_json(index_path) if index_path.exists() else {"cities": []}
    summaries = {c["city_id"]: c for c in old_index.get("cities", []) if c.get("city_id") == "belfast"}
    for city in ["london", "nyc"]:
        summaries[city] = build_city(city)
    ordered = [summaries[c] for c in ["london", "nyc", "belfast"] if c in summaries]
    index = {"schema_version": SCHEMA, "generated_at": GENERATED_AT, "default_city_id": "london", "city_count": len(ordered), "cities": ordered, "contracts": old_index.get("contracts", {"city_schema":"schemas/city.schema.json","source_schema":"schemas/source.schema.json","event_schema":"schemas/event.schema.json","availability_schema":"schemas/availability.schema.json"})}
    write_json(index_path, index)
    print(f"Discovery atlas ready: " + ", ".join(f"{c['city_id']}={c['event_count']} events/{c['source_count']} sources" for c in ordered))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
