import datetime as dt
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ACCESS_DATE = "2026-05-20"
DATE_START = "2008-01-01"
DATE_END = "2026-05-20"

OUT_DIR = Path("tmp/subagents/round392_london_nhle_heritage_tail5")
CANDIDATES_PATH = OUT_DIR / "candidates.json"
SOURCE_AUDIT_PATH = OUT_DIR / "source_audit.json"
SUMMARY_PATH = OUT_DIR / "summary.json"
NOTES_PATH = OUT_DIR / "notes.md"
REJECTED_PATH = OUT_DIR / "rejected.json"

LONDON_BBOX = "-0.5103,51.2868,0.334,51.6919"
ONS_LONDON_REGION_URL = (
    "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/"
    "Regions_December_2024_Boundaries_EN_BFC/FeatureServer/0"
)
NHLE_SERVICE_URL = (
    "https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/"
    "National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer"
)
NHLE_API_CATALOGUE_URL = "https://www.api.gov.uk/he/national-heritage-list-for-england-nhle/"
NHLE_DATA_DOWNLOADS_URL = "https://historicengland.org.uk/listing/the-list/data-downloads/"
DELISTED_SERVICE_URL = (
    "https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/"
    "Delisted/FeatureServer"
)
DELISTED_DATASET_URL = (
    "https://opendata-historicengland.hub.arcgis.com/datasets/"
    "8836370be44f4916b9ba7d350df24902_0/explore"
)
DELISTED_ITEM_URL = "https://www.arcgis.com/sharing/rest/content/items/8836370be44f4916b9ba7d350df24902"

SOURCE_ID = "historic-england-nhle-open-data-round392-tail5"
DELISTED_SOURCE_ID = "historic-england-de-designated-sites"
SOURCE_NAME = "National Heritage List for England (NHLE) open data"
DELISTED_SOURCE_NAME = "Historic England De-designated sites"
PUBLISHER = "Historic England"
LICENSE = (
    "Open Government Licence v3.0 with Historic England Open Data Hub terms; "
    "spatial data includes Ordnance Survey Crown copyright/database right attribution."
)
LICENSE_URL = "https://historicengland.org.uk/terms/website-terms-conditions/open-data-hub/"
ATTRIBUTION = "Historic England; Contains Ordnance Survey data Crown copyright and database right 2026."

DATE_FIELD_VARIANTS = {
    "ListDate": ["ListDate", "Listing date", "Date first listed"],
    "AmendDate": ["AmendDate", "Date of most recent amendment"],
    "BPNStart": ["BPNStart", "Building Preservation Notice start date", "BPN Issue Date"],
    "BPNExpire": ["BPNExpire", "Building Preservation Notice expiry date"],
    "COIStart": ["COIStart", "Start Date of Certificate", "start-date"],
    "COIExpire": ["COIExpire", "Expiry Date of Certificate", "end-date"],
    "SchedDate": ["SchedDate", "Date first scheduled"],
    "RegDate": ["RegDate", "Date first registered"],
    "DesigDate": ["DesigDate", "Date first designated"],
    "InscrDate": ["InscrDate", "Date first inscribed"],
    "DateRemovedFromList": ["DateRemovedFromList", "Date Removed From List"],
}

