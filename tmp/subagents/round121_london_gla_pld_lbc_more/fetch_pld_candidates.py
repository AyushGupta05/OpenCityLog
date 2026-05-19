#!/usr/bin/env python3
"""Round 121 PLD candidate finder.

Writes only inside this scratch directory. Source records remain in the
Planning London Datahub; the output stores factual row pointers and caveats.
"""

from __future__ import annotations

import json
import math
import re
import sys
import time
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]
OUT_DIR = Path(__file__).resolve().parent
API = "https://planningdata.london.gov.uk/api-guest/applications/_search"
SOURCE_URL_PREFIX = "https://planningdata.london.gov.uk/api-guest/applications/_source/"
ACCESSED_AT = "2026-05-19"
START = date(2008, 1, 1)
END = date(2026, 5, 19)
MAX_CANDIDATES = 70
USER_AGENT = "Bims5Round121LondonPld/0.1"

SOURCE_FIELDS = [
    "id",
    "lpa_name",
    "borough",
    "lpa_app_no",
    "site_name",
    "site_number",
    "street_name",
    "secondary_street_name",
    "locality",
    "postcode",
    "description",
    "decision_date",
    "decision",
    "status",
    "application_type_full",
    "application_type",
    "centroid",
    "wgs84_polygon",
    "url_planning_app",
    "application_details.scheme_name",
    "application_details.site_area",
    "application_details.total_gia_gained",
    "application_details.total_gia_lost",
    "application_details.projected_cost_of_works",
    "application_details.residential_details.total_no_proposed_residential_units",
    "application_details.building_details",
]

APPROVED_SHOULD = [
    {"match_phrase": {"decision": "Approved"}},
    {"match_phrase": {"decision": "Grant"}},
    {"match_phrase": {"decision": "Granted"}},
    {"match_phrase": {"decision": "Grant Permission"}},
    {"match_phrase": {"decision": "Approve"}},
    {"match_phrase": {"status": "Approved"}},
    {"match_phrase": {"status": "Grant"}},
    {"match_phrase": {"status": "Completed"}},
]

QUERY_SPECS = [
    {
        "label": "listed building consent with civic/heritage signal",
        "category": "listed-building-consent",
        "size": 180,
        "must": [
            {"bool": {"should": [
                {"match_phrase": {"application_type_full": "listed building consent"}},
                {"match_phrase": {"application_type_full": "Full planning & listed building consent"}},
                {"match_phrase": {"description": "listed building consent"}},
            ], "minimum_should_match": 1}},
            {"query_string": {
                "query": '(restoration OR refurbishment OR alteration OR extension OR demolition OR "public realm" OR museum OR library OR theatre OR gallery OR hospital OR school OR college OR university OR civic OR "town hall" OR market OR station OR bridge OR estate OR regeneration OR conservation OR heritage)',
                "fields": ["description", "site_name", "application_details.scheme_name", "application_type_full"],
            }},
        ],
    },
    {
        "label": "listed building consent broad backfill",
        "category": "listed-building-consent",
        "size": 120,
        "must": [
            {"bool": {"should": [
                {"match_phrase": {"application_type_full": "listed building consent"}},
                {"match_phrase": {"application_type_full": "Full planning & listed building consent"}},
                {"match_phrase": {"description": "listed building consent"}},
            ], "minimum_should_match": 1}},
        ],
        "should": [
            {"match_phrase": {"description": "Grade II"}},
            {"match_phrase": {"description": "public realm"}},
            {"match_phrase": {"description": "museum"}},
            {"match_phrase": {"description": "library"}},
            {"match_phrase": {"description": "hospital"}},
            {"match_phrase": {"description": "school"}},
            {"match_phrase": {"description": "theatre"}},
            {"match_phrase": {"description": "gallery"}},
        ],
        "sort": [
            {"application_details.total_gia_gained": {"order": "desc", "missing": "_last"}},
            {"application_details.site_area": {"order": "desc", "missing": "_last"}},
            {"decision_date": {"order": "desc", "missing": "_last"}},
        ],
    },
    {
        "label": "conservation-sensitive major applications",
        "category": "conservation-sensitive-major",
        "size": 220,
        "must": [
            {"query_string": {
                "query": '("conservation area" OR "demolition in conservation" OR "listed building" OR "Grade II" OR heritage OR "heritage asset" OR "conservation-area") AND (redevelopment OR demolition OR extension OR refurbishment OR restoration OR "public realm" OR "mixed use" OR residential OR office OR hotel OR school OR hospital OR museum OR theatre OR gallery OR library OR estate OR regeneration)',
                "fields": ["description", "site_name", "application_details.scheme_name", "application_type_full"],
            }},
        ],
    },
    {
        "label": "estate regeneration and masterplans",
        "category": "estate-regeneration",
        "size": 220,
        "must": [
            {"query_string": {
                "query": '("estate regeneration" OR "housing estate" OR estate OR regeneration OR masterplan OR "comprehensive redevelopment" OR "phased redevelopment")',
                "fields": ["description", "site_name", "application_details.scheme_name"],
            }},
        ],
    },
    {
        "label": "civic health education culture",
        "category": "civic-health-education-culture",
        "size": 240,
        "must": [
            {"query_string": {
                "query": '(school OR academy OR college OR university OR campus OR hospital OR healthcare OR "health centre" OR clinic OR library OR museum OR theatre OR gallery OR cultural OR culture OR civic OR "town hall" OR "leisure centre" OR "community centre" OR "community hub" OR market)',
                "fields": ["description", "site_name", "application_details.scheme_name"],
            }},
        ],
    },
    {
        "label": "major public realm mixed use",
        "category": "major-public-realm-mixed-use",
        "size": 160,
        "must": [
            {"query_string": {
                "query": '("public realm" OR "new public" OR "mixed use" OR "outline planning" OR "full planning" OR "environmental impact assessment" OR EIA OR "tall building" OR "strategic development") AND (redevelopment OR regeneration OR masterplan OR demolition OR construction OR residential OR office OR hotel OR cultural OR education OR health)',
                "fields": ["description", "site_name", "application_details.scheme_name", "application_type_full"],
            }},
        ],
    },
]

