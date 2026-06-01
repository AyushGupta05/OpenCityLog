#!/usr/bin/env python3
"""Expand London/NYC city-atlas event seeds from official/open source rows.

The source inventory identifies the source families to use. This script turns several of
those families into row-level, source-backed event records for the OpenCityLog atlas:
- London: Planning Data England brownfield/designation records inside London LPAs,
  London Fire Brigade incidents, TfL road disruptions.
- NYC: DOB permits, street-construction permits, certificates of occupancy, ZAP projects,
  historical permitted events, HPD affordable housing, capital/public works, parks,
  tree-census records, and bounded 311/collision samples.

It deliberately stores only non-sensitive fields needed for atlas provenance and does
not persist phone numbers, owner names, permittee contact details, or credentials.
"""
from __future__ import annotations

import csv
import hashlib
import http.cookiejar
import json
import re
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from datetime import date as date_cls
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DISCOVERY = ROOT / "data-discovery"
RAW = DISCOVERY / "raw_metadata"
RAW.mkdir(parents=True, exist_ok=True)

USER_AGENT = "OpenCityLog-event-expander/1.0 (+local research script)"
LONDON_BOUNDS = (-0.5103, 51.2868, 0.334, 51.6919)
NYC_BOUNDS = (-74.2591, 40.4774, -73.7004, 40.9176)
LONDON_DATAHUB_SEARCH_URL = "https://planningdata.london.gov.uk/api-guest/applications/_search"
LONDON_DATAHUB_SOURCE_URL = "https://planningdata.london.gov.uk/api-guest/applications/_source"
LONDON_DATAHUB_ALLOW_HEADER = "be2rmRnt&"

GENERATED_PREFIXES = (
    "lon_brownfield_",
    "lon_planning_datahub_application_",
    "lon_planning_designation_",
    "lon_lfb_incident_",
    "lon_dft_road_collision_",
    "lon_hmlr_price_paid_",
    "lon_hmlr_ukhpi_",
    "lon_fsa_fhrs_rating_",
    "lon_police_street_crime_",
    "lon_police_stop_search_",
    "lon_tfl_disruption_",
    "nyc_dob_permit_",
    "nyc_street_permit_",
    "nyc_street_permit_legacy_",
    "nyc_street_network_change_",
    "nyc_lpc_individual_landmark_",
    "nyc_lpc_historic_district_",
    "nyc_fdny_fire_incident_",
    "nyc_certificate_occupancy_",
    "nyc_dob_now_certificate_occupancy_",
    "nyc_dob_now_approved_permit_",
    "nyc_dob_now_job_filing_",
    "nyc_zap_project_",
    "nyc_housing_database_project_",
    "nyc_hpd_affordable_housing_building_",
    "nyc_hpd_affordable_housing_project_",
    "nyc_lpc_permit_",
    "nyc_capital_project_status_",
    "nyc_capital_project_tracker_",
    "nyc_ddc_infrastructure_project_",
    "nyc_ddc_public_building_project_",
    "nyc_street_closure_construction_",
    "nyc_parks_property_",
    "nyc_street_tree_census_",
    "nyc_permitted_event_",
    "nyc_311_service_request_",
    "nyc_collision_crash_",
)

LONDON_PLANNING_DESIGNATION_DATASETS = [
    {
        "dataset": "conservation-area",
        "source_id": "lon-extra-planning-data-conservation-areas",
        "title_prefix": "Conservation area record",
        "bucket": "planning/development/heritage",
        "summary_label": "conservation-area designation",
        "limit_per_lpa": 220,
    },
    {
        "dataset": "listed-building-outline",
        "source_id": "lon-extra-planning-data-listed-building-outlines",
        "title_prefix": "Listed building outline",
        "bucket": "planning/development/heritage",
        "summary_label": "listed-building outline",
        "limit_per_lpa": 180,
    },
    {
        "dataset": "heritage-at-risk",
        "source_id": "lon-extra-planning-data-heritage-at-risk",
        "title_prefix": "Heritage at risk record",
        "bucket": "planning/development/heritage",
        "summary_label": "heritage-at-risk record",
        "limit_per_lpa": 120,
    },
    {
        "dataset": "local-plan-boundary",
        "source_id": "lon-extra-planning-data-local-plan-boundaries",
        "title_prefix": "Local plan boundary",
        "bucket": "planning/policy/local plan",
        "summary_label": "local-plan boundary",
        "limit_per_lpa": 60,
    },
    {
        "dataset": "article-4-direction",
        "source_id": "lon-extra-planning-data-article-4-directions",
        "title_prefix": "Article 4 Direction",
        "bucket": "planning/policy/permitted development controls",
        "summary_label": "article-4 direction",
        "limit_per_lpa": 80,
        "max_pages_per_lpa": 2,
        "enforce_limit_per_lpa": True,
    },
    {
        "dataset": "tree-preservation-order",
        "source_id": "lon-extra-planning-data-tree-preservation-orders",
        "title_prefix": "Tree preservation order",
        "bucket": "planning/environment/trees",
        "summary_label": "tree-preservation order",
        "limit_per_lpa": 240,
        "max_pages_per_lpa": 2,
        "enforce_limit_per_lpa": True,
    },
    {
        "dataset": "tree-preservation-zone",
        "source_id": "lon-extra-planning-data-tree-preservation-zones",
        "title_prefix": "Tree preservation zone",
        "bucket": "planning/environment/trees",
        "summary_label": "tree-preservation zone",
        "limit_per_lpa": 180,
        "max_pages_per_lpa": 2,
        "enforce_limit_per_lpa": True,
    },
]

LONDON_LPA_NAMES = {
    "City of London", "Camden", "Hackney", "Hammersmith and Fulham", "Haringey", "Islington",
    "Kensington and Chelsea", "Lambeth", "Lewisham", "Newham", "Southwark", "Tower Hamlets",
    "Wandsworth", "Westminster", "Barking and Dagenham", "Barnet", "Bexley", "Brent",
    "Bromley", "Croydon", "Ealing", "Enfield", "Greenwich", "Harrow", "Havering",
    "Hillingdon", "Hounslow", "Kingston upon Thames", "Merton", "Redbridge",
    "Richmond upon Thames", "Sutton", "Waltham Forest", "London Legacy Development Corporation",
}

LONDON_ONS_BOROUGHS = {
    "E09000001": "City of London",
    "E09000002": "Barking and Dagenham",
    "E09000003": "Barnet",
    "E09000004": "Bexley",
    "E09000005": "Brent",
    "E09000006": "Bromley",
    "E09000007": "Camden",
    "E09000008": "Croydon",
    "E09000009": "Ealing",
    "E09000010": "Enfield",
    "E09000011": "Greenwich",
    "E09000012": "Hackney",
    "E09000013": "Hammersmith and Fulham",
    "E09000014": "Haringey",
    "E09000015": "Harrow",
    "E09000016": "Havering",
    "E09000017": "Hillingdon",
    "E09000018": "Hounslow",
    "E09000019": "Islington",
    "E09000020": "Kensington and Chelsea",
    "E09000021": "Kingston upon Thames",
    "E09000022": "Lambeth",
    "E09000023": "Lewisham",
    "E09000024": "Merton",
    "E09000025": "Newham",
    "E09000026": "Redbridge",
    "E09000027": "Richmond upon Thames",
    "E09000028": "Southwark",
    "E09000029": "Sutton",
    "E09000030": "Tower Hamlets",
    "E09000031": "Waltham Forest",
    "E09000032": "Wandsworth",
    "E09000033": "Westminster",
}

DFT_ROAD_COLLISION_URLS = [
    {
        "label": "Road Safety Data - Collisions - last 5 years",
        "url": "https://data.dft.gov.uk/road-accidents-safety-data/dft-road-casualty-statistics-collision-last-5-years.csv",
        "provisional": False,
    },
    {
        "label": "Road Safety Data - Collisions - provisional 2025",
        "url": "https://data.dft.gov.uk/road-accidents-safety-data/dft-road-casualty-statistics-collision-provisional-2025.csv",
        "provisional": True,
    },
]

DFT_COLLISION_SEVERITY = {
    "1": "fatal",
    "2": "serious",
    "3": "slight",
}

HMLR_PRICE_PAID_SOURCE_ID = "lon-extra-hm-land-registry-price-paid-data"
HMLR_PRICE_PAID_LANDING_URL = "https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads"
HMLR_PRICE_PAID_GUIDANCE_URL = "https://www.gov.uk/guidance/about-the-price-paid-data"
HMLR_PRICE_PAID_FILE_URLS = [
    {"year": year, "url": f"https://price-paid-data.publicdata.landregistry.gov.uk/pp-{year}.csv"}
    for year in range(1995, datetime.now(timezone.utc).year + 1)
]
UKHPI_SOURCE_ID = "lon-extra-uk-house-price-index"
UKHPI_RELEASE_PAGE = "https://www.gov.uk/government/statistical-data-sets/uk-house-price-index-data-downloads-february-2026"
UKHPI_ABOUT_PAGE = "https://www.gov.uk/government/publications/about-the-uk-house-price-index/about-the-uk-house-price-index"
UKHPI_FULL_FILE_URL = "https://publicdata.landregistry.gov.uk/market-trend-data/house-price-index-data/UK-HPI-full-file-2026-02.csv"
UKHPI_RELEASE_MONTH = "2026-02"
FHRS_SOURCE_ID = "lon-extra-food-hygiene-rating-scheme-api"
FHRS_API_ROOT = "https://api.ratings.food.gov.uk"
FHRS_HELP_URL = "https://api.ratings.food.gov.uk/help"
FHRS_DATA_PAGE = "https://www.food.gov.uk/uk-food-hygiene-rating-data-api"
LONDON_BOROUGH_POINTS = {
    "Barking and Dagenham": (0.1340, 51.5450),
    "Barnet": (-0.2002, 51.6538),
    "Bexley": (0.1505, 51.4549),
    "Brent": (-0.2817, 51.5588),
    "Bromley": (0.0148, 51.4039),
    "Camden": (-0.1426, 51.5423),
    "City of London": (-0.0922, 51.5155),
    "Croydon": (-0.0977, 51.3762),
    "Ealing": (-0.3089, 51.5130),
    "Enfield": (-0.0815, 51.6523),
    "Greenwich": (0.0059, 51.4892),
    "Hackney": (-0.0553, 51.5450),
    "Hammersmith and Fulham": (-0.2195, 51.4927),
    "Haringey": (-0.1119, 51.5906),
    "Harrow": (-0.3414, 51.5898),
    "Havering": (0.1837, 51.5779),
    "Hillingdon": (-0.4506, 51.5441),
    "Hounslow": (-0.3618, 51.4673),
    "Islington": (-0.1022, 51.5380),
    "Kensington and Chelsea": (-0.1936, 51.5009),
    "Kingston upon Thames": (-0.3064, 51.4123),
    "Lambeth": (-0.1180, 51.4607),
    "Lewisham": (-0.0117, 51.4452),
    "Merton": (-0.1948, 51.4109),
    "Newham": (0.0352, 51.5255),
    "Redbridge": (0.0741, 51.5590),
    "Richmond upon Thames": (-0.3055, 51.4479),
    "Southwark": (-0.0804, 51.5035),
    "Sutton": (-0.1945, 51.3618),
    "Tower Hamlets": (-0.0293, 51.5155),
    "Waltham Forest": (-0.0134, 51.5908),
    "Wandsworth": (-0.1927, 51.4571),
    "Westminster": (-0.1372, 51.4975),
}
HMLR_PROPERTY_TYPES = {
    "D": "detached",
    "S": "semi-detached",
    "T": "terraced",
    "F": "flat/maisonette",
    "O": "other property type",
}
HMLR_NEW_BUILD = {
    "Y": "newly built",
    "N": "established",
}
HMLR_TENURES = {
    "F": "freehold",
    "L": "leasehold",
}
HMLR_PPD_CATEGORIES = {
    "A": "standard price paid entry",
    "B": "additional price paid entry",
}
LONDON_ADMIN_NAME_BY_KEY = {
    re.sub(r"[^A-Z0-9]+", " ", name.upper()).strip(): name
    for name in set(LONDON_ONS_BOROUGHS.values()) | LONDON_LPA_NAMES
}
LONDON_ADMIN_NAME_BY_KEY.update({
    "CITY OF LONDON CORPORATION": "City of London",
    "CITY OF WESTMINSTER": "Westminster",
    "WESTMINSTER CITY": "Westminster",
    "ROYAL BOROUGH OF KENSINGTON AND CHELSEA": "Kensington and Chelsea",
    "HAMMERSMITH FULHAM": "Hammersmith and Fulham",
    "BARKING DAGENHAM": "Barking and Dagenham",
    "KINGSTON UPON THAMES": "Kingston upon Thames",
})


def fetch_json(url: str, timeout: int = 45, attempts: int = 3) -> Any:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8", "replace"))
        except Exception as exc:  # noqa: BLE001 - keep expansion resilient
            last_error = exc
            if attempt < attempts - 1:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def fetch_json_post(url: str, payload: dict[str, Any], headers: dict[str, str] | None = None, timeout: int = 45, attempts: int = 3) -> Any:
    body = json.dumps(payload).encode("utf-8")
    request_headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Content-Type": "application/json",
        **(headers or {}),
    }
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, data=body, headers=request_headers, method="POST")
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8", "replace"))
        except Exception as exc:  # noqa: BLE001 - keep expansion resilient
            last_error = exc
            if attempt < attempts - 1:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed to post {url}: {last_error}")


def fetch_fhrs_json(url: str, timeout: int = 45, attempts: int = 3) -> Any:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "x-api-version": "2",
    }
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8", "replace"))
        except Exception as exc:  # noqa: BLE001 - source APIs can transiently fail.
            last_error = exc
            if attempt < attempts - 1:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed to fetch FHRS JSON {url}: {last_error}")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    with tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        delete=False,
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
    ) as handle:
        handle.write(text)
        temp_path = Path(handle.name)
    for attempt in range(5):
        try:
            temp_path.replace(path)
            return
        except PermissionError:
            if attempt < 4:
                time.sleep(0.5 * (attempt + 1))
                continue
            path.write_text(text, encoding="utf-8")
            try:
                temp_path.unlink()
            except FileNotFoundError:
                pass
            return


def slug(value: str, max_len: int = 80) -> str:
    text = re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")
    return text[:max_len].strip("-") or "record"


def parse_point_wkt(value: str | None) -> tuple[float, float] | None:
    if not value:
        return None
    match = re.match(r"POINT \(([-0-9.]+) ([-0-9.]+)\)", value)
    if not match:
        return None
    return float(match.group(1)), float(match.group(2))


def point_from_geojson(geometry: Any) -> tuple[float, float] | None:
    """Return an approximate lon/lat centroid from a GeoJSON-like geometry."""
    coords: list[tuple[float, float]] = []

    def collect(value: Any) -> None:
        if isinstance(value, list) and len(value) >= 2 and all(isinstance(n, (int, float)) for n in value[:2]):
            lon, lat = float(value[0]), float(value[1])
            if -180 <= lon <= 180 and -90 <= lat <= 90:
                coords.append((lon, lat))
            return
        if isinstance(value, list):
            for item in value:
                collect(item)

    if isinstance(geometry, dict):
        if geometry.get("type") == "Point":
            point = geometry.get("coordinates")
            if isinstance(point, list) and len(point) >= 2:
                return float(point[0]), float(point[1])
        collect(geometry.get("coordinates"))
    elif isinstance(geometry, list):
        collect(geometry)
    if not coords:
        return None
    return (
        round(sum(lon for lon, _ in coords) / len(coords), 6),
        round(sum(lat for _, lat in coords) / len(coords), 6),
    )


def in_bounds(point: tuple[float, float] | None, bounds: tuple[float, float, float, float]) -> bool:
    if not point:
        return False
    lon, lat = point
    return bounds[0] <= lon <= bounds[2] and bounds[1] <= lat <= bounds[3]


def first_date(*values: Any) -> str | None:
    for value in values:
        if value:
            text = str(value).strip()
            if not text:
                continue
            # Socrata/ISO datetimes: keep date only.
            if "T" in text and re.match(r"\d{4}-\d{2}-\d{2}T", text):
                return text.split("T", 1)[0]
            # NYC legacy dates like MM/DD/YYYY.
            m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})", text)
            if m:
                return f"{int(m.group(3)):04d}-{int(m.group(1)):02d}-{int(m.group(2)):02d}"
            # NYC DOB NOW dates like 09/02/25  1:24 PM.
            m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{2})\b", text)
            if m:
                yy = int(m.group(3))
                year = 2000 + yy if yy < 70 else 1900 + yy
                return f"{year:04d}-{int(m.group(1)):02d}-{int(m.group(2)):02d}"
            if re.match(r"\d{4}-\d{2}-\d{2}", text):
                return text[:10]
            if re.match(r"\d{4}$", text):
                return text
    return None


def first_dmy_date(*values: Any) -> str | None:
    """Parse UK-style source dates before falling back to ISO/year parsing."""
    for value in values:
        if not value:
            continue
        text = str(value).strip()
        if not text:
            continue
        if "T" in text and re.match(r"\d{4}-\d{2}-\d{2}T", text):
            return text.split("T", 1)[0]
        if re.match(r"\d{4}-\d{2}-\d{2}", text):
            return text[:10]
        m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})", text)
        if m:
            return f"{int(m.group(3)):04d}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
        m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{2})\b", text)
        if m:
            yy = int(m.group(3))
            year = 2000 + yy if yy < 70 else 1900 + yy
            return f"{year:04d}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
        if re.match(r"\d{4}$", text):
            return text
    return None


