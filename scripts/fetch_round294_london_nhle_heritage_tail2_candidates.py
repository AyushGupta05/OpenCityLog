import datetime as dt
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path


ACCESS_DATE = "2026-05-20"
DATE_START = "2008-01-01"
DATE_END = "2026-05-20"

OUT_DIR = Path("tmp/subagents/round294_london_nhle_heritage_tail2")
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

SOURCE_ID = "historic-england-nhle-open-data-round294-tail2"
SOURCE_NAME = "National Heritage List for England (NHLE) open data"
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
    "COIStart": ["COIStart", "Start Date of Certificate", "start-date"],
    "SchedDate": ["SchedDate", "Date first scheduled"],
    "RegDate": ["RegDate", "Date first registered"],
    "DesigDate": ["DesigDate", "Date first designated"],
    "InscrDate": ["InscrDate", "Date first inscribed"],
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
    request = urllib.request.Request(url, headers={"User-Agent": "Bims-5 round294 NHLE tail2 fetcher"})
    with urllib.request.urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


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

    for item in [row, row.get("source_row") if isinstance(row, dict) else None]:
        if not isinstance(item, dict):
            continue
        list_entry = one_line(item.get("ListEntry") or item.get("nhle_list_entry") or item.get("list_entry") or "")
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
    candidate_id = f"london-nhle-round294-{layer_slug}-{field_slug}-{list_entry}-{date_compact(event_date)}"
    source_record_id = (
        f"NHLE ListEntry {list_entry}; {query['date_field']} {event_date}; "
        f"OBJECTID {properties.get('OBJECTID')}; layer {query['layer_id']} {query['layer_name']}"
    )
    note = one_line(properties.get("Notes") or "")

    summary = (
        f"Historic England's National Heritage List for England {query['layer_name']} layer records "
        f"{name} as ListEntry {list_entry}{grade_phrase}, with {query['date_field']} of {event_date}. "
        f"This is an administrative {query['action_label']} record, not evidence of construction, opening, "
        "occupation, repair, demolition, condition, outcome, forecast, simulation, or causation."
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
            "condition change, heritage benefit, impact, forecast, simulation, or causation."
        ),
        "transformation_method": (
            "scripts/fetch_round294_london_nhle_heritage_tail2_candidates.py queried the official Historic "
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


def fetch_candidates(existing, london_geometry):
    candidates = []
    rejected_records = []
    reason_counts = {}
    query_counts = []
    seen_keys = set()
    source_rows_fetched = 0

    def reject(reason, query, properties=None, detail=None):
        reason_counts[reason] = reason_counts.get(reason, 0) + 1
        if len(rejected_records) >= 1000:
            return
        list_entry = one_line((properties or {}).get("ListEntry"))
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
                "layer_id": query["layer_id"],
                "layer_name": query["layer_name"],
                "source_date_field": query["date_field"],
                "rows_fetched_in_london_bbox": len(features),
                "candidate_count_after_dedupe": layer_candidate_count,
            }
        )

    candidates.sort(key=lambda row: (row["effective_date"], row["record_type"], row["source_record_id"]))
    return {
        "source_rows_fetched": source_rows_fetched,
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
        "worker_scope": "round294 London Historic England/NHLE heritage-designation tail2",
        "date_window": {"start": DATE_START, "end": DATE_END},
        "source_rows_fetched": result["source_rows_fetched"],
        "candidate_count": len(candidates),
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
                "prior Historic England/NHLE London heritage packs through round215, for event IDs, source keys, "
                "and exact NHLE ListEntry/date-field/date keys. Rejected files and raw query captures were not "
                "treated as accepted candidate packs."
            ),
        },
        "critical_interpretation_note": (
            "These records are administrative heritage designation, listing, inscription, certificate/status-start, "
            "or amendment rows only. They are not evidence of construction, completion, demolition, opening, "
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
                "source_name": SOURCE_NAME,
                "publisher": PUBLISHER,
                "url": NHLE_DATA_DOWNLOADS_URL,
                "api_catalogue_url": NHLE_API_CATALOGUE_URL,
                "api_endpoint": NHLE_SERVICE_URL,
                "source_type": "official Historic England ArcGIS FeatureServer",
                "license": LICENSE,
                "license_url": LICENSE_URL,
                "attribution": ATTRIBUTION,
                "accessed_at": ACCESS_DATE,
                "coverage_years_checked": f"{DATE_START} through {DATE_END}",
                "update_frequency": "The API catalogue states that NHLE data is updated daily.",
                "geographic_scope": "England source layers; features filtered to the ONS London region E12000007.",
                "granularity": "One NHLE source row and one explicit administrative source date field.",
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
                    "COIStart",
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
                "records_reviewed": summary["source_rows_fetched"],
                "candidate_count": summary["candidate_count"],
                "required_caveats": [
                    "NHLE date fields used here are administrative designation, listing, inscription, notice/certificate start, or amendment dates, not construction dates.",
                    "NHLE point and polygon geometries locate heritage assets for atlas use but do not define construction areas, curtilage, condition, ownership, access, or outcomes.",
                    "The API catalogue page has its own start date, while the individual NHLE rows carry older administrative dates; this pack uses row-level administrative date fields only.",
                    "Use factual metadata and source URLs; list-entry page narrative text, images, and map products require separate terms review before broader redistribution.",
                ],
                "ingestion_recommendation": (
                    "Append only as documented heritage-administrative change events after the main appender "
                    "re-checks corpus duplicates."
                ),
            }
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
        "# Round294 London NHLE Heritage Tail2",
        "",
        "This pack harvests additional official Historic England NHLE administrative heritage records for London after the earlier London/NHLE heritage packs through round215.",
        "",
        f"- Accessed: {ACCESS_DATE}",
        f"- Date window: {DATE_START} through {DATE_END}",
        f"- Source rows fetched across NHLE layer/date queries: {summary['source_rows_fetched']}",
        f"- Candidate count: {summary['candidate_count']}",
        f"- Date range: {summary['date_range']['start']} to {summary['date_range']['end']}",
        f"- Manual corpus events scanned: {summary['duplicate_screening']['corpus_events_scanned']}",
        f"- Prior candidate pack JSON files scanned: {summary['duplicate_screening']['prior_candidate_pack_files_scanned']}",
        "",
        "Designation type mix:",
        "",
    ]
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
            "Caveat: these are administrative NHLE dates only. Do not treat designation, listing, inscription, certificate/status-start, or amendment dates as construction, demolition, repair, opening, occupation, condition, forecast, simulation, or causal evidence.",
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
            "schema_version": "round294_london_nhle_heritage_tail2_candidates_v1",
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
