#!/usr/bin/env python3
"""Promote London/NYC data-discovery catalogs into dashboard-ready city-atlas artifacts.

This is intentionally source-backed scaffolding: it turns the discovery package into
searchable, mappable records for the UI. It does not fabricate before/after metric
deltas; quantitative context must come from a source adapter that supplies observed
measurements with provenance.
"""
from __future__ import annotations

import json
import math
import os
import re
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DISCOVERY = ROOT / "data-discovery"
OUT = ROOT / "web/data/city-atlas"
ARCHITECTURE_MILESTONES = ROOT / "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json"
GENERATED_AT = os.environ.get("BIMS_DATA_GENERATED_AT") or datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
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
        ("staten island|\\(si\\)|\\(r\\)", "Staten Island", -74.1502, 40.5795),
        ("brooklyn|\\(bk\\)|\\(k\\)", "Brooklyn", -73.9442, 40.6782),
        ("queens|\\(qn\\)|\\(q\\)", "Queens", -73.7949, 40.7282),
        ("bronx|\\(bx\\)|\\(b\\)", "Bronx", -73.8648, 40.8448),
        ("manhattan|\\(mn\\)|\\(m\\)", "Manhattan", -73.9712, 40.7831),
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
    body = json.dumps(payload, separators=(",", ":")) + "\n"
    tmp_path = path.with_name(f"{path.name}.tmp")
    last_error: OSError | None = None
    for attempt in range(6):
        try:
            tmp_path.write_text(body, encoding="utf-8")
            os.replace(tmp_path, path)
            return
        except OSError as error:
            last_error = error
            if tmp_path.exists():
                try:
                    tmp_path.unlink()
                except OSError:
                    pass
            time.sleep(0.15 * (attempt + 1))
    if last_error:
        raise last_error


def architecture_package() -> dict[str, Any]:
    if not ARCHITECTURE_MILESTONES.exists():
        return {"sources": [], "events": []}
    return read_json(ARCHITECTURE_MILESTONES)


def architecture_sources_for_city(city: str) -> list[dict[str, Any]]:
    package = architecture_package()
    return [source for source in package.get("sources", []) if city in (source.get("city_ids") or [])]


def architecture_events_for_city(city: str) -> list[dict[str, Any]]:
    package = architecture_package()
    source_path = str(ARCHITECTURE_MILESTONES.relative_to(ROOT)).replace("\\", "/")
    events = []
    for event in package.get("events", []):
        if event.get("city_id") != city:
            continue
        annotated = dict(event)
        annotated["_source_path"] = source_path
        events.append(annotated)
    return events


def generated_artifact_paths(city: str, city_dir: Path) -> dict[str, str]:
    artifacts: dict[str, str] = {}
    known_files = {
        "detail_layers": "detail_layers.geojson",
        "lens_overlays": "lens_overlays.geojson",
        "transport_roads_base": "transport_roads_base.geojson",
    }
    for key, filename in known_files.items():
        if (city_dir / filename).exists():
            artifacts[key] = f"web/data/city-atlas/cities/{city}/{filename}"
    if city_dir.exists() and any(re.fullmatch(r"transport_roads_\d{4}\.geojson", item.name) for item in city_dir.iterdir()):
        artifacts["transport_roads_template"] = f"web/data/city-atlas/cities/{city}/transport_roads_{{year}}.geojson"
    return artifacts


def nested_counts(items: list[dict[str, Any]], first_key: str, second_key: str) -> dict[str, dict[str, int]]:
    counts: dict[str, Counter[str]] = defaultdict(Counter)
    for item in items:
        first = item.get(first_key)
        second = item.get(second_key)
        if first and second:
            counts[str(first)][str(second)] += 1
    return {key: dict(counts[key]) for key in sorted(counts)}