def date_from_iso(value: str) -> date_cls | None:
    text = str(value or "").strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}", text):
        try:
            return date_cls.fromisoformat(text[:10])
        except ValueError:
            return None
    if re.match(r"^\d{4}$", text):
        try:
            return date_cls(int(text), 1, 1)
        except ValueError:
            return None
    return None


def not_future_date(value: str | None) -> bool:
    parsed = date_from_iso(value or "")
    return bool(parsed and parsed <= datetime.now(timezone.utc).date())


def first_not_future_date(*values: Any) -> str | None:
    for value in values:
        candidate = first_date(value)
        if candidate and not_future_date(candidate):
            return candidate
    return None


def excel_serial_date(value: Any) -> str | None:
    try:
        if value in (None, ""):
            return None
        days = int(float(str(value)))
        if days < 1:
            return None
        return (date_cls(1899, 12, 30) + timedelta(days=days)).isoformat()
    except Exception:
        return None


def lfb_event_date(value: Any, year: Any = None) -> str | None:
    candidate = excel_serial_date(value)
    if candidate:
        return candidate
    return first_dmy_date(value, year)


def london_datahub_record_url(record_id: Any) -> str:
    return f"{LONDON_DATAHUB_SOURCE_URL}/{urllib.parse.quote(str(record_id), safe='')}"


def clean_text(value: Any, max_len: int = 220) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return text[:max_len].rstrip()


def event_record(**kwargs: Any) -> dict[str, Any]:
    return {k: v for k, v in kwargs.items() if v not in (None, "", [], {})}


def planning_entity_url(entity: Any) -> str | None:
    if entity in (None, ""):
        return None
    return f"https://www.planning.data.gov.uk/entity/{entity}"


def socrata_row_url(dataset_id: str, field: str | None, value: Any) -> str:
    if not field or value in (None, ""):
        return f"https://data.cityofnewyork.us/api/views/{dataset_id}"
    return "https://data.cityofnewyork.us/resource/" + dataset_id + ".json?" + urllib.parse.urlencode({field: str(value)})


def int_text(value: Any) -> str:
    try:
        if value in (None, ""):
            return "unknown"
        return f"{int(float(str(value).replace(',', ''))):,}"
    except Exception:
        return clean_text(value, 40) or "unknown"


def load_london_lpas() -> list[dict[str, Any]]:
    url = "https://www.planning.data.gov.uk/entity.json?dataset=local-planning-authority&limit=500&field=name&field=entity"
    payload = fetch_json(url)
    lpas = []
    for entity in payload.get("entities", []):
        name = str(entity.get("name", "")).replace(" LPA", "")
        if name in LONDON_LPA_NAMES:
            lpas.append({"entity": entity["entity"], "name": name})
    return sorted(lpas, key=lambda row: row["name"])