SOURCE_QUERIES = [
    {
        "layer_id": 0,
        "layer_name": "Listed Building points",
        "geometry_kind": "point",
        "date_field": "ListDate",
        "record_type": "nhle_listed_building_designation",
        "project_type": "NHLE listed-building designation",
        "bucket": "planning/development/architecture/heritage_designation",
        "title_suffix": "added to the NHLE",
        "action_label": "listed-building designation",
        "date_label": "ListDate",
        "primary_date_field": "ListDate",
    },
    {
        "layer_id": 0,
        "layer_name": "Listed Building points",
        "geometry_kind": "point",
        "date_field": "AmendDate",
        "record_type": "nhle_listed_building_amendment",
        "project_type": "NHLE listed-building amendment",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "NHLE list-entry record amended",
        "action_label": "listed-building list-entry amendment",
        "date_label": "AmendDate",
        "primary_date_field": "ListDate",
    },
    {
        "layer_id": 3,
        "layer_name": "Listed Building polygons",
        "geometry_kind": "polygon",
        "date_field": "ListDate",
        "record_type": "nhle_listed_building_designation",
        "project_type": "NHLE listed-building designation",
        "bucket": "planning/development/architecture/heritage_designation",
        "title_suffix": "added to the NHLE",
        "action_label": "listed-building designation",
        "date_label": "ListDate",
        "primary_date_field": "ListDate",
    },
    {
        "layer_id": 3,
        "layer_name": "Listed Building polygons",
        "geometry_kind": "polygon",
        "date_field": "AmendDate",
        "record_type": "nhle_listed_building_amendment",
        "project_type": "NHLE listed-building amendment",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "NHLE list-entry record amended",
        "action_label": "listed-building list-entry amendment",
        "date_label": "AmendDate",
        "primary_date_field": "ListDate",
    },
    {
        "layer_id": 1,
        "layer_name": "Building Preservation Notice points",
        "geometry_kind": "point",
        "date_field": "BPNStart",
        "record_type": "nhle_building_preservation_notice_start",
        "project_type": "NHLE building preservation notice start",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "NHLE building preservation notice started",
        "action_label": "building preservation notice start",
        "date_label": "BPNStart",
        "primary_date_field": "BPNStart",
    },
    {
        "layer_id": 1,
        "layer_name": "Building Preservation Notice points",
        "geometry_kind": "point",
        "date_field": "BPNExpire",
        "record_type": "nhle_building_preservation_notice_expiry",
        "project_type": "NHLE building preservation notice expiry",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "NHLE building preservation notice expired",
        "action_label": "building preservation notice expiry",
        "date_label": "BPNExpire",
        "primary_date_field": "BPNStart",
    },
    {
        "layer_id": 4,
        "layer_name": "Building Preservation Notices polygons",
        "geometry_kind": "polygon",
        "date_field": "BPNStart",
        "record_type": "nhle_building_preservation_notice_start",
        "project_type": "NHLE building preservation notice start",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "NHLE building preservation notice started",
        "action_label": "building preservation notice start",
        "date_label": "BPNStart",
        "primary_date_field": "BPNStart",
    },
    {
        "layer_id": 4,
        "layer_name": "Building Preservation Notices polygons",
        "geometry_kind": "polygon",
        "date_field": "BPNExpire",
        "record_type": "nhle_building_preservation_notice_expiry",
        "project_type": "NHLE building preservation notice expiry",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "NHLE building preservation notice expired",
        "action_label": "building preservation notice expiry",
        "date_label": "BPNExpire",
        "primary_date_field": "BPNStart",
    },
    {
        "layer_id": 2,
        "layer_name": "Certificate of Immunity points",
        "geometry_kind": "point",
        "date_field": "COIStart",
        "record_type": "nhle_certificate_of_immunity_start",
        "project_type": "NHLE certificate of immunity start",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "NHLE certificate of immunity started",
        "action_label": "certificate of immunity start",
        "date_label": "COIStart",
        "primary_date_field": "COIStart",
    },
    {
        "layer_id": 2,
        "layer_name": "Certificate of Immunity points",
        "geometry_kind": "point",
        "date_field": "COIExpire",
        "record_type": "nhle_certificate_of_immunity_expiry",
        "project_type": "NHLE certificate of immunity expiry",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "NHLE certificate of immunity expired",
        "action_label": "certificate of immunity expiry",
        "date_label": "COIExpire",
        "primary_date_field": "COIStart",
    },
    {
        "layer_id": 5,
        "layer_name": "Certificate of Immunity polygons",
        "geometry_kind": "polygon",
        "date_field": "COIStart",
        "record_type": "nhle_certificate_of_immunity_start",
        "project_type": "NHLE certificate of immunity start",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "NHLE certificate of immunity started",
        "action_label": "certificate of immunity start",
        "date_label": "COIStart",
        "primary_date_field": "COIStart",
    },
    {
        "layer_id": 5,
        "layer_name": "Certificate of Immunity polygons",
        "geometry_kind": "polygon",
        "date_field": "COIExpire",
        "record_type": "nhle_certificate_of_immunity_expiry",
        "project_type": "NHLE certificate of immunity expiry",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "NHLE certificate of immunity expired",
        "action_label": "certificate of immunity expiry",
        "date_label": "COIExpire",
        "primary_date_field": "COIStart",
    },
    {
        "layer_id": 6,
        "layer_name": "Scheduled Monuments",
        "geometry_kind": "polygon",
        "date_field": "SchedDate",
        "record_type": "nhle_scheduled_monument_designation",
        "project_type": "NHLE scheduled monument designation",
        "bucket": "planning/development/architecture/heritage_designation",
        "title_suffix": "scheduled monument designation recorded",
        "action_label": "scheduled monument designation",
        "date_label": "SchedDate",
        "primary_date_field": "SchedDate",
    },
    {
        "layer_id": 6,
        "layer_name": "Scheduled Monuments",
        "geometry_kind": "polygon",
        "date_field": "AmendDate",
        "record_type": "nhle_scheduled_monument_amendment",
        "project_type": "NHLE scheduled monument amendment",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "scheduled monument NHLE record amended",
        "action_label": "scheduled monument list-entry amendment",
        "date_label": "AmendDate",
        "primary_date_field": "SchedDate",
    },
    {
        "layer_id": 7,
        "layer_name": "Parks and Gardens",
        "geometry_kind": "polygon",
        "date_field": "RegDate",
        "record_type": "nhle_registered_park_garden_designation",
        "project_type": "NHLE registered park/garden designation",
        "bucket": "planning/development/architecture/heritage_designation",
        "title_suffix": "registered park/garden designation recorded",
        "action_label": "registered park/garden designation",
        "date_label": "RegDate",
        "primary_date_field": "RegDate",
    },
    {
        "layer_id": 7,
        "layer_name": "Parks and Gardens",
        "geometry_kind": "polygon",
        "date_field": "AmendDate",
        "record_type": "nhle_registered_park_garden_amendment",
        "project_type": "NHLE registered park/garden amendment",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "registered park/garden NHLE record amended",
        "action_label": "registered park/garden list-entry amendment",
        "date_label": "AmendDate",
        "primary_date_field": "RegDate",
    },
    {
        "layer_id": 8,
        "layer_name": "Battlefields",
        "geometry_kind": "polygon",
        "date_field": "RegDate",
        "record_type": "nhle_registered_battlefield_designation",
        "project_type": "NHLE registered battlefield designation",
        "bucket": "planning/development/architecture/heritage_designation",
        "title_suffix": "registered battlefield designation recorded",
        "action_label": "registered battlefield designation",
        "date_label": "RegDate",
        "primary_date_field": "RegDate",
    },
    {
        "layer_id": 8,
        "layer_name": "Battlefields",
        "geometry_kind": "polygon",
        "date_field": "AmendDate",
        "record_type": "nhle_registered_battlefield_amendment",
        "project_type": "NHLE registered battlefield amendment",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "registered battlefield NHLE record amended",
        "action_label": "registered battlefield list-entry amendment",
        "date_label": "AmendDate",
        "primary_date_field": "RegDate",
    },
    {
        "layer_id": 9,
        "layer_name": "Protected Wreck Sites",
        "geometry_kind": "polygon",
        "date_field": "DesigDate",
        "record_type": "nhle_protected_wreck_designation",
        "project_type": "NHLE protected wreck designation",
        "bucket": "planning/development/architecture/heritage_designation",
        "title_suffix": "protected wreck designation recorded",
        "action_label": "protected wreck designation",
        "date_label": "DesigDate",
        "primary_date_field": "DesigDate",
    },
    {
        "layer_id": 9,
        "layer_name": "Protected Wreck Sites",
        "geometry_kind": "polygon",
        "date_field": "AmendDate",
        "record_type": "nhle_protected_wreck_amendment",
        "project_type": "NHLE protected wreck amendment",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "protected wreck NHLE record amended",
        "action_label": "protected wreck list-entry amendment",
        "date_label": "AmendDate",
        "primary_date_field": "DesigDate",
    },
    {
        "layer_id": 10,
        "layer_name": "World Heritage Sites",
        "geometry_kind": "polygon",
        "date_field": "InscrDate",
        "record_type": "nhle_world_heritage_site_inscription",
        "project_type": "NHLE world heritage site inscription",
        "bucket": "planning/development/architecture/heritage_designation",
        "title_suffix": "world heritage site inscription recorded",
        "action_label": "world heritage site inscription",
        "date_label": "InscrDate",
        "primary_date_field": "InscrDate",
    },
    {
        "layer_id": 10,
        "layer_name": "World Heritage Sites",
        "geometry_kind": "polygon",
        "date_field": "AmendDate",
        "record_type": "nhle_world_heritage_site_amendment",
        "project_type": "NHLE world heritage site amendment",
        "bucket": "planning/development/architecture/heritage_administrative_change",
        "title_suffix": "world heritage site NHLE record amended",
        "action_label": "world heritage site list-entry amendment",
        "date_label": "AmendDate",
        "primary_date_field": "InscrDate",
    },
]

DELISTED_QUERY = {
    "layer_id": 0,
    "layer_name": "De-designated sites",
    "geometry_kind": "polygon",
    "date_field": "DateRemovedFromList",
    "record_type": "nhle_de_designation_removal",
    "project_type": "NHLE de-designation/removal",
    "bucket": "planning/development/architecture/heritage_administrative_change",
    "title_suffix": "removed from the NHLE",
    "action_label": "de-designation/removal from the NHLE",
    "date_label": "DateRemovedFromList",
    "primary_date_field": "DateRemovedFromList",
}


def clean_text(value):
    text = "" if value is None else str(value)
    return (
        text.replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\xa0", " ")
        .replace("\r", "\n")
    )


def one_line(value):
    return re.sub(r"\s+", " ", clean_text(value)).strip()


def slug(value, max_len=88):
    result = re.sub(r"[^a-z0-9]+", "-", one_line(value).lower()).strip("-")
    return (result[:max_len].strip("-") or "record")


def date_compact(value):
    return value.replace("-", "")


def get_json(url, params=None):
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, headers={"User-Agent": "Bims-5 round392 NHLE tail5 fetcher"})
    last_error = None
    for attempt in range(1, 6):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.URLError as exc:
            last_error = exc
            if attempt == 5:
                break
            time.sleep(attempt * 2)
    raise last_error