SOURCE_AUDITS = [
    {
        "source_id": "gla-planning-datahub-applications",
        "source_name": "Planning London Datahub applications",
        "publisher": "Greater London Authority / London planning authorities",
        "source_url": "https://data.london.gov.uk/dataset/planning-london-datahub-applications/",
        "api_endpoint": API,
        "license_or_terms_note": "London Datastore dataset page lists Licence: Not Specified. This scratch pack keeps factual row metadata, source-row URLs, and normalized coordinates only; review terms before redistributing a derived bulk dataset.",
        "coverage_years": "Historic/current Planning London Datahub application records queried for decision_date 2008-01-01 through 2026-05-19.",
        "update_frequency": "Daily according to the London Datastore dataset page and GLA PLD public guidance.",
        "geographic_scope": "Greater London planning authorities represented in the Planning London Datahub guest API.",
        "key_fields_used": SOURCE_FIELDS,
        "reliability_assessment": "usable with caveats",
        "required_caveats": "PLD rows are administrative planning application records. Borough feed coverage, backfill, decision coding, and centroid quality vary. Rows do not prove construction start, completion, occupation, opening, design quality, causation, or public outcomes.",
        "ingestion_recommendation": "Use as citation-backed planning-process milestones when the UI preserves PLD id, LPA reference, date field, geometry caveat, terms note, and source URL.",
        "accessed_at": ACCESSED_AT,
    },
    {
        "source_id": "gla-planning-datahub-listed-building-consent",
        "source_name": "Planning London Datahub applications API - listed building consent records",
        "publisher": "Greater London Authority / London planning authorities",
        "source_url": "https://data.london.gov.uk/dataset/planning-london-datahub-applications/",
        "api_endpoint": API,
        "license_or_terms_note": "London Datastore dataset page lists Licence: Not Specified. Candidate rows are factual pointers to official PLD records, not a full reproduced dataset.",
        "coverage_years": "PLD rows where application type or description indicated listed-building consent and decision_date was 2008-01-01 through 2026-05-19.",
        "update_frequency": "Daily according to the London Datastore dataset page and GLA PLD public guidance.",
        "geographic_scope": "Greater London planning authorities represented in the Planning London Datahub guest API.",
        "key_fields_used": SOURCE_FIELDS,
        "reliability_assessment": "usable with caveats",
        "required_caveats": "Listed-building-consent rows document consent/application administration only. They do not document that listed-building works began, were completed, improved heritage condition, or had any causal effect.",
        "ingestion_recommendation": "Use selected rows as administrative consent/decision events with limitations visible inline.",
        "accessed_at": ACCESSED_AT,
    },
]