def fetch_planning_entities(
    dataset: str,
    lpa: dict[str, Any],
    *,
    relation: str,
    page_limit: int = 500,
    timeout: int = 90,
    max_pages: int = 80,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Fetch all Planning Data entity pages for one London LPA/dataset query."""
    first_url = (
        "https://www.planning.data.gov.uk/entity.json?"
        + urllib.parse.urlencode({
            "dataset": dataset,
            "geometry_entity": str(lpa["entity"]),
            "geometry_relation": relation,
            "limit": str(page_limit),
        })
    )
    url: str | None = first_url
    rows: list[dict[str, Any]] = []
    page_count = 0
    count: int | None = None
    first_page_count = 0
    last_url = first_url
    while url and page_count < max_pages:
        payload = fetch_json(url, timeout=timeout)
        page_rows = payload.get("entities", [])
        if count is None:
            count = payload.get("count")
            first_page_count = len(page_rows)
        rows.extend(page_rows)
        page_count += 1
        last_url = url
        next_url = payload.get("links", {}).get("next")
        url = next_url if next_url and next_url != last_url else None
    return rows, {
        **lpa,
        "count": count,
        "first_page_count": first_page_count,
        "sample_count": len(rows),
        "page_count": page_count,
        "page_limit": page_limit,
        "truncated": bool(url),
        "first_url": first_url,
        "last_url": last_url,
    }


def fetch_london_brownfield(max_events: int = 10000) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    lpas = load_london_lpas()
    events: list[dict[str, Any]] = []
    retrieved_at = utc_now_iso()
    raw_summary: dict[str, Any] = {"retrieved_at": retrieved_at, "source": "planning.data.gov.uk brownfield-land", "lpas": [], "skipped_without_source_date": 0}
    seen: set[int] = set()
    for lpa in lpas:
        if len(events) >= max_events:
            break
        try:
            rows, lpa_summary = fetch_planning_entities("brownfield-land", lpa, relation="within")
        except Exception as exc:  # noqa: BLE001
            raw_summary["lpas"].append({**lpa, "error": str(exc)})
            continue
        skipped_without_date = 0
        for row in rows:
            if len(events) >= max_events:
                break
            entity = row.get("entity")
            if entity in seen:
                continue
            point = parse_point_wkt(row.get("point"))
            if not in_bounds(point, LONDON_BOUNDS):
                continue
            seen.add(entity)
            lon, lat = point
            address = clean_text(row.get("site-address") or row.get("address-text") or row.get("name"), 120)
            dwellings = row.get("maximum-net-dwellings") or row.get("minimum-net-dwellings")
            permission_status = row.get("planning-permission-status") or "brownfield register record"
            date = first_date(row.get("entry-date"), row.get("start-date"), row.get("planning-permission-date"), row.get("end-date"))
            if not date:
                skipped_without_date += 1
                raw_summary["skipped_without_source_date"] += 1
                continue
            title_bits = ["Brownfield development site", address or str(row.get("reference") or entity)]
            if dwellings:
                title_bits.append(f"up to {dwellings} homes")
            title = ": ".join(title_bits[:2]) + (f" ({title_bits[2]})" if len(title_bits) > 2 else "")
            events.append(event_record(
                event_id=f"lon_brownfield_{entity}",
                title=title,
                date=date,
                bucket="planning/development/housing",
                area=lpa["name"],
                location=address,
                latitude=lat,
                longitude=lon,
                source_ids=["lon-extra-planning-data-brownfield-land"],
                source_record_id=str(entity),
                source_url=planning_entity_url(entity),
                source_retrieved_at=retrieved_at,
                source_dataset_id="brownfield-land",
                summary=clean_text(row.get("notes") or f"{permission_status} brownfield land register record in {lpa['name']}.", 420),
                observed_change=clean_text(f"Planning/development evidence record: {permission_status}; brownfield land capacity marker" + (f" for {dwellings} net dwellings" if dwellings else "") + ".", 260),
                confidence="documented",
                limitations="Planning Data is authoritative but local-authority coverage and field completeness vary; use the linked source record for final application-level validation.",
            ))
        raw_summary["lpas"].append({**lpa_summary, "added": len([e for e in events if e.get("area") == lpa["name"]]), "skipped_without_source_date": skipped_without_date})
    return events, raw_summary


def fetch_london_datahub_applications(max_events: int = 1400) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Fetch source-backed London planning application lifecycle events.

    The Datahub is valuable for observed application, permission, commencement and
    completion records. Its London Datastore licence is currently labelled "Not
    Specified", so these rows keep only public planning/provenance fields and carry a
    visible reuse caveat into the generated event records.
    """
    retrieved_at = utc_now_iso()
    today_uk = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    fields = [
        "id",
        "lpa_name",
        "lpa_app_no",
        "last_updated",
        "valid_date",
        "decision_date",
        "decision",
        "status",
        "application_type",
        "application_type_full",
        "site_name",
        "site_number",
        "street_name",
        "locality",
        "postcode",
        "borough",
        "development_type",
        "description",
        "centroid",
        "actual_commencement_date",
        "actual_completion_date",
        "url_planning_app",
        "application_details.total_gia_gained",
        "application_details.total_gia_lost",
        "application_details.residential_details.total_no_proposed_residential_units",
        "application_details.residential_details.total_no_existing_residential_units",
        "application_details.residential_details.total_no_proposed_residential_affordable_units",
    ]
    queries = [
        {
            "label": "completed_major_developments",
            "stage": "completed",
            "date_field": "actual_completion_date",
            "size": 700,
            "body": {
                "size": 700,
                "query": {
                    "bool": {
                        "must": [
                            {"range": {"actual_completion_date": {"gte": "01/01/2024", "lte": today_uk}}},
                            {"range": {"application_details.total_gia_gained": {"gte": 1000}}},
                        ]
                    }
                },
                "sort": [{"actual_completion_date": {"order": "asc"}}],
                "_source": fields,
            },
        },
        {
            "label": "large_recent_applications",
            "stage": "validated",
            "date_field": "valid_date",
            "size": 700,
            "body": {
                "size": 700,
                "query": {
                    "bool": {
                        "must": [
                            {"range": {"valid_date": {"gte": "01/01/2024", "lte": today_uk}}},
                            {"range": {"application_details.total_gia_gained": {"gte": 5000}}},
                        ]
                    }
                },
                "sort": [{"valid_date": {"order": "asc"}}],
                "_source": fields,
            },
        },
        {
            "label": "recent_decisions_all_lpas",
            "stage": "decided",
            "date_field": "decision_date",
            "size": 5000,
            "body": {
                "size": 5000,
                "query": {
                    "bool": {
                        "must": [
                            {"range": {"decision_date": {"gte": "01/01/2023", "lte": today_uk}}},
                        ]
                    }
                },
                "sort": [{"decision_date": {"order": "desc"}}],
                "_source": fields,
            },
        },
        {
            "label": "recent_validated_all_lpas",
            "stage": "validated",
            "date_field": "valid_date",
            "size": 5000,
            "body": {
                "size": 5000,
                "query": {
                    "bool": {
                        "must": [
                            {"range": {"valid_date": {"gte": "01/01/2025", "lte": today_uk}}},
                        ]
                    }
                },
                "sort": [{"valid_date": {"order": "desc"}}],
                "_source": fields,
            },
        },
    ]
    raw_summary: dict[str, Any] = {
        "retrieved_at": retrieved_at,
        "source": LONDON_DATAHUB_SEARCH_URL,
        "licence": "Not specified on London Datastore; review before redistributing full rows.",
        "queries": {},
        "skipped_without_source_date": 0,
        "skipped_without_point": 0,
        "skipped_future_date": 0,
        "skipped_without_record_id": 0,
    }
    events: list[dict[str, Any]] = []
    seen: set[str] = set()

    def details_value(row: dict[str, Any], dotted: str) -> Any:
        current: Any = row
        for part in dotted.split("."):
            if not isinstance(current, dict):
                return None
            current = current.get(part)
        return current

    def add_stage_event(row: dict[str, Any], stage: str, date_field: str) -> bool:
        rid = row.get("id") or row.get("lpa_app_no")
        if not rid:
            raw_summary["skipped_without_record_id"] += 1
            return False
        key = f"{stage}:{rid}"
        if key in seen:
            return False
        centroid = row.get("centroid") if isinstance(row.get("centroid"), dict) else {}
        lon, lat = safe_float(centroid.get("lon")), safe_float(centroid.get("lat"))
        if lon is None or lat is None or not in_bounds((lon, lat), LONDON_BOUNDS):
            raw_summary["skipped_without_point"] += 1
            return False
        if stage == "completed":
            event_date = first_dmy_date(row.get("actual_completion_date"))
        elif stage == "commenced":
            event_date = first_dmy_date(row.get("actual_commencement_date"))
        elif stage == "decided":
            event_date = first_dmy_date(row.get("decision_date"))
        else:
            event_date = first_dmy_date(row.get("valid_date"))
        if not event_date:
            raw_summary["skipped_without_source_date"] += 1
            return False
        if not not_future_date(event_date):
            raw_summary["skipped_future_date"] += 1
            return False
        site = clean_text(row.get("site_name") or " ".join(str(v or "") for v in [row.get("site_number"), row.get("street_name")]).strip() or rid, 110)
        lpa = clean_text(row.get("lpa_name") or row.get("borough") or "London", 70)
        description = clean_text(row.get("description"), 340)
        total_gia_gained = details_value(row, "application_details.total_gia_gained")
        total_gia_lost = details_value(row, "application_details.total_gia_lost")
        proposed_units = details_value(row, "application_details.residential_details.total_no_proposed_residential_units")
        existing_units = details_value(row, "application_details.residential_details.total_no_existing_residential_units")
        affordable_units = details_value(row, "application_details.residential_details.total_no_proposed_residential_affordable_units")
        stage_label = {
            "completed": "Development completion recorded",
            "commenced": "Development commencement recorded",
            "decided": "Planning decision recorded",
            "validated": "Planning application validated",
        }.get(stage, "Planning application record")
        metrics = []
        if total_gia_gained not in (None, ""):
            metrics.append(f"GIA gained {int_text(total_gia_gained)} sq m")
        if total_gia_lost not in (None, ""):
            metrics.append(f"GIA lost {int_text(total_gia_lost)} sq m")
        if proposed_units not in (None, ""):
            metrics.append(f"proposed homes {int_text(proposed_units)}")
        if existing_units not in (None, ""):
            metrics.append(f"existing homes {int_text(existing_units)}")
        if affordable_units not in (None, ""):
            metrics.append(f"proposed affordable homes {int_text(affordable_units)}")
        status_bits = [row.get("status"), row.get("decision"), row.get("application_type_full") or row.get("application_type")]
        status_text = "; ".join(clean_text(bit, 80) for bit in status_bits if bit)
        summary = "; ".join(part for part in [
            f"{stage_label} by {lpa}",
            f"application {row.get('lpa_app_no') or rid}",
            status_text,
            ", ".join(metrics),
            description,
        ] if part)
        events.append(event_record(
            event_id=f"lon_planning_datahub_application_{stage}_{slug(rid, 72)}",
            title=f"{stage_label}: {site}, {lpa}",
                date=event_date,
            bucket=f"planning/development/{stage}",
            area=lpa,
            location=clean_text(" ".join(str(v or "") for v in [site, row.get("street_name"), row.get("postcode")]).strip(), 160),
            latitude=lat,
            longitude=lon,
            source_ids=["gla-planning-datahub-applications"],
            source_record_id=str(rid),
            source_url=london_datahub_record_url(rid),
            source_retrieved_at=retrieved_at,
            source_dataset_id="gla-planning-datahub-applications",
            source_date_field=date_field,
            summary=clean_text(summary, 520),
            observed_change=clean_text(f"{stage_label} in the Planning London Datahub for {site}.", 240),
            confidence="documented",
            limitations="Planning London Datahub rows are administrative planning records. They do not prove occupancy, impact, or causation; borough completeness, backfill, and the dataset licence should be checked before formal reuse.",
        ))
        seen.add(key)
        return True

    for query in queries:
        try:
            payload = fetch_json_post(
                LONDON_DATAHUB_SEARCH_URL,
                query["body"],
                headers={"X-API-AllowRequest": LONDON_DATAHUB_ALLOW_HEADER},
                timeout=90,
            )
        except Exception as exc:  # noqa: BLE001
            raw_summary["queries"][query["label"]] = {"error": str(exc)}
            continue
        hits = payload.get("hits", {}).get("hits", [])
        added = 0
        for hit in hits:
            if len(events) >= max_events:
                break
            row = hit.get("_source", {})
            if add_stage_event(row, str(query["stage"]), str(query["date_field"])):
                added += 1
        raw_summary["queries"][query["label"]] = {
            "requested_size": query["size"],
            "available_total": payload.get("hits", {}).get("total"),
            "fetched": len(hits),
            "added": added,
            "date_field": query["date_field"],
            "stage": query["stage"],
        }
        if len(events) >= max_events:
            break
    raw_summary["event_count"] = len(events)
    return events, raw_summary


def fetch_london_planning_designations(max_events: int = 40000) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    lpas = load_london_lpas()
    events: list[dict[str, Any]] = []
    retrieved_at = utc_now_iso()
    raw_summary: dict[str, Any] = {
        "retrieved_at": retrieved_at,
        "source": "planning.data.gov.uk planning designation datasets",
        "datasets": {},
        "max_events": max_events,
        "skipped_without_source_date": 0,
    }
    seen: set[tuple[str, int]] = set()
    for config in LONDON_PLANNING_DESIGNATION_DATASETS:
        dataset = config["dataset"]
        dataset_events = 0
        dataset_summary: list[dict[str, Any]] = []
        dataset_skipped_without_date = 0
        for lpa in lpas:
            if len(events) >= max_events or dataset_events >= max_events:
                break
            try:
                rows, lpa_summary = fetch_planning_entities(
                    dataset,
                    lpa,
                    relation="intersects",
                    max_pages=int(config.get("max_pages_per_lpa", 80)),
                )
            except Exception as exc:  # noqa: BLE001
                dataset_summary.append({**lpa, "error": str(exc)})
                continue
            added_for_lpa = 0
            skipped_for_lpa = 0
            lpa_limit = int(config.get("limit_per_lpa", max_events)) if config.get("enforce_limit_per_lpa") else max_events
            for row in rows:
                if added_for_lpa >= lpa_limit:
                    break
                entity = row.get("entity")
                if entity is None or (dataset, int(entity)) in seen:
                    continue
                point = parse_point_wkt(row.get("point"))
                if not in_bounds(point, LONDON_BOUNDS):
                    continue
                date = first_date(row.get("start-date"), row.get("entry-date"), row.get("end-date"))
                if not date:
                    skipped_for_lpa += 1
                    dataset_skipped_without_date += 1
                    raw_summary["skipped_without_source_date"] += 1
                    continue
                seen.add((dataset, int(entity)))
                lon, lat = point
                name = clean_text(row.get("name") or row.get("reference") or entity, 120)
                reference = clean_text(row.get("reference") or row.get("listed-building") or "", 80)
                quality = clean_text(row.get("quality") or "quality not stated", 60)
                source_url = row.get("documentation-url") or row.get("document-url") or row.get("notes")
                events.append(event_record(
                    event_id=f"lon_planning_designation_{slug(dataset, 36)}_{entity}",
                    title=f"{config['title_prefix']}: {name}",
                    date=date,
                    bucket=config["bucket"],
                    area=lpa["name"],
                    location=name,
                    latitude=lat,
                    longitude=lon,
                    source_ids=[config["source_id"]],
                    source_record_id=str(entity),
                    source_url=source_url if isinstance(source_url, str) and source_url.startswith("http") else planning_entity_url(entity),
                    source_retrieved_at=retrieved_at,
                    source_dataset_id=dataset,
                    summary=clean_text(f"Planning Data {config['summary_label']} record {reference or entity}; quality {quality}; LPA {lpa['name']}.", 420),
                    observed_change=clean_text(f"Planning/protection evidence record for {name}; designation/effective date is taken from Planning Data fields where supplied.", 260),
                    confidence="documented",
                    limitations="Planning Data designation records show legal/planning status or constraints, not construction completion or direct physical change.",
                ))
                dataset_events += 1
                added_for_lpa += 1
                if len(events) >= max_events or dataset_events >= max_events:
                    break
            dataset_summary.append({**lpa_summary, "added": added_for_lpa, "skipped_without_source_date": skipped_for_lpa})
        raw_summary["datasets"][dataset] = {
            "event_count": dataset_events,
            "lpas": dataset_summary,
            "skipped_without_source_date": dataset_skipped_without_date,
            "truncated_by_event_cap": len(events) >= max_events or dataset_events >= max_events,
        }
    return events, raw_summary


def fetch_london_tfl_disruptions(max_events: int = 200) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    url = "https://api.tfl.gov.uk/Road/all/Disruption"
    rows = fetch_json(url, timeout=45)
    events: list[dict[str, Any]] = []
    retrieved_at = utc_now_iso()
    skipped_without_date = 0
    for row in rows[:max_events]:
        point = None
        if isinstance(row.get("geography"), dict):
            coords = row.get("geography", {}).get("coordinates")
            if isinstance(coords, list) and len(coords) >= 2:
                point = (float(coords[0]), float(coords[1]))
        if not point:
            point = parse_point_wkt(str(row.get("point", "")).replace(",", " "))
        lon, lat = point if point else (-0.1276, 51.5072)
        rid = row.get("id") or slug(row.get("comments") or row.get("location"))
        location = clean_text(row.get("location") or row.get("comments"), 120)
        category = clean_text(row.get("category") or row.get("subCategory") or "road disruption", 60)
        date = first_date(row.get("startDateTime"), row.get("currentUpdateDateTime"), row.get("lastModifiedTime"))
        if not date:
            skipped_without_date += 1
            continue
        events.append(event_record(
            event_id=f"lon_tfl_disruption_{slug(rid, 48)}",
            title=f"TfL road disruption: {location or rid}",
            date=date,
            bucket="transport/traffic/roadworks",
            area=location,
            location=location,
            latitude=lat,
            longitude=lon,
            source_ids=["tfl-road-disruptions", "lon-hue-tfl-routes-timetables-accessibility-demand-and-cycle-hire"],
            source_record_id=str(rid),
            source_url=url,
            source_retrieved_at=retrieved_at,
            source_dataset_id="tfl-road-disruptions",
            summary=clean_text(row.get("comments"), 420),
            observed_change=clean_text(f"{category} disruption with status {row.get('status','unknown')} and severity {row.get('severity','unknown')}.", 240),
            confidence="documented",
            limitations="TfL road disruption feed is live/current; records may change or expire and should be refreshed before formal analysis.",
        ))
    return events, {"retrieved_at": retrieved_at, "source": url, "record_count": len(rows), "event_count": len(events), "skipped_without_source_date": skipped_without_date, "sample": rows[:3]}


def download_temp(url: str, suffix: str) -> Path:
    target = Path(tempfile.gettempdir()) / f"open_citylog_{slug(url, 48)}_{int(time.time())}{suffix}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=300) as response, target.open("wb") as handle:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            handle.write(chunk)
    return target


def xlsx_column_index(cell_ref: str) -> int:
    letters = re.match(r"([A-Z]+)", str(cell_ref or ""))
    if not letters:
        return 0
    result = 0
    for char in letters.group(1):
        result = result * 26 + (ord(char) - ord("A") + 1)
    return result


def xlsx_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
    strings: list[str] = []
    with archive.open("xl/sharedStrings.xml") as handle:
        for _, elem in ET.iterparse(handle, events=("end",)):
            if elem.tag == ns + "si":
                strings.append("".join(t.text or "" for t in elem.iter(ns + "t")))
                elem.clear()
    return strings


def iter_xlsx_dict_rows(path: Path):
    ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
    with zipfile.ZipFile(path) as archive:
        shared = xlsx_shared_strings(archive)
        worksheet = next((name for name in archive.namelist() if name.startswith("xl/worksheets/sheet")), "xl/worksheets/sheet1.xml")
        headers: list[str] | None = None
        with archive.open(worksheet) as handle:
            for _, row in ET.iterparse(handle, events=("end",)):
                if row.tag != ns + "row":
                    continue
                values: dict[int, str] = {}
                for cell in row.findall(ns + "c"):
                    idx = xlsx_column_index(cell.attrib.get("r", ""))
                    if not idx:
                        continue
                    cell_type = cell.attrib.get("t")
                    value_node = cell.find(ns + "v")
                    value = value_node.text if value_node is not None else ""
                    if cell_type == "s" and value != "":
                        value = shared[int(value)]
                    elif cell_type == "inlineStr":
                        value = "".join(t.text or "" for t in cell.iter(ns + "t"))
                    values[idx] = value or ""
                row.clear()
                if headers is None:
                    max_idx = max(values.keys() or [0])
                    headers = [values.get(i, "") for i in range(1, max_idx + 1)]
                    continue
                yield {headers[i - 1]: values.get(i, "") for i in range(1, len(headers) + 1) if headers[i - 1]}


def make_lfb_event(row: dict[str, Any], source_url: str, retrieved_at: str) -> dict[str, Any] | None:
    lat = safe_float(row.get("Latitude"))
    lon = safe_float(row.get("Longitude"))
    if lat is None or lon is None or not in_bounds((lon, lat), LONDON_BOUNDS):
        return None
    incident_number = clean_text(row.get("IncidentNumber"), 60)
    if not incident_number:
        return None
    event_date = lfb_event_date(row.get("DateOfCall"), row.get("CalYear"))
    if not event_date or not not_future_date(event_date):
        return None
    incident_group = clean_text(row.get("IncidentGroup"), 80)
    stop_code = clean_text(row.get("StopCodeDescription"), 100)
    special = clean_text(row.get("SpecialServiceType"), 100)
    borough = clean_text(row.get("IncGeo_BoroughName") or row.get("ProperCase") or "London", 80)
    ward = clean_text(row.get("IncGeo_WardNameNew") or row.get("IncGeo_WardName"), 80)
    postcode = clean_text(row.get("Postcode_district") or row.get("Postcode_full"), 24)
    descriptor = special or stop_code or incident_group or "incident"
    return event_record(
        event_id=f"lon_lfb_incident_{slug(incident_number, 64)}",
        title=f"London Fire Brigade incident: {descriptor} in {borough}",
        date=event_date,
        bucket="public services/fire/emergency incidents",
        area=borough,
        location=f"{ward} {postcode}".strip(),
        latitude=lat,
        longitude=lon,
        source_ids=["london-fire-brigade-incidents"],
        source_record_id=incident_number,
        source_url=source_url,
        source_retrieved_at=retrieved_at,
        source_dataset_id="london-fire-brigade-incidents",
        summary=clean_text(f"LFB {incident_group} record: {stop_code or descriptor}; property category {row.get('PropertyCategory') or 'unknown'}; ward {ward}; first pump attendance {row.get('FirstPumpArriving_AttendanceTime') or 'not recorded'} seconds.", 420),
        observed_change=clean_text(f"Emergency service incident record ({descriptor}) with spatial evidence at borough/ward/postcode scale.", 260),
        confidence="documented",
        limitations="Fire incident rows are operational emergency-service events; use as urban-stress/context evidence, not direct built-form change evidence.",
    )


def fetch_london_lfb_incidents(max_per_year: int = 125) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Stream row-level London Fire Brigade incident files without storing raw downloads."""
    sources = [
        {
            "label": "2009-2017 CSV",
            "url": "https://data.london.gov.uk/download/em8xy/73728cf4-b70e-48e2-9b97-4e4341a2110d/LFB%20Incident%20data%20from%202009%20-%202017.xlsx",
            "kind": "csv",
            "years": range(2009, 2018),
        },
        {
            "label": "2018-2023 XLSX",
            "url": "https://data.london.gov.uk/download/em8xy/f5066d66-c7a3-415f-9629-026fbda61822/LFB%20Incident%20data%20from%202018%20-%202023.xlsx",
            "kind": "xlsx",
            "years": range(2018, 2024),
        },
        {
            "label": "2024 onwards XLSX",
            "url": "https://data.london.gov.uk/download/em8xy/58m/LFB%20Incident%20data%20from%202024%20onwards.xlsx",
            "kind": "xlsx",
            "years": range(2024, 2027),
        },
    ]
    target_years = {str(y) for y in range(2009, 2027)}
    counts = {year: 0 for year in target_years}
    events: list[dict[str, Any]] = []
    seen: set[str] = set()
    retrieved_at = utc_now_iso()
    raw_summary: dict[str, Any] = {
        "retrieved_at": retrieved_at,
        "source": "London Datastore London Fire Brigade incident records",
        "sampled_per_year": counts,
        "per_year_limit": max_per_year,
        "sources": {},
        "skipped_without_point_or_date": 0,
        "skipped_duplicate": 0,
    }

    def add_row(row: dict[str, Any], source_url: str, source_summary: dict[str, Any]) -> None:
        source_summary["read_rows"] += 1
        year = str(row.get("CalYear") or "")
        if year not in target_years or counts.get(year, 0) >= max_per_year:
            return
        event = make_lfb_event(row, source_url, retrieved_at)
        if not event:
            raw_summary["skipped_without_point_or_date"] += 1
            source_summary["skipped_without_point_or_date"] += 1
            return
        event_year = str(event["date"])[:4]
        if event_year not in target_years or counts.get(event_year, 0) >= max_per_year:
            return
        if event["event_id"] in seen:
            raw_summary["skipped_duplicate"] += 1
            source_summary["skipped_duplicate"] += 1
            return
        seen.add(event["event_id"])
        events.append(event)
        counts[event_year] = counts.get(event_year, 0) + 1
        source_summary["added"] += 1

    for source in sources:
        source_years = {str(year) for year in source["years"]}
        summary = {"kind": source["kind"], "url": source["url"], "read_rows": 0, "added": 0, "skipped_without_point_or_date": 0, "skipped_duplicate": 0}
        if source["kind"] == "csv":
            req = urllib.request.Request(source["url"], headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=240) as response:
                text_stream = (line.decode("utf-8-sig", "replace") for line in response)
                reader = csv.DictReader(text_stream)
                for row in reader:
                    add_row(row, source["url"], summary)
                    if all(counts.get(year, 0) >= max_per_year for year in source_years):
                        break
        else:
            temp_path = download_temp(source["url"], ".xlsx")
            row_iter = None
            try:
                row_iter = iter_xlsx_dict_rows(temp_path)
                for row in row_iter:
                    add_row(row, source["url"], summary)
                    if all(counts.get(year, 0) >= max_per_year for year in source_years):
                        break
            finally:
                if row_iter and hasattr(row_iter, "close"):
                    row_iter.close()
                try:
                    temp_path.unlink()
                except FileNotFoundError:
                    pass
        raw_summary["sources"][source["label"]] = summary
    raw_summary["event_count"] = len(events)
    raw_summary["sampled_per_year"] = counts
    return events, raw_summary


def hmlr_cell(value: Any) -> str:
    text = clean_text(value, 180)
    if text.startswith("="):
        text = text[1:].strip()
    return text.strip('"')


def normalize_postcode(value: Any) -> str:
    text = re.sub(r"\s+", "", hmlr_cell(value).upper())
    if len(text) <= 3:
        return text
    return f"{text[:-3]} {text[-3:]}"


def postcode_outcode(value: Any) -> str:
    postcode = normalize_postcode(value)
    return clean_text(postcode.split(" ", 1)[0], 12)


def london_admin_key(value: Any) -> str:
    return re.sub(r"[^A-Z0-9]+", " ", hmlr_cell(value).upper()).strip()


def canonical_london_admin_name(*values: Any) -> str | None:
    for value in values:
        key = london_admin_key(value)
        if not key:
            continue
        if key in LONDON_ADMIN_NAME_BY_KEY:
            return LONDON_ADMIN_NAME_BY_KEY[key]
        if key == "GREATER LONDON":
            continue
    return None


def hmlr_london_candidate(row: list[str]) -> bool:
    if len(row) < 15:
        return False
    district = london_admin_key(row[12])
    county = london_admin_key(row[13])
    town = london_admin_key(row[11])
    return (
        county == "GREATER LONDON"
        or district in LONDON_ADMIN_NAME_BY_KEY
        or town == "LONDON"
        or district == "CITY OF LONDON"
    )


def hmlr_price(value: Any) -> int | None:
    try:
        return int(float(hmlr_cell(value).replace(",", "")))
    except Exception:
        return None


def hmlr_price_band(value: Any) -> str:
    price = hmlr_price(value)
    if price is None:
        return "price not parsed"
    bands = [
        (150_000, "under GBP 150k"),
        (250_000, "GBP 150k-250k"),
        (500_000, "GBP 250k-500k"),
        (750_000, "GBP 500k-750k"),
        (1_000_000, "GBP 750k-1m"),
        (2_000_000, "GBP 1m-2m"),
    ]
    for threshold, label in bands:
        if price < threshold:
            return label
    return "GBP 2m+"


def hmlr_lookup_postcodes(postcodes: list[str]) -> dict[str, dict[str, Any]]:
    if not postcodes:
        return {}
    payload = fetch_json_post(
        "https://api.postcodes.io/postcodes",
        {"postcodes": postcodes[:100]},
        timeout=45,
        attempts=3,
    )
    results: dict[str, dict[str, Any]] = {}
    for item in payload.get("result") or []:
        query = normalize_postcode(item.get("query"))
        result = item.get("result")
        if isinstance(result, dict):
            results[query] = result
    return results


def hmlr_price_paid_candidate(row: list[str], year: int, source_url: str) -> dict[str, Any] | None:
    if len(row) < 15 or not hmlr_london_candidate(row):
        return None
    record_id = hmlr_cell(row[0]).strip("{}")
    event_date = first_date(hmlr_cell(row[2]))
    postcode = normalize_postcode(row[3])
    if not record_id or not event_date or not postcode:
        return None
    if not not_future_date(event_date):
        return None
    if event_date[:4] != str(year):
        return None
    return {
        "record_id": record_id,
        "date": event_date,
        "postcode": postcode,
        "outcode": postcode_outcode(postcode),
        "price_band": hmlr_price_band(row[1]),
        "property_type": HMLR_PROPERTY_TYPES.get(hmlr_cell(row[4]).upper(), hmlr_cell(row[4]) or "property"),
        "new_build": HMLR_NEW_BUILD.get(hmlr_cell(row[5]).upper(), hmlr_cell(row[5]) or "not stated"),
        "tenure": HMLR_TENURES.get(hmlr_cell(row[6]).upper(), hmlr_cell(row[6]) or "tenure not stated"),
        "district": canonical_london_admin_name(row[12], row[13], row[11]) or hmlr_cell(row[12]) or "London",
        "ppd_category": HMLR_PPD_CATEGORIES.get(hmlr_cell(row[14]).upper(), hmlr_cell(row[14]) or "not stated"),
        "source_url": source_url,
    }


def make_hmlr_price_paid_event(record: dict[str, Any], geo: dict[str, Any], retrieved_at: str) -> dict[str, Any] | None:
    lat = safe_float(geo.get("latitude"))
    lon = safe_float(geo.get("longitude"))
    if lat is None or lon is None or not in_bounds((lon, lat), LONDON_BOUNDS):
        return None
    borough = canonical_london_admin_name(geo.get("admin_district"), record.get("district")) or record.get("district") or "London"
    outcode = clean_text(geo.get("outcode") or record.get("outcode"), 12)
    ptype = clean_text(record.get("property_type"), 80)
    return event_record(
        event_id=f"lon_hmlr_price_paid_{slug(record['record_id'], 80)}",
        title=f"HMLR property transaction: {ptype} in {borough}",
        date=record["date"],
        bucket="housing/property market/transaction",
        area=borough,
        location=clean_text(f"{borough}; postcode district {outcode}", 160),
        latitude=lat,
        longitude=lon,
        source_ids=[HMLR_PRICE_PAID_SOURCE_ID],
        source_record_id=record["record_id"],
        source_url=record["source_url"],
        source_retrieved_at=retrieved_at,
        source_dataset_id=HMLR_PRICE_PAID_SOURCE_ID,
        source_date_field="transfer deed date",
        geometry_source="Postcodes.io postcode lookup; full postcode and address fields omitted before publication",
        geometry_precision="postcode-derived point, not a property parcel or exact building location",
        summary=clean_text(
            f"HM Land Registry Price Paid row: transfer deed date {record['date']}; "
            f"property type {ptype}; tenure {record['tenure']}; new-build status {record['new_build']}; "
            f"price band {record['price_band']}; category {record['ppd_category']}; postcode district {outcode}.",
            520,
        ),
        observed_change=clean_text(
            f"Recorded property sale transaction in {borough}, shown as housing-market evidence rather than a claim of physical redevelopment.",
            260,
        ),
        confidence="documented",
        limitations=(
            "Price Paid rows are transaction records, not evidence of construction, displacement, affordability, or causal neighbourhood change. "
            "The adapter omits PAON, SAON, street, locality, town/city, county, full postcode, and exact price; the point is an approximate postcode-derived location. "
            "HMLR excludes some transfers and can amend yearly files over time."
        ),
    )


def fetch_london_hmlr_price_paid(max_per_year: int = 800) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Fetch bounded HM Land Registry Price Paid rows for London from 1995 onward.

    HMLR Price Paid includes address fields with extra address-data conditions, so
    this adapter does not persist the raw address or full postcode. It uses the
    postcode only in-memory to create an approximate point, then writes outcode,
    borough, price band, row id, file URL, and caveats.
    """
    retrieved_at = utc_now_iso()
    events: list[dict[str, Any]] = []
    seen: set[str] = set()
    postcode_cache: dict[str, dict[str, Any] | None] = {}
    raw_summary: dict[str, Any] = {
        "retrieved_at": retrieved_at,
        "source": "HM Land Registry Price Paid Data",
        "landing_page": HMLR_PRICE_PAID_LANDING_URL,
        "guidance_page": HMLR_PRICE_PAID_GUIDANCE_URL,
        "license": "Open Government Licence v3.0; address data carries Ordnance Survey/Royal Mail third-party conditions described by HM Land Registry.",
        "attribution": "Contains HM Land Registry data Crown copyright and database right. This data is licensed under the Open Government Licence v3.0.",
        "geocoder": "https://api.postcodes.io/postcodes",
        "per_year_limit": max_per_year,
        "privacy_minimization": "Adapter omits PAON, SAON, street, locality, town/city, county, full postcode, and exact price before writing atlas events.",
        "omitted_fields": ["Postcode", "PAON", "SAON", "Street", "Locality", "Town/City", "County", "Exact price"],
        "files": {},
    }

    def process_pending(pending: list[dict[str, Any]], year_counts: dict[str, int], file_summary: dict[str, Any]) -> None:
        needed = sorted({record["postcode"] for record in pending if record["postcode"] not in postcode_cache})
        for start in range(0, len(needed), 100):
            batch = needed[start:start + 100]
            try:
                lookup = hmlr_lookup_postcodes(batch)
            except Exception as exc:  # noqa: BLE001
                file_summary["postcode_lookup_errors"] += 1
                file_summary.setdefault("postcode_lookup_error_samples", []).append(clean_text(exc, 180))
                lookup = {}
            for postcode in batch:
                postcode_cache[postcode] = lookup.get(postcode)
            if batch:
                time.sleep(0.05)
        for record in pending:
            year = record["date"][:4]
            if year_counts.get(year, 0) >= max_per_year:
                continue
            if record["record_id"] in seen:
                file_summary["skipped_duplicate"] += 1
                continue
            geo = postcode_cache.get(record["postcode"])
            if not geo:
                file_summary["skipped_without_postcode_point"] += 1
                continue
            event = make_hmlr_price_paid_event(record, geo, retrieved_at)
            if not event:
                file_summary["skipped_outside_bounds"] += 1
                continue
            seen.add(record["record_id"])
            events.append(event)
            year_counts[year] = year_counts.get(year, 0) + 1
            file_summary["added"] += 1

    for source in HMLR_PRICE_PAID_FILE_URLS:
        year = int(source["year"])
        url = source["url"]
        year_counts: dict[str, int] = {}
        file_summary = {
            "year": year,
            "url": url,
            "read_rows": 0,
            "candidate_london_rows": 0,
            "added": 0,
            "skipped_short_row": 0,
            "skipped_without_date_or_postcode": 0,
            "skipped_duplicate": 0,
            "skipped_without_postcode_point": 0,
            "skipped_outside_bounds": 0,
            "postcode_lookup_errors": 0,
        }
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=240) as response:
                text_stream = (line.decode("utf-8-sig", "replace") for line in response)
                reader = csv.reader(text_stream)
                pending: list[dict[str, Any]] = []
                for row in reader:
                    file_summary["read_rows"] += 1
                    if len(row) < 15:
                        file_summary["skipped_short_row"] += 1
                        continue
                    if year_counts.get(str(year), 0) >= max_per_year:
                        break
                    if not hmlr_london_candidate(row):
                        continue
                    file_summary["candidate_london_rows"] += 1
                    record = hmlr_price_paid_candidate(row, year, url)
                    if not record:
                        file_summary["skipped_without_date_or_postcode"] += 1
                        continue
                    pending.append(record)
                    if len(pending) >= 100:
                        process_pending(pending, year_counts, file_summary)
                        pending = []
                if pending:
                    process_pending(pending, year_counts, file_summary)
        except Exception as exc:  # noqa: BLE001 - future/current-year files may lag publication.
            file_summary["error"] = clean_text(exc, 240)
        raw_summary["files"][str(year)] = file_summary

    raw_summary["event_count"] = len(events)
    raw_summary["sampled_per_year"] = {
        year: details["added"]
        for year, details in raw_summary["files"].items()
    }
    return events, raw_summary


