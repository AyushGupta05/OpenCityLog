#!/usr/bin/env python3
"""Fetch source-backed London/NYC public context layers.

The outputs are intentionally conservative: transport stops and current
context/work records with provenance and caveats, not inferred impacts.
"""

from __future__ import annotations

import csv
import io
import json
import math
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CITY_DIR = ROOT / "web" / "data" / "city-atlas" / "cities"
LONDON_DIR = CITY_DIR / "london"
NYC_DIR = CITY_DIR / "nyc"

LONDON_BOUNDS = (-0.5103, 51.2868, 0.3340, 51.6919)
NYC_BOUNDS = (-74.2591, 40.4774, -73.7004, 40.9176)

USER_AGENT = "Bims-5 public context ETL/1.0 (source-backed urban changelog)"
TIMEOUT = 90

GENERATED_EVENT_PREFIXES = {
    "london": (
        "lon_public_context_economy_",
        "lon_public_context_utility_",
        "lon_public_context_civic_",
    ),
    "nyc": (
        "nyc_public_context_economy_",
        "nyc_public_context_utility_",
    ),
}

TFL_LICENSE = "Transport for London Open Data terms"
TFL_LICENSE_URL = "https://tfl.gov.uk/corporate/terms-and-conditions/transport-data-service"
MTA_LICENSE = "MTA Developer Data Terms and Conditions"
MTA_LICENSE_URL = "https://new.mta.info/developers/terms-and-conditions"
NYC_OPEN_DATA_TERMS = "NYC Open Data Terms of Use"
NYC_OPEN_DATA_TERMS_URL = "https://opendata.cityofnewyork.us/overview/#termsofuse"
OGL3 = "Open Government Licence v3.0"
OGL3_URL = "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
GIAS_DOWNLOAD_BASE = "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public"
GIAS_PORTAL_URL = "https://www.get-information-schools.service.gov.uk/Downloads"

FAMILY_YEAR_DEFAULTS = {
    "transport": [2026],
    "economy": [2024, 2026],
    "utilities": list(range(2013, 2027)),
    "civic_services": list(range(2007, 2027)),
}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def today_utc() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2, sort_keys=False)
    tmp_path = path.with_name(f"{path.name}.tmp")
    last_error: Exception | None = None
    for attempt in range(20):
        try:
            tmp_path.write_text(text + "\n", encoding="utf-8")
            tmp_path.replace(path)
            return
        except OSError as exc:  # pragma: no cover - Windows file handle resilience
            last_error = exc
            try:
                if tmp_path.exists():
                    tmp_path.unlink()
            except OSError:
                pass
            time.sleep(min(3.0, 0.25 * (attempt + 1)))
    raise RuntimeError(f"Failed to write {path}: {last_error}")


def request(url: str, *, accept: str | None = None) -> urllib.request.Request:
    headers = {"User-Agent": USER_AGENT}
    if accept:
        headers["Accept"] = accept
    return urllib.request.Request(url, headers=headers)


def fetch_bytes(url: str, *, attempts: int = 3) -> bytes:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request(url), timeout=TIMEOUT) as response:
                return response.read()
        except Exception as exc:  # pragma: no cover - network resilience
            last_error = exc
            if attempt + 1 < attempts:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def fetch_json(url: str, *, attempts: int = 3) -> Any:
    payload = fetch_bytes(url, attempts=attempts)
    return json.loads(payload.decode("utf-8-sig"))


def url_with_params(base: str, params: dict[str, Any]) -> str:
    clean = {k: v for k, v in params.items() if v is not None}
    return f"{base}?{urllib.parse.urlencode(clean)}"


def in_bounds(lon: float | None, lat: float | None, bounds: tuple[float, float, float, float]) -> bool:
    if lon is None or lat is None:
        return False
    min_lon, min_lat, max_lon, max_lat = bounds
    return min_lon <= lon <= max_lon and min_lat <= lat <= max_lat


def slug(value: Any, fallback: str = "record") -> str:
    text = re.sub(r"[^a-z0-9]+", "-", str(value or "").lower()).strip("-")
    return text or fallback


def clean_str(value: Any) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def shorten(value: str, max_length: int = 220) -> str:
    text = clean_str(value)
    if len(text) <= max_length:
        return text
    return text[: max_length - 3].rstrip(" ,;:.") + "..."


def first_present(props: dict[str, Any], keys: list[str], default: str = "") -> str:
    for key in keys:
        value = clean_str(props.get(key))
        if value:
            return value
    return default


def remove_crs(feature_or_geometry: Any) -> Any:
    if isinstance(feature_or_geometry, dict):
        feature_or_geometry.pop("crs", None)
        if feature_or_geometry.get("type") == "Feature":
            remove_crs(feature_or_geometry.get("geometry"))
        elif feature_or_geometry.get("type") == "FeatureCollection":
            for feature in feature_or_geometry.get("features", []):
                remove_crs(feature)
    return feature_or_geometry


def feature_collection(features: list[dict[str, Any]], metadata: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "FeatureCollection",
        "schema_version": "1.0.0",
        "metadata": metadata,
        "features": features,
    }


def event_feature_collection(city_id: str, year: int, events: list[dict[str, Any]]) -> dict[str, Any]:
    features = []
    for event in events:
        geometry = event.get("geometry")
        if not geometry:
            continue
        props = {k: v for k, v in event.items() if k != "geometry"}
        features.append({"type": "Feature", "geometry": geometry, "properties": props})
    return {
        "type": "FeatureCollection",
        "schema_version": "1.0.0",
        "city_id": city_id,
        "year": year,
        "features": features,
    }


def geometry_type(geometry: dict[str, Any] | None) -> str:
    if not isinstance(geometry, dict):
        return "unknown"
    return str(geometry.get("type") or "unknown")


def point_from_feature(feature: dict[str, Any]) -> tuple[float | None, float | None]:
    geometry = feature.get("geometry") or {}
    if geometry.get("type") != "Point":
        return None, None
    coordinates = geometry.get("coordinates") or []
    if len(coordinates) < 2:
        return None, None
    try:
        return float(coordinates[0]), float(coordinates[1])
    except (TypeError, ValueError):
        return None, None


def source_evidence(
    source_id: str,
    label: str,
    url: str,
    record_id: str,
    accessed_at: str,
    *,
    kind: str = "source_record",
) -> dict[str, Any]:
    return {
        "source_id": source_id,
        "label": label,
        "kind": kind,
        "url": url,
        "record_id": record_id,
        "accessed_at": accessed_at,
    }


def provenance(
    source_id: str,
    source_url: str,
    record_id: str,
    accessed_at: str,
    source_date_field: str,
    geometry_source: str,
    geometry_precision: str,
    *,
    transform: str = "scripts/build_london_nyc_public_context.py",
) -> dict[str, Any]:
    return {
        "transform": transform,
        "source_path": "remote public API/download",
        "source_id": source_id,
        "source_url": source_url,
        "source_record_id": record_id,
        "source_retrieved_at": accessed_at,
        "source_date_field": source_date_field,
        "geometry_source": geometry_source,
        "geometry_precision": geometry_precision,
    }


def build_source_record(
    *,
    source_id: str,
    title: str,
    publisher: str,
    source_family: str,
    city_ids: list[str],
    url: str,
    license_name: str,
    license_url: str,
    accessed_at: str,
    source_type: str,
    update_frequency: str,
    fields_available: list[str],
    geometry_type_value: str,
    temporal_coverage: str,
    coverage_years: list[int],
    limitations: list[str],
    attribution: str,
) -> dict[str, Any]:
    return {
        "source_id": source_id,
        "title": title,
        "provider": publisher,
        "publisher": publisher,
        "source_family": source_family,
        "city_ids": city_ids,
        "url": url,
        "source_url": url,
        "licence": license_name,
        "license": license_name,
        "licence_url": license_url,
        "license_url": license_url,
        "attribution": attribution,
        "attribution_text": attribution,
        "accessed_at": accessed_at,
        "source_type": source_type,
        "update_frequency": update_frequency,
        "fields_available": fields_available,
        "expected_geometry_type": geometry_type_value,
        "temporal_coverage": temporal_coverage,
        "coverage_years": {
            "start": min(coverage_years),
            "end": max(coverage_years),
            "observed": coverage_years,
        },
        "reliability": "usable_with_caveats",
        "source_confidence": "documented",
        "provenance_notes": (
            "Retrieved from the public source URL by scripts/build_london_nyc_public_context.py. "
            "Records are used as source-backed context or permit evidence only, with limitations carried into emitted events."
        ),
        "caveats": limitations,
        "limitations": limitations,
    }


def build_london_transport_stops(retrieved_at: str, accessed_at: str) -> list[dict[str, Any]]:
    modes = [
        "bus",
        "tube",
        "dlr",
        "elizabeth-line",
        "overground",
        "tram",
        "national-rail",
        "river-bus",
        "river-tour",
        "coach",
    ]
    records: dict[str, dict[str, Any]] = {}
    for mode in modes:
        page = 1
        while True:
            params = {"page": page} if mode == "bus" else {}
            url = url_with_params(f"https://api.tfl.gov.uk/StopPoint/Mode/{mode}", params)
            try:
                data = fetch_json(url)
            except Exception as exc:
                print(f"[warn] TfL StopPoint mode {mode} page {page} skipped: {exc}")
                break
            stops = data.get("stopPoints") if isinstance(data, dict) else data
            if not stops:
                break
            for stop in stops:
                lon = stop.get("lon")
                lat = stop.get("lat")
                try:
                    lon_f = float(lon)
                    lat_f = float(lat)
                except (TypeError, ValueError):
                    continue
                if not in_bounds(lon_f, lat_f, LONDON_BOUNDS):
                    continue
                naptan_id = clean_str(stop.get("naptanId") or stop.get("id"))
                if not naptan_id:
                    continue
                record = records.setdefault(
                    naptan_id,
                    {
                        "source_id": f"tfl-stoppoint:{naptan_id}",
                        "stable_source_id": naptan_id,
                        "source_record_id": naptan_id,
                        "name": clean_str(stop.get("commonName") or stop.get("name")),
                        "modes": set(),
                        "serving_lines": set(),
                        "lat": lat_f,
                        "lon": lon_f,
                        "stop_type": clean_str(stop.get("stopType")),
                    },
                )
                record["modes"].update(stop.get("modes") or [mode])
                for line in stop.get("lines") or []:
                    line_label = clean_str(line.get("id") or line.get("name"))
                    if line_label:
                        record["serving_lines"].add(line_label)
                for group in stop.get("lineModeGroups") or []:
                    for line_id in group.get("lineIdentifier") or []:
                        if clean_str(line_id):
                            record["serving_lines"].add(clean_str(line_id))
            if mode != "bus":
                break
            total = int(data.get("total") or 0)
            page_size = int(data.get("pageSize") or len(stops) or 1000)
            if page * page_size >= total:
                break
            page += 1

    features: list[dict[str, Any]] = []
    mode_order = {
        "tube": 0,
        "elizabeth-line": 1,
        "dlr": 2,
        "overground": 3,
        "national-rail": 4,
        "tram": 5,
        "bus": 6,
        "coach": 7,
        "river-bus": 8,
        "river-tour": 9,
    }
    for naptan_id, record in records.items():
        modes_sorted = sorted(record["modes"], key=lambda item: (mode_order.get(item, 99), item))
        serving_lines = sorted(record["serving_lines"])
        record_url = f"https://api.tfl.gov.uk/StopPoint/{urllib.parse.quote(naptan_id)}"
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [record["lon"], record["lat"]]},
                "properties": {
                    "source_id": record["source_id"],
                    "stable_source_id": record["stable_source_id"],
                    "source_record_id": record["source_record_id"],
                    "name": record["name"],
                    "mode": modes_sorted[0] if modes_sorted else "unknown",
                    "modes": modes_sorted,
                    "stop_type": record["stop_type"],
                    "servingLineCount": len(serving_lines),
                    "servingLines": serving_lines[:80],
                    "route_count_available": bool(serving_lines),
                    "sourceFamilies": ["transport", "current_context"],
                    "sourceName": "TfL StopPoint API",
                    "publisher": "Transport for London",
                    "sourceUrl": record_url,
                    "license": TFL_LICENSE,
                    "licenseUrl": TFL_LICENSE_URL,
                    "retrievedAt": retrieved_at,
                    "accessedAt": accessed_at,
                    "sourceUpdated": None,
                    "geometrySource": "TfL StopPoint longitude/latitude",
                    "confidence": "documented",
                    "limitations": [
                        "Current public transport stop context; it may post-date selected historical replay years.",
                        "Serving line counts use TfL StopPoint line metadata where present and are not service frequency or reliability evidence.",
                    ],
                },
            }
        )
    features.sort(key=lambda feature: (feature["properties"]["mode"], feature["properties"]["name"], feature["properties"]["source_id"]))
    return features