def safe_public_text(value: Any) -> str:
    text = str(value or "")
    replacements = [
        (r"\bforecast and budget fields\b", "projected schedule and budget fields"),
        (r"\bdoes not treat forecasts as completed outcomes\b", "does not treat projected schedule fields as completed outcomes"),
        (r"\bnot proof of\b", "not evidence of"),
        (r"\bas proof of\b", "as evidence of"),
        (r"\bnot final cause/outcome\b", "not final incident-origin/outcome"),
        (r"\bnot final cause or impact determinations\b", "not final incident-origin or impact determinations"),
        (r"\bnot final cause determinations\b", "not final incident-origin determinations"),
    ]
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text, flags=re.I)
    return text


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


SOURCE_DATE_FIELD_HINTS = {
    "brownfield-land": "entry-date, start-date, planning-permission-date, or end-date",
    "gla-planning-datahub-applications": "valid_date, decision_date, actual_commencement_date, or actual_completion_date",
    "conservation-area": "start-date, entry-date, or end-date",
    "listed-building": "start-date, entry-date, or end-date",
    "tree-preservation-order": "start-date, entry-date, or end-date",
    "tree-preservation-zone": "start-date, entry-date, or end-date",
    "article-4-direction": "start-date, entry-date, or end-date",
    "local-plan-boundary": "start-date, entry-date, or end-date",
    "tfl-road-disruptions": "startDateTime, currentUpdateDateTime, or lastModifiedTime",
    "london-fire-brigade-incidents": "DateOfCall",
    "dft-road-safety-collisions": "date",
    "lon-extra-hm-land-registry-price-paid-data": "transfer deed date",
    "lon-extra-uk-house-price-index": "Date",
    "lon-extra-food-hygiene-rating-scheme-api": "RatingDate",
    "police-data-api": "Month",
    "police-data-stop-search": "Date (month-truncated by adapter)",
    "ipu4-2q9a": "issuance_date",
    "w9ak-ipjd": "signoff_date, first_permit_date, current_status_date, or filing_date",
    "bs8b-p36w": "c_o_issue_date",
    "pkdm-hqz6": "c_of_o_issuance_date",
    "rbx6-tga4": "issued_date",
    "br6q-ssj3": "datecomplt, datepermit, datefiled, or datelstupd",
    "tqtj-sjs8": "permitissuedate",
    "c9sj-fmsg": "permitissuedate",
    "i6b5-j7bu": "work_start_date",
    "as9z-kwsh": "completion_date",
    "hgx4-8ukb": "project_start_date",
    "hgx4-8ukb": "project_start_date",
    "n7gv-k5yt": "date_reported_as_of",
    "4hcv-tc5r": "constructionactualcompletion, procurementactualcompletion, designactualcompletion, or lastupdated",
    "enfh-gkve": "acquisitiondate",
    "uvpi-gqnh": "created_at",
    "bkfu-528j": "start_date_time",
    "erm2-nwe9": "created_date",
    "h9gi-nx95": "crash_date",
    "dpm2-m9mq": "issue_date or received_date",
    "buis-pvji": "desdate",
    "skyk-mpzq": "desdate or caldate",
    "8m42-w767": "incident_datetime",
}


def source_date_field_for(item: dict[str, Any]) -> str:
    explicit = item.get("source_date_field") or item.get("date_field") or item.get("date_basis")
    if explicit:
        return str(explicit)
    dataset = str(item.get("source_dataset_id") or "")
    if dataset in SOURCE_DATE_FIELD_HINTS:
        return SOURCE_DATE_FIELD_HINTS[dataset]
    source_ids = item.get("source_ids") or []
    for source_id in source_ids:
        if str(source_id) in SOURCE_DATE_FIELD_HINTS:
            return SOURCE_DATE_FIELD_HINTS[str(source_id)]
    if item.get("date"):
        return "date field supplied by source adapter"
    if item.get("year"):
        return "year supplied by curated chronology seed"
    return "source adapter date basis not labelled"