def metric_text(value: Any, suffix: str = "") -> str:
    text = clean_text(value, 40)
    if not text:
        return "not reported"
    try:
        number = float(text.replace(",", ""))
    except Exception:
        return text
    if suffix == "GBP":
        return f"GBP {number:,.0f}"
    if suffix == "%":
        return f"{number:.1f}%"
    if number.is_integer():
        return f"{number:,.0f}"
    return f"{number:,.1f}"


def ukhpi_london_borough(row: dict[str, Any]) -> str | None:
    area_code = clean_text(row.get("AreaCode"), 24)
    if area_code in LONDON_ONS_BOROUGHS:
        return LONDON_ONS_BOROUGHS[area_code]
    return None


def make_ukhpi_event(row: dict[str, Any], source_url: str, retrieved_at: str) -> dict[str, Any] | None:
    borough = ukhpi_london_borough(row)
    if not borough:
        return None
    event_date = first_dmy_date(row.get("Date"))
    if not event_date or not not_future_date(event_date):
        return None
    lon, lat = LONDON_BOROUGH_POINTS.get(borough, (-0.1276, 51.5072))
    area_code = clean_text(row.get("AreaCode"), 24)
    rid = f"{area_code}|{event_date[:7]}"
    average_price = metric_text(row.get("AveragePrice"), "GBP")
    index_value = metric_text(row.get("Index"))
    month_change = metric_text(row.get("1m%Change"), "%")
    annual_change = metric_text(row.get("12m%Change"), "%")
    sales_volume = metric_text(row.get("SalesVolume"))
    return event_record(
        event_id=f"lon_hmlr_ukhpi_{slug(rid, 80)}",
        title=f"UK HPI monthly housing-market record: {borough}",
        date=event_date,
        bucket="housing/property market/index",
        area=borough,
        location=borough,
        latitude=lat,
        longitude=lon,
        source_ids=[UKHPI_SOURCE_ID],
        source_record_id=rid,
        source_url=source_url,
        source_retrieved_at=retrieved_at,
        source_dataset_id=UKHPI_SOURCE_ID,
        source_date_field="Date",
        geometry_source="Static borough reference point used for aggregate local-authority statistic",
        geometry_precision="borough aggregate, not a parcel or address point",
        summary=clean_text(
            f"UK HPI aggregate row for {borough}: average price {average_price}; index {index_value}; "
            f"monthly change {month_change}; annual change {annual_change}; sales volume {sales_volume}.",
            520,
        ),
        observed_change=clean_text(
            f"Monthly borough-level housing-market measurement for {borough}; this is an observed aggregate statistic, not a claim about a single development or address.",
            280,
        ),
        confidence="documented",
        limitations=(
            "UK HPI is an aggregate residential property price index based on completed sales and a statistical model. "
            "It is nominal, not inflation-adjusted; recent periods are provisional/revised; sales-volume fields can be incomplete or suppressed. "
            "Do not use it as evidence of construction, affordability, displacement, or causal neighbourhood change."
        ),
    )


def fetch_london_ukhpi_monthly(max_per_borough: int | None = None) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Fetch monthly UK HPI aggregate rows for London boroughs."""
    retrieved_at = utc_now_iso()
    events: list[dict[str, Any]] = []
    counts: dict[str, int] = {}
    raw_summary: dict[str, Any] = {
        "retrieved_at": retrieved_at,
        "source": "UK House Price Index full file",
        "release_month": UKHPI_RELEASE_MONTH,
        "release_page": UKHPI_RELEASE_PAGE,
        "about_page": UKHPI_ABOUT_PAGE,
        "source_url": UKHPI_FULL_FILE_URL,
        "license": "Open Government Licence v3.0",
        "attribution": "Contains HM Land Registry data Crown copyright and database right. This data is licensed under the Open Government Licence v3.0.",
        "read_rows": 0,
        "london_rows": 0,
        "added": 0,
        "skipped_without_date": 0,
        "skipped_future_date": 0,
    }
    req = urllib.request.Request(UKHPI_FULL_FILE_URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=240) as response:
        text_stream = (line.decode("utf-8-sig", "replace") for line in response)
        reader = csv.DictReader(text_stream)
        raw_summary["fields"] = reader.fieldnames or []
        for row in reader:
            raw_summary["read_rows"] += 1
            borough = ukhpi_london_borough(row)
            if not borough:
                continue
            raw_summary["london_rows"] += 1
            if max_per_borough is not None and counts.get(borough, 0) >= max_per_borough:
                continue
            event_date = first_dmy_date(row.get("Date"))
            if not event_date:
                raw_summary["skipped_without_date"] += 1
                continue
            if not not_future_date(event_date):
                raw_summary["skipped_future_date"] += 1
                continue
            event = make_ukhpi_event(row, UKHPI_FULL_FILE_URL, retrieved_at)
            if not event:
                continue
            events.append(event)
            counts[borough] = counts.get(borough, 0) + 1
            raw_summary["added"] += 1
    raw_summary["event_count"] = len(events)
    raw_summary["sampled_per_borough"] = counts
    raw_summary["date_range"] = [
        min((event["date"] for event in events), default=None),
        max((event["date"] for event in events), default=None),
    ]
    return events, raw_summary


def fhrs_business_record_url(fhrsid: Any) -> str:
    return f"https://ratings.food.gov.uk/business/{urllib.parse.quote(str(fhrsid), safe='')}"


def fhrs_rating_text(value: Any) -> str:
    text = clean_text(value, 80)
    if not text:
        return "rating not recorded"
    if re.match(r"^\d+$", text):
        return f"{text} out of 5"
    return text.replace("_", " ").lower()


def make_fhrs_event(row: dict[str, Any], authority: dict[str, Any], retrieved_at: str) -> dict[str, Any] | None:
    rating_date = first_date(row.get("RatingDate"))
    if not rating_date or not not_future_date(rating_date):
        return None
    geo = row.get("geocode") if isinstance(row.get("geocode"), dict) else {}
    lon = safe_float(geo.get("longitude"))
    lat = safe_float(geo.get("latitude"))
    if lon is None or lat is None or not in_bounds((lon, lat), LONDON_BOUNDS):
        return None
    fhrsid = clean_text(row.get("FHRSID"), 80)
    if not fhrsid:
        return None
    authority_name = canonical_london_admin_name(row.get("LocalAuthorityName"), authority.get("Name")) or clean_text(authority.get("Name") or "London", 90)
    business_type = clean_text(row.get("BusinessType") or "food establishment", 120)
    scores = row.get("scores") if isinstance(row.get("scores"), dict) else {}
    rating = fhrs_rating_text(row.get("RatingValue"))
    pending = "yes" if row.get("NewRatingPending") else "no"
    return event_record(
        event_id=f"lon_fsa_fhrs_rating_{slug(fhrsid, 80)}",
        title=f"Food hygiene rating record: {business_type} in {authority_name}",
        date=rating_date,
        bucket="civic services/public health/food hygiene/businesses",
        area=authority_name,
        location=clean_text(f"{authority_name}; premises point from FHRS", 160),
        latitude=lat,
        longitude=lon,
        source_ids=[FHRS_SOURCE_ID],
        source_record_id=fhrsid,
        source_url=fhrs_business_record_url(fhrsid),
        source_retrieved_at=retrieved_at,
        source_dataset_id=FHRS_SOURCE_ID,
        source_date_field="RatingDate",
        atlas_category="civic_services",
        atlas_lens="services",
        affected_signals=["public_health", "services"],
        geometry_source="Food Standards Agency FHRS establishment geocode",
        geometry_precision="public food-business premises point; source coordinates may be incomplete or inaccurate",
        summary=clean_text(
            f"FHRS record for {business_type}: rating {rating}; hygiene score {scores.get('Hygiene', 'not recorded')}; "
            f"structural score {scores.get('Structural', 'not recorded')}; management-confidence score {scores.get('ConfidenceInManagement', 'not recorded')}; "
            f"new rating pending: {pending}.",
            520,
        ),
        observed_change=clean_text(
            f"Food Standards Agency hygiene-rating record dated {rating_date} for a food business in {authority_name}.",
            260,
        ),
        confidence="documented",
        limitations=(
            "FHRS records are current-snapshot public food-hygiene ratings and inspection/publication dates, not evidence of a business opening, closure, construction, or neighbourhood causation. "
            "The adapter omits business name, address lines, postcode, phone, email, and right-to-reply text; coordinates can be incomplete or inaccurate."
        ),
    )


def fetch_london_fhrs_ratings(max_per_authority: int = 300) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Fetch bounded London Food Hygiene Rating Scheme records.

    FHRS rows include public business names, addresses, postcodes, phone fields and
    right-to-reply text. This adapter uses those rows only to identify source
    records and points, then writes a privacy-minimized event layer.
    """
    retrieved_at = utc_now_iso()
    authorities_payload = fetch_fhrs_json(f"{FHRS_API_ROOT}/Authorities", timeout=90)
    authorities = [
        authority
        for authority in authorities_payload.get("authorities", [])
        if authority.get("RegionName") == "London"
    ]
    events: list[dict[str, Any]] = []
    seen: set[str] = set()
    raw_summary: dict[str, Any] = {
        "retrieved_at": retrieved_at,
        "source": "Food Standards Agency Food Hygiene Rating Scheme API",
        "help_url": FHRS_HELP_URL,
        "data_page": FHRS_DATA_PAGE,
        "license": "Open Government Licence v3.0",
        "per_authority_limit": max_per_authority,
        "authority_count": len(authorities),
        "privacy_minimization": "Adapter omits business name, address lines, postcode, phone, email, and right-to-reply text before writing atlas events.",
        "omitted_fields": ["BusinessName", "AddressLine1", "AddressLine2", "AddressLine3", "AddressLine4", "PostCode", "Phone", "LocalAuthorityEmailAddress", "RightToReply"],
        "authorities": {},
        "skipped_without_point_or_date": 0,
        "skipped_duplicate": 0,
    }
    page_size = 500
    for authority in sorted(authorities, key=lambda item: clean_text(item.get("Name"), 120)):
        authority_id = authority.get("LocalAuthorityId")
        authority_name = canonical_london_admin_name(authority.get("Name")) or clean_text(authority.get("Name"), 120)
        summary = {
            "local_authority_id": authority_id,
            "name": authority_name,
            "establishment_count": authority.get("EstablishmentCount"),
            "last_published_date": authority.get("LastPublishedDate"),
            "read_rows": 0,
            "added": 0,
            "skipped_without_point_or_date": 0,
        }
        page_number = 1
        while summary["added"] < max_per_authority:
            url = f"{FHRS_API_ROOT}/Establishments?" + urllib.parse.urlencode({
                "localAuthorityId": str(authority_id),
                "pageSize": str(page_size),
                "pageNumber": str(page_number),
            })
            payload = fetch_fhrs_json(url, timeout=90)
            rows = payload.get("establishments") or []
            if not rows:
                break
            for row in rows:
                summary["read_rows"] += 1
                if summary["added"] >= max_per_authority:
                    break
                event = make_fhrs_event(row, authority, retrieved_at)
                if not event:
                    summary["skipped_without_point_or_date"] += 1
                    raw_summary["skipped_without_point_or_date"] += 1
                    continue
                if event["event_id"] in seen:
                    raw_summary["skipped_duplicate"] += 1
                    continue
                seen.add(event["event_id"])
                events.append(event)
                summary["added"] += 1
            meta = payload.get("meta") or {}
            if page_number >= int(meta.get("totalPages") or page_number):
                break
            page_number += 1
            time.sleep(0.05)
        raw_summary["authorities"][authority_name] = summary
    raw_summary["event_count"] = len(events)
    raw_summary["sampled_per_authority"] = {
        name: details["added"]
        for name, details in raw_summary["authorities"].items()
    }
    raw_summary["date_range"] = [
        min((event["date"] for event in events), default=None),
        max((event["date"] for event in events), default=None),
    ]
    return events, raw_summary