def arcgis_features(service_url, params, page_size=2000):
    rows = []
    offset = 0
    while True:
        page_params = dict(params)
        page_params["resultOffset"] = offset
        page_params["resultRecordCount"] = page_size
        payload = get_json(f"{service_url}/query", page_params)
        if payload.get("error"):
            raise RuntimeError(f"ArcGIS query failed for {service_url}: {payload['error']}")
        features = payload.get("features") or []
        rows.extend(features)
        exceeded = bool(payload.get("exceededTransferLimit") or payload.get("properties", {}).get("exceededTransferLimit"))
        if len(features) < page_size and not exceeded:
            break
        if not features:
            break
        offset += page_size
    return rows


def iso_from_millis(value):
    if value in (None, ""):
        return ""
    if isinstance(value, str):
        value = value.strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            return value
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}T.*", value):
            return value[:10]
    try:
        return (dt.datetime(1970, 1, 1) + dt.timedelta(milliseconds=int(value))).strftime("%Y-%m-%d")
    except (TypeError, ValueError, OverflowError):
        return ""


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8").lstrip("\ufeff"))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def iter_points(geometry):
    if not geometry:
        return
    geometry_type = geometry.get("type")
    coords = geometry.get("coordinates") or []
    if geometry_type == "Point":
        yield coords
    elif geometry_type == "MultiPoint":
        for point in coords:
            yield point
    elif geometry_type == "Polygon":
        for ring in coords:
            for point in ring:
                yield point
    elif geometry_type == "MultiPolygon":
        for polygon in coords:
            for ring in polygon:
                for point in ring:
                    yield point


def first_point(geometry):
    for point in iter_points(geometry):
        if len(point) >= 2:
            return [float(point[0]), float(point[1])]
    return None


def point_in_ring(point, ring):
    x, y = point
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y):
            x_at_y = (xj - xi) * (y - yi) / (yj - yi) + xi
            if x < x_at_y:
                inside = not inside
        j = i
    return inside


def point_in_geometry(point, geometry):
    if not geometry:
        return False
    geometry_type = geometry.get("type")
    if geometry_type == "Polygon":
        rings = geometry.get("coordinates", [])
        if not rings:
            return False
        if not point_in_ring(point, rings[0]):
            return False
        return not any(point_in_ring(point, ring) for ring in rings[1:])
    if geometry_type == "MultiPolygon":
        return any(point_in_geometry(point, {"type": "Polygon", "coordinates": polygon}) for polygon in geometry.get("coordinates", []))
    if geometry_type in ("Point", "MultiPoint"):
        return any(abs(point[0] - candidate[0]) < 1e-9 and abs(point[1] - candidate[1]) < 1e-9 for candidate in iter_points(geometry))
    return False


def representative_point(geometry, london_geometry=None):
    point = first_point(geometry)
    if geometry and geometry.get("type") in ("Point", "MultiPoint"):
        return point

    points = [[float(p[0]), float(p[1])] for p in iter_points(geometry) if len(p) >= 2]
    if not points:
        return None

    centroid = [
        sum(point[0] for point in points) / len(points),
        sum(point[1] for point in points) / len(points),
    ]
    if point_in_geometry(centroid, geometry) and (london_geometry is None or point_in_geometry(centroid, london_geometry)):
        return centroid

    for candidate in points:
        if london_geometry is None or point_in_geometry(candidate, london_geometry):
            return candidate
    return centroid


def london_region_geometry():
    payload = get_json(
        f"{ONS_LONDON_REGION_URL}/query",
        {
            "where": "RGN24CD='E12000007'",
            "outFields": "RGN24CD,RGN24NM",
            "returnGeometry": "true",
            "outSR": "4326",
            "f": "geojson",
        },
    )
    features = payload.get("features") or []
    if not features:
        raise RuntimeError("Could not fetch ONS London region geometry.")
    return features[0]["geometry"]


def text_for_row(row):
    try:
        return json.dumps(row, ensure_ascii=False, sort_keys=True)
    except TypeError:
        return str(row)


def eventish_rows(value):
    if isinstance(value, dict):
        if any(key in value for key in ("event_id", "candidate_id", "source_record_id", "source_url", "evidence", "provenance")):
            yield value
        for item in value.values():
            yield from eventish_rows(item)
    elif isinstance(value, list):
        for item in value:
            yield from eventish_rows(item)


def candidate_pack_json_files():
    root = Path("tmp/subagents")
    if not root.exists():
        return
    name_pattern = re.compile(r"(candidates|arch_candidates|heritage_candidates)", re.I)
    skip_pattern = re.compile(r"(rejected|summary|source_audit|validation|query|raw)", re.I)
    for path in root.rglob("*.json"):
        try:
            resolved = path.resolve()
            if OUT_DIR.resolve() in resolved.parents:
                continue
            if skip_pattern.search(path.name):
                continue
            if path.stat().st_size > 50_000_000:
                continue
        except OSError:
            continue
        path_text = str(path).lower()
        if name_pattern.search(path.name) or ("heritage" in path_text and path.name.lower() == "candidates.json"):
            yield path


def extract_entries(text):
    entries = set()
    for match in re.finditer(r"historicengland\.org\.uk/listing/the-list/list-entry/(\d{6,8})", text, re.I):
        entries.add(match.group(1))
    for match in re.finditer(r"\bNHLE\s+(?:COI\s+)?ListEntry\s*(\d{6,8})\b", text, re.I):
        entries.add(match.group(1))
    for match in re.finditer(r"\bOriginalListEntryNumber\D{0,24}(\d{6,8})\b", text, re.I):
        entries.add(match.group(1))
    if "NHLE" in text or "Historic England" in text or "historicengland.org.uk/listing/the-list/list-entry/" in text:
        for match in re.finditer(r"\bListEntry\D{0,24}(\d{6,8})\b", text, re.I):
            entries.add(match.group(1))
    return entries


def canonical_date_field(value, text=""):
    value = one_line(value)
    value_lower = value.lower()
    text_lower = text.lower()
    for canonical, variants in DATE_FIELD_VARIANTS.items():
        for variant in variants:
            if variant.lower() == value_lower:
                return canonical
            if variant.lower() in value_lower and canonical not in ("COIStart",):
                return canonical
    if value_lower == "start-date" and ("certificate of immunity" in text_lower or "coi" in text_lower or "nhle coi" in text_lower):
        return "COIStart"
    if value_lower == "end-date" and ("certificate of immunity" in text_lower or "coi" in text_lower or "nhle coi" in text_lower):
        return "COIExpire"
    return ""


def add_text_field_date_keys(text, entries, keys):
    if not entries:
        return
    for canonical, variants in DATE_FIELD_VARIANTS.items():
        for variant in variants:
            variant_pattern = re.escape(variant)
            for match in re.finditer(rf"\b{variant_pattern}\b[^\d]{{0,80}}(\d{{4}}-\d{{2}}-\d{{2}})", text, re.I):
                for entry in entries:
                    keys.add(f"{entry}|{canonical}|{match.group(1)}")
            for match in re.finditer(rf"(\d{{4}}-\d{{2}}-\d{{2}})[^\w]{{0,80}}\b{variant_pattern}\b", text, re.I):
                for entry in entries:
                    keys.add(f"{entry}|{canonical}|{match.group(1)}")


