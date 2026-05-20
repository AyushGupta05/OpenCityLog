import datetime as dt
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path


ACCESS_DATE = "2026-05-19"
DATE_START = "2008-01-01"
DATE_END = ACCESS_DATE
TARGET_CANDIDATES = 80

OUT_DIR = Path("tmp/subagents/round215_london_nhle_heritage_tail")
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
NHLE_LAYER_URL = (
    "https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/"
    "National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer/0"
)

SOURCE_ID = "historic-england-nhle-listed-building-points-round215"
SOURCE_NAME = "National Heritage List for England (NHLE) listed-building points"
PUBLISHER = "Historic England"
SOURCE_DATASET_URL = "https://historicengland.org.uk/listing/the-list/data-downloads/"
LICENSE = (
    "Open Government Licence v3.0 with Historic England Open Data Hub terms; "
    "spatial data includes Ordnance Survey Crown copyright/database right attribution."
)
LICENSE_URL = "https://historicengland.org.uk/terms/website-terms-conditions/open-data-hub/"
ATTRIBUTION = "Historic England; Contains Ordnance Survey data Crown copyright and database right 2026."


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
    )


def one_line(value):
    return re.sub(r"\s+", " ", clean_text(value)).strip()


def slug(value, max_len=84):
    result = re.sub(r"[^a-z0-9]+", "-", one_line(value).lower()).strip("-")
    return (result[:max_len].strip("-") or "record")


def date_compact(value):
    return value.replace("-", "")


def get_json(url, params=None):
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, headers={"User-Agent": "Bims-5 round215 NHLE tail fetcher"})
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.loads(response.read().decode("utf-8"))


def arcgis_features(service_url, params, page_size=2000):
    rows = []
    offset = 0
    while True:
        page_params = dict(params)
        page_params["resultOffset"] = offset
        page_params["resultRecordCount"] = page_size
        payload = get_json(f"{service_url}/query", page_params)
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
    return (dt.datetime(1970, 1, 1) + dt.timedelta(milliseconds=int(value))).strftime("%Y-%m-%d")


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
            return point
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


def point_in_polygon(point, geometry):
    if geometry.get("type") == "Polygon":
        return any(point_in_ring(point, ring) for ring in geometry.get("coordinates", []))
    if geometry.get("type") == "MultiPolygon":
        for polygon in geometry.get("coordinates", []):
            if any(point_in_ring(point, ring) for ring in polygon):
                return True
    return False


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


def flatten_json(value):
    if isinstance(value, dict):
        for item in value.values():
            yield from flatten_json(item)
    elif isinstance(value, list):
        for item in value:
            yield from flatten_json(item)
    else:
        yield value


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
    roots = [Path("tmp/subagents")]
    name_pattern = re.compile(r"(candidates|arch_candidates|heritage_candidates)", re.I)
    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*.json"):
            try:
                resolved = path.resolve()
                if OUT_DIR.resolve() in resolved.parents:
                    continue
                if "query" in path.name.lower():
                    continue
                if path.stat().st_size > 50_000_000:
                    continue
            except OSError:
                continue
            path_text = str(path).lower()
            if name_pattern.search(path.name) or (
                "heritage" in path_text and path.name.lower() == "candidates.json"
            ):
                yield path


def extract_list_entry_keys(row):
    text = text_for_row(row)
    date = one_line(row.get("date") or row.get("effective_date") or row.get("decision_date") or "")
    source_date_field = one_line(row.get("source_date_field") or "")
    source_url = one_line(row.get("source_url") or "")
    source_record_id = one_line(row.get("source_record_id") or "")
    entries = set()

    for match in re.finditer(r"historicengland\.org\.uk/listing/the-list/list-entry/(\d{6,8})", text, re.I):
        entries.add(match.group(1))
    for match in re.finditer(r"\bNHLE\s+ListEntry\s*(\d{6,8})\b", text, re.I):
        entries.add(match.group(1))
    if "National Heritage List" in text or "NHLE" in text or "historicengland.org.uk/listing/the-list/list-entry/" in text:
        for match in re.finditer(r"\bListEntry\D{0,20}(\d{6,8})\b", text, re.I):
            entries.add(match.group(1))

    keys = set()
    if date and entries:
        listdate_like = (
            source_date_field == "ListDate"
            or "listdate" in source_date_field.lower()
            or "date first listed" in source_date_field.lower()
            or "first listed" in text.lower()
            or " listed " in f" {one_line(row.get('title') or '')} ".lower()
            or "listed at grade" in text.lower()
            or ("NHLE ListEntry" in source_record_id and "AmendDate" not in source_record_id)
            or ("historicengland.org.uk/listing/the-list/list-entry/" in source_url and "AmendDate" not in source_record_id)
        )
        if listdate_like:
            for entry in entries:
                keys.add(f"{entry}|{date}")
    return keys