def category_and_lens(bucket: str, title: str = "") -> tuple[str, str, list[str]]:
    text = f"{bucket} {title}".lower()
    signals = set()
    planning_terms = ["planning", "development", "building", "zoning", "parcel", "landmark", "brownfield", "housing", "listed", "conservation", "local plan"]
    if any(k in text for k in planning_terms):
        category, lens = "built_environment", "built_environment"
        signals.add("built_environment"); signals.add("buildings")
    elif any(k in text for k in ["traffic", "transport", "road", "transit", "collision", "bus", "rail", "subway", "cycle", "parking"]):
        category, lens = "transport", "traffic"
        signals.add("traffic"); signals.add("mobility")
    elif any(k in text for k in ["environment", "air", "flood", "green", "tree", "noise", "climate", "parkland", "parks property", "public realm/parks"]):
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
    if any(k in text for k in planning_terms):
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


def source_url_for(source: dict[str, Any]) -> str | None:
    api_endpoint = source.get("api_endpoint")
    if isinstance(api_endpoint, str) and api_endpoint.startswith("http"):
        return api_endpoint
    for key in ["access_url", "url", "metadata_url"]:
        value = source.get(key)
        if isinstance(value, str) and value.startswith("http"):
            return value
    return None


def evidence_for_source(source: dict[str, Any], item: dict[str, Any] | None = None) -> dict[str, Any]:
    sid = source.get("source_id") or source.get("id") or slug(source.get("title", "source"))
    row_url = item.get("source_url") if item and isinstance(item.get("source_url"), str) and item.get("source_url", "").startswith("http") else None
    return {
        "source_id": sid,
        "label": source.get("title") or sid,
        "kind": "source_record",
        "url": row_url or source_url_for(source),
        "file_path": source.get("raw_metadata_file"),
        "record_id": item.get("source_record_id") if item and item.get("source_record_id") else sid,
        "accessed_at": item.get("source_retrieved_at") if item and item.get("source_retrieved_at") else source.get("retrieved_at"),
    }