def norm(value: Any) -> str:
    text = "" if value is None else str(value)
    text = urllib.parse.unquote(text)
    text = text.replace("&amp;", "&")
    text = text.lower()
    text = re.sub(r"[\s_/\\\-]+", " ", text)
    text = re.sub(r"[^a-z0-9 &.]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def norm_ref(value: Any) -> str:
    text = urllib.parse.unquote("" if value is None else str(value)).lower()
    text = text.replace("&amp;", "&")
    text = re.sub(r"[^a-z0-9]+", "", text)
    return text


def slug(value: Any, limit: int = 64) -> str:
    text = norm(value)
    text = re.sub(r"[^a-z0-9]+", "_", text).strip("_")
    return (text[:limit].strip("_") or "row")


def sentence_trim(value: Any, limit: int = 260) -> str:
    text = re.sub(r"\s+", " ", "" if value is None else str(value)).strip()
    if len(text) <= limit:
        return text
    cut = text[:limit - 1].rsplit(" ", 1)[0].rstrip(",;:")
    return f"{cut}..."


def iso_from_pld_date(value: Any) -> str | None:
    if not value:
        return None
    text = str(value).strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%dT%H:%M:%S%z"):
        try:
            return datetime.strptime(text, fmt).date().isoformat()
        except ValueError:
            pass
    match = re.match(r"^(\d{2})/(\d{2})/(\d{4})", text)
    if match:
        day, month, year = map(int, match.groups())
        try:
            return date(year, month, day).isoformat()
        except ValueError:
            return None
    return None


def in_window(iso_date: str | None) -> bool:
    if not iso_date:
        return False
    try:
        dt = date.fromisoformat(iso_date)
    except ValueError:
        return False
    return START <= dt <= END


def is_londonish(point: dict[str, float] | None) -> bool:
    if not point:
        return False
    lat = point.get("latitude")
    lon = point.get("longitude")
    if lat is None or lon is None or not math.isfinite(lat) or not math.isfinite(lon):
        return False
    return 51.25 <= lat <= 51.75 and -0.60 <= lon <= 0.40


def round6(value: Any) -> float:
    return round(float(value), 6)


def walk_coords(coords: Any) -> list[tuple[float, float]]:
    out: list[tuple[float, float]] = []
    if not isinstance(coords, list):
        return out
    if len(coords) >= 2 and all(isinstance(v, (int, float)) for v in coords[:2]):
        lon, lat = float(coords[0]), float(coords[1])
        if -180 <= lon <= 180 and -90 <= lat <= 90:
            out.append((lon, lat))
        return out
    for child in coords:
        out.extend(walk_coords(child))
    return out


def representative_point_from_geojson(geometry: Any) -> dict[str, float] | None:
    if not geometry:
        return None
    coords = walk_coords(geometry.get("coordinates") if isinstance(geometry, dict) else geometry)
    coords = [(lon, lat) for lon, lat in coords if -0.80 <= lon <= 0.60 and 51.0 <= lat <= 52.0]
    if not coords:
        return None
    return {
        "longitude": sum(lon for lon, _ in coords) / len(coords),
        "latitude": sum(lat for _, lat in coords) / len(coords),
    }


def row_point(row: dict[str, Any]) -> tuple[dict[str, float] | None, str, str]:
    centroid = row.get("centroid") or {}
    point: dict[str, float] | None = None
    if isinstance(centroid, dict):
        try:
            point = {"latitude": float(centroid.get("lat")), "longitude": float(centroid.get("lon"))}
        except (TypeError, ValueError):
            point = None
    if is_londonish(point):
        return (
            point,
            "Planning London Datahub centroid",
            "Source centroid from PLD row; not a surveyed building footprint or planning-boundary geometry.",
        )
    poly_point = representative_point_from_geojson(row.get("wgs84_polygon"))
    if is_londonish(poly_point):
        return (
            poly_point,
            "Representative point derived from Planning London Datahub wgs84_polygon because centroid was absent or outside the London envelope",
            "Representative point from source WGS84 polygon; not a measured building footprint or statutory listed-building extent.",
        )
    return None, "", ""


def numberish(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    text = re.sub(r"[^0-9.\-]+", "", str(value))
    try:
        return float(text) if text else 0.0
    except ValueError:
        return 0.0


def details(row: dict[str, Any]) -> dict[str, Any]:
    return row.get("application_details") if isinstance(row.get("application_details"), dict) else {}


def residential_units(row: dict[str, Any]) -> float:
    d = details(row)
    res = d.get("residential_details") if isinstance(d.get("residential_details"), dict) else {}
    return numberish(res.get("total_no_proposed_residential_units"))


def max_storeys(row: dict[str, Any]) -> float:
    d = details(row)
    buildings = d.get("building_details")
    vals: list[float] = []
    if isinstance(buildings, list):
        for b in buildings:
            if isinstance(b, dict):
                for key in ("max_storeys", "storeys", "number_of_storeys"):
                    vals.append(numberish(b.get(key)))
    return max(vals) if vals else 0.0


def source_url(row_id: str) -> str:
    return SOURCE_URL_PREFIX + urllib.parse.quote(row_id, safe="")


def text_blob(row: dict[str, Any]) -> str:
    d = details(row)
    return norm(" ".join(str(v or "") for v in [
        row.get("site_name"),
        row.get("description"),
        row.get("application_type_full"),
        row.get("application_type"),
        d.get("scheme_name"),
        row.get("lpa_name"),
    ]))


def location_for(row: dict[str, Any]) -> str:
    d = details(row)
    bits = [
        d.get("scheme_name"),
        row.get("site_name"),
        " ".join(str(v) for v in [row.get("site_number"), row.get("street_name")] if v),
        " ".join(str(v) for v in [row.get("site_number"), row.get("locality")] if v),
        row.get("postcode"),
        row.get("lpa_name") or row.get("borough"),
    ]
    seen: set[str] = set()
    for bit in bits:
        label = sentence_trim(bit, 120)
        key = norm(label)
        if len(key) < 4 or key in seen or key in {"site", "land", "building", "premises", "ground floor"}:
            continue
        seen.add(key)
        return label
    return row.get("lpa_app_no") or row.get("id") or "PLD row"


def decision_ok(row: dict[str, Any]) -> bool:
    text = norm(f"{row.get('decision')} {row.get('status')}")
    if re.search(r"refus|withdraw|invalid|insufficient|not required|no objection|comment issued|finally disposed|closed", text):
        return False
    return bool(re.search(r"approved|grant|permission", text))


def category_flags(row: dict[str, Any], query_categories: set[str]) -> set[str]:
    blob = text_blob(row)
    flags = set(query_categories)
    app_type = norm(row.get("application_type_full") or row.get("application_type"))
    if "listed building consent" in app_type or "listed building consent" in blob:
        flags.add("listed-building-consent")
    if re.search(r"conservation|listed building|grade ii|heritage|heritage asset|demolition in conservation", blob):
        flags.add("conservation-sensitive-major")
    if re.search(r"estate regeneration|housing estate|estate|regeneration|masterplan|comprehensive redevelopment|phased redevelopment", blob):
        flags.add("estate-regeneration")
    if re.search(r"school|academy|college|university|campus|hospital|healthcare|health centre|clinic|library|museum|theatre|gallery|cultural|culture|civic|town hall|leisure centre|community centre|community hub|market", blob):
        flags.add("civic-health-education-culture")
    if re.search(r"public realm|mixed use|outline planning|environmental impact assessment| eia |tall building|strategic development", f" {blob} "):
        flags.add("major-public-realm-mixed-use")
    return flags


def project_type(row: dict[str, Any], flags: set[str]) -> str:
    blob = text_blob(row)
    if "listed-building-consent" in flags and "civic-health-education-culture" in flags:
        return "listed-building consent / civic, health, education or culture planning record"
    if "listed-building-consent" in flags:
        return "listed-building consent planning record"
    if "estate-regeneration" in flags:
        return "estate regeneration or masterplan planning record"
    if re.search(r"hospital|healthcare|health centre|clinic", blob):
        return "health planning record"
    if re.search(r"school|academy|college|university|campus", blob):
        return "education planning record"
    if re.search(r"library|museum|theatre|gallery|cultural|culture", blob):
        return "culture planning record"
    if re.search(r"civic|town hall|community centre|community hub|leisure centre|market", blob):
        return "civic or community planning record"
    if "conservation-sensitive-major" in flags:
        return "conservation-sensitive major planning record"
    return "Planning London Datahub application record"


def score_row(row: dict[str, Any], flags: set[str]) -> int:
    blob = text_blob(row)
    score = 45
    category_weights = {
        "listed-building-consent": 16,
        "conservation-sensitive-major": 13,
        "estate-regeneration": 17,
        "civic-health-education-culture": 17,
        "major-public-realm-mixed-use": 10,
    }
    for flag, weight in category_weights.items():
        if flag in flags:
            score += weight
    if decision_ok(row):
        score += 8
    units = residential_units(row)
    gia = numberish(details(row).get("total_gia_gained"))
    site_area = numberish(details(row).get("site_area"))
    storeys = max_storeys(row)
    if units >= 1000:
        score += 15
    elif units >= 500:
        score += 12
    elif units >= 100:
        score += 8
    elif units >= 25:
        score += 4
    if gia >= 100000:
        score += 14
    elif gia >= 50000:
        score += 11
    elif gia >= 10000:
        score += 8
    elif gia >= 1000:
        score += 3
    if site_area >= 5:
        score += 7
    elif site_area >= 1:
        score += 4
    if storeys >= 30:
        score += 8
    elif storeys >= 12:
        score += 4
    high_signal = [
        "museum", "library", "theatre", "gallery", "hospital", "health centre",
        "school", "university", "college", "town hall", "civic centre",
        "estate regeneration", "masterplan", "public realm", "listed building",
        "conservation area", "heritage", "market", "station", "community hub",
    ]
    score += sum(3 for term in high_signal if term in blob)
    low_signal = [
        "approval of details", "discharge of condition", "non material amendment",
        "variation of condition", "advertisement", "tree works", "installation of plaque",
        "installation of secondary glazing", "internal alterations only", "single dwelling",
        "householder", "certificate of lawfulness", "details pursuant",
    ]
    score -= sum(10 for term in low_signal if term in blob)
    if len(row.get("description") or "") < 80:
        score -= 5
    return score


def duplicate_index() -> dict[str, set[str]]:
    idx: dict[str, set[str]] = {
        "pld_ids": set(),
        "lpa_refs": set(),
        "source_urls": set(),
        "title_dates": set(),
    }
    scan_roots = [
        ROOT / "data" / "manual_drops",
        ROOT / "web" / "data" / "city-atlas" / "cities" / "london",
        ROOT / "api",
        ROOT / "manifests",
        ROOT / "tmp" / "subagents",
    ]
    files: list[Path] = []
    for scan_root in scan_roots:
        if not scan_root.exists():
            continue
        files.extend(p for p in scan_root.rglob("*") if p.suffix.lower() in {".json", ".jsonl", ".ndjson"})
    for path in files:
        try:
            if OUT_DIR in path.parents or path.stat().st_size > 80_000_000:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for match in re.finditer(r"planningdata\.london\.gov\.uk/api-guest/applications/_source/([^\"'\s,}]+)", text):
            decoded = urllib.parse.unquote(match.group(1)).rstrip("\\")
            idx["pld_ids"].add(decoded)
            idx["source_urls"].add(source_url(decoded))
        for match in re.finditer(r"PLD:([^;\"'\]\n\r,}]+)", text):
            idx["pld_ids"].add(urllib.parse.unquote(match.group(1)).strip())
        for match in re.finditer(r"LPA:([^;\"'\]\n\r,}]+)", text):
            idx["lpa_refs"].add(norm_ref(match.group(1)))
        if '"title"' in text and ('"date"' in text or '"effective_date"' in text):
            try:
                payload = json.loads(text)
            except json.JSONDecodeError:
                payload = None
            for obj in iter_objects(payload):
                if isinstance(obj, dict):
                    title = obj.get("title")
                    dt = obj.get("date") or obj.get("effective_date")
                    if title and dt:
                        idx["title_dates"].add(f"{norm(title)}|{str(dt)[:10]}")
                    srid = obj.get("source_record_id")
                    if srid:
                        for m in re.finditer(r"PLD:([^;]+)", str(srid)):
                            idx["pld_ids"].add(urllib.parse.unquote(m.group(1)).strip())
                        for m in re.finditer(r"LPA:([^;]+)", str(srid)):
                            idx["lpa_refs"].add(norm_ref(m.group(1)))
    idx["pld_ids"] = {v for v in idx["pld_ids"] if v}
    idx["lpa_refs"] = {v for v in idx["lpa_refs"] if v}
    idx["source_urls"] = {v for v in idx["source_urls"] if v}
    return idx


def iter_objects(value: Any):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from iter_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_objects(child)


def fetch_json(body: dict[str, Any], retries: int = 3) -> dict[str, Any]:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        API,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
    )
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=75) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:  # noqa: BLE001 - keep stdlib retry small and explicit.
            last_err = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"PLD query failed after {retries} attempts: {last_err}")