def read_zip_csv(zip_file: zipfile.ZipFile, filename: str) -> list[dict[str, str]]:
    try:
        with zip_file.open(filename) as fh:
            text = io.TextIOWrapper(fh, encoding="utf-8-sig", newline="")
            return list(csv.DictReader(text))
    except KeyError:
        return []


def build_mta_feed_features(feed: dict[str, str], payload: bytes, retrieved_at: str, accessed_at: str) -> list[dict[str, Any]]:
    features: list[dict[str, Any]] = []
    with zipfile.ZipFile(io.BytesIO(payload)) as zf:
        stops = read_zip_csv(zf, "stops.txt")
        routes = {row.get("route_id", ""): (row.get("route_short_name") or row.get("route_long_name") or row.get("route_id") or "") for row in read_zip_csv(zf, "routes.txt")}
        trips_route: dict[str, str] = {}
        try:
            with zf.open("trips.txt") as fh:
                reader = csv.DictReader(io.TextIOWrapper(fh, encoding="utf-8-sig", newline=""))
                for row in reader:
                    trip_id = row.get("trip_id")
                    route_id = row.get("route_id")
                    if trip_id:
                        trips_route[trip_id] = clean_str(routes.get(route_id or "", route_id or ""))
        except KeyError:
            pass
        stop_routes: dict[str, set[str]] = defaultdict(set)
        try:
            with zf.open("stop_times.txt") as fh:
                reader = csv.DictReader(io.TextIOWrapper(fh, encoding="utf-8-sig", newline=""))
                for row in reader:
                    stop_id = row.get("stop_id")
                    route_label = trips_route.get(row.get("trip_id") or "")
                    if stop_id and route_label:
                        stop_routes[stop_id].add(route_label)
        except KeyError:
            pass
        feed_info = read_zip_csv(zf, "feed_info.txt")
        feed_version = first_present(feed_info[0], ["feed_version", "feed_start_date", "feed_end_date"], "") if feed_info else ""

    for stop in stops:
        try:
            lon = float(stop.get("stop_lon") or "")
            lat = float(stop.get("stop_lat") or "")
        except (TypeError, ValueError):
            continue
        if not in_bounds(lon, lat, NYC_BOUNDS):
            continue
        stop_id = clean_str(stop.get("stop_id"))
        if not stop_id:
            continue
        route_labels = sorted(stop_routes.get(stop_id, set()))
        source_record_id = f"{feed['feed_id']}:{stop_id}"
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "source_id": f"mta-gtfs:{source_record_id}",
                    "stable_source_id": source_record_id,
                    "source_record_id": source_record_id,
                    "name": clean_str(stop.get("stop_name")),
                    "mode": feed["mode"],
                    "modes": [feed["mode"]],
                    "stop_type": "GTFS stop/station",
                    "parent_station": clean_str(stop.get("parent_station")) or None,
                    "servingLineCount": len(route_labels),
                    "servingLines": route_labels[:80],
                    "route_count_available": bool(route_labels),
                    "sourceFamilies": ["transport", "current_context"],
                    "sourceName": f"MTA GTFS static feed: {feed['title']}",
                    "publisher": "Metropolitan Transportation Authority",
                    "sourceUrl": feed["url"],
                    "license": MTA_LICENSE,
                    "licenseUrl": MTA_LICENSE_URL,
                    "retrievedAt": retrieved_at,
                    "accessedAt": accessed_at,
                    "sourceUpdated": feed_version or None,
                    "geometrySource": "MTA GTFS stops.txt stop_lon/stop_lat",
                    "confidence": "documented",
                    "limitations": [
                        "Current GTFS static stop context; it may post-date selected historical replay years.",
                        "Route counts are derived from GTFS trips/stop_times and are not service frequency, travel speed, or reliability evidence.",
                    ],
                },
            }
        )
    return features


def build_nyc_transport_stops(retrieved_at: str, accessed_at: str) -> list[dict[str, Any]]:
    feeds = [
        {
            "feed_id": "subway",
            "title": "Subway",
            "mode": "subway",
            "url": "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip",
        },
        {"feed_id": "bus_brooklyn", "title": "Brooklyn buses", "mode": "bus", "url": "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_b.zip"},
        {"feed_id": "bus_bronx", "title": "Bronx buses", "mode": "bus", "url": "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_bx.zip"},
        {"feed_id": "bus_manhattan", "title": "Manhattan buses", "mode": "bus", "url": "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_m.zip"},
        {"feed_id": "bus_queens", "title": "Queens buses", "mode": "bus", "url": "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_q.zip"},
        {"feed_id": "bus_staten_island", "title": "Staten Island buses", "mode": "bus", "url": "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_si.zip"},
        {"feed_id": "bus_company", "title": "MTA Bus Company", "mode": "bus", "url": "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_busco.zip"},
        {"feed_id": "lirr", "title": "Long Island Rail Road", "mode": "rail", "url": "http://web.mta.info/developers/data/lirr/google_transit.zip"},
        {"feed_id": "metro_north", "title": "Metro-North Railroad", "mode": "rail", "url": "http://web.mta.info/developers/data/mnr/google_transit.zip"},
    ]
    features: list[dict[str, Any]] = []
    seen: set[str] = set()
    for feed in feeds:
        try:
            payload = fetch_bytes(feed["url"])
            feed_features = build_mta_feed_features(feed, payload, retrieved_at, accessed_at)
        except Exception as exc:
            print(f"[warn] MTA feed {feed['feed_id']} skipped: {exc}")
            continue
        for feature in feed_features:
            key = feature["properties"]["source_id"]
            if key in seen:
                continue
            seen.add(key)
            features.append(feature)
    features.sort(key=lambda feature: (feature["properties"]["mode"], feature["properties"]["name"], feature["properties"]["source_id"]))
    return features


def fetch_arcgis_layer(layer_id: int) -> list[dict[str, Any]]:
    base = f"https://gis.london.gov.uk/arcgis/rest/services/apps/Busyness_context/MapServer/{layer_id}/query"
    features: list[dict[str, Any]] = []
    offset = 0
    while True:
        url = url_with_params(
            base,
            {
                "where": "1=1",
                "outFields": "*",
                "returnGeometry": "true",
                "f": "geojson",
                "outSR": "4326",
                "resultRecordCount": 2000,
                "resultOffset": offset,
            },
        )
        data = fetch_json(url)
        batch = data.get("features") or []
        for feature in batch:
            remove_crs(feature)
            features.append(feature)
        if len(batch) < 2000 and not data.get("exceededTransferLimit"):
            break
        offset += len(batch)
        if not batch:
            break
    return features


def arcgis_record_url(layer_id: int, id_field: str, value: Any) -> str:
    where = f"{id_field}='{str(value).replace(chr(39), chr(39) + chr(39))}'"
    return url_with_params(
        f"https://gis.london.gov.uk/arcgis/rest/services/apps/Busyness_context/MapServer/{layer_id}/query",
        {
            "where": where,
            "outFields": "*",
            "returnGeometry": "true",
            "f": "geojson",
            "outSR": "4326",
        },
    )


def context_event(
    *,
    city_id: str,
    event_id: str,
    title: str,
    summary: str,
    year: int,
    category: str,
    lens: str,
    geometry: dict[str, Any],
    source_id: str,
    source_label: str,
    source_url: str,
    source_record_id: str,
    accessed_at: str,
    source_date_field: str,
    geometry_source: str,
    geometry_precision: str,
    affected_area: str,
    affected_signals: list[str],
    caveats: list[str],
    confidence: str = "documented",
    effective_date: str | None = None,
    date_precision_value: str = "year",
) -> dict[str, Any]:
    return {
        "schema_version": "1.0.0",
        "city_id": city_id,
        "record_kind": "event",
        "event_id": event_id,
        "title": title,
        "short_description": shorten(summary),
        "year": year,
        "effective_date": effective_date or str(year),
        "date_precision": date_precision_value,
        "source_date_field": source_date_field,
        "category": category,
        "lens": lens,
        "geometry": geometry,
        "affected_area": {"label": affected_area},
        "source_ids": [source_id],
        "evidence": [source_evidence(source_id, source_label, source_url, source_record_id, accessed_at)],
        "confidence": confidence,
        "affected_signals": affected_signals,
        "explanation": summary,
        "impact_deltas": [],
        "traffic_metrics": None,
        "caveats": caveats,
        "provenance": provenance(
            source_id,
            source_url,
            source_record_id,
            accessed_at,
            source_date_field,
            geometry_source,
            geometry_precision,
        ),
    }