def scan_existing():
    existing_ids = set()
    existing_source_keys = set()
    existing_nhle_listdate_keys = set()
    scanned_candidate_files = 0
    corpus_event_count = 0

    corpus_path = Path("data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json")
    if corpus_path.exists():
        corpus = read_json(corpus_path)
        for event in corpus.get("events", []):
            corpus_event_count += 1
            event_id = one_line(event.get("event_id") or event.get("candidate_id") or "")
            if event_id:
                existing_ids.add(event_id)
            city = one_line(event.get("city_id") or event.get("city") or "")
            date = one_line(event.get("date") or event.get("effective_date") or "")
            source_url = one_line(event.get("source_url") or "")
            source_record_id = one_line(event.get("source_record_id") or "")
            source_date_field = one_line(event.get("source_date_field") or "")
            if city and date and source_url and source_record_id:
                existing_source_keys.add(f"{city}|{source_url}|{source_record_id}|{source_date_field}|{date}")
            if city == "london":
                existing_nhle_listdate_keys.update(extract_list_entry_keys(event))

    for path in candidate_pack_json_files():
        try:
            payload = read_json(path)
        except (OSError, json.JSONDecodeError):
            continue
        scanned_candidate_files += 1
        for row in eventish_rows(payload):
            event_id = one_line(row.get("event_id") or row.get("candidate_id") or "")
            if event_id:
                existing_ids.add(event_id)
            city = one_line(row.get("city_id") or row.get("city") or "london")
            date = one_line(row.get("date") or row.get("effective_date") or "")
            source_url = one_line(row.get("source_url") or "")
            source_record_id = one_line(row.get("source_record_id") or "")
            source_date_field = one_line(row.get("source_date_field") or "")
            if city and date and source_url and source_record_id:
                existing_source_keys.add(f"{city}|{source_url}|{source_record_id}|{source_date_field}|{date}")
            existing_nhle_listdate_keys.update(extract_list_entry_keys(row))

    return {
        "existing_ids": existing_ids,
        "existing_source_keys": existing_source_keys,
        "existing_nhle_listdate_keys": existing_nhle_listdate_keys,
        "scanned_candidate_files": scanned_candidate_files,
        "corpus_event_count": corpus_event_count,
    }