def query_body(spec: dict[str, Any], year: int) -> dict[str, Any]:
    lte = "19/05/2026" if year == 2026 else f"31/12/{year}"
    must = [
        *spec.get("must", []),
        {"bool": {"should": APPROVED_SHOULD, "minimum_should_match": 1}},
    ]
    body: dict[str, Any] = {
        "size": spec["size"],
        "_source": SOURCE_FIELDS,
        "query": {
            "bool": {
                "filter": [{"range": {"decision_date": {"gte": f"01/01/{year}", "lte": lte}}}],
                "must": must,
            }
        },
    }
    if spec.get("should"):
        body["query"]["bool"]["should"] = spec["should"]
    if spec.get("sort"):
        body["sort"] = spec["sort"]
    return body


def collect_rows() -> tuple[dict[str, dict[str, Any]], list[dict[str, Any]]]:
    rows: dict[str, dict[str, Any]] = {}
    query_stats: list[dict[str, Any]] = []
    for spec in QUERY_SPECS:
        total_hits = 0
        fetched = 0
        for year in range(START.year, END.year + 1):
            body = query_body(spec, year)
            payload = fetch_json(body)
            total = payload.get("hits", {}).get("total", {})
            total_value = total.get("value") if isinstance(total, dict) else total
            total_hits += int(total_value or 0)
            hits = payload.get("hits", {}).get("hits", [])
            fetched += len(hits)
            for hit in hits:
                src = hit.get("_source") or {}
                row_id = src.get("id") or hit.get("_id")
                if not row_id:
                    continue
                existing = rows.setdefault(row_id, src)
                cats = existing.setdefault("_query_categories", [])
                if spec["category"] not in cats:
                    cats.append(spec["category"])
        query_stats.append({
            "label": spec["label"],
            "category": spec["category"],
            "total_hits_summed_by_year": total_hits,
            "fetched_hits_summed_by_year": fetched,
        })
    return rows, query_stats