def provenance_snippets(row):
    snippets = []
    if not isinstance(row, dict):
        return snippets
    for key in ("source_record_id", "record_id"):
        if row.get(key):
            snippets.append(one_line(row.get(key)))
    provenance = row.get("provenance")
    if isinstance(provenance, dict):
        for key in ("source_record_id", "record_id"):
            if provenance.get(key):
                snippets.append(one_line(provenance.get(key)))
    for evidence in row.get("evidence") or []:
        if isinstance(evidence, dict):
            for key in ("source_record_id", "record_id"):
                if evidence.get(key):
                    snippets.append(one_line(evidence.get(key)))
    return snippets


def extract_nhle_keys(row):
    text = text_for_row(row)
    if not re.search(r"(NHLE|Historic England|historicengland\.org\.uk|ListEntry)", text, re.I):
        return set()

    entries = extract_entries(text)
    keys = set()
    date = iso_from_millis(row.get("date") or row.get("effective_date") or "")
    field = canonical_date_field(row.get("source_date_field") or "", text)
    if date and field and entries:
        for entry in entries:
            keys.add(f"{entry}|{field}|{date}")
    if date and not field and entries:
        lower_text = text.lower()
        listdate_like = (
            "listdate" in lower_text
            or "was listed" in lower_text
            or "listed-building designation" in lower_text
            or "statutory listed" in lower_text
        )
        if listdate_like and "amenddate" not in lower_text and "heritage at risk" not in lower_text:
            for entry in entries:
                keys.add(f"{entry}|ListDate|{date}")

    for item in [row, row.get("source_row") if isinstance(row, dict) else None]:
        if not isinstance(item, dict):
            continue
        list_entry = one_line(
            item.get("ListEntry")
            or item.get("OriginalListEntryNumber")
            or item.get("nhle_list_entry")
            or item.get("list_entry")
            or ""
        )
        if not list_entry:
            continue
        for canonical, variants in DATE_FIELD_VARIANTS.items():
            for variant in variants:
                if variant in item:
                    candidate_date = iso_from_millis(item.get(variant))
                    if candidate_date:
                        keys.add(f"{list_entry}|{canonical}|{candidate_date}")

    for snippet in provenance_snippets(row):
        snippet_entries = extract_entries(snippet) or entries
        add_text_field_date_keys(snippet, snippet_entries, keys)

    for match in re.finditer(r"nhle[-_a-z]*amend[-_a-z]*(\d{6,8})[-_](\d{8})", text, re.I):
        compact = match.group(2)
        keys.add(f"{match.group(1)}|AmendDate|{compact[:4]}-{compact[4:6]}-{compact[6:8]}")
    for match in re.finditer(r"nhle[-_a-z]*list[-_a-z]*(\d{6,8})[-_](\d{8})", text, re.I):
        compact = match.group(2)
        keys.add(f"{match.group(1)}|ListDate|{compact[:4]}-{compact[4:6]}-{compact[6:8]}")
    for match in re.finditer(r"coi[-_a-z]*(\d{6,8})[-_](\d{8})", text, re.I):
        compact = match.group(2)
        keys.add(f"{match.group(1)}|COIStart|{compact[:4]}-{compact[4:6]}-{compact[6:8]}")

    return keys


def scan_existing():
    existing_ids = set()
    existing_source_keys = set()
    existing_nhle_keys = set()
    scanned_candidate_files = 0
    corpus_event_count = 0

    def add_row(row, default_city=""):
        nonlocal corpus_event_count
        event_id = one_line(row.get("event_id") or row.get("candidate_id") or "")
        if event_id:
            existing_ids.add(event_id)
        city = one_line(row.get("city_id") or row.get("city") or default_city)
        date = iso_from_millis(row.get("date") or row.get("effective_date") or "")
        source_url = one_line(row.get("source_url") or "")
        source_record_id = one_line(row.get("source_record_id") or "")
        source_date_field = canonical_date_field(row.get("source_date_field") or "", text_for_row(row)) or one_line(row.get("source_date_field") or "")
        if city and date and source_url and source_record_id:
            existing_source_keys.add(f"{city}|{source_url}|{source_record_id}|{source_date_field}|{date}")
        if city == "london" or not city:
            existing_nhle_keys.update(extract_nhle_keys(row))

    corpus_path = Path("data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json")
    if corpus_path.exists():
        corpus = read_json(corpus_path)
        for event in corpus.get("events", []):
            corpus_event_count += 1
            add_row(event, default_city="london")

    for path in candidate_pack_json_files():
        try:
            payload = read_json(path)
        except (OSError, json.JSONDecodeError):
            continue
        scanned_candidate_files += 1
        for row in eventish_rows(payload):
            add_row(row, default_city="london")

    return {
        "existing_ids": existing_ids,
        "existing_source_keys": existing_source_keys,
        "existing_nhle_keys": existing_nhle_keys,
        "scanned_candidate_files": scanned_candidate_files,
        "corpus_event_count": corpus_event_count,
    }


def query_features(query):
    date_field = query["date_field"]
    return arcgis_features(
        f"{NHLE_SERVICE_URL}/{query['layer_id']}",
        {
            "where": (
                f"{date_field} >= timestamp '{DATE_START} 00:00:00' "
                f"AND {date_field} <= timestamp '{DATE_END} 23:59:59'"
            ),
            "outFields": "*",
            "returnGeometry": "true",
            "outSR": "4326",
            "f": "geojson",
            "geometry": LONDON_BBOX,
            "geometryType": "esriGeometryEnvelope",
            "inSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
        },
    )


def query_delisted_features():
    date_field = DELISTED_QUERY["date_field"]
    return arcgis_features(
        f"{DELISTED_SERVICE_URL}/{DELISTED_QUERY['layer_id']}",
        {
            "where": (
                f"{date_field} >= timestamp '{DATE_START} 00:00:00' "
                f"AND {date_field} <= timestamp '{DATE_END} 23:59:59'"
            ),
            "outFields": "*",
            "returnGeometry": "true",
            "outSR": "4326",
            "f": "geojson",
            "geometry": LONDON_BBOX,
            "geometryType": "esriGeometryEnvelope",
            "inSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
        },
    )


def date_fields_for_source_row(properties):
    output = {}
    for canonical in DATE_FIELD_VARIANTS:
        output[canonical] = iso_from_millis(properties.get(canonical))
    output["BPNExpire"] = iso_from_millis(properties.get("BPNExpire"))
    output["COIExpire"] = iso_from_millis(properties.get("COIExpire"))
    return output