def candidate_from_feature(feature):
    properties = feature.get("properties") or {}
    point = first_point(feature.get("geometry"))
    if not point:
        return None

    list_entry = one_line(properties.get("ListEntry"))
    list_date = iso_from_millis(properties.get("ListDate"))
    if not list_entry or not list_date:
        return None

    name = one_line(properties.get("Name") or f"NHLE ListEntry {list_entry}")
    grade = one_line(properties.get("Grade") or "not supplied")
    source_url = one_line(properties.get("hyperlink")) or (
        f"https://historicengland.org.uk/listing/the-list/list-entry/{list_entry}"
    )
    candidate_id = f"london-nhle-list-round215-{list_entry}-{date_compact(list_date)}"
    source_record_id = f"NHLE ListEntry {list_entry}; ListDate {list_date}; OBJECTID {properties.get('OBJECTID')}"

    return {
        "city_id": "london",
        "candidate_id": candidate_id,
        "event_id": candidate_id,
        "title": f"{name} added to the NHLE",
        "summary": (
            "Historic England's National Heritage List for England listed-building points layer records "
            f"{name} as ListEntry {list_entry}, Grade {grade}, with a ListDate of {list_date}. "
            "This is an administrative heritage designation record, not evidence of construction, opening, "
            "occupation, repair, demolition, condition, or outcome."
        ),
        "observed_change": (
            "Official NHLE administrative milestone: the listed-building point row carries the cited ListDate. "
            "The source does not by itself state a physical change on that date."
        ),
        "effective_date": list_date,
        "effective_date_range": None,
        "date": list_date,
        "date_precision": "day",
        "source_date_field": "ListDate",
        "bucket": "planning/development/architecture/heritage_designation",
        "category": "architecture",
        "subcategory": "heritage_designation",
        "project_type": "NHLE listed-building designation",
        "record_type": "nhle_list_designation",
        "location_name": name,
        "area": name,
        "geometry": {"type": "Point", "coordinates": [float(point[0]), float(point[1])]},
        "latitude": float(point[1]),
        "longitude": float(point[0]),
        "source_id": SOURCE_ID,
        "source_ids": [SOURCE_ID],
        "source_dataset_id": SOURCE_ID,
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
            "NHLE listed-building point geometry from Historic England Open Data Hub, filtered inside "
            "ONS London region E12000007."
        ),
        "geometry_precision": (
            "Official NHLE point for locating the asset; it does not define full statutory extent, "
            "curtilage, building footprint, interior boundary, or works area."
        ),
        "limitations": (
            "NHLE ListDate documents a heritage/listing administrative designation date only. It is not "
            "evidence of construction, demolition, restoration, occupation, public access, condition change, "
            "heritage benefit, impact, forecast, simulation, or causation."
        ),
        "transformation_method": (
            "scripts/fetch_round215_london_nhle_heritage_tail_candidates.py queried the Historic England "
            "NHLE listed-building points FeatureServer for ListDate from 2008-01-01 through 2026-05-19, "
            "filtered features to the ONS London region geometry, removed existing corpus and prior "
            "heritage-candidate ListEntry/ListDate pairs, and normalized the remaining official rows into "
            "Bims-5 candidate events."
        ),
        "source_row": {
            "OBJECTID": properties.get("OBJECTID"),
            "ListEntry": properties.get("ListEntry"),
            "Name": properties.get("Name"),
            "Grade": properties.get("Grade"),
            "ListDate": list_date,
            "AmendDate": iso_from_millis(properties.get("AmendDate")),
            "NGR": properties.get("NGR"),
            "Easting": properties.get("Easting"),
            "Northing": properties.get("Northing"),
            "CaptureScale": properties.get("CaptureScale"),
            "hyperlink": source_url,
        },
    }


def fetch_nhle_candidates(existing, london_geometry):
    features = arcgis_features(
        NHLE_LAYER_URL,
        {
            "where": (
                "ListDate >= timestamp '2008-01-01 00:00:00' "
                "AND ListDate <= timestamp '2026-05-19 23:59:59'"
            ),
            "outFields": (
                "OBJECTID,ListEntry,Name,ListDate,AmendDate,Grade,hyperlink,NGR,"
                "Easting,Northing,CaptureScale"
            ),
            "returnGeometry": "true",
            "outSR": "4326",
            "f": "geojson",
            "geometry": LONDON_BBOX,
            "geometryType": "esriGeometryEnvelope",
            "inSR": "4326",
            "spatialRel": "esriSpatialRelIntersects",
        },
    )

    candidates = []
    rejected_records = []
    reason_counts = {}
    eligible_after_duplicate_screen = 0

    def reject(reason, properties=None, detail=None):
        reason_counts[reason] = reason_counts.get(reason, 0) + 1
        if len(rejected_records) < 500:
            row = {
                "reason": reason,
                "source_record_id": "",
                "date": "",
                "title": "",
            }
            if properties:
                list_entry = one_line(properties.get("ListEntry"))
                list_date = iso_from_millis(properties.get("ListDate"))
                row.update(
                    {
                        "source_record_id": f"NHLE ListEntry {list_entry}" if list_entry else "",
                        "date": list_date,
                        "title": one_line(properties.get("Name")),
                    }
                )
            if detail:
                row["detail"] = detail
            rejected_records.append(row)

    for feature in features:
        properties = feature.get("properties") or {}
        point = first_point(feature.get("geometry"))
        if not point:
            reject("missing_point_geometry", properties)
            continue
        if not point_in_polygon(point, london_geometry):
            reject("outside_ons_london_region", properties)
            continue

        list_entry = one_line(properties.get("ListEntry"))
        list_date = iso_from_millis(properties.get("ListDate"))
        if not list_entry or not list_date:
            reject("missing_list_entry_or_listdate", properties)
            continue
        if list_date < DATE_START or list_date > DATE_END:
            reject("outside_date_window", properties)
            continue

        key = f"{list_entry}|{list_date}"
        if key in existing["existing_nhle_listdate_keys"]:
            reject("existing_corpus_or_prior_pack_listentry_listdate", properties)
            continue

        candidate = candidate_from_feature(feature)
        if not candidate:
            reject("normalization_failed", properties)
            continue

        source_key = (
            f"london|{candidate['source_url']}|{candidate['source_record_id']}|"
            f"{candidate['source_date_field']}|{candidate['date']}"
        )
        if candidate["event_id"] in existing["existing_ids"]:
            reject("existing_event_id", properties, candidate["event_id"])
            continue
        if source_key in existing["existing_source_keys"]:
            reject("existing_source_key", properties, source_key)
            continue

        eligible_after_duplicate_screen += 1
        if len(candidates) < TARGET_CANDIDATES:
            candidates.append(candidate)
        else:
            reject("eligible_headroom_after_cap", properties)

    candidates.sort(key=lambda row: (row["effective_date"], row["source_record_id"]))
    return {
        "features_fetched": len(features),
        "candidates": candidates,
        "rejected_records": rejected_records,
        "reason_counts": reason_counts,
        "eligible_after_duplicate_screen": eligible_after_duplicate_screen,
        "headroom_after_cap": max(0, eligible_after_duplicate_screen - len(candidates)),
    }