def duplicate_reason(candidate: dict[str, Any], row: dict[str, Any], idx: dict[str, set[str]], selected_keys: dict[str, set[str]]) -> str | None:
    row_id = row.get("id") or ""
    lpa_ref = norm_ref(row.get("lpa_app_no"))
    url = candidate["source_url"]
    title_date = f"{norm(candidate['title'])}|{candidate['date']}"
    location_date = f"{norm(location_for(row))}|{candidate['date']}"
    checks = [
        ("PLD id already present in corpus/prior packs", row_id in idx["pld_ids"]),
        ("LPA reference already present in corpus/prior packs", bool(lpa_ref and lpa_ref in idx["lpa_refs"])),
        ("PLD source URL already present in corpus/prior packs", url in idx["source_urls"]),
        ("title/date already present in corpus/prior packs", title_date in idx["title_dates"] or location_date in idx["title_dates"]),
        ("PLD id duplicated within this scratch fetch", row_id in selected_keys["pld_ids"]),
        ("LPA reference duplicated within this scratch fetch", bool(lpa_ref and lpa_ref in selected_keys["lpa_refs"])),
        ("source URL duplicated within this scratch fetch", url in selected_keys["source_urls"]),
        ("title/date duplicated within this scratch fetch", title_date in selected_keys["title_dates"] or location_date in selected_keys["title_dates"]),
    ]
    for reason, hit in checks:
        if hit:
            return reason
    return None