def fetch_london_dft_road_collisions(max_per_year: int = 4500) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Fetch bounded official DfT STATS19 road-collision rows inside London.

    The complete GB file is very large, so this adapter uses the latest five-year
    collision CSV plus the current provisional collision CSV and keeps a per-year
    London cap. Rows are public, non-sensitive STATS19 records with point
    coordinates and OGL reuse terms.
    """
    retrieved_at = utc_now_iso()
    source_id = "dft-road-safety-collisions"
    counts: dict[str, int] = {}
    source_counts: dict[str, dict[str, Any]] = {}
    events: list[dict[str, Any]] = []
    seen: set[str] = set()

    for source in DFT_ROAD_COLLISION_URLS:
        url = source["url"]
        source_summary = {
            "label": source["label"],
            "url": url,
            "provisional": source["provisional"],
            "read_rows": 0,
            "london_rows_seen": 0,
            "added": 0,
            "skipped_without_point": 0,
            "skipped_without_date": 0,
            "skipped_future_date": 0,
        }
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=240) as response:
            text_stream = (line.decode("utf-8-sig", "replace") for line in response)
            reader = csv.DictReader(text_stream)
            for row in reader:
                source_summary["read_rows"] += 1
                ons_code = clean_text(row.get("local_authority_ons_district"), 20)
                if not ons_code.startswith("E09"):
                    continue
                event_date = first_dmy_date(row.get("date"))
                if not event_date:
                    source_summary["skipped_without_date"] += 1
                    continue
                if not not_future_date(event_date):
                    source_summary["skipped_future_date"] += 1
                    continue
                year = event_date[:4]
                if counts.get(year, 0) >= max_per_year:
                    continue
                lon = safe_float(row.get("longitude"))
                lat = safe_float(row.get("latitude"))
                if lon is None or lat is None or not in_bounds((lon, lat), LONDON_BOUNDS):
                    source_summary["skipped_without_point"] += 1
                    continue
                rid = clean_text(row.get("collision_index") or row.get("accident_index") or row.get("collision_ref_no") or row.get("accident_reference"), 80)
                if not rid or rid in seen:
                    continue
                borough = LONDON_ONS_BOROUGHS.get(ons_code, ons_code or "London")
                severity = DFT_COLLISION_SEVERITY.get(clean_text(row.get("collision_severity") or row.get("accident_severity"), 12), "recorded")
                vehicles = int_text(row.get("number_of_vehicles"))
                casualties = int_text(row.get("number_of_casualties"))
                road_bits = []
                if row.get("first_road_number") not in (None, "", "-1", "0"):
                    road_bits.append(f"road {row.get('first_road_number')}")
                if row.get("speed_limit") not in (None, "", "-1"):
                    road_bits.append(f"{row.get('speed_limit')} mph limit")
                if row.get("road_type") not in (None, "", "-1"):
                    road_bits.append(f"road type code {row.get('road_type')}")
                if row.get("weather_conditions") not in (None, "", "-1"):
                    road_bits.append(f"weather code {row.get('weather_conditions')}")
                events.append(event_record(
                    event_id=f"lon_dft_road_collision_{slug(rid, 72)}",
                    title=f"Reported road collision ({severity}) in {borough}",
                    date=event_date,
                    bucket="transport/road safety/collision",
                    area=borough,
                    location=clean_text("; ".join(road_bits) or ons_code, 180),
                    latitude=lat,
                    longitude=lon,
                    source_ids=[source_id],
                    source_record_id=rid,
                    source_url=url,
                    source_retrieved_at=retrieved_at,
                    source_dataset_id=source_id,
                    source_date_field="date",
                    summary=clean_text(f"DfT STATS19 collision row: {severity}; {vehicles} vehicles; {casualties} casualties; local authority {borough}; LSOA {row.get('lsoa_of_accident_location') or 'not recorded'}.", 420),
                    observed_change=clean_text(f"Police-reported personal-injury road collision recorded in STATS19 for {borough}.", 240),
                    confidence="documented",
                    limitations="STATS19 records include personal-injury collisions reported to police. They are road-safety context events, not evidence of infrastructure causation; 2025 rows are provisional and may be revised.",
                ))
                seen.add(rid)
                counts[year] = counts.get(year, 0) + 1
                source_summary["london_rows_seen"] += 1
                source_summary["added"] += 1
        source_counts[source["label"]] = source_summary

    return events, {
        "retrieved_at": retrieved_at,
        "sources": source_counts,
        "sampled_per_year": counts,
        "per_year_limit": max_per_year,
        "event_count": len(events),
    }


def police_custom_download_url(
    date_from: str,
    date_to: str,
    forces: list[str],
    timeout: int = 180,
    *,
    include_crime: bool = True,
    include_outcomes: bool = False,
    include_stop_and_search: bool = False,
) -> tuple[str, dict[str, Any]]:
    """Create and poll a Police.uk custom CSV download."""
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    landing = opener.open(urllib.request.Request("https://data.police.uk/data/", headers={"User-Agent": USER_AGENT}), timeout=45)
    html = landing.read().decode("utf-8", "replace")
    token_match = re.search(r"name='csrfmiddlewaretoken' value='([^']+)'", html)
    if not token_match:
        raise RuntimeError("Police.uk custom download form did not expose a CSRF token")
    form_pairs = [
        ("csrfmiddlewaretoken", token_match.group(1)),
        ("date_from", date_from),
        ("date_to", date_to),
    ]
    if include_crime:
        form_pairs.append(("include_crime", "on"))
    if include_outcomes:
        form_pairs.append(("include_outcomes", "on"))
    if include_stop_and_search:
        form_pairs.append(("include_stop_and_search", "on"))
    form_pairs.extend(("forces", force) for force in forces)
    request = urllib.request.Request(
        "https://data.police.uk/data/",
        data=urllib.parse.urlencode(form_pairs).encode("utf-8"),
        headers={
            "User-Agent": USER_AGENT,
            "Referer": "https://data.police.uk/data/",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    response = opener.open(request, timeout=60)
    body = response.read().decode("utf-8", "replace")
    progress_match = re.search(r'"url": "([^"]+)"', body)
    if not progress_match:
        raise RuntimeError("Police.uk custom download response did not include a progress URL")
    progress_url = urllib.parse.urljoin("https://data.police.uk", progress_match.group(1))
    start = time.time()
    polls = 0
    while time.time() - start < timeout:
        polls += 1
        try:
            progress = json.loads(opener.open(urllib.request.Request(progress_url, headers={"User-Agent": USER_AGENT}), timeout=45).read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                time.sleep(min(45.0, 8.0 + polls * 3.0))
                continue
            raise
        if progress.get("status") == "ready" and progress.get("url"):
            return str(progress["url"]), {
                "date_from": date_from,
                "date_to": date_to,
                "forces": forces,
                "include_crime": include_crime,
                "include_outcomes": include_outcomes,
                "include_stop_and_search": include_stop_and_search,
                "progress_url": progress_url,
                "polls": polls,
            }
        if progress.get("status") == "failed":
            raise RuntimeError(f"Police.uk custom download failed: {progress}")
        time.sleep(5.0)
    raise RuntimeError(f"Police.uk custom download was not ready after {timeout} seconds")


def fetch_london_police_street_crimes(max_per_month_force: int = 380, date_from: str = "2023-04", date_to: str = "2026-03") -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Fetch bounded Police.uk street-level crime/ASB rows for London forces."""
    retrieved_at = utc_now_iso()
    source_id = "police-data-api"
    forces = ["metropolitan", "city-of-london"]
    download_url, download_meta = police_custom_download_url(date_from, date_to, forces)
    raw_summary: dict[str, Any] = {
        "retrieved_at": retrieved_at,
        "source": "https://data.police.uk/data/",
        "download": download_meta | {"download_url_host": urllib.parse.urlparse(download_url).netloc},
        "per_month_force_limit": max_per_month_force,
        "files": {},
        "sampled_per_month_force": {},
        "skipped_without_point": 0,
        "skipped_without_month": 0,
        "skipped_future_date": 0,
    }
    events: list[dict[str, Any]] = []
    seen: set[str] = set()
    counts: dict[str, int] = {}
    temp_path = Path(tempfile.gettempdir()) / f"open_citylog_police_london_{int(time.time())}.zip"
    try:
        urllib.request.urlretrieve(download_url, temp_path)
        with zipfile.ZipFile(temp_path) as archive:
            for name in sorted(archive.namelist()):
                lower = name.lower()
                if not lower.endswith(".csv") or "street" not in lower:
                    continue
                file_summary = {"read_rows": 0, "added": 0}
                with archive.open(name) as handle:
                    text_stream = (line.decode("utf-8-sig", "replace") for line in handle)
                    reader = csv.DictReader(text_stream)
                    for row_index, row in enumerate(reader):
                        file_summary["read_rows"] += 1
                        month = clean_text(row.get("Month"), 10)
                        if not re.match(r"^\d{4}-\d{2}$", month):
                            raw_summary["skipped_without_month"] += 1
                            continue
                        event_date = f"{month}-01"
                        if not not_future_date(event_date):
                            raw_summary["skipped_future_date"] += 1
                            continue
                        force = clean_text(row.get("Reported by") or row.get("Falls within") or name, 80)
                        count_key = f"{month}|{force}"
                        if counts.get(count_key, 0) >= max_per_month_force:
                            continue
                        lat = safe_float(row.get("Latitude"))
                        lon = safe_float(row.get("Longitude"))
                        if lat is None or lon is None or not in_bounds((lon, lat), LONDON_BOUNDS):
                            raw_summary["skipped_without_point"] += 1
                            continue
                        crime_id = clean_text(row.get("Crime ID"), 96)
                        if not crime_id:
                            stable = "|".join([
                                month,
                                force,
                                clean_text(row.get("Crime type"), 80),
                                clean_text(row.get("Location"), 120),
                                clean_text(row.get("LSOA code"), 40),
                                str(row_index),
                            ])
                            crime_id = hashlib.sha1(stable.encode("utf-8")).hexdigest()
                        if crime_id in seen:
                            continue
                        seen.add(crime_id)
                        crime_type = clean_text(row.get("Crime type") or "Crime/ASB", 80)
                        lsoa_name = clean_text(row.get("LSOA name"), 90)
                        location = clean_text(row.get("Location"), 140)
                        outcome = clean_text(row.get("Last outcome category"), 140)
                        area = lsoa_name or force or "London"
                        events.append(event_record(
                            event_id=f"lon_police_street_crime_{slug(crime_id, 80)}",
                            title=f"Police.uk street-level record: {crime_type}",
                            date=event_date,
                            bucket="public safety/police recorded crime/street-level",
                            area=area,
                            location=location,
                            latitude=lat,
                            longitude=lon,
                            source_ids=[source_id],
                            source_record_id=crime_id,
                            source_url="https://data.police.uk/data/",
                            source_retrieved_at=retrieved_at,
                            source_dataset_id=source_id,
                            source_date_field="Month",
                            summary=clean_text(f"{crime_type} record reported by {force}; approximate location {location or 'not stated'}; LSOA {lsoa_name or row.get('LSOA code') or 'not recorded'}; latest outcome {outcome or 'not recorded'}.", 420),
                            observed_change=clean_text(f"Police.uk anonymized street-level crime/ASB record for {month}.", 220),
                            confidence="documented",
                            limitations="Police.uk street-level locations are anonymized/approximate and the data is management information, not a complete measure of all harm or safety. Do not infer causation from nearby urban changes.",
                        ))
                        counts[count_key] = counts.get(count_key, 0) + 1
                        file_summary["added"] += 1
                raw_summary["files"][name] = file_summary
    finally:
        try:
            temp_path.unlink()
        except FileNotFoundError:
            pass
    raw_summary["sampled_per_month_force"] = counts
    raw_summary["event_count"] = len(events)
    return events, raw_summary


def police_force_from_filename(name: str) -> str:
    lower = name.lower()
    if "city-of-london" in lower:
        return "City of London Police"
    if "metropolitan" in lower:
        return "Metropolitan Police Service"
    if "btp" in lower:
        return "British Transport Police"
    return clean_text(Path(name).stem, 80)