def source_audit(summary):
    return {
        "generated_at": f"{ACCESS_DATE}T00:00:00Z",
        "source_audits": [
            {
                "source_id": SOURCE_ID,
                "source_name": SOURCE_NAME,
                "publisher": PUBLISHER,
                "url": SOURCE_DATASET_URL,
                "api_endpoint": f"{NHLE_LAYER_URL}/query",
                "source_type": "official Historic England ArcGIS FeatureServer row",
                "license": LICENSE,
                "license_url": LICENSE_URL,
                "attribution": ATTRIBUTION,
                "accessed_at": ACCESS_DATE,
                "coverage_years_checked": f"{DATE_START} through {DATE_END}",
                "update_frequency": "Historic England API catalogue describes NHLE data as regularly updated; this pack was retrieved on 2026-05-19.",
                "geographic_scope": "England source layer; features filtered to the ONS London region E12000007.",
                "granularity": "One NHLE listed-building point row with a ListEntry and ListDate.",
                "key_fields": [
                    "OBJECTID",
                    "ListEntry",
                    "Name",
                    "Grade",
                    "ListDate",
                    "AmendDate",
                    "hyperlink",
                    "NGR",
                    "Easting",
                    "Northing",
                    "CaptureScale",
                    "geometry",
                ],
                "reliability": "strong for administrative listed-building designation dates",
                "records_reviewed": summary["source_rows_fetched"],
                "candidate_count": summary["candidate_count"],
                "headroom_after_cap": summary["headroom_after_cap"],
                "required_caveats": [
                    "ListDate is a heritage-administrative list/designation date, not a physical works date.",
                    "NHLE point geometry locates the asset but does not define full statutory extent, curtilage, interior boundary, or work area.",
                    "Use factual metadata and source URLs; list-entry narrative text, images, and map terms require separate review before redistribution.",
                ],
                "ingestion_recommendation": "Append as documented heritage-administrative change events only after the main appender re-checks corpus duplicates.",
            }
        ],
        "summary": summary,
    }