def mark_selected(candidate: dict[str, Any], row: dict[str, Any], selected_keys: dict[str, set[str]]) -> None:
    selected_keys["pld_ids"].add(row.get("id") or "")
    lpa_ref = norm_ref(row.get("lpa_app_no"))
    if lpa_ref:
        selected_keys["lpa_refs"].add(lpa_ref)
    selected_keys["source_urls"].add(candidate["source_url"])
    selected_keys["title_dates"].add(f"{norm(candidate['title'])}|{candidate['date']}")
    selected_keys["title_dates"].add(f"{norm(location_for(row))}|{candidate['date']}")


def make_candidate(row: dict[str, Any], flags: set[str], row_score: int) -> tuple[dict[str, Any] | None, str | None]:
    iso_date = iso_from_pld_date(row.get("decision_date"))
    if not in_window(iso_date):
        return None, "PLD decision_date missing, unparsable, or outside 2008-01-01 through 2026-05-19."
    if not decision_ok(row):
        return None, "PLD row did not contain an approved/granted planning decision/status."
    point, geometry_source, geometry_precision = row_point(row)
    if not point:
        return None, "No usable London centroid or WGS84 polygon found in PLD row."
    location = location_for(row)
    if len(norm(location)) < 5:
        return None, "Location fields too sparse for a useful atlas candidate."

    row_id = row.get("id") or ""
    lpa_ref = row.get("lpa_app_no") or ""
    desc = sentence_trim(row.get("description") or "No proposal description supplied in PLD row.", 300)
    source_id = "gla-planning-datahub-listed-building-consent" if "listed-building-consent" in flags else "gla-planning-datahub-applications"
    source_name = (
        "Planning London Datahub applications API - listed building consent records"
        if source_id == "gla-planning-datahub-listed-building-consent"
        else "Planning London Datahub applications"
    )
    app_type = row.get("application_type_full") or row.get("application_type") or "planning application"
    decision_text = row.get("decision") or row.get("status") or "recorded decision"
    title = f"Planning London Datahub decision row for {sentence_trim(location, 100)}"
    observed = (
        f"Planning London Datahub records an administrative {decision_text} decision/status "
        f"for a {app_type} row at {sentence_trim(location, 110)} on {iso_date}."
    )
    summary = (
        f"{observed} Proposal description field: {desc}"
    )
    publisher_lpa = row.get("lpa_name") or row.get("borough") or "London planning authorities"
    candidate = {
        "city_id": "london",
        "candidate_id": f"lon_pld_round121_{slug(row_id, 70)}_{iso_date.replace('-', '_')}",
        "title": title,
        "summary": summary,
        "observed_change": observed,
        "date": iso_date,
        "effective_date": iso_date,
        "date_precision": "day",
        "source_id": source_id,
        "source_ids": [source_id],
        "source_name": source_name,
        "publisher": f"Greater London Authority / {publisher_lpa}",
        "source_url": source_url(row_id),
        "source_record_id": f"PLD:{row_id}{f'; LPA:{lpa_ref}' if lpa_ref else ''}",
        "source_type": "official Planning London Datahub application API row",
        "accessed_at": ACCESSED_AT,
        "source_date_field": "Planning London Datahub decision_date",
        "latitude": round6(point["latitude"]),
        "longitude": round6(point["longitude"]),
        "geometry_source": geometry_source,
        "geometry_precision": geometry_precision,
        "confidence": "documented",
        "project_type": project_type(row, flags),
        "license_or_terms_note": "London Datastore dataset page lists Licence: Not Specified; this candidate stores factual row metadata and source URL only pending source-level reuse review.",
        "attribution": f"Greater London Authority / {publisher_lpa} / Planning London Datahub",
        "limitations": "This is an administrative planning application row. It is not evidence that works started, were completed, were occupied, opened, improved heritage condition, caused local outcomes, or delivered the proposed scheme. Borough feed quality, backfill, decision coding, and geometry completeness vary.",
        "transformation_method": "Queried the Planning London Datahub guest Elasticsearch API by year for listed-building-consent, conservation/heritage, estate-regeneration, civic, health, education, culture, public-realm, and major mixed-use terms; normalized PLD decision_date to ISO date; converted PLD centroid or WGS84 polygon to a representative point; rejected duplicates by PLD id, LPA reference, title/date, and source URL against current corpus and prior scratch packs.",
        "_score": row_score,
        "_flags": sorted(flags),
    }
    return candidate, None