def candidate_from_feature(query, feature, point):
    properties = feature.get("properties") or {}
    list_entry = one_line(properties.get("ListEntry"))
    event_date = iso_from_millis(properties.get(query["date_field"]))
    if not list_entry or not event_date:
        return None

    name = one_line(properties.get("Name") or f"NHLE ListEntry {list_entry}")
    grade = one_line(properties.get("Grade") or "")
    grade_phrase = f", Grade {grade}" if grade else ""
    source_url = one_line(properties.get("hyperlink")) or (
        f"https://historicengland.org.uk/listing/the-list/list-entry/{list_entry}"
    )
    layer_slug = slug(query["layer_name"], max_len=36)
    field_slug = slug(query["date_field"], max_len=20)
    candidate_id = f"london-nhle-round392-{layer_slug}-{field_slug}-{list_entry}-{date_compact(event_date)}"
    source_record_id = (
        f"NHLE ListEntry {list_entry}; {query['date_field']} {event_date}; "
        f"OBJECTID {properties.get('OBJECTID')}; layer {query['layer_id']} {query['layer_name']}"
    )
    note = one_line(properties.get("Notes") or "")

    summary = (
        f"Historic England's National Heritage List for England {query['layer_name']} layer records "
        f"{name} as ListEntry {list_entry}{grade_phrase}, with {query['date_field']} of {event_date}. "
        f"This is an administrative {query['action_label']} record, not evidence of construction, opening, "
        "occupation, repair, demolition, condition, or broader outcome evidence."
    )
    if note:
        summary += f" NHLE layer note: {note}."

    source_key_field = canonical_date_field(query["date_field"]) or query["date_field"]
    return {
        "city_id": "london",
        "candidate_id": candidate_id,
        "event_id": candidate_id,
        "title": f"{name} {query['title_suffix']}",
        "summary": summary,
        "observed_change": (
            f"Official NHLE administrative milestone: the {query['layer_name']} row carries the cited "
            f"{query['date_field']}. The source does not by itself state a physical change on that date."
        ),
        "effective_date": event_date,
        "effective_date_range": None,
        "date": event_date,
        "date_precision": "day",
        "source_date_field": query["date_field"],
        "bucket": query["bucket"],
        "category": "architecture",
        "subcategory": "heritage_administrative_status",
        "project_type": query["project_type"],
        "record_type": query["record_type"],
        "designation_type": query["action_label"],
        "location_name": name,
        "area": name,
        "geometry": {"type": "Point", "coordinates": [float(point[0]), float(point[1])]},
        "latitude": float(point[1]),
        "longitude": float(point[0]),
        "source_id": SOURCE_ID,
        "source_ids": [SOURCE_ID],
        "source_dataset_id": f"{SOURCE_ID}-layer-{query['layer_id']}",
        "source_layer_id": query["layer_id"],
        "source_layer_name": query["layer_name"],
        "source_name": SOURCE_NAME,
        "publisher": PUBLISHER,
        "source_url": source_url,
        "source_record_id": source_record_id,
        "source_type": "official Historic England ArcGIS FeatureServer row",
        "accessed_at": ACCESS_DATE,
        "confidence": "documented",
        "license": LICENSE,
        "license_url": LICENSE_URL,
        "license_or_terms_note": LICENSE,
        "attribution": ATTRIBUTION,
        "geometry_source": (
            f"NHLE {query['layer_name']} geometry from Historic England Open Data Hub, filtered inside "
            "ONS London region E12000007."
        ),
        "geometry_precision": (
            "Official NHLE point or representative polygon point for locating the heritage asset; it does "
            "not define a surveyed works area, construction footprint, complete curtilage, or condition boundary."
        ),
        "limitations": (
            f"NHLE {query['date_field']} documents an administrative {query['action_label']} date only. "
            "It is not evidence of construction, demolition, restoration, occupation, public access, "
            "condition change, heritage benefit, or broader outcome evidence."
        ),
        "transformation_method": (
            "scripts/fetch_round392_london_nhle_heritage_tail5_candidates.py queried the official Historic "
            f"England NHLE FeatureServer layer {query['layer_id']} ({query['layer_name']}) for "
            f"{query['date_field']} from {DATE_START} through {DATE_END}, filtered features to the ONS "
            "London region geometry, deduplicated against the manual architecture corpus and prior "
            "candidate packs by NHLE ListEntry/date-field/date and source keys, and normalized the "
            "remaining rows into Bims-5 candidate events."
        ),
        "nhle_list_entry": list_entry,
        "grade": grade,
        "source_row": {
            "OBJECTID": properties.get("OBJECTID"),
            "ListEntry": properties.get("ListEntry"),
            "Name": properties.get("Name"),
            "Grade": properties.get("Grade"),
            "Notes": properties.get("Notes"),
            "NGR": properties.get("NGR"),
            "Easting": properties.get("Easting"),
            "Northing": properties.get("Northing"),
            "Latitude": properties.get("Latitude"),
            "Longitude": properties.get("Longitude"),
            "CaptureScale": properties.get("CaptureScale"),
            "area_ha": properties.get("area_ha"),
            "hyperlink": source_url,
            **date_fields_for_source_row(properties),
        },
        "dedupe_key": f"{list_entry}|{source_key_field}|{event_date}",
    }


def candidate_from_delisted_feature(feature, point):
    properties = feature.get("properties") or {}
    original_entry = one_line(properties.get("OriginalListEntryNumber"))
    article_uid = one_line(properties.get("ARTICLEUID"))
    object_id = properties.get("OBJECTID")
    event_date = iso_from_millis(properties.get("DateRemovedFromList"))
    if not event_date or not (original_entry or article_uid):
        return None

    record_key = original_entry or f"article-{article_uid}"
    name = one_line(properties.get("ARTICLEVERSIONNAME") or f"Historic England de-designated site {record_key}")
    category = one_line(properties.get("HERITAGECATEGORYDESCRIPTION") or "")
    category_phrase = f" ({category})" if category else ""
    decision_text = one_line(properties.get("DecisionText") or "")
    candidate_id = f"london-nhle-round392-de-designated-sites-date-removed-{record_key}-{date_compact(event_date)}"
    source_record_id = (
        f"De-designated sites ARTICLEUID {article_uid}; OriginalListEntryNumber {original_entry}; "
        f"DateRemovedFromList {event_date}; OBJECTID {object_id}; layer 0 De-designated sites"
    )

    summary = (
        f"Historic England's De-designated sites open-data layer records {name} as removed from the "
        f"National Heritage List for England on {event_date}{category_phrase}. This is an administrative "
        "de-designation/removal record, not evidence of construction, demolition, repair, opening, "
        "occupation, condition, or broader outcome evidence."
    )
    if decision_text:
        summary += f" Source decision text summary: {decision_text}"

    return {
        "city_id": "london",
        "candidate_id": candidate_id,
        "event_id": candidate_id,
        "title": f"{name} removed from the NHLE",
        "summary": summary,
        "observed_change": (
            "Official Historic England administrative milestone: the De-designated sites row carries "
            "DateRemovedFromList. The source does not by itself state a physical change on that date."
        ),
        "effective_date": event_date,
        "effective_date_range": None,
        "date": event_date,
        "date_precision": "day",
        "source_date_field": "DateRemovedFromList",
        "bucket": DELISTED_QUERY["bucket"],
        "category": "architecture",
        "subcategory": "heritage_administrative_status",
        "project_type": DELISTED_QUERY["project_type"],
        "record_type": DELISTED_QUERY["record_type"],
        "designation_type": DELISTED_QUERY["action_label"],
        "location_name": name,
        "area": name,
        "geometry": {"type": "Point", "coordinates": [float(point[0]), float(point[1])]},
        "latitude": float(point[1]),
        "longitude": float(point[0]),
        "source_id": DELISTED_SOURCE_ID,
        "source_ids": [DELISTED_SOURCE_ID],
        "source_dataset_id": f"{DELISTED_SOURCE_ID}-round392-tail5-layer-0",
        "source_layer_id": 0,
        "source_layer_name": "De-designated sites",
        "source_name": DELISTED_SOURCE_NAME,
        "publisher": PUBLISHER,
        "source_url": DELISTED_DATASET_URL,
        "source_record_id": source_record_id,
        "source_type": "official Historic England ArcGIS FeatureServer row",
        "accessed_at": ACCESS_DATE,
        "confidence": "documented",
        "license": LICENSE,
        "license_url": LICENSE_URL,
        "license_or_terms_note": LICENSE,
        "attribution": ATTRIBUTION,
        "geometry_source": (
            "Historic England De-designated sites polygon geometry from the Open Data Hub, filtered inside "
            "ONS London region E12000007."
        ),
        "geometry_precision": (
            "Official de-designated-site polygon representative point for locating the heritage asset; it "
            "does not define a construction footprint, demolition extent, current condition, or works area."
        ),
        "limitations": (
            "DateRemovedFromList documents an administrative NHLE de-designation/removal date only. It is "
            "not evidence of construction, demolition, restoration, occupation, public access, condition "
            "change, heritage benefit, or broader outcome evidence."
        ),
        "transformation_method": (
            "scripts/fetch_round392_london_nhle_heritage_tail5_candidates.py queried the official Historic "
            f"England De-designated sites FeatureServer layer 0 for DateRemovedFromList from {DATE_START} "
            f"through {DATE_END}, filtered features to the ONS London region geometry, deduplicated against "
            "the manual architecture corpus and prior candidate packs by original NHLE list-entry/date-field/date "
            "and source keys, and normalized the remaining rows into Bims-5 candidate events."
        ),
        "nhle_list_entry": original_entry,
        "grade": "",
        "source_row": {
            "OBJECTID": object_id,
            "ARTICLEUID": properties.get("ARTICLEUID"),
            "ARTICLEVERSIONNAME": properties.get("ARTICLEVERSIONNAME"),
            "HERITAGECATEGORYDESCRIPTION": properties.get("HERITAGECATEGORYDESCRIPTION"),
            "CaptureScale": properties.get("CaptureScale"),
            "DateRemovedFromList": event_date,
            "DecisionText": properties.get("DecisionText"),
            "DDRType": properties.get("DDRType"),
            "OriginalListEntryNumber": properties.get("OriginalListEntryNumber"),
            "Shape__Area": properties.get("Shape__Area"),
            "Shape__Length": properties.get("Shape__Length"),
            "source_url": DELISTED_DATASET_URL,
        },
        "dedupe_key": f"{record_key}|DateRemovedFromList|{event_date}",
    }