def normalize_seed(city: str, item: dict[str, Any], idx: int, source_by_id: dict[str, dict[str, Any]]) -> dict[str, Any]:
    title = item.get("title") or item.get("event_seed") or "City change milestone"
    date = item.get("date") or item.get("date_start") or item.get("year")
    if not date:
        raise ValueError(f"Seed event lacks a source date: {city} #{idx} {title!r}")
    year = year_from_date(date)
    bucket = item.get("bucket") or item.get("category") or " ".join(str(item.get(k, "")) for k in ["source_hint", "event_seed"])
    category, lens, signals = category_and_lens(bucket, title)

    provided_geometry = item.get("geometry") if isinstance(item.get("geometry"), dict) else None
    geometry_source = item.get("geometry_source")
    geometry_precision = item.get("geometry_precision")
    used_atlas_reference_point = False
    if provided_geometry and provided_geometry.get("type") == "Point":
        lng, lat = provided_geometry.get("coordinates", [None, None])[:2]
        label = item.get("area") or item.get("location") or item.get("affected_area") or point_for(city, f"{title} {bucket}", idx)[0]
        geometry_source = geometry_source or "Source adapter supplied GeoJSON point geometry."
        geometry_precision = geometry_precision or "Point geometry supplied by the source adapter; inspect source row caveats before treating it as an exact site."
    else:
        lng = item.get("longitude") or item.get("lng")
        lat = item.get("latitude") or item.get("lat")
        area_label = item.get("area") or item.get("location") or item.get("affected_area")
        if lng is not None and lat is not None:
            lng, lat = float(lng), float(lat)
            label = area_label or point_for(city, f"{title} {bucket}", idx)[0]
            provided_geometry = {"type": "Point", "coordinates": [lng, lat]}
            geometry_source = geometry_source or "Source adapter supplied latitude/longitude fields or a documented geocode."
            geometry_precision = geometry_precision or "Row-level point from the adapter; source geocoding precision varies and may be approximate."
        else:
            label, lng, lat = point_for(city, f"{title} {bucket} {area_label or ''} {item.get('event_seed','')}", idx)
            if area_label:
                label = str(area_label)
            provided_geometry = {"type": "Point", "coordinates": [lng, lat]}
            used_atlas_reference_point = True
            geometry_source = geometry_source or "Atlas reference point selected from city/area keywords because the source seed lacks row-level coordinates."
            geometry_precision = geometry_precision or "Approximate area/city reference marker for map navigation, not an exact event geometry."

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
            evidence.append(evidence_for_source(src, item))
    primary_source = source_by_id.get(source_ids[0]) if source_ids else None
    primary_evidence = evidence[0] if evidence else {}
    explanation = safe_public_text(item.get("observed_change") or item.get("summary") or item.get("significance") or item.get("event_seed") or "Chronology seed from the civic open-data discovery package.")
    source_date_field = source_date_field_for(item)
    caveats = [
        safe_public_text(item.get("limitations") or "Discovery milestone: use as a search/analysis anchor, not a final causal estimate."),
        "No before/after outcome metric is inferred unless a source adapter supplies observed measurements.",
    ]
    if used_atlas_reference_point:
        caveats.append("Map marker is an atlas reference point because the source record did not provide row-level coordinates.")
    return {
        "schema_version": SCHEMA,
        "city_id": city,
        "record_kind": "event",
        "event_id": item.get("event_id") or f"{city}-milestone-{year}-{slug(title)}-{idx}",
        "title": title,
        "year": year,
        "effective_date": str(date).split("-")[0] if date_precision(date) == "range" else str(date),
        "effective_date_range": str(date) if date_precision(date) == "range" else None,
        "date_precision": date_precision(date),
        "source_date_field": source_date_field,
        "category": category,
        "lens": lens,
        "geometry": provided_geometry,
        "affected_area": {"label": label},
        "source_ids": source_ids[:8],
        "evidence": evidence[:8],
        "confidence": item.get("confidence") or ("documented" if evidence else "inferred"),
        "affected_signals": signals,
        "explanation": explanation,
        "impact_deltas": [],
        "traffic_metrics": None,
        "caveats": [c for c in caveats if c],
        "provenance": {
            "transform": "scripts/build_discovery_city_atlas.py#normalize_seed",
            "source_path": item.get("_source_path") or str(CITY_META[city]["seed_file"].relative_to(ROOT)).replace("\\", "/"),
            "source_record_id": item.get("source_record_id") or item.get("record_id") or primary_evidence.get("record_id"),
            "source_url": item.get("source_url") or primary_evidence.get("url"),
            "source_retrieved_at": item.get("source_retrieved_at") or primary_evidence.get("accessed_at"),
            "source_dataset_id": item.get("source_dataset_id") or (primary_source.get("source_id") if primary_source else None),
            "source_date_field": source_date_field,
            "geometry_source": geometry_source,
            "geometry_precision": geometry_precision,
        },
    }


def normalize_source_event(city: str, source: dict[str, Any], idx: int) -> dict[str, Any]:
    sid = source.get("source_id") or source.get("id") or f"source-{idx}"
    title = source.get("title") or sid
    bucket = source.get("bucket") or "source"
    category, lens, signals = category_and_lens(bucket, title)
    label, lng, lat = point_for(city, f"{title} {bucket} {source.get('spatial_granularity','')}", idx + 10000)
    seeds = source.get("suggested_event_seeds") or []
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
        "impact_deltas": [],
        "traffic_metrics": None,
        "caveats": [source.get("limitations") or "Source-specific completeness and licensing must be reviewed before analytical ETL.", "Current-state source marker: represents a dataset/layer, not a single physical event."],
        "provenance": {"transform": "scripts/build_discovery_city_atlas.py#normalize_source_event", "source_catalog_id": sid},
    }