def reject_record(row: dict[str, Any], reason: str, flags: set[str] | None = None, score: int | None = None) -> dict[str, Any]:
    row_id = row.get("id") or ""
    iso_date = iso_from_pld_date(row.get("decision_date"))
    return {
        "city_id": "london",
        "source": "Planning London Datahub applications",
        "source_record_id": f"PLD:{row_id}{f'; LPA:{row.get('lpa_app_no')}' if row.get('lpa_app_no') else ''}" if row_id else "",
        "title": sentence_trim(location_for(row), 140),
        "date": iso_date or row.get("decision_date") or "",
        "source_url": source_url(row_id) if row_id else "",
        "accessed_at": ACCESSED_AT,
        "reason": reason,
        "query_categories": sorted(flags or row.get("_query_categories") or []),
        "score": score,
    }


def clean_candidate(candidate: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in candidate.items() if not k.startswith("_")}


def select_candidates(rows: dict[str, dict[str, Any]], idx: dict[str, set[str]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], Counter]:
    prepared: list[tuple[int, dict[str, Any], set[str], dict[str, Any] | None, str | None]] = []
    rejection_counts: Counter = Counter()
    for row in rows.values():
        flags = category_flags(row, set(row.get("_query_categories") or []))
        score = score_row(row, flags)
        candidate, reason = make_candidate(row, flags, score)
        if reason:
            rejection_counts[reason] += 1
        prepared.append((score, row, flags, candidate, reason))
    prepared.sort(key=lambda item: (-item[0], str(item[1].get("decision_date") or ""), str(item[1].get("id") or "")))

    selected: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    selected_keys = {"pld_ids": set(), "lpa_refs": set(), "source_urls": set(), "title_dates": set()}
    caps = {
        "listed-building-consent": 24,
        "conservation-sensitive-major": 18,
        "estate-regeneration": 18,
        "civic-health-education-culture": 22,
        "major-public-realm-mixed-use": 12,
    }
    cap_counts: Counter = Counter()

    def primary_flag(flags: set[str]) -> str:
        for flag in ["listed-building-consent", "estate-regeneration", "civic-health-education-culture", "conservation-sensitive-major", "major-public-realm-mixed-use"]:
            if flag in flags:
                return flag
        return "major-public-realm-mixed-use"

    for score, row, flags, candidate, reason in prepared:
        if reason:
            rejected.append(reject_record(row, reason, flags, score))
            continue
        assert candidate is not None
        dup = duplicate_reason(candidate, row, idx, selected_keys)
        if dup:
            rejection_counts[dup] += 1
            rejected.append(reject_record(row, dup, flags, score))
            continue
        primary = primary_flag(flags)
        if cap_counts[primary] >= caps.get(primary, 999):
            reason = f"candidate cap reached for {primary}"
            rejection_counts[reason] += 1
            rejected.append(reject_record(row, reason, flags, score))
            continue
        selected.append(candidate)
        cap_counts[primary] += 1
        mark_selected(candidate, row, selected_keys)
        if len(selected) >= MAX_CANDIDATES:
            break

    # Keep the rejection report useful but bounded.
    if len(rejected) > 500:
        important = [
            r for r in rejected
            if "duplicate" in r["reason"].lower() or "already present" in r["reason"].lower()
        ][:260]
        other = [r for r in rejected if r not in important][:240]
        rejected = important + other
    return [clean_candidate(c) for c in selected], rejected, rejection_counts


def validate_output(candidates: list[dict[str, Any]]) -> list[str]:
    required = [
        "city_id", "candidate_id", "title", "summary", "observed_change",
        "date", "effective_date", "date_precision", "source_id", "source_ids",
        "source_name", "publisher", "source_url", "source_record_id",
        "source_type", "accessed_at", "source_date_field", "latitude",
        "longitude", "geometry_source", "geometry_precision", "confidence",
        "project_type", "license_or_terms_note", "attribution", "limitations",
        "transformation_method",
    ]
    problems: list[str] = []
    seen_ids: set[str] = set()
    for i, candidate in enumerate(candidates):
        for key in required:
            if key not in candidate or candidate[key] in ("", None, []):
                problems.append(f"candidate[{i}] missing {key}")
        if candidate.get("candidate_id") in seen_ids:
            problems.append(f"duplicate candidate_id {candidate.get('candidate_id')}")
        seen_ids.add(candidate.get("candidate_id", ""))
        if candidate.get("accessed_at") != ACCESSED_AT:
            problems.append(f"candidate[{i}] accessed_at not {ACCESSED_AT}")
        if not in_window(candidate.get("date")):
            problems.append(f"candidate[{i}] date outside requested window: {candidate.get('date')}")
        if "planningdata.london.gov.uk/api-guest/applications/_source/" not in candidate.get("source_url", ""):
            problems.append(f"candidate[{i}] source_url is not a PLD source row")
        for field in ("summary", "observed_change"):
            text = norm(candidate.get(field, ""))
            if re.search(r"\bcaused\b|\bwill increase\b|\bwill decrease\b|\bdelivered\b|\bopened\b|\bcompleted\b", text):
                problems.append(f"candidate[{i}] possible overclaim in {field}")
    return problems