def notes_md(summary):
    return "\n".join(
        [
            "# Round215 London NHLE Heritage Tail",
            "",
            "This worker harvested additional official Historic England NHLE listed-building designation records for London.",
            "",
            f"- Accessed: {ACCESS_DATE}",
            f"- Date window: {DATE_START} through {DATE_END}",
            f"- Source rows fetched in London bounding box: {summary['source_rows_fetched']}",
            f"- Candidate count: {summary['candidate_count']}",
            f"- Date range: {summary['date_range']['start']} to {summary['date_range']['end']}",
            f"- Headroom after cap: {summary['headroom_after_cap']}",
            f"- Existing corpus events scanned: {summary['duplicate_screening']['corpus_events_scanned']}",
            f"- Prior candidate pack JSON files scanned: {summary['duplicate_screening']['prior_candidate_pack_files_scanned']}",
            "",
            "Record-type mix:",
            "",
            *[f"- {key}: {value}" for key, value in summary["record_type_mix"].items()],
            "",
            "Caveat: NHLE ListDate is an administrative heritage/listing date. It is not a construction, demolition, repair, opening, occupation, condition, outcome, prediction, simulation, or causation claim.",
            "",
        ]
    )


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    existing = scan_existing()
    london_geometry = london_region_geometry()
    result = fetch_nhle_candidates(existing, london_geometry)
    candidates = result["candidates"]
    dates = [candidate["date"] for candidate in candidates]
    record_type_mix = {}
    grade_mix = {}
    for candidate in candidates:
        record_type_mix[candidate["record_type"]] = record_type_mix.get(candidate["record_type"], 0) + 1
        grade = one_line(candidate["source_row"].get("Grade") or "not supplied")
        grade_mix[grade] = grade_mix.get(grade, 0) + 1

    summary = {
        "generated_at": f"{ACCESS_DATE}T00:00:00Z",
        "worker_scope": "round215 London Historic England/NHLE heritage-designation tail",
        "date_window": {"start": DATE_START, "end": DATE_END},
        "source_rows_fetched": result["features_fetched"],
        "candidate_count": len(candidates),
        "target_candidates": TARGET_CANDIDATES,
        "eligible_after_duplicate_screen": result["eligible_after_duplicate_screen"],
        "headroom_after_cap": result["headroom_after_cap"],
        "date_range": {"start": min(dates) if dates else None, "end": max(dates) if dates else None},
        "record_type_mix": record_type_mix,
        "grade_mix": grade_mix,
        "rejected_reason_counts": result["reason_counts"],
        "duplicate_screening": {
            "corpus_events_scanned": existing["corpus_event_count"],
            "prior_candidate_pack_files_scanned": existing["scanned_candidate_files"],
            "existing_event_ids_seen": len(existing["existing_ids"]),
            "existing_source_keys_seen": len(existing["existing_source_keys"]),
            "existing_nhle_listentry_listdate_keys_seen": len(existing["existing_nhle_listdate_keys"]),
            "screening_note": (
                "Scanned the manual architecture corpus and candidate-like tmp/subagents JSON packs, including "
                "prior London NHLE/heritage/certificate outputs, for event IDs, source keys, and exact "
                "ListEntry + ListDate pairs. Raw query captures were intentionally excluded from duplicate "
                "screening because they are not prior accepted candidate packs."
            ),
        },
        "critical_interpretation_note": (
            "These records are administrative heritage/listing designations only. They are not evidence of "
            "physical construction, completion, demolition, opening, occupation, repair, condition, impact, "
            "prediction, simulation, or causation."
        ),
        "candidate_ids": [candidate["candidate_id"] for candidate in candidates],
    }

    pack = {
        "metadata": {
            "schema_version": "round215_london_nhle_heritage_tail_candidates_v1",
            "generated_at": f"{ACCESS_DATE}T00:00:00Z",
            "city_id": "london",
            "source_id": SOURCE_ID,
            "date_window": {"start": DATE_START, "end": DATE_END},
            "candidate_count": len(candidates),
            "critical_interpretation_note": summary["critical_interpretation_note"],
            "duplicate_screening": summary["duplicate_screening"],
        },
        "candidates": candidates,
    }

    rejected_pack = {
        "generated_at": f"{ACCESS_DATE}T00:00:00Z",
        "reason_counts": result["reason_counts"],
        "records": result["rejected_records"],
        "record_limit_note": "Detailed rejected records are capped at 500 examples; reason_counts contains full counts.",
    }

    write_json(CANDIDATES_PATH, pack)
    write_json(SOURCE_AUDIT_PATH, source_audit(summary))
    write_json(SUMMARY_PATH, summary)
    write_json(REJECTED_PATH, rejected_pack)
    NOTES_PATH.write_text(notes_md(summary), encoding="utf-8")
    print(json.dumps(summary, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