def load_seeds(city: str) -> list[dict[str, Any]]:
    payload = read_json(CITY_META[city]["seed_file"])
    curated = architecture_events_for_city(city)
    if city == "london":
        return payload.get("events", []) + curated
    return payload.get("chronology_milestones", []) + payload.get("ongoing_event_patterns", []) + curated


def source_to_registry(city: str, source: dict[str, Any]) -> dict[str, Any]:
    sid = source.get("source_id") or source.get("id") or slug(source.get("title", "source"))
    bucket = source.get("bucket") or "source"
    caveat = safe_public_text(source.get("limitations") or "Catalog-level source entry; check the linked publisher record for completeness, licence, and update details before formal reuse.")
    licence = source.get("licence") or "Requires source-level licence review"
    caveats = [caveat]
    if not source.get("retrieved_at"):
        caveats.append("Exact source retrieval date is not recorded in this discovered source catalog entry; review the linked publisher page before formal reuse.")
    if re.search(r"requires source-level review|verify|terms|dataset-specific", str(licence), re.I):
        caveats.append("Licence or terms require source-level review before redistribution or formal analytical reuse.")
    return {
        "source_id": sid,
        "title": source.get("title") or sid,
        "provider": source.get("publisher") or source.get("provider") or "Official/open civic source",
        "source_family": str(bucket).split("/")[0].strip().lower().replace(" ", "_") or "source",
        "url": source.get("access_url") or source.get("url") or "",
        "licence": licence,
        "licence_url": source.get("licence_url") or source.get("license_url") or source.get("url") or source.get("access_url") or "",
        "coverage_years": source.get("coverage_years") if isinstance(source.get("coverage_years"), dict) else {"start": 1700, "end": 2026},
        "update_frequency": source.get("update_frequency") or source.get("temporal_granularity") or source.get("time_coverage") or "Cadence varies by source; verify publisher metadata.",
        "reliability": "usable_with_caveats",
        "source_confidence": "documented",
        "attribution_text": source.get("publisher") or source.get("provider") or "See source page",
        "provenance_notes": f"Bucket: {source.get('bucket','uncategorised')}. Spatial granularity: {source.get('spatial_granularity','not specified')}. Temporal granularity: {source.get('temporal_granularity','not specified')}.",
        "caveats": caveats,
        "raw_metadata_file": source.get("raw_metadata_file"),
        "retrieved_at": source.get("retrieved_at"),
        "accessed_at": source.get("retrieved_at"),
        "registry_reviewed_at": source.get("retrieved_at") or GENERATED_AT,
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
            "availability": "partial_local",
            "years": list(range(1800, 2027)),
            "notes": f"{len(ids)} discovered source(s). Event count contains observed or source-backed event records; source catalog layers stay in sources.json.",
        })
    return families