def write_notes(payload: dict[str, Any], duplicate_sizes: dict[str, int]) -> None:
    lines = [
        "# Round 121 London PLD Listed-Building / Civic More",
        "",
        f"Accessed: {ACCESSED_AT}",
        "",
        "## Sources",
        "",
        "- Planning London Datahub guest API: https://planningdata.london.gov.uk/api-guest/applications/_search",
        "- PLD source-row URL pattern: https://planningdata.london.gov.uk/api-guest/applications/_source/{PLD id}",
        "- London Datastore dataset page: https://data.london.gov.uk/dataset/planning-london-datahub-applications/",
        "- GLA PLD context page: https://www.london.gov.uk/programmes-strategies/planning/digital-planning/planning-london-datahub",
        "",
        "## Method",
        "",
        "- Queried PLD by year from 2008-01-01 through 2026-05-19 for listed-building-consent, conservation/heritage-sensitive, estate-regeneration, civic, health, education, culture, public-realm, and major mixed-use signals.",
        "- Used `decision_date` as the administrative event date and retained only approved/granted decision/status rows after local date parsing.",
        "- Converted PLD centroids to WGS84 points; where the centroid was missing or outside the London envelope, used a representative point from `wgs84_polygon`.",
        "- Rejected duplicates against the existing corpus and prior scratch packs by PLD id, LPA reference, source URL, and normalized title/date.",
        "",
        "## Counts",
        "",
        f"- Unique PLD rows fetched before filtering: {payload['metadata']['rows_fetched_unique']}",
        f"- Candidate rows written: {len(payload['candidates'])}",
        f"- Rejected rows reported: {len(payload['rejected'])}",
        f"- Existing duplicate index sizes: {duplicate_sizes}",
        "",
        "## Query Stats",
        "",
    ]
    for stat in payload["query_stats"]:
        lines.append(f"- {stat['label']}: total hits by-year sum {stat['total_hits_summed_by_year']}; fetched {stat['fetched_hits_summed_by_year']}.")
    lines.extend([
        "",
        "## Rejection Summary",
        "",
    ])
    for reason, count in payload["rejection_summary"].items():
        lines.append(f"- {reason}: {count}")
    lines.extend([
        "",
        "## Caveats",
        "",
        "- These are administrative planning rows, not evidence of construction start, completion, occupation, opening, heritage improvement, or local outcome effects.",
        "- London Datastore lists the PLD applications dataset licence as Not Specified, so this pack keeps factual metadata and source-row URLs for review rather than a reproduced bulk dataset.",
        "- PLD borough feeds/backfills vary; source dates, decision labels, and centroids should be checked before promoted ingestion.",
        "- Proposal descriptions are source text fields and should be displayed as application/proposal language, not as delivered change.",
        "",
    ])
    (OUT_DIR / "notes.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    idx = duplicate_index()
    rows, query_stats = collect_rows()
    candidates, rejected, rejection_counts = select_candidates(rows, idx)
    problems = validate_output(candidates)
    if problems:
        for problem in problems:
            print(problem, file=sys.stderr)
        return 2
    payload = {
        "generated_at": "2026-05-19T00:00:00Z",
        "task": "round121_london_gla_pld_lbc_more",
        "metadata": {
            "accessed_at": ACCESSED_AT,
            "date_window": {"start": START.isoformat(), "end": END.isoformat()},
            "max_candidates": MAX_CANDIDATES,
            "rows_fetched_unique": len(rows),
            "candidate_count": len(candidates),
            "rejected_report_is_bounded": True,
        },
        "source_audits": SOURCE_AUDITS,
        "query_stats": query_stats,
        "rejection_summary": dict(sorted(rejection_counts.items(), key=lambda kv: (-kv[1], kv[0]))),
        "candidates": candidates,
        "rejected": rejected,
    }
    (OUT_DIR / "candidates.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUT_DIR / "source_audit.json").write_text(
        json.dumps({
            "generated_at": payload["generated_at"],
            "task": payload["task"],
            "source_audits": SOURCE_AUDITS,
            "query_stats": query_stats,
            "rejection_summary": payload["rejection_summary"],
        }, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    duplicate_sizes = {key: len(value) for key, value in idx.items()}
    write_notes(payload, duplicate_sizes)
    print(json.dumps({
        "rows_fetched_unique": len(rows),
        "candidate_count": len(candidates),
        "rejected_reported": len(rejected),
        "duplicate_index_sizes": duplicate_sizes,
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