def fetch_candidates(existing, london_geometry):
    candidates = []
    rejected_records = []
    reason_counts = {}
    query_counts = []
    seen_keys = set()
    source_rows_fetched = 0
    source_rows_fetched_by_source = {
        "national_heritage_list_for_england_nhle": 0,
        "historic_england_de_designated_sites": 0,
    }

    def reject(reason, query, properties=None, detail=None):
        reason_counts[reason] = reason_counts.get(reason, 0) + 1
        if len(rejected_records) >= 1000:
            return
        list_entry = one_line(
            (properties or {}).get("ListEntry")
            or (properties or {}).get("OriginalListEntryNumber")
            or (properties or {}).get("ARTICLEUID")
        )
        event_date = iso_from_millis((properties or {}).get(query["date_field"]))
        rejected = {
            "reason": reason,
            "source_record_id": f"NHLE ListEntry {list_entry}" if list_entry else "",
            "source_date_field": query["date_field"],
            "date": event_date,
            "title": one_line((properties or {}).get("Name")),
            "source_layer_id": query["layer_id"],
            "source_layer_name": query["layer_name"],
        }
        if detail:
            rejected["detail"] = detail
        rejected_records.append(rejected)

    for query in SOURCE_QUERIES:
        features = query_features(query)
        source_rows_fetched += len(features)
        source_rows_fetched_by_source["national_heritage_list_for_england_nhle"] += len(features)
        layer_candidate_count = 0
        for feature in features:
            properties = feature.get("properties") or {}
            geometry = feature.get("geometry")
            point = representative_point(geometry, london_geometry)
            if not point:
                reject("missing_or_unsupported_geometry", query, properties)
                continue
            if not point_in_geometry(point, london_geometry):
                reject("outside_ons_london_region", query, properties)
                continue

            list_entry = one_line(properties.get("ListEntry"))
            event_date = iso_from_millis(properties.get(query["date_field"]))
            if not list_entry or not event_date:
                reject("missing_list_entry_or_date", query, properties)
                continue
            if event_date < DATE_START or event_date > DATE_END:
                reject("outside_date_window", query, properties)
                continue

            canonical = canonical_date_field(query["date_field"]) or query["date_field"]
            nhle_key = f"{list_entry}|{canonical}|{event_date}"
            if nhle_key in existing["existing_nhle_keys"]:
                reject("existing_corpus_or_prior_pack_nhle_key", query, properties, nhle_key)
                continue
            if nhle_key in seen_keys:
                reject("duplicate_within_round", query, properties, nhle_key)
                continue

            candidate = candidate_from_feature(query, feature, point)
            if not candidate:
                reject("normalization_failed", query, properties)
                continue

            source_key = (
                f"london|{candidate['source_url']}|{candidate['source_record_id']}|"
                f"{canonical}|{candidate['date']}"
            )
            if candidate["event_id"] in existing["existing_ids"]:
                reject("existing_event_id", query, properties, candidate["event_id"])
                continue
            if source_key in existing["existing_source_keys"]:
                reject("existing_source_key", query, properties, source_key)
                continue

            seen_keys.add(nhle_key)
            candidates.append(candidate)
            layer_candidate_count += 1

        query_counts.append(
            {
                "source": "National Heritage List for England (NHLE)",
                "layer_id": query["layer_id"],
                "layer_name": query["layer_name"],
                "source_date_field": query["date_field"],
                "rows_fetched_in_london_bbox": len(features),
                "candidate_count_after_dedupe": layer_candidate_count,
            }
        )

    delisted_features = query_delisted_features()
    source_rows_fetched += len(delisted_features)
    source_rows_fetched_by_source["historic_england_de_designated_sites"] += len(delisted_features)
    delisted_candidate_count = 0
    for feature in delisted_features:
        properties = feature.get("properties") or {}
        geometry = feature.get("geometry")
        point = representative_point(geometry, london_geometry)
        if not point:
            reject("missing_or_unsupported_geometry", DELISTED_QUERY, properties)
            continue
        if not point_in_geometry(point, london_geometry):
            reject("outside_ons_london_region", DELISTED_QUERY, properties)
            continue

        original_entry = one_line(properties.get("OriginalListEntryNumber"))
        article_uid = one_line(properties.get("ARTICLEUID"))
        record_key = original_entry or f"article-{article_uid}"
        event_date = iso_from_millis(properties.get("DateRemovedFromList"))
        if not event_date or not (original_entry or article_uid):
            reject("missing_record_id_or_date", DELISTED_QUERY, properties)
            continue
        if event_date < DATE_START or event_date > DATE_END:
            reject("outside_date_window", DELISTED_QUERY, properties)
            continue

        heritage_key = f"{record_key}|DateRemovedFromList|{event_date}"
        if heritage_key in existing["existing_nhle_keys"]:
            reject("existing_corpus_or_prior_pack_nhle_key", DELISTED_QUERY, properties, heritage_key)
            continue
        if heritage_key in seen_keys:
            reject("duplicate_within_round", DELISTED_QUERY, properties, heritage_key)
            continue

        candidate = candidate_from_delisted_feature(feature, point)
        if not candidate:
            reject("normalization_failed", DELISTED_QUERY, properties)
            continue

        source_key = (
            f"london|{candidate['source_url']}|{candidate['source_record_id']}|"
            f"DateRemovedFromList|{candidate['date']}"
        )
        if candidate["event_id"] in existing["existing_ids"]:
            reject("existing_event_id", DELISTED_QUERY, properties, candidate["event_id"])
            continue
        if source_key in existing["existing_source_keys"]:
            reject("existing_source_key", DELISTED_QUERY, properties, source_key)
            continue

        seen_keys.add(heritage_key)
        candidates.append(candidate)
        delisted_candidate_count += 1

    query_counts.append(
        {
            "source": "Historic England De-designated sites",
            "layer_id": DELISTED_QUERY["layer_id"],
            "layer_name": DELISTED_QUERY["layer_name"],
            "source_date_field": DELISTED_QUERY["date_field"],
            "rows_fetched_in_london_bbox": len(delisted_features),
            "candidate_count_after_dedupe": delisted_candidate_count,
        }
    )

    candidates.sort(key=lambda row: (row["effective_date"], row["record_type"], row["source_record_id"]))
    return {
        "source_rows_fetched": source_rows_fetched,
        "source_rows_fetched_by_source": source_rows_fetched_by_source,
        "query_counts": query_counts,
        "candidates": candidates,
        "rejected_records": rejected_records,
        "reason_counts": reason_counts,
    }