def build_london_economy_context(retrieved_at: str, accessed_at: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    contexts = [
        {
            "layer_id": 1,
            "kind": "bid",
            "name_field": "bid_name",
            "id_field": "bid_id",
            "label": "Business Improvement District",
            "signals": ["economy", "commercial", "business-improvement-district"],
        },
        {
            "layer_id": 3,
            "kind": "high_street",
            "name_field": "highstreet_name",
            "id_field": "highstreet_id",
            "label": "High street",
            "signals": ["economy", "commercial", "retail", "high-street"],
        },
        {
            "layer_id": 5,
            "kind": "town_centre",
            "name_field": "tc_name",
            "id_field": "tc_id",
            "label": "Town centre",
            "signals": ["economy", "commercial", "retail", "town-centre"],
        },
    ]
    output_features: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    for context in contexts:
        try:
            features = fetch_arcgis_layer(context["layer_id"])
        except Exception as exc:
            print(f"[warn] London economy layer {context['layer_id']} skipped: {exc}")
            continue
        for idx, feature in enumerate(features):
            props = feature.get("properties") or {}
            geometry = remove_crs(feature.get("geometry") or {})
            if not geometry:
                continue
            record_id = first_present(props, [context["id_field"], "objectid", "OBJECTID"], f"{context['kind']}-{idx}")
            name = first_present(props, [context["name_field"], "name", "NAME"], f"London {context['label']} {record_id}")
            record_url = arcgis_record_url(context["layer_id"], context["id_field"], record_id)
            output_props = dict(props)
            output_props.update(
                {
                    "source_id": f"gla-busyness-context:{context['kind']}:{record_id}",
                    "stable_source_id": str(record_id),
                    "source_record_id": str(record_id),
                    "name": name,
                    "context_type": context["kind"],
                    "category": "economy",
                    "lens": "economy",
                    "sourceName": "GLA Busyness Context boundary layers",
                    "publisher": "Greater London Authority",
                    "sourceUrl": record_url,
                    "license": OGL3,
                    "licenseUrl": OGL3_URL,
                    "retrievedAt": retrieved_at,
                    "accessedAt": accessed_at,
                    "geometrySource": "GLA Busyness Context boundary geometry",
                    "confidence": "documented",
                    "limitations": [
                        "Current commercial-place context, not evidence that the place changed in the selected year.",
                        "Not footfall, vacancy, turnover, frontage survey, or economic impact evidence.",
                    ],
                }
            )
            output_features.append({"type": "Feature", "geometry": geometry, "properties": output_props})
            for year in (2024, 2026):
                events.append(
                    context_event(
                        city_id="london",
                        event_id=f"lon_public_context_economy_{context['kind']}_{slug(record_id)}_{year}",
                        title=f"{context['label']} context: {name}",
                        summary=(
                            f"GLA records {name} as {context['label'].lower()} commercial context. "
                            "This supports economy land-use and destination context only; no economic impact is inferred."
                        ),
                        year=year,
                        category="economy",
                        lens="economy",
                        geometry=geometry,
                        source_id="gla-busyness-context-boundaries",
                        source_label="GLA Busyness Context boundary record",
                        source_url=record_url,
                        source_record_id=str(record_id),
                        accessed_at=accessed_at,
                        source_date_field="current public boundary layer at access date",
                        geometry_source="GLA public boundary geometry",
                        geometry_precision="official source boundary polygon; not a parcel, footfall, vacancy, or outcome measure",
                        affected_area=name,
                        affected_signals=context["signals"],
                        caveats=[
                            "Current context is shown for the selected replay year and is not evidence that this boundary changed in that year.",
                            "No footfall, vacancy, turnover, commercial performance, or causal effect is inferred.",
                        ],
                    )
                )
    output_features.sort(key=lambda f: (f["properties"]["context_type"], f["properties"]["name"], f["properties"]["source_record_id"]))
    events.sort(key=lambda e: (e["year"], e["event_id"]))
    return output_features, events


def fetch_latest_gias_csv(accessed_at: str) -> tuple[str, str, str]:
    start = date.fromisoformat(accessed_at)
    errors: list[str] = []
    for offset in range(15):
        candidate = start - timedelta(days=offset)
        stamp = candidate.strftime("%Y%m%d")
        url = f"{GIAS_DOWNLOAD_BASE}/edubasealldata{stamp}.csv"
        try:
            with urllib.request.urlopen(request(url, accept="text/csv"), timeout=TIMEOUT) as response:
                payload = response.read()
            return stamp, url, payload.decode("utf-8-sig", errors="replace")
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                continue
            errors.append(f"{stamp}: HTTP {exc.code}")
        except Exception as exc:  # pragma: no cover - network resilience
            errors.append(f"{stamp}: {exc}")
    suffix = f" ({'; '.join(errors[-3:])})" if errors else ""
    raise RuntimeError(f"Failed to fetch a recent GIAS edubasealldata CSV{suffix}")


def parse_gias_date(value: Any) -> date | None:
    text = clean_str(value)
    if not text:
        return None
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def iso_date(value: date | None) -> str | None:
    return value.isoformat() if value else None


def clean_int(value: Any) -> int | None:
    text = clean_str(value).replace(",", "")
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def epsg27700_to_wgs84(easting: float, northing: float) -> tuple[float, float]:
    # British National Grid (OSGB36 / EPSG:27700) to WGS84 without adding a heavy dependency.
    a = 6377563.396
    b = 6356256.909
    f0 = 0.9996012717
    lat0 = math.radians(49.0)
    lon0 = math.radians(-2.0)
    n0 = -100000.0
    e0 = 400000.0
    e2 = 1.0 - (b * b) / (a * a)
    n = (a - b) / (a + b)

    lat = lat0
    meridional_arc = 0.0
    while northing - n0 - meridional_arc >= 0.00001:
        lat = lat + (northing - n0 - meridional_arc) / (a * f0)
        ma = (1 + n + (5 / 4) * n**2 + (5 / 4) * n**3) * (lat - lat0)
        mb = (3 * n + 3 * n**2 + (21 / 8) * n**3) * math.sin(lat - lat0) * math.cos(lat + lat0)
        mc = ((15 / 8) * n**2 + (15 / 8) * n**3) * math.sin(2 * (lat - lat0)) * math.cos(2 * (lat + lat0))
        md = (35 / 24) * n**3 * math.sin(3 * (lat - lat0)) * math.cos(3 * (lat + lat0))
        meridional_arc = b * f0 * (ma - mb + mc - md)

    sin_lat = math.sin(lat)
    cos_lat = math.cos(lat)
    tan_lat = math.tan(lat)
    nu = a * f0 / math.sqrt(1 - e2 * sin_lat * sin_lat)
    rho = a * f0 * (1 - e2) / ((1 - e2 * sin_lat * sin_lat) ** 1.5)
    eta2 = nu / rho - 1
    sec_lat = 1 / cos_lat
    d_e = easting - e0

    vii = tan_lat / (2 * rho * nu)
    viii = tan_lat / (24 * rho * nu**3) * (5 + 3 * tan_lat**2 + eta2 - 9 * tan_lat**2 * eta2)
    ix = tan_lat / (720 * rho * nu**5) * (61 + 90 * tan_lat**2 + 45 * tan_lat**4)
    x = sec_lat / nu
    xi = sec_lat / (6 * nu**3) * (nu / rho + 2 * tan_lat**2)
    xii = sec_lat / (120 * nu**5) * (5 + 28 * tan_lat**2 + 24 * tan_lat**4)
    xiia = sec_lat / (5040 * nu**7) * (61 + 662 * tan_lat**2 + 1320 * tan_lat**4 + 720 * tan_lat**6)

    lat_osgb = lat - vii * d_e**2 + viii * d_e**4 - ix * d_e**6
    lon_osgb = lon0 + x * d_e - xi * d_e**3 + xii * d_e**5 - xiia * d_e**7

    def to_cartesian(phi: float, lam: float, height: float, semi_major: float, semi_minor: float) -> tuple[float, float, float]:
        eccentricity2 = 1 - (semi_minor * semi_minor) / (semi_major * semi_major)
        nu_value = semi_major / math.sqrt(1 - eccentricity2 * math.sin(phi) ** 2)
        x_value = (nu_value + height) * math.cos(phi) * math.cos(lam)
        y_value = (nu_value + height) * math.cos(phi) * math.sin(lam)
        z_value = ((1 - eccentricity2) * nu_value + height) * math.sin(phi)
        return x_value, y_value, z_value

    x1, y1, z1 = to_cartesian(lat_osgb, lon_osgb, 0.0, a, b)
    tx, ty, tz = 446.448, -125.157, 542.060
    rx = math.radians(0.1502 / 3600)
    ry = math.radians(0.2470 / 3600)
    rz = math.radians(0.8421 / 3600)
    scale = 1 + 20.4894e-6
    x2 = tx + x1 * scale - y1 * rz + z1 * ry
    y2 = ty + x1 * rz + y1 * scale - z1 * rx
    z2 = tz - x1 * ry + y1 * rx + z1 * scale

    wgs84_a = 6378137.0
    wgs84_b = 6356752.3141
    e2_wgs84 = 1 - (wgs84_b * wgs84_b) / (wgs84_a * wgs84_a)
    lon = math.atan2(y2, x2)
    p = math.sqrt(x2 * x2 + y2 * y2)
    lat_wgs = math.atan2(z2, p * (1 - e2_wgs84))
    for _ in range(8):
        nu_wgs = wgs84_a / math.sqrt(1 - e2_wgs84 * math.sin(lat_wgs) ** 2)
        lat_wgs = math.atan2(z2 + e2_wgs84 * nu_wgs * math.sin(lat_wgs), p)
    return math.degrees(lon), math.degrees(lat_wgs)


def gias_active_in_year(open_date: date | None, close_date: date | None, status: str, year: int) -> bool:
    status_l = status.lower()
    year_start = date(year, 1, 1)
    year_end = date(year, 12, 31)
    if open_date:
        if open_date > year_end:
            return False
        if close_date and close_date < year_start:
            return False
        if status_l.startswith("closed") and not close_date:
            return False
        return True
    return year == 2026 and status_l.startswith("open")


def gias_rank(row: dict[str, str]) -> float:
    text = " ".join(
        clean_str(row.get(key)).lower()
        for key in ("EstablishmentName", "TypeOfEstablishment (name)", "EstablishmentTypeGroup (name)", "PhaseOfEducation (name)")
    )
    if "university" in text:
        return 3.4
    if "college" in text or "16 plus" in text:
        return 3.0
    if "secondary" in text or "all-through" in text:
        return 2.5
    if "primary" in text:
        return 2.1
    if "nursery" in text or "children" in text:
        return 1.8
    return 1.6


def build_london_civic_gias_context(retrieved_at: str, accessed_at: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    source_stamp, source_url, text = fetch_latest_gias_csv(accessed_at)
    source_date = datetime.strptime(source_stamp, "%Y%m%d").date().isoformat()
    output_features: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    rejected = Counter()
    reader = csv.DictReader(io.StringIO(text))
    for row_index, row in enumerate(reader, start=2):
        if clean_str(row.get("GOR (name)")) != "London":
            continue
        urn = clean_str(row.get("URN"))
        if not urn:
            rejected["missing_urn"] += 1
            continue
        try:
            easting = float(clean_str(row.get("Easting")))
            northing = float(clean_str(row.get("Northing")))
        except ValueError:
            rejected["missing_geometry"] += 1
            continue
        lon, lat = epsg27700_to_wgs84(easting, northing)
        if not in_bounds(lon, lat, LONDON_BOUNDS):
            rejected["outside_london_bounds"] += 1
            continue

        geometry = {"type": "Point", "coordinates": [round(lon, 7), round(lat, 7)]}
        name = clean_str(row.get("EstablishmentName")) or f"GIAS establishment {urn}"
        status = clean_str(row.get("EstablishmentStatus (name)")) or "Not recorded"
        open_date = parse_gias_date(row.get("OpenDate"))
        close_date = parse_gias_date(row.get("CloseDate"))
        census_date = parse_gias_date(row.get("CensusDate"))
        phase = clean_str(row.get("PhaseOfEducation (name)")) or "Not recorded"
        establishment_type = clean_str(row.get("TypeOfEstablishment (name)")) or "Not recorded"
        group = clean_str(row.get("EstablishmentTypeGroup (name)")) or "Not recorded"
        local_authority = clean_str(row.get("LA (name)")) or "London"
        record_id = f"URN {urn}; edubasealldata{source_stamp}.csv row {row_index}"
        record_url = f"https://www.get-information-schools.service.gov.uk/Establishments/Establishment/Details/{urllib.parse.quote(urn)}"
        pupils = clean_int(row.get("NumberOfPupils"))
        capacity = clean_int(row.get("SchoolCapacity"))
        rank = gias_rank(row)
        caveats = [
            "GIAS is an establishment register; it is not an official school catchment, service-capacity surface, or evidence of educational outcomes.",
            "OpenDate/CloseDate record establishment status dates, not construction start, building completion, or first occupation unless separately corroborated.",
            "Independent, specialist, and post-16 establishments may be present; service access or eligibility is not inferred.",
        ]
        feature_props = {
            "id": f"london-gias-civic-service-{urn}",
            "layer": "civic_service_anchor",
            "category": "civic_services",
            "sublayer_id": "civic_services",
            "service_type": "civic_services",
            "label": name,
            "name": name,
            "color": "#178f8f",
            "rank": rank,
            "source_id": f"gias-establishment:{urn}",
            "stable_source_id": urn,
            "source_record_id": record_id,
            "source_name": "Get Information About Schools establishment extract",
            "sourceName": "Get Information About Schools establishment extract",
            "publisher": "Department for Education",
            "source_type": "daily public establishment-register CSV",
            "sourceUrl": record_url,
            "bulkDownloadUrl": source_url,
            "license": OGL3,
            "licenseUrl": OGL3_URL,
            "accessed_at": accessed_at,
            "accessedAt": accessed_at,
            "retrievedAt": retrieved_at,
            "sourceUpdated": source_date,
            "geometry_source": "GIAS Easting/Northing converted from British National Grid to WGS84",
            "geometrySource": "GIAS Easting/Northing converted from British National Grid to WGS84",
            "geometry_precision": "GIAS establishment point; not a building footprint, catchment, or capacity area",
            "transformation_method": "Filtered GIAS rows to London, removed personal/contact fields, converted EPSG:27700 easting/northing to WGS84, and emitted education-service context with source dates and caveats.",
            "confidence": "documented",
            "establishment_status": status,
            "open_date": iso_date(open_date),
            "close_date": iso_date(close_date),
            "census_date": iso_date(census_date),
            "phase_of_education": phase,
            "establishment_type": establishment_type,
            "establishment_type_group": group,
            "local_authority": local_authority,
            "number_of_pupils": pupils,
            "school_capacity": capacity,
            "pupil_capacity_context": "Current/source snapshot only; not historical demand unless the source census date matches the selected year.",
            "caveat": " ".join(caveats),
            "limitations": caveats,
        }
        if status.lower().startswith("open"):
            output_features.append({"type": "Feature", "geometry": geometry, "properties": feature_props})

        for year in range(2007, 2027):
            if not gias_active_in_year(open_date, close_date, status, year):
                continue
            event_caveats = list(caveats)
            if not open_date:
                event_caveats.append("No OpenDate is present, so this row is emitted only as current context for the retrieval year.")
            summary = (
                f"DfE GIAS records {name} in {local_authority} as {establishment_type} ({phase}), "
                f"status {status}. This is education/civic-service context only; no catchment, demand, capacity, or outcome claim is inferred."
            )
            events.append(
                context_event(
                    city_id="london",
                    event_id=f"lon_public_context_civic_gias_{slug(urn)}_{year}",
                    title=f"Education service context: {name}",
                    summary=summary,
                    year=year,
                    category="civic_services",
                    lens="civic_services",
                    geometry=geometry,
                    source_id="dfe-gias-public-establishment-context",
                    source_label="DfE GIAS establishment record",
                    source_url=record_url,
                    source_record_id=record_id,
                    accessed_at=accessed_at,
                    source_date_field="OpenDate/CloseDate/EstablishmentStatus (name)/CensusDate",
                    geometry_source="GIAS Easting/Northing converted from British National Grid to WGS84",
                    geometry_precision="GIAS establishment point; not a building footprint, catchment, demand surface, or capacity area",
                    affected_area=f"{local_authority}: {name}",
                    affected_signals=["civic_services", "education", "school", slug(phase), slug(establishment_type)],
                    caveats=event_caveats,
                )
            )

    output_features.sort(key=lambda f: (f["properties"]["local_authority"], f["properties"]["name"], f["properties"]["stable_source_id"]))
    events.sort(key=lambda e: (e["year"], e["event_id"]))
    metadata = {
        "title": "London civic education-service context",
        "publisher": "Department for Education",
        "source_url": source_url,
        "portal_url": GIAS_PORTAL_URL,
        "license": OGL3,
        "license_url": OGL3_URL,
        "retrieved_at": retrieved_at,
        "accessed_at": accessed_at,
        "source_updated": source_date,
        "feature_count": len(output_features),
        "event_count": len(events),
        "rejected_counts": dict(sorted(rejected.items())),
        "limitations": [
            "Current open establishment anchors may post-date selected historical replay years.",
            "Historical active-year context is emitted only where GIAS OpenDate/CloseDate/status fields support it.",
            "Not an official catchment, entitlement, service-capacity, demand, building-completion, or educational-outcome dataset.",
            "Personal/contact fields from the bulk CSV are deliberately not emitted.",
        ],
    }
    return output_features, events, metadata


def fetch_socrata_geojson(base: str, params: dict[str, Any]) -> dict[str, Any]:
    return fetch_json(url_with_params(base, params))


def socrata_row_url(resource: str, field: str, value: str, *, geojson: bool = False) -> str:
    suffix = "geojson" if geojson else "json"
    return url_with_params(
        f"https://data.cityofnewyork.us/resource/{resource}.{suffix}",
        {"$limit": 1, field: value},
    )


def socrata_where_url(resource: str, where: str, *, geojson: bool = False, limit: int = 1) -> str:
    suffix = "geojson" if geojson else "json"
    return url_with_params(
        f"https://data.cityofnewyork.us/resource/{resource}.{suffix}",
        {"$limit": limit, "$where": where},
    )


def build_nyc_economy_context(retrieved_at: str, accessed_at: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    resource = "7jdm-inj8"
    url = url_with_params(f"https://data.cityofnewyork.us/resource/{resource}.geojson", {"$limit": 5000})
    try:
        data = fetch_json(url)
    except Exception as exc:
        print(f"[warn] NYC BID layer skipped: {exc}")
        return [], []
    output_features: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    for idx, feature in enumerate(data.get("features") or []):
        remove_crs(feature)
        props = feature.get("properties") or {}
        geometry = feature.get("geometry")
        if not geometry:
            continue
        borough = first_present(props, ["borough", "f_all_bi_1"], "")
        name = first_present(props, ["bid", "bid_name", "bidname", "name", "district", "f_all_bi_2"], "")
        year_found = first_present(props, ["year_found"], "")
        raw_object_id = first_present(props, ["objectid_2", "objectid_1", "objectid", "globalid"], "")
        record_id = slug("-".join(part for part in (borough, name, year_found, raw_object_id) if part), f"bid-{idx}")
        if not name:
            name = f"NYC BID {record_id}"
        where_parts = []
        if name:
            where_parts.append(f"f_all_bi_2='{name.replace(chr(39), chr(39) + chr(39))}'")
        if borough:
            where_parts.append(f"f_all_bi_1='{borough.replace(chr(39), chr(39) + chr(39))}'")
        if year_found:
            where_parts.append(f"year_found='{year_found.replace(chr(39), chr(39) + chr(39))}'")
        record_url = socrata_where_url(resource, " AND ".join(where_parts), geojson=True) if where_parts else url
        output_props = dict(props)
        output_props.update(
            {
                "source_id": f"nyc-sbs-bid:{record_id}",
                "stable_source_id": str(record_id),
                "source_record_id": str(record_id),
                "name": name,
                "context_type": "business_improvement_district",
                "category": "economy",
                "lens": "economy",
                "sourceName": "NYC Business Improvement Districts",
                "publisher": "NYC Department of Small Business Services",
                "sourceUrl": record_url,
                "license": NYC_OPEN_DATA_TERMS,
                "licenseUrl": NYC_OPEN_DATA_TERMS_URL,
                "retrievedAt": retrieved_at,
                "accessedAt": accessed_at,
                "geometrySource": "NYC Open Data BID geometry",
                "confidence": "documented",
                "limitations": [
                    "Current commercial district context, not evidence that the district changed in the selected year.",
                    "Not footfall, vacancy, turnover, storefront-level, or economic impact evidence.",
                ],
            }
        )
        output_features.append({"type": "Feature", "geometry": geometry, "properties": output_props})
        for year in (2024, 2026):
            events.append(
                context_event(
                    city_id="nyc",
                    event_id=f"nyc_public_context_economy_bid_{slug(record_id)}_{year}",
                    title=f"Business Improvement District context: {name}",
                    summary=(
                        f"NYC SBS records {name} as Business Improvement District commercial context. "
                        "This supports economy land-use and destination context only; no economic impact is inferred."
                    ),
                    year=year,
                    category="economy",
                    lens="economy",
                    geometry=geometry,
                    source_id="nyc-sbs-business-improvement-districts",
                    source_label="NYC SBS Business Improvement District record",
                    source_url=record_url,
                    source_record_id=str(record_id),
                    accessed_at=accessed_at,
                    source_date_field="current public boundary layer at access date",
                    geometry_source="NYC Open Data BID geometry",
                    geometry_precision="official source boundary polygon; not a parcel, footfall, vacancy, or outcome measure",
                    affected_area=name,
                    affected_signals=["economy", "commercial", "business-improvement-district", "retail"],
                    caveats=[
                        "Current context is shown for the selected replay year and is not evidence that this boundary changed in that year.",
                        "No footfall, vacancy, turnover, commercial performance, or causal effect is inferred.",
                    ],
                )
            )
    output_features.sort(key=lambda f: (f["properties"]["name"], f["properties"]["source_record_id"]))
    events.sort(key=lambda e: (e["year"], e["event_id"]))
    return output_features, events


def fetch_nyc_business_licenses_for_year(year: int, limit: int) -> list[dict[str, Any]]:
    resource = "w7w3-xahh"
    base = f"https://data.cityofnewyork.us/resource/{resource}.json"
    where = (
        f"license_creation_date between '{year}-01-01T00:00:00' and '{year}-12-31T23:59:59' "
        "AND latitude IS NOT NULL AND longitude IS NOT NULL"
    )
    return fetch_json(
        url_with_params(
            base,
            {
                "$limit": limit,
                "$select": ",".join(
                    [
                        "license_nbr",
                        "business_unique_id",
                        "business_category",
                        "license_type",
                        "license_status",
                        "license_creation_date",
                        "lic_expir_dd",
                        "address_borough",
                        "community_board",
                        "council_district",
                        "nta",
                        "latitude",
                        "longitude",
                    ]
                ),
                "$order": "license_creation_date ASC, license_nbr ASC",
                "$where": where,
            },
        )
    )


def build_nyc_business_license_context(
    retrieved_at: str,
    accessed_at: str,
    *,
    per_year_limit: int = 600,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    resource = "w7w3-xahh"
    output_features: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    for year in range(2007, 2027):
        try:
            rows = fetch_nyc_business_licenses_for_year(year, per_year_limit)
        except Exception as exc:
            print(f"[warn] NYC DCWP issued licenses {year} skipped: {exc}")
            continue
        for idx, row in enumerate(rows):
            license_number = first_present(row, ["license_nbr"], f"{resource}-{year}-{idx}")
            business_unique_id = first_present(row, ["business_unique_id"], "")
            record_id = slug("-".join(part for part in (license_number, business_unique_id) if part), f"license-{year}-{idx}")
            category = first_present(row, ["business_category"], "business license")
            license_type = first_present(row, ["license_type"], "license")
            status = first_present(row, ["license_status"], "")
            borough = first_present(row, ["address_borough"], "NYC")
            community_board = first_present(row, ["community_board"], "")
            council_district = first_present(row, ["council_district"], "")
            nta = first_present(row, ["nta"], "")
            creation_date = clean_str(row.get("license_creation_date"))[:10] or str(year)
            expiration_date = clean_str(row.get("lic_expir_dd"))[:10]
            try:
                lat = float(row.get("latitude"))
                lon = float(row.get("longitude"))
            except (TypeError, ValueError):
                continue
            if not in_bounds(lon, lat, NYC_BOUNDS):
                continue
            geometry = {"type": "Point", "coordinates": [round(lon, 6), round(lat, 6)]}
            record_url = socrata_row_url(resource, "license_nbr", license_number)
            label = f"{category} license context in {borough}"
            feature_props = {
                "source_id": f"nyc-dcwp-issued-license:{record_id}",
                "source_ids": ["nyc-dcwp-issued-business-licenses"],
                "stable_source_id": record_id,
                "source_record_id": license_number,
                "name": label,
                "context_type": "issued_business_license",
                "business_category": category,
                "license_type": license_type,
                "license_status": status,
                "license_creation_date": creation_date,
                "license_expiration_date": expiration_date,
                "borough": borough,
                "community_board": community_board,
                "council_district": council_district,
                "nta": nta,
                "category": "economy",
                "lens": "economy",
                "sourceName": "NYC DCWP Issued Licenses",
                "publisher": "NYC Department of Consumer and Worker Protection",
                "sourceUrl": record_url,
                "license": NYC_OPEN_DATA_TERMS,
                "licenseUrl": NYC_OPEN_DATA_TERMS_URL,
                "retrievedAt": retrieved_at,
                "accessedAt": accessed_at,
                "geometrySource": "NYC Open Data latitude/longitude fields from issued license record",
                "confidence": "documented",
                "source_kind": "current_context",
                "evidence_role": "administrative_license_record_context",
                "visible_year": 2026,
                "limitations": [
                    "Issued business license creation date is an administrative license record, not proof of business opening, closure, performance, footfall, or economic impact.",
                    "Business names, street addresses, phone numbers, and other contact fields are intentionally omitted from the atlas artifact.",
                    "Coordinates are source-supplied public record points and may be approximate or stale.",
                ],
            }
            output_features.append({"type": "Feature", "geometry": geometry, "properties": feature_props})
            summary = (
                f"NYC DCWP records an issued {license_type.lower()} license for {category.lower()} in {borough}. "
                "This is administrative business-license context only; no economic performance or opening/closure claim is inferred."
            )
            events.append(
                context_event(
                    city_id="nyc",
                    event_id=f"nyc_public_context_economy_dcwp_license_{record_id}",
                    title=f"Issued business license context: {category} in {borough}",
                    summary=summary,
                    year=year,
                    category="economy",
                    lens="economy",
                    geometry=geometry,
                    source_id="nyc-dcwp-issued-business-licenses",
                    source_label="NYC DCWP issued business license record",
                    source_url=record_url,
                    source_record_id=license_number,
                    accessed_at=accessed_at,
                    source_date_field="license_creation_date",
                    geometry_source="NYC Open Data issued-license latitude/longitude",
                    geometry_precision="source-supplied public record point; not a parcel, frontage, opening date, closure date, or performance measure",
                    affected_area=", ".join(part for part in (borough, community_board, council_district, nta) if part) or borough,
                    affected_signals=["economy", "business-license", "commercial-activity-context"],
                    caveats=[
                        "Administrative license evidence only; it does not prove business opening, closure, performance, footfall, demand, or causality.",
                        "Business names, street addresses, phone numbers, and other contact fields are not emitted.",
                    ],
                    effective_date=creation_date,
                    date_precision_value="day" if re.match(r"^\d{4}-\d{2}-\d{2}$", creation_date) else "year",
                )
            )
    output_features.sort(
        key=lambda f: (
            f["properties"].get("license_creation_date") or "",
            f["properties"].get("source_record_id") or "",
        )
    )
    events.sort(key=lambda e: (e["year"], e["event_id"]))
    return output_features, events


def build_london_utility_events(retrieved_at: str, accessed_at: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    url = "https://api.tfl.gov.uk/Road/all/Disruption"
    try:
        data = fetch_json(url)
    except Exception as exc:
        print(f"[warn] TfL Road Disruptions skipped: {exc}")
        return [], []
    utility_terms = re.compile(
        r"utility|utilities|thames water|ukpn|uk power|cadent|gas|electric|electricity|sewer|water|hydrant|cable|telecom|fibre|fiber",
        re.IGNORECASE,
    )
    output_features: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    for idx, item in enumerate(data if isinstance(data, list) else []):
        text = " ".join(
            clean_str(item.get(key))
            for key in ("id", "category", "subCategory", "comments", "location", "corridorIds")
        )
        if not utility_terms.search(text):
            continue
        geometry = item.get("geography") or item.get("geometry")
        if not geometry:
            continue
        remove_crs(geometry)
        event_id_raw = clean_str(item.get("id") or f"tfl-road-disruption-{idx}")
        start = clean_str(item.get("startDateTime"))
        try:
            year = int(start[:4]) if start else 2026
        except ValueError:
            year = 2026
        if year < 2024 or year > 2026:
            year = 2026
        location = clean_str(item.get("location")) or "London road network"
        subcategory = clean_str(item.get("subCategory") or item.get("category") or "utility works")
        comments = clean_str(item.get("comments"))
        record_url = url
        props = {
            "source_id": f"tfl-road-disruption:{event_id_raw}",
            "stable_source_id": event_id_raw,
            "source_record_id": event_id_raw,
            "name": f"{subcategory}: {location}",
            "context_type": "utility_road_disruption",
            "category": "utilities",
            "lens": "utilities",
            "startDateTime": item.get("startDateTime"),
            "endDateTime": item.get("endDateTime"),
            "lastModifiedTime": item.get("lastModifiedTime"),
            "sourceName": "TfL Road Disruptions API",
            "publisher": "Transport for London",
            "sourceUrl": record_url,
            "license": TFL_LICENSE,
            "licenseUrl": TFL_LICENSE_URL,
            "retrievedAt": retrieved_at,
            "accessedAt": accessed_at,
            "geometrySource": "TfL Road Disruptions geography/geometry field",
            "confidence": "documented",
            "limitations": [
                "Current/live road-disruption context; not a complete historical utility works archive.",
                "Not utility capacity, reliability, live network status, or outage proof.",
            ],
        }
        output_features.append({"type": "Feature", "geometry": geometry, "properties": props})
        summary = (
            f"TfL Road Disruptions records {subcategory} at {location}."
            + (f" Source comment: {comments[:180]}" if comments else "")
        )
        events.append(
            context_event(
                city_id="london",
                event_id=f"lon_public_context_utility_tfl_road_disruption_{slug(event_id_raw)}",
                title=f"Utility works context: {location}",
                summary=summary,
                year=year,
                category="utilities",
                lens="utilities",
                geometry=geometry,
                source_id="tfl-road-disruptions-utility-works",
                source_label="TfL Road Disruptions record",
                source_url=record_url,
                source_record_id=event_id_raw,
                accessed_at=accessed_at,
                source_date_field="startDateTime/endDateTime/lastModifiedTime",
                geometry_source="TfL Road Disruptions geography/geometry",
                geometry_precision="source road disruption point or area; not a surveyed underground asset alignment",
                affected_area=location,
                affected_signals=["utilities", "utility-works", "street-works"],
                caveats=[
                    "Current/live road-disruption context from the access date, not a complete historical utility works archive.",
                    "No engineering capacity, service reliability, outage, or causal claim is inferred.",
                ],
            )
        )
    output_features.sort(key=lambda f: (f["properties"].get("startDateTime") or "", f["properties"]["source_record_id"]))
    events.sort(key=lambda e: (e["year"], e["event_id"]))
    return output_features, events


def epsg2263_to_wgs84(easting_ft: float, northing_ft: float) -> tuple[float, float]:
    # NAD83 / New York Long Island (EPSG:2263), inverse Lambert Conformal Conic.
    a = 6378137.0
    inv_f = 298.257222101
    f = 1.0 / inv_f
    e = math.sqrt(2 * f - f * f)
    ft = 1200.0 / 3937.0
    false_easting = 984250.0 * ft
    false_northing = 0.0
    lon0 = math.radians(-74.0)
    phi0 = math.radians(40.166666666666664)
    phi1 = math.radians(40.666666666666664)
    phi2 = math.radians(41.03333333333333)

    def m(phi: float) -> float:
        return math.cos(phi) / math.sqrt(1.0 - e * e * math.sin(phi) ** 2)

    def t(phi: float) -> float:
        sin_phi = math.sin(phi)
        ratio = (1.0 - e * sin_phi) / (1.0 + e * sin_phi)
        return math.tan(math.pi / 4.0 - phi / 2.0) / (ratio ** (e / 2.0))

    m1, m2 = m(phi1), m(phi2)
    t1, t2, t0 = t(phi1), t(phi2), t(phi0)
    n = (math.log(m1) - math.log(m2)) / (math.log(t1) - math.log(t2))
    f_lcc = m1 / (n * (t1**n))
    rho0 = a * f_lcc * (t0**n)

    x = easting_ft * ft - false_easting
    y = northing_ft * ft - false_northing
    rho = math.copysign(math.sqrt(x * x + (rho0 - y) * (rho0 - y)), n)
    theta = math.atan2(x, rho0 - y)
    lon = lon0 + theta / n
    t_value = (rho / (a * f_lcc)) ** (1.0 / n)
    phi = math.pi / 2.0 - 2.0 * math.atan(t_value)
    for _ in range(8):
        sin_phi = math.sin(phi)
        phi = math.pi / 2.0 - 2.0 * math.atan(t_value * (((1.0 - e * sin_phi) / (1.0 + e * sin_phi)) ** (e / 2.0)))
    return math.degrees(lon), math.degrees(phi)


def parse_wkt_geometry(wkt: str) -> dict[str, Any] | None:
    text = clean_str(wkt)
    if not text:
        return None
    upper = text.upper()

    def parse_pairs(pair_text: str) -> list[list[float]]:
        coords: list[list[float]] = []
        for item in pair_text.split(","):
            nums = re.findall(r"-?\d+(?:\.\d+)?", item)
            if len(nums) < 2:
                continue
            lon, lat = epsg2263_to_wgs84(float(nums[0]), float(nums[1]))
            coords.append([round(lon, 7), round(lat, 7)])
        return coords

    if upper.startswith("POINT"):
        nums = re.findall(r"-?\d+(?:\.\d+)?", text)
        if len(nums) < 2:
            return None
        lon, lat = epsg2263_to_wgs84(float(nums[0]), float(nums[1]))
        return {"type": "Point", "coordinates": [round(lon, 7), round(lat, 7)]}
    if upper.startswith("LINESTRING"):
        match = re.search(r"\((.*)\)", text)
        if not match:
            return None
        coords = parse_pairs(match.group(1))
        return {"type": "LineString", "coordinates": coords} if len(coords) >= 2 else None
    if upper.startswith("MULTILINESTRING"):
        inner = text[text.find("(") + 1 : text.rfind(")")]
        parts = re.findall(r"\(([^()]+)\)", inner)
        lines = [parse_pairs(part) for part in parts]
        lines = [line for line in lines if len(line) >= 2]
        return {"type": "MultiLineString", "coordinates": lines} if lines else None
    return None


def permit_filter(start: str, end: str) -> str:
    terms = [
        "CONSOLIDATED EDISON",
        "CON EDISON",
        "CONED",
        "NATIONAL GRID",
        "NYC DEPT OF ENVIRONMENTAL PROTECTION",
        "DEPT OF ENVIRONMENTAL PROTECTION",
        "VERIZON",
        "CHARTER",
        "CABLE",
        "WATER",
        "SEWER",
        "GAS",
        "ELECTRIC",
        "STEAM",
        "TELECOM",
        "FIBER",
        "FIBRE",
    ]
    text_clauses = []
    for term in terms:
        safe = term.replace("'", "''")
        text_clauses.append(f"upper(permitteename) like '%{safe}%'")
        text_clauses.append(f"upper(permitpurposecomments) like '%{safe}%'")
        text_clauses.append(f"upper(permittypedesc) like '%{safe}%'")
    return (
        f"permitissuedate between '{start}T00:00:00' and '{end}T23:59:59' "
        f"AND ({' OR '.join(text_clauses)})"
    )


def utility_signal_from_permit(props: dict[str, Any]) -> str:
    text = " ".join(clean_str(props.get(key)).upper() for key in ("permitteename", "permitpurposecomments", "permittypedesc"))
    if "WATER" in text or "SEWER" in text or "ENVIRONMENTAL PROTECTION" in text:
        return "water-sewer"
    if "GAS" in text or "NATIONAL GRID" in text:
        return "gas"
    if "ELECTRIC" in text or "CONSOLIDATED EDISON" in text or "CON EDISON" in text or "STEAM" in text:
        return "electric-steam"
    if "VERIZON" in text or "CHARTER" in text or "CABLE" in text or "TELECOM" in text or "FIBER" in text or "FIBRE" in text:
        return "telecom"
    return "utility"


def fetch_nyc_utility_permits_for_year(resource: str, year: int, limit: int) -> list[dict[str, Any]]:
    base = f"https://data.cityofnewyork.us/resource/{resource}.geojson"
    data = fetch_socrata_geojson(
        base,
        {
            "$limit": limit,
            "$order": "permitissuedate ASC, permitnumber ASC",
            "$where": permit_filter(f"{year}-01-01", f"{year}-12-31"),
        },
    )
    return data.get("features") or []


def build_nyc_utility_events(retrieved_at: str, accessed_at: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    resources: list[tuple[str, range, int, str]] = [
        ("c9sj-fmsg", range(2013, 2022), 160, "nyc-dot-street-construction-permits-legacy"),
        ("tqtj-sjs8", range(2022, 2027), 220, "nyc-dot-street-construction-permits-current"),
    ]
    output_features: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    for resource, years, limit, source_id in resources:
        for year in years:
            try:
                rows = fetch_nyc_utility_permits_for_year(resource, year, limit)
            except Exception as exc:
                print(f"[warn] NYC utility permits {resource} {year} skipped: {exc}")
                continue
            for idx, feature in enumerate(rows):
                props = feature.get("properties") or {}
                permit_number = first_present(props, ["permitnumber", "permit_number"], f"{resource}-{year}-{idx}")
                wkt = first_present(props, ["wkt", "locationgeometry"], "")
                geometry = parse_wkt_geometry(wkt)
                if not geometry:
                    continue
                issue_date = first_present(props, ["permitissuedate"], str(year))
                start_date = first_present(props, ["issuedworkstartdate"], "")
                end_date = first_present(props, ["issuedworkenddate"], "")
                permittee = first_present(props, ["permitteename"], "NYC utility permittee")
                purpose = first_present(props, ["permitpurposecomments", "permittypedesc"], "utility street work")
                on_street = first_present(props, ["onstreetname", "streetname"], "NYC street")
                record_url = socrata_row_url(resource, "permitnumber", permit_number, geojson=True)
                utility_signal = utility_signal_from_permit(props)
                output_props = dict(props)
                output_props.update(
                    {
                        "source_id": f"nyc-dot-utility-permit:{permit_number}",
                        "stable_source_id": permit_number,
                        "source_record_id": permit_number,
                        "name": f"{permittee}: {purpose}",
                        "context_type": "utility_street_work_permit",
                        "utility_signal": utility_signal,
                        "category": "utilities",
                        "lens": "utilities",
                        "sourceName": "NYC DOT Street Construction Permits",
                        "publisher": "NYC Department of Transportation",
                        "sourceUrl": record_url,
                        "license": NYC_OPEN_DATA_TERMS,
                        "licenseUrl": NYC_OPEN_DATA_TERMS_URL,
                        "retrievedAt": retrieved_at,
                        "accessedAt": accessed_at,
                        "geometrySource": "DOT permit WKT work-location line converted from EPSG:2263 to WGS84",
                        "confidence": "documented",
                        "limitations": [
                            "Street construction permit evidence, not a utility network map.",
                            "Not utility capacity, service reliability, live outage, or completed-work proof.",
                        ],
                    }
                )
                output_features.append({"type": "Feature", "geometry": geometry, "properties": output_props})
                summary = f"NYC DOT permit {permit_number} records utility-related street work by {permittee} at {on_street}: {purpose}."
                events.append(
                    context_event(
                        city_id="nyc",
                        event_id=f"nyc_public_context_utility_dot_permit_{slug(permit_number)}",
                        title=f"Utility street work permit: {on_street}",
                        summary=summary,
                        year=year,
                        category="utilities",
                        lens="utilities",
                        geometry=geometry,
                        source_id=source_id,
                        source_label="NYC DOT street construction permit record",
                        source_url=record_url,
                        source_record_id=permit_number,
                        accessed_at=accessed_at,
                        source_date_field="permitissuedate/issuedworkstartdate/issuedworkenddate",
                        geometry_source="NYC DOT permit WKT work-location geometry",
                        geometry_precision="DOT work-location line converted from EPSG:2263; not a surveyed utility network alignment",
                        affected_area=on_street,
                        affected_signals=["utilities", "utility-works", utility_signal],
                        caveats=[
                            "Permit evidence documents authorized street work; it does not prove work completion or live asset status.",
                            "No engineering capacity, service reliability, outage, or causal claim is inferred.",
                        ],
                    )
                )
    output_features.sort(key=lambda f: (f["properties"].get("permitissuedate") or "", f["properties"]["source_record_id"]))
    events.sort(key=lambda e: (e["year"], e["event_id"]))
    return output_features, events


def upsert_events(city_id: str, events: list[dict[str, Any]]) -> None:
    city_path = CITY_DIR / city_id
    by_year: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for event in events:
        by_year[int(event["year"])].append(event)

    prefixes = GENERATED_EVENT_PREFIXES[city_id]
    touched_years = sorted(by_year)
    for year in touched_years:
        path = city_path / f"events_{year}.json"
        data = read_json(path, {"schema_version": "1.0.0", "city_id": city_id, "year": year, "events": []})
        existing = data.get("events") or []
        kept = [event for event in existing if not any(str(event.get("event_id", "")).startswith(prefix) for prefix in prefixes)]
        merged = kept + by_year[year]
        merged.sort(key=lambda event: (str(event.get("effective_date") or ""), str(event.get("event_id") or "")))
        data["schema_version"] = data.get("schema_version") or "1.0.0"
        data["city_id"] = city_id
        data["year"] = year
        data["events"] = merged
        data["event_count"] = len(merged)
        write_json(path, data)
        write_json(city_path / f"events_{year}.geojson", event_feature_collection(city_id, year, merged))

    # Remove stale generated records from years not touched by this run.
    for path in sorted(city_path.glob("events_*.json")):
        if path.name == "events.json":
            continue
        match = re.match(r"events_(\d{4})\.json$", path.name)
        if not match:
            continue
        year = int(match.group(1))
        if year in touched_years:
            continue
        data = read_json(path, {})
        events_existing = data.get("events") or []
        kept = [event for event in events_existing if not any(str(event.get("event_id", "")).startswith(prefix) for prefix in prefixes)]
        if len(kept) != len(events_existing):
            data["events"] = kept
            data["event_count"] = len(kept)
            write_json(path, data)
            write_json(city_path / f"events_{year}.geojson", event_feature_collection(city_id, year, kept))

    update_events_index(city_id)


def update_events_index(city_id: str) -> None:
    city_path = CITY_DIR / city_id
    index_path = city_path / "events.json"
    index = read_json(index_path, {"schema_version": "1.0.0", "city_id": city_id})
    years: list[int] = []
    chunks: list[dict[str, Any]] = []
    total = 0
    for path in sorted(city_path.glob("events_*.json")):
        match = re.match(r"events_(\d{4})\.json$", path.name)
        if not match:
            continue
        year = int(match.group(1))
        data = read_json(path, {})
        events = data.get("events") or []
        categories = Counter(clean_str(event.get("category") or "unknown") for event in events)
        confidence = Counter(clean_str(event.get("confidence") or "unknown") for event in events)
        cat_conf: dict[str, Counter[str]] = defaultdict(Counter)
        for event in events:
            cat_conf[clean_str(event.get("category") or "unknown")][clean_str(event.get("confidence") or "unknown")] += 1
        chunks.append(
            {
                "year": year,
                "event_count": len(events),
                "json_path": f"web/data/city-atlas/cities/{city_id}/events_{year}.json",
                "path": f"web/data/city-atlas/cities/{city_id}/events_{year}.json",
                "geojson_path": f"web/data/city-atlas/cities/{city_id}/events_{year}.geojson",
                "counts_by_category": dict(sorted(categories.items())),
                "counts_by_confidence": dict(sorted(confidence.items())),
                "counts_by_category_confidence": {k: dict(sorted(v.items())) for k, v in sorted(cat_conf.items())},
            }
        )
        total += len(events)
        if events:
            years.append(year)
    index["schema_version"] = index.get("schema_version") or "1.0.0"
    index["city_id"] = city_id
    index["event_count"] = total
    index["event_years"] = years
    index["chunks"] = chunks
    index["generated_at"] = utc_now()
    write_json(index_path, index)


def upsert_sources(city_id: str, records: list[dict[str, Any]]) -> None:
    path = CITY_DIR / city_id / "sources.json"
    data = read_json(path, {"schema_version": "1.0.0", "city_id": city_id, "sources": []})
    existing = {source.get("source_id"): source for source in data.get("sources") or []}
    for record in records:
        existing[record["source_id"]] = record
    data["schema_version"] = data.get("schema_version") or "1.0.0"
    data["city_id"] = city_id
    data["sources"] = sorted(existing.values(), key=lambda source: str(source.get("source_id") or ""))
    data["source_count"] = len(data["sources"])
    data["generated_at"] = utc_now()
    write_json(path, data)


def update_city_json(city_id: str, artifact_paths: dict[str, str], source_families: dict[str, list[str]]) -> None:
    path = CITY_DIR / city_id / "city.json"
    data = read_json(path, {"schema_version": "1.0.0", "city_id": city_id})
    artifacts = data.setdefault("artifact_paths", {})
    artifacts.update(artifact_paths)
    families = data.setdefault("source_families", [])
    if isinstance(families, list):
        by_id: dict[str, dict[str, Any]] = {}
        for item in families:
            if isinstance(item, dict) and item.get("family_id"):
                by_id[str(item["family_id"])] = item
        for family, ids in source_families.items():
            item = by_id.get(family)
            if not item:
                item = {
                    "family_id": family,
                    "label": family.replace("_", " ").title(),
                    "source_ids": [],
                    "availability": "partial_local",
                    "years": FAMILY_YEAR_DEFAULTS.get(family, list(range(2007, 2027))),
                    "notes": "Source-backed public context added by scripts/build_london_nyc_public_context.py.",
                }
                families.append(item)
                by_id[family] = item
            if "years" not in item:
                item["years"] = FAMILY_YEAR_DEFAULTS.get(family, list(range(2007, 2027)))
            current = [str(source_id) for source_id in item.get("source_ids") or []]
            for source_id in ids:
                if source_id not in current:
                    current.append(source_id)
            item["source_ids"] = sorted(current)
    elif isinstance(families, dict):
        for family, ids in source_families.items():
            current: list[str] = []
            value = families.get(family)
            if isinstance(value, list):
                current = [str(item) for item in value]
            elif isinstance(value, dict) and isinstance(value.get("source_ids"), list):
                current = [str(item) for item in value["source_ids"]]
            for source_id in ids:
                if source_id not in current:
                    current.append(source_id)
            if isinstance(value, dict):
                value["source_ids"] = sorted(current)
                families[family] = value
            else:
                families[family] = sorted(current)
    write_json(path, data)


def source_records(accessed_at: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    london_sources = [
        build_source_record(
            source_id="tfl-stoppoint-public-context",
            title="TfL StopPoint API",
            publisher="Transport for London",
            source_family="transport",
            city_ids=["london"],
            url="https://api.tfl.gov.uk/StopPoint",
            license_name=TFL_LICENSE,
            license_url=TFL_LICENSE_URL,
            accessed_at=accessed_at,
            source_type="API",
            update_frequency="TfL-managed current operational data",
            fields_available=["naptanId", "commonName", "modes", "lat", "lon", "lines", "lineModeGroups", "stopType"],
            geometry_type_value="Point",
            temporal_coverage="Current stop context at retrieval date",
            coverage_years=[2026],
            limitations=[
                "May post-date selected historical replay years.",
                "Route counts are stop metadata context, not frequency, speed, or reliability evidence.",
            ],
            attribution="Contains Transport for London data.",
        ),
        build_source_record(
            source_id="gla-busyness-context-boundaries",
            title="GLA Busyness Context boundary layers",
            publisher="Greater London Authority",
            source_family="economy",
            city_ids=["london"],
            url="https://gis.london.gov.uk/arcgis/rest/services/apps/Busyness_context/MapServer",
            license_name=OGL3,
            license_url=OGL3_URL,
            accessed_at=accessed_at,
            source_type="ArcGIS Feature Service",
            update_frequency="GLA-managed public context layer; update cadence varies by layer",
            fields_available=["bid_name", "bid_id", "highstreet_name", "highstreet_id", "tc_name", "tc_id", "commercial", "classification"],
            geometry_type_value="Polygon/MultiPolygon",
            temporal_coverage="Current boundary/context layer at retrieval date",
            coverage_years=[2024, 2026],
            limitations=[
                "Used as commercial-place context only, not evidence that a boundary changed in a selected year.",
                "Does not provide footfall, vacancy, turnover, economic outcome, or causal impact measurements.",
            ],
            attribution="Contains public sector information licensed under the Open Government Licence v3.0.",
        ),
        build_source_record(
            source_id="tfl-road-disruptions-utility-works",
            title="TfL Road Disruptions API utility works records",
            publisher="Transport for London",
            source_family="utilities",
            city_ids=["london"],
            url="https://api.tfl.gov.uk/Road/all/Disruption",
            license_name=TFL_LICENSE,
            license_url=TFL_LICENSE_URL,
            accessed_at=accessed_at,
            source_type="API",
            update_frequency="Current/live road disruption feed",
            fields_available=["id", "category", "subCategory", "comments", "location", "startDateTime", "endDateTime", "lastModifiedTime", "geography", "geometry"],
            geometry_type_value="Point/Polygon",
            temporal_coverage="Current/live and planned disruptions visible at retrieval date",
            coverage_years=[2024, 2025, 2026],
            limitations=[
                "Not a complete historical street works archive.",
                "Not engineering capacity, service reliability, outage, or live network-status evidence.",
            ],
            attribution="Contains Transport for London data.",
        ),
        build_source_record(
            source_id="dfe-gias-public-establishment-context",
            title="Get Information About Schools public establishment extract",
            publisher="Department for Education",
            source_family="civic_services",
            city_ids=["london"],
            url=GIAS_PORTAL_URL,
            license_name=OGL3,
            license_url=OGL3_URL,
            accessed_at=accessed_at,
            source_type="Daily public establishment-register CSV",
            update_frequency="GIAS public downloads are updated daily when a current extract is available",
            fields_available=[
                "URN",
                "EstablishmentName",
                "EstablishmentStatus (name)",
                "OpenDate",
                "CloseDate",
                "CensusDate",
                "NumberOfPupils",
                "SchoolCapacity",
                "PhaseOfEducation (name)",
                "TypeOfEstablishment (name)",
                "EstablishmentTypeGroup (name)",
                "LA (name)",
                "GOR (name)",
                "Easting",
                "Northing",
            ],
            geometry_type_value="Point converted from British National Grid easting/northing",
            temporal_coverage="Current register extract with establishment OpenDate/CloseDate where available",
            coverage_years=list(range(2007, 2027)),
            limitations=[
                "GIAS establishment dates are register/status dates, not construction, completion, occupation, catchment, demand, capacity, or outcome evidence.",
                "Current rows may post-date selected historical replay years; historical context is emitted only when OpenDate/CloseDate/status fields support it.",
                "Independent, specialist, and post-16 establishments may be present; public service access or eligibility is not inferred.",
                "Personal/contact fields from the public CSV are not emitted.",
            ],
            attribution="Contains public sector information licensed under the Open Government Licence v3.0.",
        ),
    ]
    nyc_sources = [
        build_source_record(
            source_id="mta-gtfs-static-public-context",
            title="MTA GTFS static feeds",
            publisher="Metropolitan Transportation Authority",
            source_family="transport",
            city_ids=["nyc"],
            url="https://new.mta.info/developers",
            license_name=MTA_LICENSE,
            license_url=MTA_LICENSE_URL,
            accessed_at=accessed_at,
            source_type="GTFS static downloads",
            update_frequency="MTA-managed current static schedule feeds",
            fields_available=["stops.txt", "routes.txt", "trips.txt", "stop_times.txt", "feed_info.txt"],
            geometry_type_value="Point",
            temporal_coverage="Current stop/schedule context at retrieval date",
            coverage_years=[2026],
            limitations=[
                "May post-date selected historical replay years.",
                "Route counts derived from GTFS trips/stop_times are not speed, frequency, or reliability evidence.",
            ],
            attribution="Contains MTA data.",
        ),
        build_source_record(
            source_id="nyc-sbs-business-improvement-districts",
            title="NYC Business Improvement Districts",
            publisher="NYC Department of Small Business Services",
            source_family="economy",
            city_ids=["nyc"],
            url="https://data.cityofnewyork.us/resource/7jdm-inj8.geojson",
            license_name=NYC_OPEN_DATA_TERMS,
            license_url=NYC_OPEN_DATA_TERMS_URL,
            accessed_at=accessed_at,
            source_type="NYC Open Data GeoJSON API",
            update_frequency="NYC Open Data managed public dataset",
            fields_available=["id", "the_geom", "shape_area", "shape_leng"],
            geometry_type_value="Polygon/MultiPolygon",
            temporal_coverage="Current BID boundary context at retrieval date",
            coverage_years=[2024, 2026],
            limitations=[
                "Used as commercial district context only, not evidence that a district changed in a selected year.",
                "Does not provide footfall, vacancy, turnover, or economic impact measurements.",
            ],
            attribution="Contains data provided by NYC Open Data and NYC SBS.",
        ),
        build_source_record(
            source_id="nyc-dcwp-issued-business-licenses",
            title="NYC DCWP Issued Licenses",
            publisher="NYC Department of Consumer and Worker Protection",
            source_family="economy",
            city_ids=["nyc"],
            url="https://data.cityofnewyork.us/resource/w7w3-xahh.json",
            license_name=NYC_OPEN_DATA_TERMS,
            license_url=NYC_OPEN_DATA_TERMS_URL,
            accessed_at=accessed_at,
            source_type="NYC Open Data JSON API",
            update_frequency="NYC Open Data managed public dataset",
            fields_available=[
                "license_nbr",
                "business_unique_id",
                "business_category",
                "license_type",
                "license_status",
                "license_creation_date",
                "lic_expir_dd",
                "address_borough",
                "community_board",
                "council_district",
                "nta",
                "latitude",
                "longitude",
            ],
            geometry_type_value="Point from public latitude/longitude fields",
            temporal_coverage="Issued-license records with license_creation_date from 2007 onward in the sampled atlas context",
            coverage_years=list(range(2007, 2027)),
            limitations=[
                "License creation date is an administrative record date and does not establish business opening, closure, performance, footfall, demand, or economic impact.",
                "Generated atlas artifacts intentionally omit business names, street addresses, phone numbers, and contact fields.",
                "Coordinates are source-supplied public record points and may be approximate or stale.",
            ],
            attribution="Contains data provided by NYC Open Data and NYC DCWP.",
        ),
        build_source_record(
            source_id="nyc-dot-street-construction-permits-current",
            title="NYC DOT Street Construction Permits 2022-present",
            publisher="NYC Department of Transportation",
            source_family="utilities",
            city_ids=["nyc"],
            url="https://data.cityofnewyork.us/resource/tqtj-sjs8.geojson",
            license_name=NYC_OPEN_DATA_TERMS,
            license_url=NYC_OPEN_DATA_TERMS_URL,
            accessed_at=accessed_at,
            source_type="NYC Open Data GeoJSON/API with WKT work-location geometry",
            update_frequency="NYC Open Data managed permit feed",
            fields_available=["permitnumber", "permitteename", "permitpurposecomments", "permitissuedate", "issuedworkstartdate", "issuedworkenddate", "permittypedesc", "wkt"],
            geometry_type_value="LineString/Point converted from EPSG:2263 WKT",
            temporal_coverage="2022-present permits available through NYC Open Data",
            coverage_years=list(range(2022, 2027)),
            limitations=[
                "Permit evidence does not prove completion or live network status.",
                "Not engineering capacity, service reliability, or outage evidence.",
            ],
            attribution="Contains data provided by NYC Open Data and NYC DOT.",
        ),
        build_source_record(
            source_id="nyc-dot-street-construction-permits-legacy",
            title="NYC DOT Street Construction Permits 2013-2021",
            publisher="NYC Department of Transportation",
            source_family="utilities",
            city_ids=["nyc"],
            url="https://data.cityofnewyork.us/resource/c9sj-fmsg.geojson",
            license_name=NYC_OPEN_DATA_TERMS,
            license_url=NYC_OPEN_DATA_TERMS_URL,
            accessed_at=accessed_at,
            source_type="NYC Open Data GeoJSON/API with WKT work-location geometry",
            update_frequency="Archived NYC Open Data permit feed",
            fields_available=["permitnumber", "permitteename", "permitpurposecomments", "permitissuedate", "issuedworkstartdate", "issuedworkenddate", "permittypedesc", "wkt"],
            geometry_type_value="LineString/Point converted from EPSG:2263 WKT",
            temporal_coverage="2013-2021 permits available through NYC Open Data",
            coverage_years=list(range(2013, 2022)),
            limitations=[
                "No records before 2013 from this source.",
                "Permit evidence does not prove completion or live network status.",
                "Not engineering capacity, service reliability, or outage evidence.",
            ],
            attribution="Contains data provided by NYC Open Data and NYC DOT.",
        ),
    ]
    return london_sources, nyc_sources


def main() -> None:
    retrieved_at = utc_now()
    accessed_at = today_utc()
    economy_utilities_only = "--economy-utilities-only" in sys.argv[1:]

    if economy_utilities_only:
        print("[public-context] Economy/utilities-only mode: preserving existing transport stop and civic context artifacts")
    else:
        print("[public-context] Fetching London TfL StopPoint context")
        london_stops = build_london_transport_stops(retrieved_at, accessed_at)
        write_json(
            LONDON_DIR / "transport_stops_2026.geojson",
            feature_collection(
                london_stops,
                {
                    "title": "London public transport stop context",
                    "publisher": "Transport for London",
                    "source_url": "https://api.tfl.gov.uk/StopPoint",
                    "license": TFL_LICENSE,
                    "license_url": TFL_LICENSE_URL,
                    "retrieved_at": retrieved_at,
                    "accessed_at": accessed_at,
                    "feature_count": len(london_stops),
                    "limitations": [
                        "Current context layer for visual and access analysis; it may post-date selected historical replay years.",
                        "Route counts use source metadata where present and do not represent frequency, speed, or reliability.",
                    ],
                },
            ),
        )

        print("[public-context] Fetching NYC MTA GTFS stop context")
        nyc_stops = build_nyc_transport_stops(retrieved_at, accessed_at)
        write_json(
            NYC_DIR / "transport_stops_2026.geojson",
            feature_collection(
                nyc_stops,
                {
                    "title": "NYC public transport stop context",
                    "publisher": "Metropolitan Transportation Authority",
                    "source_url": "https://new.mta.info/developers",
                    "license": MTA_LICENSE,
                    "license_url": MTA_LICENSE_URL,
                    "retrieved_at": retrieved_at,
                    "accessed_at": accessed_at,
                    "feature_count": len(nyc_stops),
                    "limitations": [
                        "Current GTFS static context for visual and access analysis; it may post-date selected historical replay years.",
                        "Route counts derived from GTFS trips/stop_times do not represent speed or reliability.",
                    ],
                },
            ),
        )

    print("[public-context] Fetching London economy context")
    london_economy_features, london_economy_events = build_london_economy_context(retrieved_at, accessed_at)
    london_economy_collection = feature_collection(
        london_economy_features,
        {
            "title": "London economy boundary context",
            "publisher": "Greater London Authority",
            "source_url": "https://gis.london.gov.uk/arcgis/rest/services/apps/Busyness_context/MapServer",
            "license": OGL3,
            "license_url": OGL3_URL,
            "retrieved_at": retrieved_at,
            "accessed_at": accessed_at,
            "feature_count": len(london_economy_features),
            "artifact_role": "current economy anchor/context layer",
            "limitations": [
                "Current commercial-place context only; not evidence that a place changed in a selected year.",
                "No economic impact, footfall, vacancy, or frontage claim is inferred.",
            ],
        },
    )
    write_json(
        LONDON_DIR / "economy_context_2026.geojson",
        london_economy_collection,
    )
    write_json(LONDON_DIR / "economy_anchors_2026.geojson", london_economy_collection)

    print("[public-context] Fetching NYC economy context")
    nyc_economy_features, nyc_economy_events = build_nyc_economy_context(retrieved_at, accessed_at)
    print("[public-context] Fetching NYC DCWP issued business license context")
    nyc_license_features, nyc_license_events = build_nyc_business_license_context(retrieved_at, accessed_at)
    nyc_economy_features = nyc_economy_features + nyc_license_features
    nyc_economy_events = nyc_economy_events + nyc_license_events
    nyc_economy_collection = feature_collection(
        nyc_economy_features,
        {
            "title": "NYC economy district and issued-license context",
            "publisher": "NYC Department of Small Business Services; NYC Department of Consumer and Worker Protection",
            "source_url": "https://data.cityofnewyork.us/resource/7jdm-inj8.geojson; https://data.cityofnewyork.us/resource/w7w3-xahh.json",
            "license": NYC_OPEN_DATA_TERMS,
            "license_url": NYC_OPEN_DATA_TERMS_URL,
            "retrieved_at": retrieved_at,
            "accessed_at": accessed_at,
            "feature_count": len(nyc_economy_features),
            "artifact_role": "current economy anchor/context layer",
            "limitations": [
                "Commercial district and issued-license context only; not evidence that a district or business changed in a selected year unless the source date says so.",
                "Business-license creation dates are administrative source dates, not proof of opening, closure, performance, footfall, vacancy, or economic impact.",
                "Business names, street addresses, phone numbers, and contact fields are omitted from the generated atlas artifacts.",
            ],
        },
    )
    write_json(
        NYC_DIR / "economy_context_2026.geojson",
        nyc_economy_collection,
    )
    write_json(NYC_DIR / "economy_anchors_2026.geojson", nyc_economy_collection)

    print("[public-context] Fetching London utility works context")
    london_utility_features, london_utility_events = build_london_utility_events(retrieved_at, accessed_at)
    london_utility_collection = feature_collection(
        london_utility_features,
        {
            "title": "London utility works context",
            "publisher": "Transport for London",
            "source_url": "https://api.tfl.gov.uk/Road/all/Disruption",
            "license": TFL_LICENSE,
            "license_url": TFL_LICENSE_URL,
            "retrieved_at": retrieved_at,
            "accessed_at": accessed_at,
            "feature_count": len(london_utility_features),
            "artifact_role": "current utility works context; not a surveyed utility network",
            "limitations": [
                "Current/live road disruption context, not a complete historical utility works archive.",
                "No utility capacity, reliability, outage, or engineering status is inferred.",
                "This artifact is named for frontend contract compatibility; features are works/disruption context, not a utility network map.",
            ],
        },
    )
    write_json(
        LONDON_DIR / "utility_context_2026.geojson",
        london_utility_collection,
    )
    write_json(LONDON_DIR / "utility_network_2026.geojson", london_utility_collection)

    if economy_utilities_only:
        london_civic_events = []
    else:
        print("[public-context] Fetching London DfE GIAS civic-service context")
        london_civic_features, london_civic_events, london_civic_metadata = build_london_civic_gias_context(retrieved_at, accessed_at)
        write_json(
            LONDON_DIR / "civic_services_2026.geojson",
            feature_collection(london_civic_features, london_civic_metadata),
        )

    print("[public-context] Fetching NYC utility street work permit context")
    nyc_utility_features, nyc_utility_events = build_nyc_utility_events(retrieved_at, accessed_at)
    nyc_utility_collection = feature_collection(
        nyc_utility_features,
        {
            "title": "NYC utility street work permit context",
            "publisher": "NYC Department of Transportation",
            "source_url": "https://data.cityofnewyork.us/resource/tqtj-sjs8.geojson",
            "license": NYC_OPEN_DATA_TERMS,
            "license_url": NYC_OPEN_DATA_TERMS_URL,
            "retrieved_at": retrieved_at,
            "accessed_at": accessed_at,
            "feature_count": len(nyc_utility_features),
            "artifact_role": "current utility works permit context; not a surveyed utility network",
            "limitations": [
                "Street construction permit evidence, not a utility network map.",
                "No utility capacity, reliability, outage, or engineering status is inferred.",
                "This artifact is named for frontend contract compatibility; features are permit/work-location context, not a utility network map.",
            ],
        },
    )
    write_json(
        NYC_DIR / "utility_context_2026.geojson",
        nyc_utility_collection,
    )
    write_json(NYC_DIR / "utility_network_2026.geojson", nyc_utility_collection)

    print("[public-context] Updating event chunks, city manifests, and source manifests")
    upsert_events("london", london_economy_events + london_utility_events + london_civic_events)
    upsert_events("nyc", nyc_economy_events + nyc_utility_events)
    london_sources, nyc_sources = source_records(accessed_at)
    upsert_sources("london", london_sources)
    upsert_sources("nyc", nyc_sources)
    update_city_json(
        "london",
        {
            "transport_stops": "web/data/city-atlas/cities/london/transport_stops_2026.geojson",
            "economy_anchors": "web/data/city-atlas/cities/london/economy_anchors_2026.geojson",
            "economy_anchors_2026": "web/data/city-atlas/cities/london/economy_anchors_2026.geojson",
            "economy_context_2026": "web/data/city-atlas/cities/london/economy_context_2026.geojson",
            "utility_network": "web/data/city-atlas/cities/london/utility_network_2026.geojson",
            "utility_network_2026": "web/data/city-atlas/cities/london/utility_network_2026.geojson",
            "utility_context_2026": "web/data/city-atlas/cities/london/utility_context_2026.geojson",
            "civic_services_context": "web/data/city-atlas/cities/london/civic_services_2026.geojson",
        },
        {
            "transport": ["tfl-stoppoint-public-context"],
            "economy": ["gla-busyness-context-boundaries"],
            "utilities": ["tfl-road-disruptions-utility-works"],
            "civic_services": ["dfe-gias-public-establishment-context"],
        },
    )
    update_city_json(
        "nyc",
        {
            "transport_stops": "web/data/city-atlas/cities/nyc/transport_stops_2026.geojson",
            "economy_anchors": "web/data/city-atlas/cities/nyc/economy_anchors_2026.geojson",
            "economy_anchors_2026": "web/data/city-atlas/cities/nyc/economy_anchors_2026.geojson",
            "economy_context_2026": "web/data/city-atlas/cities/nyc/economy_context_2026.geojson",
            "utility_network": "web/data/city-atlas/cities/nyc/utility_network_2026.geojson",
            "utility_network_2026": "web/data/city-atlas/cities/nyc/utility_network_2026.geojson",
            "utility_context_2026": "web/data/city-atlas/cities/nyc/utility_context_2026.geojson",
        },
        {
            "transport": ["mta-gtfs-static-public-context"],
            "economy": ["nyc-sbs-business-improvement-districts", "nyc-dcwp-issued-business-licenses"],
            "utilities": ["nyc-dot-street-construction-permits-current", "nyc-dot-street-construction-permits-legacy"],
        },
    )

    london_stop_count = len(london_stops) if not economy_utilities_only else len(read_json(LONDON_DIR / "transport_stops_2026.geojson", {}).get("features") or [])
    nyc_stop_count = len(nyc_stops) if not economy_utilities_only else len(read_json(NYC_DIR / "transport_stops_2026.geojson", {}).get("features") or [])
    london_civic_count = len(london_civic_features) if not economy_utilities_only else len(read_json(LONDON_DIR / "civic_services_2026.geojson", {}).get("features") or [])
    print(
        "[public-context] Done: "
        f"London stops={london_stop_count}, London economy={len(london_economy_features)}, London utility={len(london_utility_features)}, London civic={london_civic_count}, "
        f"NYC stops={nyc_stop_count}, NYC economy={len(nyc_economy_features)}, NYC utility={len(nyc_utility_features)}"
    )


if __name__ == "__main__":
    main()