def build_city(city: str) -> dict[str, Any]:
    meta = CITY_META[city]
    catalog_payload = read_json(meta["catalog_file"])
    source_raw = catalog_payload.get("sources", []) + architecture_sources_for_city(city)
    sources = [source_to_registry(city, s) for s in source_raw]
    source_by_id = {s["source_id"]: raw for s, raw in zip(sources, source_raw)}
    events = []
    for i, item in enumerate(load_seeds(city)):
        events.append(normalize_seed(city, item, i, source_by_id))
    events.sort(key=lambda e: (e["year"], e["event_id"]))

    city_dir = OUT / "cities" / city
    city_dir.mkdir(parents=True, exist_ok=True)
    for stale in city_dir.glob("events_*.json"):
        stale.unlink()
    for stale in city_dir.glob("events_*.geojson"):
        stale.unlink()
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
        chunks.append({"year": year, "event_count": len(year_events), "counts_by_category": dict(Counter(e["category"] for e in year_events)), "counts_by_confidence": dict(Counter(e["confidence"] for e in year_events)), "counts_by_category_confidence": nested_counts(year_events, "category", "confidence"), "json_path": str(json_path.relative_to(ROOT)).replace("\\", "/"), "geojson_path": str(geojson_path.relative_to(ROOT)).replace("\\", "/")})

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
        "data_availability": {"status":"partial_source_backed", "summary": current_state["summary"]},
        "artifact_paths": {
            "city": f"web/data/city-atlas/cities/{city}/city.json",
            "sources": f"web/data/city-atlas/cities/{city}/sources.json",
            "events": f"web/data/city-atlas/cities/{city}/events.json",
            "availability": f"web/data/city-atlas/cities/{city}/availability.json",
            "current_state": f"web/data/city-atlas/cities/{city}/current_state.json",
            **generated_artifact_paths(city, city_dir),
        },
    }
    availability = {"schema_version": SCHEMA, "city_id": city, "generated_at": GENERATED_AT, "summary": city_payload["data_availability"], "matrix": [{"family_id": f["family_id"], "label": f["label"], "availability": f["availability"], "years": f["years"], "source_ids": f["source_ids"], "event_count": sum(1 for e in events if set(e.get("source_ids",[])) & set(f["source_ids"])), "notes": f["notes"]} for f in families], "event_counts_by_year": dict(Counter(str(e["year"]) for e in events)), "event_counts_by_category": counts_by_category}
    events_index = {
        "schema_version": SCHEMA,
        "city_id": city,
        "generated_at": GENERATED_AT,
        "event_count": len(events),
        "event_years": sorted(by_year),
        "chunks": chunks,
        "migration": {
            "source_kind": "data-discovery civic source catalog + event seeds + curated architecture milestones",
            "source_schema_version": None,
            "source_path": str(meta["catalog_file"].relative_to(ROOT)).replace("\\", "/"),
            "source_event_count": len(source_raw) + len(load_seeds(city)),
            "normalized_event_count": len(events),
            "basis": [
                "source_catalog.json",
                "events_seed.json",
                str(ARCHITECTURE_MILESTONES.relative_to(ROOT)).replace("\\", "/"),
            ],
            "notes": [
                "Current-state source-layer records are dataset/layer markers, not physical single-site events.",
                "Curated architecture milestones are named public-source records, not a complete planning or building-control register.",
                "Before/after outcome metrics are not generated unless a source adapter supplies observed measurements.",
            ],
        },
    }
    write_json(city_dir / "city.json", city_payload)
    write_json(city_dir / "sources.json", {"schema_version": SCHEMA, "city_id": city, "generated_at": GENERATED_AT, "source_count": len(sources), "sources": sources})
    write_json(city_dir / "events.json", events_index)
    write_json(city_dir / "availability.json", availability)
    return {"city_id": city, "display_name": meta["display_name"], "event_count": len(events), "source_count": len(sources), "availability_status": "partial_source_backed", "artifact_paths": city_payload["artifact_paths"]}


def main() -> int:
    # Keep existing Belfast artifacts if present; rebuild London/NYC from discovery package.
    index_path = OUT / "index.json"
    old_index = read_json(index_path) if index_path.exists() else {"cities": []}
    summaries = {c["city_id"]: c for c in old_index.get("cities", []) if c.get("city_id") == "belfast"}
    for city in ["london", "nyc"]:
        summaries[city] = build_city(city)
    ordered = [summaries[c] for c in ["belfast", "london", "nyc"] if c in summaries]
    index = {"schema_version": SCHEMA, "generated_at": GENERATED_AT, "default_city_id": "belfast", "city_count": len(ordered), "cities": ordered, "contracts": old_index.get("contracts", {"city_schema":"schemas/city.schema.json","source_schema":"schemas/source.schema.json","event_schema":"schemas/event.schema.json","availability_schema":"schemas/availability.schema.json"})}
    write_json(index_path, index)
    print(f"Discovery atlas ready: " + ", ".join(f"{c['city_id']}={c['event_count']} events/{c['source_count']} sources" for c in ordered))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