def make_summary(existing, result):
    candidates = result["candidates"]
    dates = [candidate["date"] for candidate in candidates]
    record_type_mix = {}
    source_date_field_mix = {}
    designation_type_mix = {}
    layer_mix = {}
    for candidate in candidates:
        record_type_mix[candidate["record_type"]] = record_type_mix.get(candidate["record_type"], 0) + 1
        source_date_field_mix[candidate["source_date_field"]] = source_date_field_mix.get(candidate["source_date_field"], 0) + 1
        designation_type_mix[candidate["designation_type"]] = designation_type_mix.get(candidate["designation_type"], 0) + 1
        layer = f"{candidate['source_layer_id']} {candidate['source_layer_name']}"
        layer_mix[layer] = layer_mix.get(layer, 0) + 1

    return {
        "generated_at": f"{ACCESS_DATE}T00:00:00Z",
        "worker_scope": "round392 London Historic England/NHLE heritage-designation tail5",
        "date_window": {"start": DATE_START, "end": DATE_END},
        "source_rows_fetched": result["source_rows_fetched"],
        "source_rows_fetched_by_source": result["source_rows_fetched_by_source"],
        "candidate_count": len(candidates),
        "pack_type": "exhaustion" if not candidates else "candidate",
        "exhaustion_note": (
            "No clean deduped London NHLE or de-designated administrative rows remained after scanning "
            "the manual architecture corpus and prior candidate packs through round315."
            if not candidates
            else None
        ),
        "date_range": {"start": min(dates) if dates else None, "end": max(dates) if dates else None},
        "record_type_mix": record_type_mix,
        "source_date_field_mix": source_date_field_mix,
        "designation_type_mix": designation_type_mix,
        "source_layer_mix": layer_mix,
        "query_counts": result["query_counts"],
        "rejected_reason_counts": result["reason_counts"],
        "duplicate_screening": {
            "manual_corpus_path": "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
            "corpus_events_scanned": existing["corpus_event_count"],
            "prior_candidate_pack_files_scanned": existing["scanned_candidate_files"],
            "existing_event_ids_seen": len(existing["existing_ids"]),
            "existing_source_keys_seen": len(existing["existing_source_keys"]),
            "existing_nhle_date_keys_seen": len(existing["existing_nhle_keys"]),
            "dedupe_key": "NHLE ListEntry + canonical source date field + administrative date",
            "screening_note": (
                "Scanned the manual architecture corpus and candidate-like tmp/subagents JSON packs, including "
                "prior Historic England/NHLE London heritage packs through round315, for event IDs, source keys, "
                "exact NHLE ListEntry/date-field/date keys, and de-designated OriginalListEntryNumber/date keys. "
                "Rejected files and raw query captures were not "
                "treated as accepted candidate packs."
            ),
        },
        "critical_interpretation_note": (
            "These records are administrative heritage designation, listing, inscription, certificate/status-start or expiry, "
            "de-designation/removal, or amendment rows only. They are not evidence of construction, completion, demolition, opening, "
            "occupation, repair, condition, impact, prediction, simulation, or causation."
        ),
        "candidate_ids": [candidate["candidate_id"] for candidate in candidates],
    }