def fetch_london_police_stop_searches(max_per_month_force: int = 320, date_from: str = "2023-04", date_to: str = "2026-03") -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Fetch privacy-minimized Police.uk stop-and-search rows for London.

    Police.uk stop/search CSVs include demographic fields. This adapter
    intentionally does not persist age, gender, ethnicity, or operation names.
    """
    retrieved_at = utc_now_iso()
    source_id = "police-data-stop-search"
    forces = ["metropolitan", "city-of-london", "btp"]
    download_url, download_meta = police_custom_download_url(
        date_from,
        date_to,
        forces,
        include_crime=False,
        include_stop_and_search=True,
    )
    raw_summary: dict[str, Any] = {
        "retrieved_at": retrieved_at,
        "source": "https://data.police.uk/data/",
        "download": download_meta | {"download_url_host": urllib.parse.urlparse(download_url).netloc},
        "per_month_force_limit": max_per_month_force,
        "files": {},
        "sampled_per_month_force": {},
        "privacy_minimization": "Adapter does not persist gender, age range, self-defined ethnicity, officer-defined ethnicity, operation name, or exact timestamp.",
        "skipped_without_point": 0,
        "skipped_without_date": 0,
        "skipped_future_date": 0,
    }
    events: list[dict[str, Any]] = []
    seen: set[str] = set()
    counts: dict[str, int] = {}
    temp_path = Path(tempfile.gettempdir()) / f"open_citylog_police_stop_search_london_{int(time.time())}.zip"
    try:
        urllib.request.urlretrieve(download_url, temp_path)
        with zipfile.ZipFile(temp_path) as archive:
            for name in sorted(archive.namelist()):
                lower = name.lower()
                if not lower.endswith(".csv") or "stop-and-search" not in lower:
                    continue
                force = police_force_from_filename(name)
                file_summary = {"read_rows": 0, "added": 0}
                with archive.open(name) as handle:
                    text_stream = (line.decode("utf-8-sig", "replace") for line in handle)
                    reader = csv.DictReader(text_stream)
                    for row_index, row in enumerate(reader):
                        file_summary["read_rows"] += 1
                        date_text = clean_text(row.get("Date"), 40)
                        event_date_raw = first_date(date_text)
                        if not event_date_raw:
                            raw_summary["skipped_without_date"] += 1
                            continue
                        if not not_future_date(event_date_raw):
                            raw_summary["skipped_future_date"] += 1
                            continue
                        month = event_date_raw[:7]
                        count_key = f"{month}|{force}"
                        if counts.get(count_key, 0) >= max_per_month_force:
                            continue
                        lat = safe_float(row.get("Latitude"))
                        lon = safe_float(row.get("Longitude"))
                        if lat is None or lon is None or not in_bounds((lon, lat), LONDON_BOUNDS):
                            raw_summary["skipped_without_point"] += 1
                            continue
                        search_type = clean_text(row.get("Type") or "Stop and search", 80)
                        object_of_search = clean_text(row.get("Object of search") or "object not stated", 100)
                        outcome = clean_text(row.get("Outcome") or "outcome not stated", 120)
                        legislation = clean_text(row.get("Legislation") or "legislation not stated", 120)
                        operation_flag = clean_text(row.get("Part of a policing operation") or "not stated", 30)
                        stable = "|".join([
                            date_text,
                            force,
                            f"{lat:.5f}",
                            f"{lon:.5f}",
                            search_type,
                            object_of_search,
                            outcome,
                            legislation,
                            str(row_index),
                        ])
                        rid = hashlib.sha1(stable.encode("utf-8")).hexdigest()
                        if rid in seen:
                            continue
                        seen.add(rid)
                        events.append(event_record(
                            event_id=f"lon_police_stop_search_{rid}",
                            title=f"Police.uk stop-and-search record: {object_of_search}",
                            date=f"{month}-01",
                            bucket="public safety/police stop and search",
                            area=force,
                            location="Police.uk approximate stop-and-search point",
                            latitude=lat,
                            longitude=lon,
                            source_ids=[source_id],
                            source_record_id=rid,
                            source_url="https://data.police.uk/data/",
                            source_retrieved_at=retrieved_at,
                            source_dataset_id=source_id,
                            source_date_field="Date (month-truncated by adapter)",
                            summary=clean_text(f"{search_type}; object of search {object_of_search}; outcome {outcome}; legislation {legislation}; part of a policing operation: {operation_flag}. Demographic fields are intentionally omitted.", 420),
                            observed_change=clean_text(f"Police.uk stop-and-search record for {force}, displayed at month precision.", 220),
                            confidence="documented",
                            limitations="Police.uk stop-and-search records are sensitive public-safety management information. This adapter omits demographic fields and exact timestamps; points may be approximate. Do not infer causation from nearby urban changes.",
                        ))
                        counts[count_key] = counts.get(count_key, 0) + 1
                        file_summary["added"] += 1
                raw_summary["files"][name] = file_summary
    finally:
        try:
            temp_path.unlink()
        except FileNotFoundError:
            pass
    raw_summary["sampled_per_month_force"] = counts
    raw_summary["event_count"] = len(events)
    return events, raw_summary


def socrata(domain: str, dataset: str, params: dict[str, str], timeout: int = 60) -> list[dict[str, Any]]:
    query = urllib.parse.urlencode(params, safe=", ():'><=")
    url = f"https://{domain}/resource/{dataset}.json?{query}"
    return fetch_json(url, timeout=timeout)


def socrata_year_sample(dataset: str, date_field: str, years: range, per_year: int, select: str | None = None, where_extra: str | None = None, order: str | None = None, timeout: int = 90) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    counts: dict[str, int | str] = {}
    for year in years:
        where = f"{date_field} between '{year}-01-01T00:00:00' and '{year}-12-31T23:59:59'"
        if where_extra:
            where = f"({where}) AND ({where_extra})"
        params = {"$limit": str(per_year), "$where": where}
        if select:
            params["$select"] = select
        if order:
            params["$order"] = order
        try:
            batch = socrata("data.cityofnewyork.us", dataset, params, timeout=timeout)
            rows.extend(batch)
            counts[str(year)] = len(batch)
        except Exception as exc:  # noqa: BLE001
            counts[str(year)] = f"ERROR: {exc}"
    return rows, {"dataset": dataset, "date_field": date_field, "per_year_limit": per_year, "counts_by_year": counts, "fetched": len(rows)}


def safe_float(value: Any) -> float | None:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except Exception:
        return None


def nyc_borough_name(value: Any) -> str:
    text = clean_text(value, 24).upper().strip("()")
    if "STATEN" in text or "RICHMOND" in text:
        return "Staten Island"
    if "MANHATTAN" in text or text == "NEW YORK":
        return "Manhattan"
    if "BROOKLYN" in text or text == "KINGS":
        return "Brooklyn"
    if "BRONX" in text:
        return "Bronx"
    if "QUEENS" in text:
        return "Queens"
    return {
        "M": "Manhattan",
        "MN": "Manhattan",
        "MANHATTAN": "Manhattan",
        "X": "Bronx",
        "BX": "Bronx",
        "BRONX": "Bronx",
        "B": "Brooklyn",
        "K": "Brooklyn",
        "BK": "Brooklyn",
        "BROOKLYN": "Brooklyn",
        "Q": "Queens",
        "QN": "Queens",
        "QUEENS": "Queens",
        "R": "Staten Island",
        "SI": "Staten Island",
        "S": "Staten Island",
        "STATEN ISLAND": "Staten Island",
    }.get(text, clean_text(value, 40) or "NYC")


def fetch_nyc_events() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    events: list[dict[str, Any]] = []
    retrieved_at = utc_now_iso()
    raw: dict[str, Any] = {"retrieved_at": retrieved_at, "sources": {}, "skipped_without_source_date": 0}

    def add_with_point(prefix: str, rows: list[dict[str, Any]], source_id: str, title_fn, date_fn, bucket: str, summary_fn, record_id_fn, lat_key: str, lon_key: str, area_fn, limit: int, source_url_fn=None, record_url_field: str | None = None) -> None:
        added = 0
        for row in rows:
            if added >= limit:
                break
            lat, lon = safe_float(row.get(lat_key)), safe_float(row.get(lon_key))
            if lat is None or lon is None or not in_bounds((lon, lat), NYC_BOUNDS):
                continue
            rid = clean_text(record_id_fn(row), 90)
            if not rid:
                continue
            date = date_fn(row)
            if not date:
                raw["skipped_without_source_date"] += 1
                continue
            source_url = source_url_fn(row) if source_url_fn else socrata_row_url(source_id, record_url_field, rid)
            events.append(event_record(
                event_id=f"{prefix}_{slug(rid, 70)}",
                title=clean_text(title_fn(row), 180),
                date=date,
                bucket=bucket,
                area=clean_text(area_fn(row), 120),
                latitude=lat,
                longitude=lon,
                source_ids=[source_id],
                source_record_id=rid,
                source_url=source_url,
                source_retrieved_at=retrieved_at,
                source_dataset_id=source_id,
                summary=clean_text(summary_fn(row), 420),
                observed_change=clean_text(summary_fn(row), 260),
                confidence="documented",
                limitations="Row-level official open-data record; final analytical ETL should de-duplicate repeated administrative updates and attach full source metadata.",
            ))
            added += 1

    dob_select = "borough,house__,street_name,job__,job_type,work_type,permit_status,permit_type,filing_date,issuance_date,job_start_date,permit_si_no,gis_latitude,gis_longitude,gis_nta_name"
    dob_rows, dob_meta = socrata_year_sample(
        "ipu4-2q9a", "issuance_date", range(2004, 2027), 140,
        select=dob_select,
        where_extra="gis_latitude IS NOT NULL AND gis_longitude IS NOT NULL",
        order="issuance_date ASC",
        timeout=90,
    )
    raw["sources"]["ipu4-2q9a"] = dob_meta | {"sample_fields": list(dob_rows[0].keys()) if dob_rows else []}
    add_with_point(
        "nyc_dob_permit", dob_rows, "ipu4-2q9a",
        lambda r: f"DOB permit issued: {r.get('permit_type') or r.get('work_type') or 'permit'} at {r.get('house__','')} {r.get('street_name','')}, {r.get('borough','NYC')}",
        lambda r: first_date(r.get("issuance_date"), r.get("filing_date"), r.get("job_start_date")),
        "planning/development/construction",
        lambda r: f"{r.get('permit_status','Permit')} {r.get('permit_type') or r.get('work_type') or 'permit'} record for job {r.get('job__')} at {r.get('house__','')} {r.get('street_name','')} in {r.get('borough','NYC')}.",
        lambda r: r.get("permit_si_no") or r.get("job__"), "gis_latitude", "gis_longitude",
        lambda r: r.get("gis_nta_name") or r.get("borough") or "NYC", 4000,
        source_url_fn=lambda r: socrata_row_url("ipu4-2q9a", "permit_si_no", r.get("permit_si_no") or r.get("job__")),
    )

    dob_now_job_select = "job_filing_number,filing_status,job_type,house_no,street_name,borough,block,lot,bin,bbl,postcode,latitude,longitude,nta,filing_date,current_status_date,first_permit_date,signoff_date,building_type,existing_dwelling_units,proposed_dwelling_units,total_construction_floor_area,initial_cost"
    dob_now_job_rows, dob_now_job_meta = socrata_year_sample(
        "w9ak-ipjd", "filing_date", range(2019, 2027), 120,
        select=dob_now_job_select,
        where_extra="latitude IS NOT NULL AND longitude IS NOT NULL",
        order="filing_date ASC",
        timeout=90,
    )
    raw["sources"]["w9ak-ipjd"] = dob_now_job_meta | {"sample_fields": list(dob_now_job_rows[0].keys()) if dob_now_job_rows else []}
    add_with_point(
        "nyc_dob_now_job_filing", dob_now_job_rows, "w9ak-ipjd",
        lambda r: f"DOB NOW job filing: {r.get('job_type') or 'job'} at {r.get('house_no','')} {r.get('street_name','')}, {nyc_borough_name(r.get('borough'))}",
        lambda r: first_date(r.get("signoff_date"), r.get("first_permit_date"), r.get("current_status_date"), r.get("filing_date")),
        "planning/development/construction",
        lambda r: f"DOB NOW job filing {r.get('job_filing_number')}; status {r.get('filing_status') or 'not stated'}; job type {r.get('job_type') or 'not stated'}; dwelling units {int_text(r.get('existing_dwelling_units'))} existing to {int_text(r.get('proposed_dwelling_units'))} proposed.",
        lambda r: r.get("job_filing_number"), "latitude", "longitude",
        lambda r: r.get("nta") or nyc_borough_name(r.get("borough")) or "NYC",
        960,
        source_url_fn=lambda r: socrata_row_url("w9ak-ipjd", "job_filing_number", r.get("job_filing_number")),
    )

    co_select = "job_number,job_type,c_o_issue_date,bin_number,borough,house_number,street_name,application_status_raw,filing_status_raw,issue_type,latitude,longitude,nta"
    co_rows, co_meta = socrata_year_sample(
        "bs8b-p36w", "c_o_issue_date", range(2004, 2027), 90,
        select=co_select,
        where_extra="latitude IS NOT NULL AND longitude IS NOT NULL",
        order="c_o_issue_date ASC",
        timeout=90,
    )
    raw["sources"]["bs8b-p36w"] = co_meta | {"sample_fields": list(co_rows[0].keys()) if co_rows else []}
    add_with_point(
        "nyc_certificate_occupancy", co_rows, "bs8b-p36w",
        lambda r: f"Certificate of occupancy issued: {r.get('house_number','')} {r.get('street_name','')}, {r.get('borough','NYC')}",
        lambda r: first_date(r.get("c_o_issue_date")),
        "planning/development/housing",
        lambda r: f"Certificate of occupancy {r.get('issue_type','issued')} for job {r.get('job_number')} at {r.get('house_number','')} {r.get('street_name','')}.",
        lambda r: r.get("job_number") or r.get("bin_number"), "latitude", "longitude",
        lambda r: r.get("nta") or r.get("borough") or "NYC", 2500,
        source_url_fn=lambda r: socrata_row_url("bs8b-p36w", "job_number", r.get("job_number") or r.get("bin_number")),
    )

    dob_now_select = "job_filing_name,job_type,bin,borough,house_no,street_name,submitted_date,c_of_o_status,c_of_o_filing_type,community_board,c_of_o_issuance_date,application_number,number_of_dwelling_units,latitude,longitude"
    dob_now_rows, dob_now_meta = socrata_year_sample(
        "pkdm-hqz6", "c_of_o_issuance_date", range(2020, 2027), 120,
        select=dob_now_select,
        where_extra="latitude IS NOT NULL AND longitude IS NOT NULL",
        order="c_of_o_issuance_date ASC",
        timeout=90,
    )
    raw["sources"]["pkdm-hqz6"] = dob_now_meta | {"sample_fields": list(dob_now_rows[0].keys()) if dob_now_rows else []}
    add_with_point(
        "nyc_dob_now_certificate_occupancy", dob_now_rows, "pkdm-hqz6",
        lambda r: f"DOB NOW certificate of occupancy: {r.get('house_no','')} {r.get('street_name','')}, {r.get('borough','NYC')}",
        lambda r: first_date(r.get("c_of_o_issuance_date"), r.get("submitted_date")),
        "planning/development/housing",
        lambda r: f"DOB NOW C of O {r.get('c_of_o_status','record')} for filing {r.get('job_filing_name') or r.get('application_number')} with {r.get('number_of_dwelling_units') or 'unknown'} dwelling units.",
        lambda r: r.get("application_number") or r.get("job_filing_name") or r.get("bin"), "latitude", "longitude",
        lambda r: r.get("borough") or r.get("community_board") or "NYC", 1200,
        source_url_fn=lambda r: socrata_row_url("pkdm-hqz6", "application_number", r.get("application_number") or r.get("job_filing_name") or r.get("bin")),
    )

    housing_db_select = "job_number,job_type,residflag,nonresflag,job_status,permityear,compltyear,classainit,classaprop,classanet,units_co,boro,bin,bbl,addressnum,addressst,bldg_class,job_desc,datefiled,datepermit,datecomplt,datelstupd,landmark,floorsinit,floorsprop,ownership,latitude,longitude,geomsource,version,ntaname20,commntydst,councildst"
    housing_db_rows, housing_db_meta = socrata_year_sample(
        "br6q-ssj3", "datefiled", range(2010, 2027), 110,
        select=housing_db_select,
        where_extra="latitude IS NOT NULL AND longitude IS NOT NULL",
        order="datefiled ASC",
        timeout=90,
    )
    raw["sources"]["br6q-ssj3"] = housing_db_meta | {"sample_fields": list(housing_db_rows[0].keys()) if housing_db_rows else []}
    add_with_point(
        "nyc_housing_database_project", housing_db_rows, "br6q-ssj3",
        lambda r: f"Housing database project: {r.get('job_type') or 'job'} at {r.get('addressnum','')} {r.get('addressst','')}, {nyc_borough_name(r.get('boro'))}",
        lambda r: first_date(r.get("datecomplt"), r.get("datepermit"), r.get("datefiled"), r.get("datelstupd")),
        "planning/development/housing",
        lambda r: f"DCP Housing Database project {r.get('job_number')}; status {r.get('job_status') or 'not stated'}; Class A units {int_text(r.get('classainit'))} initial to {int_text(r.get('classaprop'))} proposed, net {int_text(r.get('classanet'))}; version {r.get('version') or 'not stated'}.",
        lambda r: r.get("job_number"), "latitude", "longitude",
        lambda r: r.get("ntaname20") or nyc_borough_name(r.get("boro")) or "NYC",
        1700,
        source_url_fn=lambda r: socrata_row_url("br6q-ssj3", "job_number", r.get("job_number")),
    )

    approved_permit_select = "job_filing_number,work_permit,filing_reason,house_no,street_name,borough,work_type,approved_date,issued_date,expired_date,job_description,estimated_job_costs,permit_status,tracking_number,zip_code,latitude,longitude,community_board,council_district,bbl,bin,nta"
    approved_permit_rows, approved_permit_meta = socrata_year_sample(
        "rbx6-tga4", "issued_date", range(2018, 2027), 150,
        select=approved_permit_select,
        where_extra="latitude IS NOT NULL AND longitude IS NOT NULL",
        order="issued_date ASC",
        timeout=90,
    )
    raw["sources"]["rbx6-tga4"] = approved_permit_meta | {"sample_fields": list(approved_permit_rows[0].keys()) if approved_permit_rows else []}
    add_with_point(
        "nyc_dob_now_approved_permit", approved_permit_rows, "rbx6-tga4",
        lambda r: f"DOB NOW permit issued: {r.get('work_type') or 'permit'} at {r.get('house_no','')} {r.get('street_name','')}, {nyc_borough_name(r.get('borough'))}",
        lambda r: first_date(r.get("issued_date"), r.get("approved_date")),
        "planning/development/construction",
        lambda r: f"DOB NOW {r.get('permit_status','permit')} {r.get('work_type') or 'work'} record for filing {r.get('job_filing_number') or r.get('work_permit')} at {r.get('house_no','')} {r.get('street_name','')}; description: {r.get('job_description') or 'not provided'}.",
        lambda r: r.get("work_permit") or r.get("tracking_number") or r.get("job_filing_number"),
        "latitude", "longitude",
        lambda r: r.get("nta") or nyc_borough_name(r.get("borough")) or "NYC",
        1600,
        source_url_fn=lambda r: socrata_row_url("rbx6-tga4", "work_permit", r.get("work_permit") or r.get("tracking_number") or r.get("job_filing_number")),
    )

    street_select = "permitnumber,applicationtrackingid,permitstatusshortdesc,permittypedesc,permitissuedate,issuedworkstartdate,issuedworkenddate,boroughname,onstreetname,fromstreetname,tostreetname,permitpurposecomments,permitlocationcomments"
    street_rows, street_meta = socrata_year_sample(
        "tqtj-sjs8", "permitissuedate", range(2022, 2027), 250,
        select=street_select,
        order="permitissuedate ASC",
        timeout=90,
    )
    raw["sources"]["tqtj-sjs8"] = street_meta | {"sample_fields": list(street_rows[0].keys()) if street_rows else []}
    for row in street_rows[:1800]:
        rid = row.get("permitnumber") or row.get("applicationtrackingid")
        date = first_date(row.get("permitissuedate"), row.get("issuedworkstartdate"))
        if not rid or not date:
            raw["skipped_without_source_date"] += 1
            continue
        borough = clean_text(row.get("boroughname") or "NYC", 40)
        street = clean_text(row.get("onstreetname") or row.get("fromstreetname") or "street segment", 80)
        events.append(event_record(
            event_id=f"nyc_street_permit_{slug(rid, 64)}",
            title=f"Street construction permit: {street}, {borough}",
            date=date,
            bucket="transport/traffic/roadworks",
            area=borough,
            location=f"{street} from {clean_text(row.get('fromstreetname'), 50)} to {clean_text(row.get('tostreetname'), 50)}".strip(),
            source_ids=["tqtj-sjs8"],
            source_record_id=str(rid),
            source_url=socrata_row_url("tqtj-sjs8", "permitnumber", rid),
            source_retrieved_at=retrieved_at,
            source_dataset_id="tqtj-sjs8",
            summary=clean_text(f"{row.get('permittypedesc','Street permit')} ({row.get('permitstatusshortdesc','status unknown')}) on {street}; purpose: {row.get('permitpurposecomments') or row.get('permitlocationcomments') or 'not specified'}.", 420),
            observed_change=clean_text(f"Street/right-of-way work permit affecting {street} in {borough}.", 220),
            confidence="documented",
            limitations="Street permit feed does not always expose public coordinates; atlas point is borough-distributed unless a later geocoder attaches segment geometry.",
        ))

    legacy_street_rows, legacy_street_meta = socrata_year_sample(
        "c9sj-fmsg", "permitissuedate", range(2013, 2022), 220,
        select=street_select,
        order="permitissuedate ASC",
        timeout=90,
    )
    raw["sources"]["c9sj-fmsg"] = legacy_street_meta | {"sample_fields": list(legacy_street_rows[0].keys()) if legacy_street_rows else []}
    for row in legacy_street_rows[:1800]:
        rid = row.get("permitnumber") or row.get("applicationtrackingid")
        date = first_date(row.get("permitissuedate"), row.get("issuedworkstartdate"), row.get("createdon"))
        if not rid or not date:
            raw["skipped_without_source_date"] += 1
            continue
        borough = clean_text(row.get("boroughname") or "NYC", 40)
        street = clean_text(row.get("onstreetname") or row.get("fromstreetname") or "street segment", 80)
        events.append(event_record(
            event_id=f"nyc_street_permit_legacy_{slug(rid, 64)}",
            title=f"Legacy street construction permit: {street}, {borough}",
            date=date,
            bucket="transport/traffic/roadworks",
            area=borough,
            location=f"{street} from {clean_text(row.get('fromstreetname'), 50)} to {clean_text(row.get('tostreetname'), 50)}".strip(),
            source_ids=["c9sj-fmsg"],
            source_record_id=str(rid),
            source_url=socrata_row_url("c9sj-fmsg", "permitnumber", rid),
            source_retrieved_at=retrieved_at,
            source_dataset_id="c9sj-fmsg",
            summary=clean_text(f"{row.get('permittypedesc','Street permit')} ({row.get('permitstatusshortdesc','status unknown')}) on {street}; purpose: {row.get('permitpurposecomments') or row.get('permitlocationcomments') or 'not specified'}.", 420),
            observed_change=clean_text(f"Street/right-of-way work permit affecting {street} in {borough}.", 220),
            confidence="documented",
            limitations="Legacy street permit feed does not always expose public coordinates; atlas point is borough-distributed unless a later geocoder attaches segment geometry.",
        ))

    street_network_rows = socrata("data.cityofnewyork.us", "as9z-kwsh", {
        "$limit": "1000",
        "$select": "on_street,from_st,to_street,completion_date,type_of_change,new_direction,boro",
        "$order": "completion_date ASC",
        "$where": "completion_date IS NOT NULL",
    }, timeout=90)
    raw["sources"]["as9z-kwsh"] = {"fetched": len(street_network_rows), "sample_fields": list(street_network_rows[0].keys()) if street_network_rows else []}
    for row in street_network_rows:
        date = first_date(row.get("completion_date"))
        if not date:
            raw["skipped_without_source_date"] += 1
            continue
        if not not_future_date(date):
            continue
        street = clean_text(row.get("on_street") or "street segment", 80)
        from_street = clean_text(row.get("from_st"), 70)
        to_street = clean_text(row.get("to_street"), 70)
        change_type = clean_text(row.get("type_of_change") or "street network change", 80)
        direction = clean_text(row.get("new_direction"), 40)
        borough = nyc_borough_name(row.get("boro"))
        rid = f"{street}-{from_street}-{to_street}-{date}-{change_type}-{direction}"
        events.append(event_record(
            event_id=f"nyc_street_network_change_{slug(rid, 96)}",
            title=f"Street network change: {change_type} on {street}, {borough}",
            date=date,
            bucket="transport/traffic/network change",
            area=borough,
            location=f"{street} from {from_street} to {to_street}".strip(),
            source_ids=["as9z-kwsh"],
            source_record_id=clean_text(rid, 180),
            source_url=socrata_row_url("as9z-kwsh", None, None),
            source_retrieved_at=retrieved_at,
            source_dataset_id="as9z-kwsh",
            summary=clean_text(f"NYC DOT Street Network Changes row records {change_type} on {street} from {from_street} to {to_street}; new direction {direction or 'not stated'}; completion date {date}.", 420),
            observed_change=clean_text(f"NYC DOT records a completed street network change on {street}.", 220),
            confidence="documented",
            limitations="Street Network Changes gives segment names and completion dates but no public row id or geometry in this API response; atlas point is borough-distributed until a centerline join is added.",
        ))

    closure_select = "uniqueid,segmentid,onstreetname,fromstreetname,tostreetname,borough_code,work_start_date,work_end_date,purpose,the_geom"
    closure_rows, closure_meta = socrata_year_sample(
        "i6b5-j7bu", "work_start_date", range(2018, 2027), 180,
        select=closure_select,
        where_extra="the_geom IS NOT NULL",
        order="work_start_date ASC",
        timeout=90,
    )
    raw["sources"]["i6b5-j7bu"] = closure_meta | {"sample_fields": list(closure_rows[0].keys()) if closure_rows else []}
    added_closures = 0
    for row in closure_rows:
        if added_closures >= 1500:
            break
        point = point_from_geojson(row.get("the_geom"))
        if not in_bounds(point, NYC_BOUNDS):
            continue
        lon, lat = point
        rid = row.get("uniqueid") or row.get("segmentid")
        date = first_date(row.get("work_start_date"))
        if not rid or not date:
            raw["skipped_without_source_date"] += 1
            continue
        borough = nyc_borough_name(row.get("borough_code"))
        street = clean_text(row.get("onstreetname") or row.get("fromstreetname") or "street segment", 80)
        events.append(event_record(
            event_id=f"nyc_street_closure_construction_{slug(rid, 64)}",
            title=f"Construction street closure: {street}, {borough}",
            date=date,
            bucket="transport/traffic/roadworks",
            area=borough,
            location=f"{street} from {clean_text(row.get('fromstreetname'), 50)} to {clean_text(row.get('tostreetname'), 50)}".strip(),
            latitude=lat,
            longitude=lon,
            source_ids=["i6b5-j7bu"],
            source_record_id=str(rid),
            source_url=socrata_row_url("i6b5-j7bu", "uniqueid", rid),
            source_retrieved_at=retrieved_at,
            source_dataset_id="i6b5-j7bu",
            summary=clean_text(f"DOT construction closure on {street}; purpose: {row.get('purpose') or 'not specified'}; work window {first_date(row.get('work_start_date'))} to {first_date(row.get('work_end_date'))}.", 420),
            observed_change=clean_text(f"Observed DOT construction-closure record affecting {street} in {borough}.", 220),
            confidence="documented",
            limitations="Street closure records describe permitted/recorded closure windows; they do not prove full construction completion or permanent network change.",
        ))
        added_closures += 1

    zap_rows = socrata("data.cityofnewyork.us", "hgx4-8ukb", {
        "$limit": "500",
        "$select": "project_id,project_status,public_status,ceqr_number,borough,certified_referred",
        "$order": "certified_referred ASC",
        "$where": "certified_referred IS NOT NULL",
    }, timeout=90)
    raw["sources"]["hgx4-8ukb"] = {"fetched": len(zap_rows), "sample_fields": list(zap_rows[0].keys()) if zap_rows else []}
    for row in zap_rows[:500]:
        rid = row.get("project_id") or row.get("ceqr_number")
        date = first_date(row.get("certified_referred"))
        if not rid or not date:
            raw["skipped_without_source_date"] += 1
            continue
        borough = clean_text(row.get("borough") or "NYC", 60)
        status = clean_text(row.get("public_status") or row.get("project_status") or "ZAP project", 80)
        events.append(event_record(
            event_id=f"nyc_zap_project_{slug(rid, 60)}",
            title=f"ZAP land-use project: {rid} ({borough})",
            date=date,
            bucket="planning/development/zoning",
            area=borough,
            source_ids=["hgx4-8ukb"],
            source_record_id=str(rid),
            source_url=socrata_row_url("hgx4-8ukb", "project_id", rid),
            source_retrieved_at=retrieved_at,
            source_dataset_id="hgx4-8ukb",
            summary=clean_text(f"Zoning Application Portal project {rid}; CEQR {row.get('ceqr_number','n/a')}; public status {status}; borough {borough}.", 360),
            observed_change=clean_text(f"Land-use/zoning application milestone with public status {status}.", 220),
            confidence="documented",
            limitations="ZAP project records may require BBL/action joins for exact parcel geometry and project description.",
        ))

    hpd_building_select = "project_id,project_name,project_start_date,building_id,house_number,street_name,borough,postcode,bbl,bin,community_board,council_district,latitude,longitude,reporting_construction_type,all_counted_units,total_units,extremely_low_income_units,very_low_income_units,low_income_units,moderate_income_units,middle_income_units"
    hpd_building_rows, hpd_building_meta = socrata_year_sample(
        "hg8x-zxpr", "project_start_date", range(2014, 2027), 180,
        select=hpd_building_select,
        where_extra="latitude IS NOT NULL AND longitude IS NOT NULL",
        order="project_start_date ASC",
        timeout=90,
    )
    raw["sources"]["hg8x-zxpr"] = hpd_building_meta | {"sample_fields": list(hpd_building_rows[0].keys()) if hpd_building_rows else []}
    add_with_point(
        "nyc_hpd_affordable_housing_building", hpd_building_rows, "hg8x-zxpr",
        lambda r: f"HPD affordable housing building: {r.get('project_name') or r.get('house_number','')} {r.get('street_name','')}, {nyc_borough_name(r.get('borough'))}",
        lambda r: first_date(r.get("project_start_date")),
        "planning/development/housing/public services",
        lambda r: f"HPD affordable housing production building record for project {r.get('project_id')}; construction type {r.get('reporting_construction_type') or 'not specified'}; {int_text(r.get('all_counted_units'))} counted affordable units and {int_text(r.get('total_units'))} total units reported.",
        lambda r: f"{r.get('project_id')}-{r.get('building_id') or r.get('bin') or r.get('bbl')}",
        "latitude", "longitude",
        lambda r: r.get("neighborhood_tabulation_area") or nyc_borough_name(r.get("borough")) or "NYC",
        2200,
        source_url_fn=lambda r: socrata_row_url("hg8x-zxpr", "project_id", r.get("project_id")),
    )

    capital_status_rows = socrata("data.cityofnewyork.us", "n7gv-k5yt", {
        "$limit": "1400",
        "$select": "date_reported_as_of,pid,project_name,description,category,borough,managing_agency,client_agency,current_phase,design_start,budget_forecast,forecast_completion,total_schedule_changes",
        "$order": "date_reported_as_of ASC",
        "$where": "date_reported_as_of IS NOT NULL",
    }, timeout=90)
    raw["sources"]["n7gv-k5yt"] = {"fetched": len(capital_status_rows), "sample_fields": list(capital_status_rows[0].keys()) if capital_status_rows else []}
    for row in capital_status_rows[:1200]:
        rid = row.get("pid") or row.get("project_name")
        date = first_date(row.get("date_reported_as_of"))
        if not rid or not date:
            raw["skipped_without_source_date"] += 1
            continue
        borough = nyc_borough_name(row.get("borough"))
        phase = clean_text(row.get("current_phase") or "status not stated", 80)
        events.append(event_record(
            event_id=f"nyc_capital_project_status_{slug(rid, 64)}_{slug(date, 12)}",
            title=f"Capital project status: {clean_text(row.get('project_name') or rid, 120)}",
            date=date,
            bucket="capital projects/public investment/infrastructure",
            area=borough,
            source_ids=["n7gv-k5yt"],
            source_record_id=str(rid),
            source_url=socrata_row_url("n7gv-k5yt", "pid", rid),
            source_retrieved_at=retrieved_at,
            source_dataset_id="n7gv-k5yt",
            summary=clean_text(f"Capital project status row: {phase}; category {row.get('category') or 'not specified'}; managing agency {row.get('managing_agency') or 'not specified'}; project description: {row.get('description') or 'not provided'}.", 420),
            observed_change=clean_text(f"Observed capital-project status record in phase {phase}.", 220),
            confidence="documented",
            limitations="Capital project status rows include projected schedule and budget fields; this atlas record uses the source reporting date and does not treat projected schedule fields as completed outcomes.",
        ))

    tracker_rows = socrata("data.cityofnewyork.us", "4hcv-tc5r", {
        "$limit": "1800",
        "$select": "trackerid,fmsid,title,summary,currentphase,designstart,designactualcompletion,procurementstart,procurementactualcompletion,constructionstart,constructionactualcompletion,lastupdated,totalfunding,fundingsource,name,parkid,latitude,longitude,borough",
        "$order": "lastupdated ASC",
        "$where": "latitude IS NOT NULL AND longitude IS NOT NULL AND lastupdated IS NOT NULL",
    }, timeout=90)
    raw["sources"]["4hcv-tc5r"] = {"fetched": len(tracker_rows), "sample_fields": list(tracker_rows[0].keys()) if tracker_rows else []}
    add_with_point(
        "nyc_capital_project_tracker", tracker_rows, "4hcv-tc5r",
        lambda r: f"Capital project tracker: {r.get('title') or r.get('fmsid')}, {nyc_borough_name(r.get('borough'))}",
        lambda r: first_date(r.get("constructionactualcompletion"), r.get("procurementactualcompletion"), r.get("designactualcompletion"), r.get("lastupdated")),
        "capital projects/public realm/parks",
        lambda r: f"Capital Project Tracker row for {r.get('title') or r.get('fmsid')}; current phase {r.get('currentphase') or 'not stated'}; public location {r.get('name') or 'not specified'}; funding {r.get('totalfunding') or 'not stated'}.",
        lambda r: r.get("trackerid") or r.get("fmsid"),
        "latitude", "longitude",
        lambda r: nyc_borough_name(r.get("borough")) or "NYC",
        1800,
        source_url_fn=lambda r: socrata_row_url("4hcv-tc5r", "trackerid", r.get("trackerid") or r.get("fmsid")),
    )

    parks_rows = socrata("data.cityofnewyork.us", "enfh-gkve", {
        "$limit": "1800",
        "$select": "objectid,gispropnum,signname,name311,acquisitiondate,borough,location,acres,typecategory,subcategory,waterfront,multipolygon",
        "$order": "acquisitiondate ASC",
        "$where": "acquisitiondate IS NOT NULL AND multipolygon IS NOT NULL",
    }, timeout=90)
    raw["sources"]["enfh-gkve"] = {"fetched": len(parks_rows), "sample_fields": list(parks_rows[0].keys()) if parks_rows else []}
    added_parks = 0
    for row in parks_rows:
        if added_parks >= 1600:
            break
        point = point_from_geojson(row.get("multipolygon"))
        if not in_bounds(point, NYC_BOUNDS):
            continue
        lon, lat = point
        rid = row.get("objectid") or row.get("gispropnum") or row.get("signname")
        date = first_date(row.get("acquisitiondate"))
        if not rid or not date:
            raw["skipped_without_source_date"] += 1
            continue
        name = clean_text(row.get("signname") or row.get("name311") or rid, 100)
        borough = nyc_borough_name(row.get("borough"))
        events.append(event_record(
            event_id=f"nyc_parks_property_{slug(rid, 64)}",
            title=f"Parks property acquisition: {name}",
            date=date,
            bucket="environment/public realm/parks",
            area=borough,
            location=clean_text(row.get("location"), 140),
            latitude=lat,
            longitude=lon,
            source_ids=["enfh-gkve"],
            source_record_id=str(rid),
            source_url=socrata_row_url("enfh-gkve", "objectid", rid),
            source_retrieved_at=retrieved_at,
            source_dataset_id="enfh-gkve",
            summary=clean_text(f"NYC Parks property record for {name}; type {row.get('typecategory') or row.get('subcategory') or 'not specified'}; acres {row.get('acres') or 'not stated'}; waterfront={row.get('waterfront')}.", 420),
            observed_change=clean_text(f"Parks property record with acquisition date for {name}.", 220),
            confidence="documented",
            limitations="Parks acquisition dates and property polygons are administrative records; public opening, renovation, or access changes may differ.",
        ))
        added_parks += 1

    tree_rows = socrata("data.cityofnewyork.us", "uvpi-gqnh", {
        "$limit": "1800",
        "$select": "tree_id,created_at,status,health,spc_common,address,zipcode,boroname,nta_name,latitude,longitude,tree_dbh,problems",
        "$order": "created_at ASC",
        "$where": "latitude IS NOT NULL AND longitude IS NOT NULL",
    }, timeout=90)
    raw["sources"]["uvpi-gqnh"] = {"fetched": len(tree_rows), "sample_fields": list(tree_rows[0].keys()) if tree_rows else []}
    add_with_point(
        "nyc_street_tree_census", tree_rows, "uvpi-gqnh",
        lambda r: f"Street tree census point: {r.get('spc_common') or 'tree'} in {r.get('nta_name') or nyc_borough_name(r.get('boroname'))}",
        lambda r: first_date(r.get("created_at"), "2015"),
        "environment/public realm/tree canopy",
        lambda r: f"2015 Street Tree Census record {r.get('tree_id')}; status {r.get('status') or 'not stated'}; health {r.get('health') or 'not stated'}; species {r.get('spc_common') or 'not stated'}; diameter {r.get('tree_dbh') or 'not stated'} inches.",
        lambda r: r.get("tree_id"),
        "latitude", "longitude",
        lambda r: r.get("nta_name") or nyc_borough_name(r.get("boroname")) or "NYC",
        1800,
        record_url_field="tree_id",
    )

    lpc_permit_rows, lpc_permit_meta = socrata_year_sample(
        "dpm2-m9mq", "issue_date", range(2004, 2027), 75,
        select="docket,address,received_date,borough,block,lot,lmnametype,communityboard,worktypes,regulation_type,issue_date,expiration_date,latitude,longitude,regulation_number,community_board",
        where_extra="latitude IS NOT NULL AND longitude IS NOT NULL",
        order="issue_date ASC",
        timeout=90,
    )
    raw["sources"]["dpm2-m9mq"] = lpc_permit_meta | {"sample_fields": list(lpc_permit_rows[0].keys()) if lpc_permit_rows else []}
    add_with_point(
        "nyc_lpc_permit", lpc_permit_rows, "dpm2-m9mq",
        lambda r: f"LPC permit issued: {r.get('worktypes') or r.get('regulation_type') or 'landmark work'} at {r.get('address','NYC')}",
        lambda r: first_date(r.get("issue_date"), r.get("received_date")),
        "planning/development/heritage",
        lambda r: f"LPC permit {r.get('docket') or r.get('regulation_number')}; landmark/site {r.get('lmnametype') or 'not stated'}; regulation type {r.get('regulation_type') or 'not stated'}; work type {r.get('worktypes') or 'not stated'}.",
        lambda r: r.get("docket") or r.get("regulation_number"), "latitude", "longitude",
        lambda r: nyc_borough_name(r.get("borough")) or "NYC",
        1600,
        source_url_fn=lambda r: socrata_row_url("dpm2-m9mq", "docket", r.get("docket") or r.get("regulation_number")),
    )

    individual_landmark_rows = socrata("data.cityofnewyork.us", "buis-pvji", {
        "$limit": "2000",
        "$select": "the_geom,objectid,borough,block,lot,address,bbl,lpc_name,lpc_lpnumb,lpc_sitede,lpc_sitest,lpc_altern,desdate,landmarkty,url_report",
        "$order": "desdate ASC",
        "$where": "desdate IS NOT NULL AND the_geom IS NOT NULL",
    }, timeout=120)
    raw["sources"]["buis-pvji"] = {"fetched": len(individual_landmark_rows), "sample_fields": list(individual_landmark_rows[0].keys()) if individual_landmark_rows else []}
    added_individual_landmarks = 0
    for row in individual_landmark_rows:
        point = point_from_geojson(row.get("the_geom"))
        if not in_bounds(point, NYC_BOUNDS):
            continue
        rid = row.get("objectid") or row.get("lpc_lpnumb") or row.get("bbl")
        date = first_date(row.get("desdate"))
        if not rid or not date:
            raw["skipped_without_source_date"] += 1
            continue
        if not not_future_date(date):
            continue
        lon, lat = point
        name = clean_text(row.get("lpc_name") or row.get("address") or rid, 120)
        borough = nyc_borough_name(row.get("borough"))
        events.append(event_record(
            event_id=f"nyc_lpc_individual_landmark_{slug(rid, 64)}",
            title=f"Individual landmark designated: {name}",
            date=date,
            bucket="planning/heritage/landmark designation",
            area=borough,
            location=clean_text(row.get("address") or row.get("lpc_sitede"), 180),
            latitude=lat,
            longitude=lon,
            source_ids=["buis-pvji"],
            source_record_id=str(rid),
            source_url=socrata_row_url("buis-pvji", "objectid", rid),
            source_retrieved_at=retrieved_at,
            source_dataset_id="buis-pvji",
            summary=clean_text(f"LPC individual landmark site {row.get('lpc_lpnumb') or rid}; status {row.get('lpc_sitest') or 'not stated'}; type {row.get('landmarkty') or 'landmark'}; alternate name {row.get('lpc_altern') or 'not stated'}.", 420),
            observed_change=clean_text(f"LPC designation record for {name}; designation date is taken from the source desdate field.", 240),
            confidence="documented",
            limitations="LPC landmark designation is a legal/protection status event, not a physical construction event or causal impact claim.",
        ))
        added_individual_landmarks += 1

    historic_district_rows = socrata("data.cityofnewyork.us", "skyk-mpzq", {
        "$limit": "300",
        "$select": "the_geom,borough,lp_number,current_,area_name,extension,status_of_,last_actio,public_hea,desdate,caldate,shape_leng,shape_area",
        "$order": "desdate ASC",
        "$where": "desdate IS NOT NULL AND the_geom IS NOT NULL",
    }, timeout=120)
    raw["sources"]["skyk-mpzq"] = {"fetched": len(historic_district_rows), "sample_fields": list(historic_district_rows[0].keys()) if historic_district_rows else []}
    added_historic_districts = 0
    for row in historic_district_rows:
        point = point_from_geojson(row.get("the_geom"))
        if not in_bounds(point, NYC_BOUNDS):
            continue
        rid = row.get("lp_number") or row.get("area_name")
        date = first_date(row.get("desdate"), row.get("caldate"))
        if not rid or not date:
            raw["skipped_without_source_date"] += 1
            continue
        if not not_future_date(date):
            continue
        lon, lat = point
        name = clean_text(row.get("area_name") or rid, 120)
        borough = nyc_borough_name(row.get("borough"))
        events.append(event_record(
            event_id=f"nyc_lpc_historic_district_{slug(rid, 64)}",
            title=f"Historic district designated: {name}",
            date=date,
            bucket="planning/heritage/historic district designation",
            area=borough,
            latitude=lat,
            longitude=lon,
            source_ids=["skyk-mpzq"],
            source_record_id=str(rid),
            source_url=socrata_row_url("skyk-mpzq", "lp_number", rid),
            source_retrieved_at=retrieved_at,
            source_dataset_id="skyk-mpzq",
            summary=clean_text(f"LPC historic district record {rid}; status {row.get('status_of_') or row.get('last_actio') or 'not stated'}; public hearing {row.get('public_hea') or 'not stated'}.", 420),
            observed_change=clean_text(f"LPC historic district designation record for {name}.", 220),
            confidence="documented",
            limitations="Historic district designation is a legal/protection status event. Geometry is simplified to a centroid in the atlas marker layer.",
        ))
        added_historic_districts += 1

    fire_dispatch_rows, fire_dispatch_meta = socrata_year_sample(
        "8m42-w767", "incident_datetime", range(2005, 2027), 90,
        select="starfire_incident_id,incident_datetime,incident_borough,zipcode,alarm_box_location,alarm_source_description_tx,alarm_level_index_description,highest_alarm_level,incident_classification,incident_classification_group,first_on_scene_datetime,incident_close_datetime,engines_assigned_quantity,ladders_assigned_quantity,other_units_assigned_quantity",
        order="incident_datetime ASC",
        timeout=120,
    )
    raw["sources"]["8m42-w767"] = fire_dispatch_meta | {"sample_fields": list(fire_dispatch_rows[0].keys()) if fire_dispatch_rows else []}
    for row in fire_dispatch_rows[:1800]:
        rid = row.get("starfire_incident_id")
        date = first_date(row.get("incident_datetime"))
        if not rid or not date:
            raw["skipped_without_source_date"] += 1
            continue
        if not not_future_date(date):
            continue
        borough = nyc_borough_name(row.get("incident_borough"))
        classification = clean_text(row.get("incident_classification") or row.get("incident_classification_group") or "fire dispatch incident", 120)
        events.append(event_record(
            event_id=f"nyc_fdny_fire_incident_{slug(rid, 64)}",
            title=f"FDNY dispatch incident: {classification}, {borough}",
            date=date,
            bucket="fire/public safety/emergency incident",
            area=borough,
            location=clean_text(row.get("alarm_box_location") or row.get("zipcode") or borough, 160),
            source_ids=["8m42-w767"],
            source_record_id=str(rid),
            source_url=socrata_row_url("8m42-w767", "starfire_incident_id", rid),
            source_retrieved_at=retrieved_at,
            source_dataset_id="8m42-w767",
            summary=clean_text(f"FDNY Starfire dispatch row {rid}; classification {classification}; alarm level {row.get('highest_alarm_level') or row.get('alarm_level_index_description') or 'not stated'}; engines {row.get('engines_assigned_quantity') or 'not stated'}, ladders {row.get('ladders_assigned_quantity') or 'not stated'}.", 420),
            observed_change=clean_text(f"Observed FDNY dispatch incident record for {classification} in {borough}.", 220),
            confidence="documented",
            limitations="FDNY dispatch rows are operational emergency-response records. They are not final incident-origin determinations and do not imply built-form change or impact.",
        ))

    permit_event_rows, permit_event_meta = socrata_year_sample(
        "bkfu-528j", "start_date_time", range(2005, 2027), 130,
        select="event_id,event_name,start_date_time,end_date_time,event_agency,event_type,event_borough,event_location,street_closure_type,community_board,police_precinct",
        order="start_date_time ASC",
        timeout=90,
    )
    raw["sources"]["bkfu-528j"] = permit_event_meta | {"sample_fields": list(permit_event_rows[0].keys()) if permit_event_rows else []}
    for row in permit_event_rows[:2600]:
        rid = row.get("event_id") or row.get("event_name")
        date = first_date(row.get("start_date_time"))
        if not rid or not date:
            raw["skipped_without_source_date"] += 1
            continue
        borough = clean_text(row.get("event_borough") or "NYC", 60)
        events.append(event_record(
            event_id=f"nyc_permitted_event_{slug(rid, 60)}",
            title=f"Permitted civic event: {clean_text(row.get('event_name') or rid, 120)}",
            date=date,
            bucket="public services/major event/street use",
            area=borough,
            location=clean_text(row.get("event_location"), 160),
            source_ids=["bkfu-528j"],
            source_record_id=str(rid),
            source_url=socrata_row_url("bkfu-528j", "event_id", rid),
            source_retrieved_at=retrieved_at,
            source_dataset_id="bkfu-528j",
            summary=clean_text(f"{row.get('event_type','Permitted event')} handled by {row.get('event_agency','NYC agency')} at {row.get('event_location','location not specified')}.", 360),
            observed_change="Permitted event/street-use record with possible temporary access, footfall, or traffic effects.",
            confidence="documented",
            limitations="Historical permitted event records are administrative events; exact geometry/closure impacts require event-location parsing.",
        ))

    complaint_rows, complaint_meta = socrata_year_sample(
        "erm2-nwe9", "created_date", range(2020, 2027), 120,
        select="unique_key,created_date,complaint_type,descriptor,incident_zip,borough,latitude,longitude,location_type",
        where_extra="latitude IS NOT NULL AND longitude IS NOT NULL",
        order="created_date ASC",
        timeout=120,
    )
    raw["sources"]["erm2-nwe9"] = complaint_meta | {"sample_fields": list(complaint_rows[0].keys()) if complaint_rows else []}
    add_with_point(
        "nyc_311_service_request", complaint_rows, "erm2-nwe9",
        lambda r: f"311 service request: {r.get('complaint_type','complaint')} - {r.get('descriptor','')}",
        lambda r: first_date(r.get("created_date")),
        "public services/service requests",
        lambda r: f"311 {r.get('complaint_type','service request')} record ({r.get('descriptor','no descriptor')}) in {r.get('borough','NYC')}.",
        lambda r: r.get("unique_key"), "latitude", "longitude",
        lambda r: r.get("borough") or r.get("incident_zip") or "NYC", 1200,
        record_url_field="unique_key",
    )

    collision_rows, collision_meta = socrata_year_sample(
        "h9gi-nx95", "crash_date", range(2012, 2027), 160,
        select="crash_date,crash_time,borough,zip_code,latitude,longitude,on_street_name,off_street_name,cross_street_name,number_of_persons_injured,number_of_persons_killed,number_of_pedestrians_injured,number_of_pedestrians_killed,number_of_cyclist_injured,number_of_cyclist_killed,number_of_motorist_injured,number_of_motorist_killed,contributing_factor_vehicle_1,contributing_factor_vehicle_2,collision_id,vehicle_type_code1,vehicle_type_code2",
        where_extra="latitude IS NOT NULL AND longitude IS NOT NULL",
        order="crash_date ASC",
        timeout=90,
    )
    raw["sources"]["h9gi-nx95"] = collision_meta | {"sample_fields": list(collision_rows[0].keys()) if collision_rows else []}
    add_with_point(
        "nyc_collision_crash", collision_rows, "h9gi-nx95",
        lambda r: f"Motor vehicle collision: {r.get('on_street_name') or r.get('cross_street_name') or r.get('borough','NYC')}",
        lambda r: first_date(r.get("crash_date")),
        "transport/safety/collisions",
        lambda r: f"Crash {r.get('collision_id')} at {r.get('crash_time','unknown time')}; injured={r.get('number_of_persons_injured','0')}, killed={r.get('number_of_persons_killed','0')}; factor={r.get('contributing_factor_vehicle_1','unknown')}.",
        lambda r: r.get("collision_id"), "latitude", "longitude",
        lambda r: r.get("borough") or r.get("zip_code") or "NYC", 2500,
        record_url_field="collision_id",
    )

    deduped: dict[str, dict[str, Any]] = {}
    for event in events:
        deduped[event["event_id"]] = event
    return list(deduped.values()), raw

def update_london_seed(new_events: list[dict[str, Any]]) -> None:
    path = DISCOVERY / "london/events_seed.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    events = [e for e in payload.get("events", []) if not str(e.get("event_id", "")).startswith(GENERATED_PREFIXES)]
    events.extend(new_events)
    payload.setdefault("metadata", {})["event_count"] = len(events)
    payload["metadata"]["expanded_from_official_rows_at"] = utc_now_iso()
    payload["metadata"]["generated_event_prefixes"] = list(GENERATED_PREFIXES)
    payload["events"] = events
    write_json(path, payload)


def update_nyc_seed(new_events: list[dict[str, Any]]) -> None:
    path = DISCOVERY / "new_york/events_seed.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    chronology = [e for e in payload.get("chronology_milestones", []) if not str(e.get("event_id", "")).startswith(GENERATED_PREFIXES)]
    chronology.extend(new_events)
    payload["chronology_milestones"] = chronology
    payload["generated_event_metadata"] = {
        "expanded_from_official_rows_at": utc_now_iso(),
        "generated_event_count": len(new_events),
        "total_chronology_milestones": len(chronology),
        "generated_event_prefixes": list(GENERATED_PREFIXES),
    }
    write_json(path, payload)


def main() -> None:
    london_brownfield, london_brownfield_raw = fetch_london_brownfield(max_events=10000)
    london_datahub, london_datahub_raw = fetch_london_datahub_applications(max_events=12000)
    london_designations, london_designations_raw = fetch_london_planning_designations(max_events=40000)
    london_lfb, london_lfb_raw = fetch_london_lfb_incidents(max_per_year=1500)
    london_dft_collisions, london_dft_collisions_raw = fetch_london_dft_road_collisions(max_per_year=4500)
    london_hmlr_price_paid, london_hmlr_price_paid_raw = fetch_london_hmlr_price_paid(max_per_year=800)
    london_ukhpi, london_ukhpi_raw = fetch_london_ukhpi_monthly()
    london_fhrs, london_fhrs_raw = fetch_london_fhrs_ratings(max_per_authority=300)
    london_police_crimes, london_police_crimes_raw = fetch_london_police_street_crimes(max_per_month_force=380)
    london_police_stop_searches, london_police_stop_searches_raw = fetch_london_police_stop_searches(max_per_month_force=320)
    london_tfl, london_tfl_raw = fetch_london_tfl_disruptions(max_events=250)
    london_events = london_brownfield + london_datahub + london_designations + london_lfb + london_dft_collisions + london_hmlr_price_paid + london_ukhpi + london_fhrs + london_police_crimes + london_police_stop_searches + london_tfl
    update_london_seed(london_events)

    nyc_events, nyc_raw = fetch_nyc_events()
    update_nyc_seed(nyc_events)

    write_json(RAW / "generated_event_expansion_london_brownfield_summary.json", london_brownfield_raw)
    write_json(RAW / "generated_event_expansion_london_datahub_applications_summary.json", london_datahub_raw)
    write_json(RAW / "generated_event_expansion_london_planning_designations_summary.json", london_designations_raw)
    write_json(RAW / "generated_event_expansion_london_lfb_incidents_summary.json", london_lfb_raw)
    write_json(RAW / "generated_event_expansion_london_dft_road_collisions_summary.json", london_dft_collisions_raw)
    write_json(RAW / "generated_event_expansion_london_hmlr_price_paid_summary.json", london_hmlr_price_paid_raw)
    write_json(RAW / "generated_event_expansion_london_ukhpi_summary.json", london_ukhpi_raw)
    write_json(RAW / "generated_event_expansion_london_fhrs_summary.json", london_fhrs_raw)
    write_json(RAW / "generated_event_expansion_london_police_street_crimes_summary.json", london_police_crimes_raw)
    write_json(RAW / "generated_event_expansion_london_police_stop_searches_summary.json", london_police_stop_searches_raw)
    write_json(RAW / "generated_event_expansion_london_tfl_disruptions_summary.json", london_tfl_raw)
    write_json(RAW / "generated_event_expansion_nyc_summary.json", nyc_raw)
    nyc_source_counts = {source_id: details.get("fetched") for source_id, details in nyc_raw.get("sources", {}).items()}
    write_json(DISCOVERY / "shared/generated_event_expansion_summary.json", {
        "generated_at": utc_now_iso(),
        "london": {
            "brownfield_events": len(london_brownfield),
            "planning_datahub_application_events": len(london_datahub),
            "planning_designation_events": len(london_designations),
            "lfb_incident_events": len(london_lfb),
            "dft_road_collision_events": len(london_dft_collisions),
            "hmlr_price_paid_events": len(london_hmlr_price_paid),
            "ukhpi_monthly_events": len(london_ukhpi),
            "fhrs_food_hygiene_rating_events": len(london_fhrs),
            "police_street_crime_events": len(london_police_crimes),
            "police_stop_search_events": len(london_police_stop_searches),
            "tfl_disruption_events": len(london_tfl),
            "total_generated_events": len(london_events),
        },
        "nyc": {"total_generated_events": len(nyc_events), "source_event_counts": nyc_source_counts},
        "notes": [
            "Official/open source rows are converted to source-backed atlas events, not causal impact claims.",
            "Sensitive contact, owner, permittee and personal fields from permit/admin datasets are intentionally not persisted.",
            "Records without public coordinates rely on the atlas builder's deterministic city/borough point distribution.",
            "London brownfield rows are fetched from Planning Data England per London LPA; LFB rows are sampled from a very large London Datastore incident CSV to keep the repo lightweight.",
            "London Planning Datahub application rows are public administrative records; the London Datastore licence is labelled Not Specified, so the atlas stores only minimal public provenance fields and carries a reuse caveat.",
            "London Planning Data designation rows include conservation/listed/heritage/local-plan, Article 4, and tree-preservation records. They are legal/planning-status evidence and should not be presented as direct physical construction events.",
            "DfT STATS19 London collision rows are official reported personal-injury road-safety records; they are local transport-safety context, not causal evidence about street design.",
            "HM Land Registry Price Paid rows are property transaction records. The adapter omits address fields, full postcodes, and exact prices; postcode-derived points are approximate and should not be treated as exact property/building locations.",
            "UK House Price Index rows are borough-level monthly aggregate statistics; they are nominal, revised over time, and not evidence of single-site construction, affordability, displacement, or causation.",
            "Food Standards Agency FHRS rows are current-snapshot food-hygiene rating records. The adapter omits business names, addresses, postcodes, phone/email fields, and right-to-reply text before writing atlas events.",
            "Police.uk street-level crime/ASB rows are anonymized public-safety management records; they are approximate locations and should not be treated as exact incident sites or causal evidence.",
            "Police.uk stop-and-search rows are privacy-minimized by the adapter: demographic fields and exact timestamps are intentionally omitted before writing atlas events.",
            "NYC LPC landmark and historic-district records are legal designation events; FDNY dispatch rows are operational incident records, not final incident-origin or impact determinations.",
        ],
    })
    print(json.dumps({
        "london_generated": len(london_events),
        "london_brownfield": len(london_brownfield),
        "london_datahub_applications": len(london_datahub),
        "london_planning_designations": len(london_designations),
        "london_lfb_incidents": len(london_lfb),
        "london_dft_road_collisions": len(london_dft_collisions),
        "london_hmlr_price_paid": len(london_hmlr_price_paid),
        "london_ukhpi_monthly": len(london_ukhpi),
        "london_fhrs_food_hygiene_ratings": len(london_fhrs),
        "london_police_street_crimes": len(london_police_crimes),
        "london_police_stop_searches": len(london_police_stop_searches),
        "london_tfl_disruptions": len(london_tfl),
        "nyc_generated": len(nyc_events),
        "nyc_source_counts": nyc_source_counts,
    }, indent=2))


if __name__ == "__main__":
    main()