def source_audit(summary):
    return {
        "generated_at": f"{ACCESS_DATE}T00:00:00Z",
        "source_audits": [
            {
                "source_id": SOURCE_ID,
                "stable_id": SOURCE_ID,
                "source_name": SOURCE_NAME,
                "publisher": PUBLISHER,
                "url": NHLE_DATA_DOWNLOADS_URL,
                "source_url": NHLE_DATA_DOWNLOADS_URL,
                "api_catalogue_url": NHLE_API_CATALOGUE_URL,
                "api_endpoint": NHLE_SERVICE_URL,
                "source_type": "official Historic England ArcGIS FeatureServer",
                "license": LICENSE,
                "license_url": LICENSE_URL,
                "license_or_terms_note": LICENSE,
                "attribution": ATTRIBUTION,
                "accessed_at": ACCESS_DATE,
                "date_or_date_range": {"start": DATE_START, "end": DATE_END},
                "coverage_years_checked": f"{DATE_START} through {DATE_END}",
                "update_frequency": "The API catalogue states that NHLE data is updated daily.",
                "geographic_scope": "England source layers; features filtered to the ONS London region E12000007.",
                "geometry_ref": "Official NHLE layer geometries filtered inside the ONS London region boundary E12000007.",
                "granularity": "One NHLE source row and one explicit administrative source date field.",
                "method": (
                    "Queried the official NHLE FeatureServer layers and date fields listed below, filtered rows "
                    "to ONS London region geometry, and deduped against the manual corpus plus prior candidate packs."
                ),
                "confidence": "documented source audit",
                "limitations": (
                    "NHLE rows support administrative heritage dates only. They do not by themselves document "
                    "physical works, access, condition, ownership, or broader outcome evidence."
                ),
                "layers_checked": [
                    {
                        "layer_id": query["layer_id"],
                        "layer_name": query["layer_name"],
                        "source_date_field": query["date_field"],
                        "record_type": query["record_type"],
                    }
                    for query in SOURCE_QUERIES
                ],
                "key_fields": [
                    "OBJECTID",
                    "ListEntry",
                    "Name",
                    "Grade",
                    "ListDate",
                    "AmendDate",
                    "BPNStart",
                    "BPNExpire",
                    "COIStart",
                    "COIExpire",
                    "SchedDate",
                    "RegDate",
                    "DesigDate",
                    "InscrDate",
                    "hyperlink",
                    "NGR",
                    "Easting",
                    "Northing",
                    "geometry",
                ],
                "reliability": "strong for official NHLE administrative source dates, with interpretation caveats",
                "records_reviewed": summary["source_rows_fetched_by_source"].get(
                    "national_heritage_list_for_england_nhle", 0
                ),
                "candidate_count": sum(
                    count
                    for record_type, count in summary["record_type_mix"].items()
                    if record_type != DELISTED_QUERY["record_type"]
                ),
                "required_caveats": [
                    "NHLE date fields used here are administrative designation, listing, inscription, notice/certificate start or expiry, or amendment dates, not construction dates.",
                    "NHLE point and polygon geometries locate heritage assets for atlas use but do not define construction areas, curtilage, condition, ownership, access, or outcomes.",
                    "The API catalogue page has its own start date, while the individual NHLE rows carry older administrative dates; this pack uses row-level administrative date fields only.",
                    "Use factual metadata and source URLs; list-entry page narrative text, images, and map products require separate terms review before broader redistribution.",
                ],
                "ingestion_recommendation": (
                    "Append only as documented heritage-administrative change events after the main appender "
                    "re-checks corpus duplicates."
                ),
            },
            {
                "source_id": DELISTED_SOURCE_ID,
                "stable_id": DELISTED_SOURCE_ID,
                "source_name": DELISTED_SOURCE_NAME,
                "publisher": PUBLISHER,
                "url": DELISTED_DATASET_URL,
                "source_url": DELISTED_DATASET_URL,
                "api_item_url": DELISTED_ITEM_URL,
                "api_endpoint": DELISTED_SERVICE_URL,
                "source_type": "official Historic England ArcGIS FeatureServer",
                "license": LICENSE,
                "license_url": LICENSE_URL,
                "license_or_terms_note": LICENSE,
                "attribution": ATTRIBUTION,
                "accessed_at": ACCESS_DATE,
                "date_or_date_range": {"start": DATE_START, "end": DATE_END},
                "coverage_years_checked": f"{DATE_START} through {DATE_END}",
                "update_frequency": "ArcGIS item metadata indicates an official Historic England hosted feature service; the service copyright is current to 2026.",
                "geographic_scope": "England source layer; features filtered to the ONS London region E12000007.",
                "geometry_ref": "Official de-designated-site polygon geometries filtered inside the ONS London region boundary E12000007.",
                "granularity": "One de-designated source row and the DateRemovedFromList administrative field.",
                "method": (
                    "Queried the official de-designated sites FeatureServer DateRemovedFromList field, filtered rows "
                    "to ONS London region geometry, and deduped against the manual corpus plus prior candidate packs."
                ),
                "confidence": "documented source audit",
                "limitations": (
                    "DateRemovedFromList supports an administrative removal date only. It does not by itself "
                    "document physical works, access, condition, ownership, or broader outcome evidence."
                ),
                "layers_checked": [
                    {
                        "layer_id": DELISTED_QUERY["layer_id"],
                        "layer_name": DELISTED_QUERY["layer_name"],
                        "source_date_field": DELISTED_QUERY["date_field"],
                        "record_type": DELISTED_QUERY["record_type"],
                    }
                ],
                "key_fields": [
                    "OBJECTID",
                    "ARTICLEUID",
                    "ARTICLEVERSIONNAME",
                    "HERITAGECATEGORYDESCRIPTION",
                    "DateRemovedFromList",
                    "DecisionText",
                    "DDRType",
                    "OriginalListEntryNumber",
                    "geometry",
                ],
                "reliability": "strong for official Historic England de-designation/removal administrative dates, with interpretation caveats",
                "records_reviewed": summary["source_rows_fetched_by_source"].get(
                    "historic_england_de_designated_sites", 0
                ),
                "candidate_count": summary["record_type_mix"].get(DELISTED_QUERY["record_type"], 0),
                "required_caveats": [
                    "DateRemovedFromList is a heritage-administrative de-designation/removal date, not a demolition, construction, repair, opening, occupation, condition, or outcome date.",
                    "The de-designated polygon or representative point is for atlas location only and is not evidence of current physical condition or work extent.",
                    "The dataset states it covers complete removals from the NHLE since 4 April 2011 and excludes partial delisting, removal of part of an area, and duplicate-entry removals.",
                ],
                "ingestion_recommendation": (
                    "Append only as documented heritage-administrative change events after the main appender "
                    "re-checks corpus duplicates."
                ),
            },
        ],
        "supporting_boundary_source": {
            "source_name": "ONS Regions December 2024 Boundaries EN BFC",
            "publisher": "Office for National Statistics / Esri ArcGIS service",
            "url": ONS_LONDON_REGION_URL,
            "filter": "RGN24CD='E12000007'",
            "use": "London region spatial inclusion test only, not event evidence.",
        },
        "summary": summary,
    }


def notes_md(summary):
    lines = [
        "# Round392 London NHLE Heritage Tail5",
        "",
        "This pack harvests additional official Historic England/NHLE administrative heritage records for London after the earlier London/NHLE heritage packs through round315.",
        "",
        f"- Accessed: {ACCESS_DATE}",
        f"- Date window: {DATE_START} through {DATE_END}",
        f"- Source rows fetched across all official Historic England queries: {summary['source_rows_fetched']}",
        f"- NHLE source rows fetched: {summary['source_rows_fetched_by_source'].get('national_heritage_list_for_england_nhle', 0)}",
        f"- De-designated source rows fetched: {summary['source_rows_fetched_by_source'].get('historic_england_de_designated_sites', 0)}",
        f"- Candidate count: {summary['candidate_count']}",
        f"- Date range: {summary['date_range']['start']} to {summary['date_range']['end']}",
        f"- Pack type: {summary['pack_type']}",
        f"- Manual corpus events scanned: {summary['duplicate_screening']['corpus_events_scanned']}",
        f"- Prior candidate pack JSON files scanned: {summary['duplicate_screening']['prior_candidate_pack_files_scanned']}",
        "",
        "Designation type mix:",
        "",
    ]
    if summary["exhaustion_note"]:
        lines.extend([summary["exhaustion_note"], ""])
    lines.extend(f"- {key}: {value}" for key, value in summary["designation_type_mix"].items())
    lines.extend(
        [
            "",
            "Source date field mix:",
            "",
        ]
    )
    lines.extend(f"- {key}: {value}" for key, value in summary["source_date_field_mix"].items())
    lines.extend(
        [
            "",
            "Caveat: these are administrative Historic England/NHLE dates only. Do not treat designation, listing, inscription, certificate/status-start or expiry, amendment, or de-designation/removal dates as construction, demolition, repair, opening, occupation, condition, impact, prediction, simulation, or causal evidence.",
            "",
        ]
    )
    return "\n".join(lines)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    existing = scan_existing()
    london_geometry = london_region_geometry()
    result = fetch_candidates(existing, london_geometry)
    summary = make_summary(existing, result)

    pack = {
        "metadata": {
            "schema_version": "round392_london_nhle_heritage_tail5_candidates_v1",
            "generated_at": f"{ACCESS_DATE}T00:00:00Z",
            "city_id": "london",
            "source_id": SOURCE_ID,
            "date_window": {"start": DATE_START, "end": DATE_END},
            "candidate_count": len(result["candidates"]),
            "critical_interpretation_note": summary["critical_interpretation_note"],
            "duplicate_screening": summary["duplicate_screening"],
        },
        "candidates": result["candidates"],
    }
    rejected_pack = {
        "generated_at": f"{ACCESS_DATE}T00:00:00Z",
        "reason_counts": result["reason_counts"],
        "records": result["rejected_records"],
        "record_limit_note": "Detailed rejected records are capped at 1000 examples; reason_counts contains full counts.",
    }

    write_json(CANDIDATES_PATH, pack)
    write_json(SOURCE_AUDIT_PATH, source_audit(summary))
    write_json(SUMMARY_PATH, summary)
    write_json(REJECTED_PATH, rejected_pack)
    NOTES_PATH.write_text(notes_md(summary), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

