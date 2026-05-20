import io
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path


ACCESS_DATE = "2026-05-19"
DATE_START = "2008-01-01"
DATE_END = ACCESS_DATE
OUT_DIR = Path("tmp/subagents/round130_heritage_designations_more")
OUT_PATH = OUT_DIR / "candidates.json"
AUDIT_PATH = OUT_DIR / "source_audit.json"

LONDON_BBOX = "-0.5103,51.2868,0.334,51.6919"
ONS_LONDON_REGION_URL = (
    "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/"
    "Regions_December_2024_Boundaries_EN_BFC/FeatureServer/0"
)
NHLE_LAYER_URL = (
    "https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/"
    "National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer/0"
)
CONSERVATION_AREAS_URL = (
    "https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/"
    "Conservation_Areas/FeatureServer/0"
)
NYC_LPC_NCRE_API = "https://data.cityofnewyork.us/resource/ncre-qhxs.json"
NYC_LPC_HISTORIC_DISTRICTS_API = "https://data.cityofnewyork.us/resource/skyk-mpzq.json"
DFC_CHANGES_PAGE = (
    "https://www.communities-ni.gov.uk/publications/"
    "changes-list-buildings-special-architectural-or-historic-interest"
)
DFC_CHANGES_PDF = (
    "https://www.communities-ni.gov.uk/sites/default/files/2026-04/"
    "dfc-hed-new-listings.pdf"
)


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


def slug(value, max_len=96):
    result = re.sub(r"[^a-z0-9]+", "-", one_line(value).lower()).strip("-")
    return (result[:max_len].strip("-") or "record")


def date_compact(value):
    return value.replace("-", "")


def get_json(url, params=None):
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    request = urllib.request.Request(url, headers={"User-Agent": "Bims-5 round130 provenance fetcher"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def get_bytes(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Bims-5 round130 provenance fetcher"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


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


def socrata_rows(api_url, params, page_size=50000):
    rows = []
    offset = 0
    while True:
        page_params = dict(params)
        page_params["$limit"] = page_size
        page_params["$offset"] = offset
        batch = get_json(api_url, page_params)
        if not isinstance(batch, list):
            raise RuntimeError(f"Socrata API returned non-list payload for {api_url}: {str(batch)[:200]}")
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return rows


def iso_from_millis(value):
    if value in (None, ""):
        return ""
    # ArcGIS date values are UTC milliseconds. Build from the epoch with timedelta so
    # pre-1970 list dates work on Windows too.
    import datetime as _dt

    return (_dt.datetime(1970, 1, 1) + _dt.timedelta(milliseconds=int(value))).strftime("%Y-%m-%d")


def normalize_lp(value):
    match = re.search(r"LP-0*(\d+)", clean_text(value), re.I)
    if not match:
        return ""
    return f"LP-{int(match.group(1)):05d}"


def normalize_hb_ref(value):
    return re.sub(r"\s+", " ", clean_text(value).strip()).upper()


def scan_existing():
    roots = [
        Path("tmp/subagents"),
        Path("web/data/city-atlas/cities/london"),
        Path("web/data/city-atlas/cities/nyc"),
        Path("web/data/city-atlas/cities/belfast"),
        Path("data/manual_drops"),
        Path("config"),
    ]
    current_out_dir = OUT_DIR.resolve()
    existing_nhle_amend_keys = set()
    existing_lp_numbers = set()
    existing_hb_refs = set()
    files_scanned = 0

    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*.json"):
            try:
                if current_out_dir in path.resolve().parents:
                    continue
                if path.stat().st_size > 50_000_000:
                    continue
                text = path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            files_scanned += 1
            for match in re.finditer(r"nhle-amend-(\d+)-(\d{8})", text, re.I):
                compact = match.group(2)
                existing_nhle_amend_keys.add(
                    f"{match.group(1)}|{compact[:4]}-{compact[4:6]}-{compact[6:8]}"
                )
            for match in re.finditer(
                r"(?:NHLE ListEntry\s*)?(\d{6,8}).{0,140}?AmendDate[:\s]*(\d{4}-\d{2}-\d{2})",
                text,
                re.I | re.S,
            ):
                existing_nhle_amend_keys.add(f"{match.group(1)}|{match.group(2)}")
            for match in re.finditer(r"LP-0*\d{4,5}", text, re.I):
                lp = normalize_lp(match.group(0))
                if lp:
                    existing_lp_numbers.add(lp)
            for match in re.finditer(r"HB\d{2}/\d{2}/\d{3}(?:\s?[A-Z])?", text, re.I):
                existing_hb_refs.add(normalize_hb_ref(match.group(0)))

    return {
        "files_scanned": files_scanned,
        "nhle_amend_keys": existing_nhle_amend_keys,
        "lp_numbers": existing_lp_numbers,
        "hb_refs": existing_hb_refs,
    }


def first_point(geometry):
    if not geometry:
        return None
    coords = geometry.get("coordinates")
    if geometry.get("type") == "Point":
        return coords
    if geometry.get("type") == "MultiPoint" and coords:
        return coords[0]
    return None


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


def representative_point(geometry):
    points = [point for point in iter_points(geometry) if len(point) >= 2]
    if not points:
        return None
    return [
        sum(point[0] for point in points) / len(points),
        sum(point[1] for point in points) / len(points),
    ]


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


def fetch_london_nhle_amendment_candidates(existing, london_geometry):
    features = arcgis_features(
        NHLE_LAYER_URL,
        {
            "where": (
                "AmendDate >= timestamp '2008-01-01 00:00:00' "
                "AND AmendDate <= timestamp '2026-05-19 23:59:59'"
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
    rejected = []
    for feature in features:
        properties = feature.get("properties") or {}
        point = first_point(feature.get("geometry"))
        if not point or not point_in_polygon(point, london_geometry):
            continue
        list_entry = str(properties.get("ListEntry") or "").strip()
        amend_date = iso_from_millis(properties.get("AmendDate"))
        if not list_entry or not amend_date:
            rejected.append({"source_record_id": list_entry, "reason": "Missing ListEntry or AmendDate."})
            continue
        key = f"{list_entry}|{amend_date}"
        if key in existing["nhle_amend_keys"]:
            rejected.append({"source_record_id": key, "reason": "NHLE amendment key already seen in repo scan."})
            continue

        name = one_line(properties.get("Name") or f"NHLE ListEntry {list_entry}")
        grade = one_line(properties.get("Grade") or "not supplied")
        source_url = one_line(properties.get("hyperlink")) or (
            f"https://historicengland.org.uk/listing/the-list/list-entry/{list_entry}"
        )
        candidate_id = f"london-nhle-amend-{list_entry}-{date_compact(amend_date)}"
        candidates.append(
            {
                "city_id": "london",
                "candidate_id": candidate_id,
                "event_id": candidate_id,
                "title": f"{name} NHLE list-entry record amended",
                "summary": (
                    "Historic England's National Heritage List for England records an AmendDate of "
                    f"{amend_date} for {name} (ListEntry {list_entry}, Grade {grade}). "
                    "This is a heritage-administrative list-entry amendment, not a construction, "
                    "opening, occupation, repair, condition, or outcome claim."
                ),
                "observed_change": (
                    "Official NHLE administrative milestone: the list-entry row carries the cited "
                    "AmendDate. The source does not by itself state a physical change on that date."
                ),
                "effective_date": amend_date,
                "effective_date_range": None,
                "date": amend_date,
                "date_precision": "day",
                "source_date_field": "AmendDate",
                "bucket": "planning/development/architecture/heritage_administrative_change",
                "project_type": "NHLE list-entry amendment",
                "geometry": {"type": "Point", "coordinates": [float(point[0]), float(point[1])]},
                "latitude": float(point[1]),
                "longitude": float(point[0]),
                "source_ids": ["historic-england-nhle-amendments-open-data"],
                "source_name": "National Heritage List for England (NHLE) listed building points",
                "publisher": "Historic England",
                "source_url": source_url,
                "source_record_id": f"NHLE ListEntry {list_entry}; AmendDate {amend_date}; OBJECTID {properties.get('OBJECTID')}",
                "source_type": "official Historic England ArcGIS FeatureServer row",
                "accessed_at": ACCESS_DATE,
                "confidence": "documented",
                "license": (
                    "Open Government Licence v3.0 with Historic England Open Data Hub terms; "
                    "spatial data includes Ordnance Survey Crown copyright/database right attribution."
                ),
                "license_url": "https://historicengland.org.uk/terms/website-terms-conditions/open-data-hub/",
                "attribution": (
                    "Historic England; Contains Ordnance Survey data Crown copyright and database right 2026."
                ),
                "geometry_source": (
                    "NHLE listed-building point geometry from Historic England Open Data Hub, filtered "
                    "inside ONS London region E12000007."
                ),
                "geometry_precision": (
                    "Official NHLE point for locating the asset; it does not define full statutory extent, "
                    "curtilage, or work area."
                ),
                "limitations": (
                    "NHLE AmendDate documents a list-entry administrative amendment only. It is not evidence "
                    "of construction, demolition, restoration, occupation, public access, condition change, "
                    "heritage benefit, or causation."
                ),
                "source_row": {
                    "OBJECTID": properties.get("OBJECTID"),
                    "ListEntry": properties.get("ListEntry"),
                    "Name": properties.get("Name"),
                    "Grade": properties.get("Grade"),
                    "ListDate": iso_from_millis(properties.get("ListDate")),
                    "AmendDate": amend_date,
                    "NGR": properties.get("NGR"),
                    "Easting": properties.get("Easting"),
                    "Northing": properties.get("Northing"),
                    "CaptureScale": properties.get("CaptureScale"),
                },
            }
        )

    candidates.sort(key=lambda row: (row["effective_date"], row["source_record_id"]))
    return candidates, rejected, len(features)


def fetch_nyc_lpc_candidates(existing):
    rows = socrata_rows(
        NYC_LPC_NCRE_API,
        {
            "$select": (
                "the_geom,bin_number,bbl,boroughid,block,lot,lp_number,lm_name,pluto_addr,"
                "desig_addr,lm_type,hist_distr,most_curre,status,last_actio,desdate,caldate,public_hea"
            ),
            "$where": "desdate between '2008-01-01T00:00:00' and '2026-05-19T23:59:59'",
        },
    )

    by_lp = {}
    row_counts = {}
    rejected = []
    for row in rows:
        lp = normalize_lp(row.get("lp_number"))
        if not lp:
            rejected.append({"source_record_id": row.get("lp_number", ""), "reason": "Missing LP number."})
            continue
        if lp in existing["lp_numbers"]:
            rejected.append({"source_record_id": lp, "reason": "LP number already seen in repo scan."})
            continue
        if one_line(row.get("status")).upper() != "DESIGNATED" or one_line(row.get("most_curre")) != "1":
            rejected.append({"source_record_id": lp, "reason": "Not a current designated row."})
            continue
        if not row.get("the_geom"):
            rejected.append({"source_record_id": lp, "reason": "Missing geometry."})
            continue
        row_counts[lp] = row_counts.get(lp, 0) + 1
        by_lp.setdefault(lp, row)

    candidates = []
    for lp, row in sorted(by_lp.items()):
        date = one_line(row.get("desdate"))[:10]
        if not (DATE_START <= date <= DATE_END):
            continue
        point = first_point(row.get("the_geom")) or representative_point(row.get("the_geom"))
        if not point:
            rejected.append({"source_record_id": lp, "reason": "Could not derive a representative point."})
            continue
        name = one_line(row.get("lm_name") or f"LPC {lp}")
        lm_type = one_line(row.get("lm_type") or "landmark")
        address = one_line(row.get("desig_addr") or row.get("pluto_addr") or row.get("boroughid") or "NYC")
        candidate_id = f"nyc-lpc-designation-{lp.lower()}-{date_compact(date)}"
        candidates.append(
            {
                "city_id": "nyc",
                "candidate_id": candidate_id,
                "event_id": candidate_id,
                "title": f"{name} was designated by NYC LPC",
                "summary": (
                    "NYC Landmarks Preservation Commission Open Data records "
                    f"{name} ({lp}) at {address} as designated on {date}. "
                    "This is an administrative heritage/protective status designation, not a physical change."
                ),
                "observed_change": (
                    "Official LPC row documents a designation action for the named landmark/site."
                ),
                "effective_date": date,
                "effective_date_range": None,
                "date": date,
                "date_precision": "day",
                "source_date_field": "DESDATE",
                "bucket": "planning/development/architecture/landmarks_preservation",
                "project_type": f"NYC LPC {lm_type} designation",
                "geometry": {"type": "Point", "coordinates": [float(point[0]), float(point[1])]},
                "latitude": float(point[1]),
                "longitude": float(point[0]),
                "source_ids": ["nyc-lpc-designated-calendared-buildings-sites-ncre-qhxs"],
                "source_name": "NYC Open Data: Designated and Calendared Buildings and Sites",
                "publisher": "NYC Landmarks Preservation Commission / NYC Open Data",
                "source_url": f"{NYC_LPC_NCRE_API}?lp_number={urllib.parse.quote(row.get('lp_number', lp))}",
                "source_record_id": lp,
                "source_type": "official NYC Open Data Socrata API row",
                "accessed_at": ACCESS_DATE,
                "confidence": "documented",
                "license": (
                    "NYC Open Data / NYC.gov terms; dataset-specific metadata license field is null. "
                    "Attribute NYC Landmarks Preservation Commission and NYC Open Data."
                ),
                "license_url": "https://opendata.cityofnewyork.us/open-data-law/",
                "attribution": "NYC Landmarks Preservation Commission / NYC Open Data",
                "geometry_source": (
                    f"Official NYC Open Data point geometry from ncre-qhxs for {lp}; "
                    f"{row_counts.get(lp, 1)} source row(s) with this LP number were observed in this fetch."
                ),
                "geometry_precision": (
                    "Representative official row point for atlas navigation; not a surveyed landmark boundary, "
                    "interior extent, or work area."
                ),
                "limitations": (
                    "Designation rows document legal/protective status only. They do not document construction, "
                    "restoration, permit activity, current occupancy, physical condition change, owner action, "
                    "preservation outcome, or causal effect."
                ),
                "source_row": {
                    "lp_number": row.get("lp_number"),
                    "lm_name": row.get("lm_name"),
                    "desig_addr": row.get("desig_addr"),
                    "pluto_addr": row.get("pluto_addr"),
                    "boroughid": row.get("boroughid"),
                    "lm_type": row.get("lm_type"),
                    "status": row.get("status"),
                    "last_actio": row.get("last_actio"),
                    "most_curre": row.get("most_curre"),
                    "desdate": row.get("desdate"),
                    "caldate": row.get("caldate"),
                    "public_hea": row.get("public_hea"),
                    "row_count_for_lp": row_counts.get(lp, 1),
                },
            }
        )

    candidates.sort(key=lambda row: (row["effective_date"], row["source_record_id"]))
    return candidates, rejected, len(rows)


def fetch_nyc_historic_district_audit(existing):
    rows = socrata_rows(
        NYC_LPC_HISTORIC_DISTRICTS_API,
        {
            "$select": "borough,lp_number,current_,area_name,extension,status_of_,last_actio,desdate,caldate",
            "$where": "desdate between '2008-01-01T00:00:00' and '2026-05-19T23:59:59'",
        },
    )
    usable = []
    duplicates = []
    for row in rows:
        lp = normalize_lp(row.get("lp_number"))
        if (
            lp
            and one_line(row.get("current_")).lower() == "yes"
            and one_line(row.get("status_of_")).upper() == "DESIGNATED"
        ):
            if lp in existing["lp_numbers"]:
                duplicates.append(lp)
            else:
                usable.append(lp)
    return {"rows_reviewed": len(rows), "usable_not_emitted": len(set(usable)), "duplicate_lp_numbers": len(set(duplicates))}


def fetch_london_conservation_area_audit():
    london_lpas = {
        "Barking and Dagenham",
        "Barnet",
        "Bexley",
        "Brent",
        "Bromley",
        "Camden",
        "City of London",
        "Croydon",
        "Ealing",
        "Enfield",
        "Greenwich",
        "Hackney",
        "Hammersmith and Fulham",
        "Haringey",
        "Harrow",
        "Havering",
        "Hillingdon",
        "Hounslow",
        "Islington",
        "Kensington and Chelsea",
        "Kingston upon Thames",
        "Lambeth",
        "Lewisham",
        "Merton",
        "Newham",
        "Redbridge",
        "Richmond upon Thames",
        "Southwark",
        "Sutton",
        "Tower Hamlets",
        "Waltham Forest",
        "Wandsworth",
        "Westminster",
    }
    features = arcgis_features(
        CONSERVATION_AREAS_URL,
        {
            "where": "1=1",
            "outFields": "UID,NAME,DATE_OF_DE,DATE_UPDAT,LPA,CAPTURE_SC,x,y",
            "returnGeometry": "false",
            "f": "json",
        },
    )

    def parse_date(text):
        text = one_line(text)
        match = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", text)
        if match:
            return f"{match.group(3)}-{match.group(2).zfill(2)}-{match.group(1).zfill(2)}"
        match = re.match(r"^(\d{4})$", text)
        if match:
            return f"{match.group(1)}-01-01"
        return ""

    recent_london = 0
    for feature in features:
        attrs = feature.get("attributes") or feature.get("properties") or {}
        date = parse_date(attrs.get("DATE_OF_DE"))
        if attrs.get("LPA") in london_lpas and DATE_START <= date <= DATE_END:
            recent_london += 1
    return {"rows_reviewed": len(features), "recent_london_designation_rows": recent_london}


def extract_dfc_belfast_rows(existing):
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        return [], [{"source": DFC_CHANGES_PDF, "reason": f"pypdf unavailable: {exc}"}], ""

    pdf_bytes = get_bytes(DFC_CHANGES_PDF)
    reader = PdfReader(io.BytesIO(pdf_bytes))
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    text = clean_text(text)
    matches = list(re.finditer(r"(?m)^ ?(HB\d{2}/\d{2}/\d{3}(?:\s?[A-Z])?)\s+", text))
    candidates = []
    rejected = []

    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        block = text[start:end]
        lines = [one_line(line) for line in block.splitlines() if one_line(line)]
        if not lines:
            continue
        hb_ref = normalize_hb_ref(match.group(1))
        if not hb_ref.startswith("HB26/"):
            if any(re.search(r"\bBelfast\b", line, re.I) for line in lines):
                rejected.append(
                    {
                        "source_record_id": hb_ref,
                        "reason": "Address text contains Belfast but HB area reference is outside Belfast city scope.",
                    }
                )
            continue
        if not any(re.search(r"\bBelfast\b", line, re.I) for line in lines):
            rejected.append({"source_record_id": hb_ref, "reason": "HB26 row did not contain Belfast address text."})
            continue
        if hb_ref in existing["hb_refs"]:
            rejected.append({"source_record_id": hb_ref, "reason": "HB reference already seen in repo scan."})
            continue

        first_line = lines[0]
        first_match = re.match(
            r"^(HB\d{2}/\d{2}/\d{3}(?:\s?[A-Z])?)\s+(.+?)\s+(Record Only|New Listing|De-Listing|Delisting)\b\s*(.*)$",
            first_line,
            re.I,
        )
        if first_match:
            title_name = one_line(first_match.group(2))
            update_type = one_line(first_match.group(3))
            current_use = one_line(first_match.group(4)) or "not supplied"
        else:
            title_name = hb_ref
            update_type = "Record Only"
            current_use = "not supplied"
        address_lines = [line for line in lines[1:] if not re.match(r"^HB\d{2}/", line)]
        address = one_line(", ".join(address_lines)) or "Belfast"
        candidate_id = f"belfast-dfc-hed-{slug(update_type, 32)}-{slug(hb_ref, 32)}-202603"
        candidates.append(
            {
                "city_id": "belfast",
                "candidate_id": candidate_id,
                "event_id": candidate_id,
                "title": f"DfC HED recorded {update_type} list update for {title_name}",
                "summary": (
                    "The Department for Communities Historic Environment Division changes publication records "
                    f"{hb_ref}, {title_name}, as a {update_type} row in the March 2026 additions to the List "
                    "of Buildings of special architectural or historic interest. This is a heritage-record/list "
                    "administrative update, not a physical works claim."
                ),
                "observed_change": (
                    f"Official DfC HED changes publication row: {hb_ref} is recorded as {update_type} "
                    "in the March 2026 additions table."
                ),
                "effective_date": None,
                "effective_date_range": {"start": "2026-03-01", "end": "2026-03-31"},
                "date": "2026-03",
                "date_precision": "month",
                "source_date_field": "PDF heading 'March 2026 Additions to the list'",
                "bucket": "planning/development/architecture/heritage_administrative_change",
                "project_type": f"DfC HED {update_type.lower()} heritage record update",
                "geometry": None,
                "geometry_ref": {
                    "type": "official_source_address",
                    "label": address,
                    "source_field": "Address text in DfC HED changes PDF",
                    "precision": (
                        "Official address/location text only; no point geometry is exposed in the PDF row. "
                        "Do not map as a precise building coordinate without a separate official spatial match."
                    ),
                },
                "source_ids": ["dfc-hed-changes-to-list-buildings-2026-03"],
                "source_name": "Changes to the List of Buildings of special architectural or historic interest",
                "publisher": "Department for Communities Historic Environment Division",
                "source_url": DFC_CHANGES_PDF,
                "source_page_url": DFC_CHANGES_PAGE,
                "source_record_id": f"{hb_ref}; March 2026 {update_type} row",
                "source_type": "official Department for Communities publication PDF",
                "accessed_at": ACCESS_DATE,
                "confidence": "documented",
                "license": (
                    "Crown copyright / Department for Communities website terms; preserve attribution and "
                    "re-check terms before redistributing full PDF content."
                ),
                "license_url": "https://www.communities-ni.gov.uk/crown-copyright",
                "attribution": "Department for Communities Historic Environment Division",
                "geometry_source": "Official PDF address text only.",
                "geometry_precision": "geometry_ref only; not geocoded.",
                "limitations": (
                    "The March 2026 PDF row is an administrative heritage-record/list update. A 'Record Only' "
                    "row must not be presented as a confirmed statutory listing, construction, restoration, "
                    "occupation, condition change, public access, heritage outcome, or causal evidence."
                ),
                "source_row": {
                    "HB_ref": hb_ref,
                    "name": title_name,
                    "update_type": update_type,
                    "current_use": current_use,
                    "address": address,
                    "pdf_heading": "March 2026 Additions to the list",
                },
            }
        )

    candidates.sort(key=lambda row: row["source_record_id"])
    return candidates, rejected, text.splitlines()[0].strip() if text else ""


def build_source_audits(london_nhle_count, london_nhle_rejected, london_conservation_audit, nyc_count, nyc_rejected, nyc_hd_audit, belfast_rejected):
    return [
        {
            "source_id": "historic-england-nhle-amendments-open-data",
            "source_name": "National Heritage List for England (NHLE) listed building points",
            "publisher": "Historic England",
            "url": "https://www.api.gov.uk/he/national-heritage-list-for-england-nhle/",
            "api_endpoint": NHLE_LAYER_URL,
            "license": "Open Government Licence v3.0 with Historic England Open Data Hub terms and OS attribution",
            "license_url": "https://historicengland.org.uk/terms/website-terms-conditions/open-data-hub/",
            "coverage_years_checked": f"{DATE_START} through {DATE_END}",
            "update_frequency": "Historic England API catalogue states NHLE data is updated daily.",
            "geographic_scope": "England; candidates filtered to points inside ONS London region E12000007.",
            "granularity": "NHLE listed-building point row with ListEntry and AmendDate.",
            "key_fields": ["ListEntry", "Name", "Grade", "AmendDate", "hyperlink", "NGR", "geometry"],
            "reliability": "strong for administrative list-entry amendment dates",
            "records_reviewed": london_nhle_count,
            "rejected_as_duplicates_or_invalid": len(london_nhle_rejected),
            "required_caveats": [
                "AmendDate is a list-entry administrative amendment date, not a physical works date.",
                "NHLE point geometry locates the asset but does not define full statutory extent or curtilage.",
            ],
            "ingestion_recommendation": "Use as heritage-administrative change events with source-row caveats.",
        },
        {
            "source_id": "historic-england-conservation-areas",
            "source_name": "Conservation Areas in England",
            "publisher": "Historic England",
            "url": "https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/Conservation_Areas/FeatureServer",
            "license": "Open Government Licence v3.0 with Historic England Open Data Hub terms and OS attribution",
            "coverage_years_checked": f"{DATE_START} through {DATE_END}",
            "geographic_scope": "England; audit filtered rows by London local planning authority names.",
            "granularity": "Conservation-area polygon row with DATE_OF_DE designation date.",
            "key_fields": ["UID", "NAME", "DATE_OF_DE", "DATE_UPDAT", "LPA", "geometry"],
            "reliability": "usable with caveats",
            "records_reviewed": london_conservation_audit["rows_reviewed"],
            "recent_london_designation_rows": london_conservation_audit["recent_london_designation_rows"],
            "emitted_candidates": 0,
            "required_caveats": [
                "Conservation area designation is a planning/protection status, not construction or condition evidence.",
                "The repo already contains London conservation-area events from the Planning Data family, so this pass did not emit duplicate conservation-area candidates.",
            ],
            "ingestion_recommendation": "Use only after name/date/LPA duplicate reconciliation against existing Planning Data conservation-area rows.",
        },
        {
            "source_id": "nyc-lpc-designated-calendared-buildings-sites-ncre-qhxs",
            "source_name": "NYC Open Data: Designated and Calendared Buildings and Sites",
            "publisher": "NYC Landmarks Preservation Commission / NYC Open Data",
            "url": "https://data.cityofnewyork.us/d/ncre-qhxs",
            "api_endpoint": NYC_LPC_NCRE_API,
            "license": "NYC Open Data / NYC.gov terms; dataset-specific metadata license field is null",
            "license_url": "https://opendata.cityofnewyork.us/open-data-law/",
            "coverage_years_checked": f"{DATE_START} through {DATE_END}",
            "update_frequency": "NYC Open Data metadata says this dataset is updated as needed.",
            "geographic_scope": "New York City landmarks and sites.",
            "granularity": "LPC building/site point row, grouped to LP number for candidate events.",
            "key_fields": ["lp_number", "lm_name", "lm_type", "status", "most_curre", "desdate", "the_geom"],
            "reliability": "strong for LPC designation status when status/most_current/desdate are present",
            "records_reviewed": nyc_count,
            "rejected_as_duplicates_or_invalid": len(nyc_rejected),
            "required_caveats": [
                "Designation is legal/protective status, not construction, restoration, occupancy, or condition evidence.",
                "Point geometry is a representative row point; interiors and complex sites are not mapped as full extents.",
            ],
            "ingestion_recommendation": "Use as documented LPC designation events after LP-number duplicate review.",
        },
        {
            "source_id": "nyc-lpc-historic-districts-skyk-mpzq",
            "source_name": "NYC Open Data: Historic Districts",
            "publisher": "NYC Landmarks Preservation Commission / NYC Open Data",
            "url": "https://data.cityofnewyork.us/d/skyk-mpzq",
            "api_endpoint": NYC_LPC_HISTORIC_DISTRICTS_API,
            "license": "NYC Open Data / NYC.gov terms; dataset-specific metadata applies",
            "coverage_years_checked": f"{DATE_START} through {DATE_END}",
            "geographic_scope": "New York City historic-district polygons.",
            "granularity": "Historic district polygon with LP number and designation date.",
            "key_fields": ["lp_number", "area_name", "current_", "status_of_", "desdate", "the_geom"],
            "reliability": "strong for district designation rows with current/status/designation fields",
            "records_reviewed": nyc_hd_audit["rows_reviewed"],
            "usable_not_emitted": nyc_hd_audit["usable_not_emitted"],
            "duplicate_lp_numbers": nyc_hd_audit["duplicate_lp_numbers"],
            "required_caveats": [
                "Historic-district rows document administrative preservation status, not physical works or outcomes.",
                "All current 2008-2026 LP numbers found here were already represented by existing corpus/candidate records in this scan.",
            ],
            "ingestion_recommendation": "No new round130 candidates emitted; use as a cross-check for district LP duplicates.",
        },
        {
            "source_id": "dfc-hed-changes-to-list-buildings-2026-03",
            "source_name": "Changes to the List of Buildings of special architectural or historic interest",
            "publisher": "Department for Communities Historic Environment Division",
            "url": DFC_CHANGES_PAGE,
            "download_url": DFC_CHANGES_PDF,
            "license": "Crown copyright / Department for Communities website terms; re-check before redistributing full PDF content",
            "license_url": "https://www.communities-ni.gov.uk/crown-copyright",
            "coverage_years_checked": "March 2026 publication; Belfast rows extracted from current PDF accessed on 2026-05-19.",
            "update_frequency": "Publication page is updated as recent list changes are published.",
            "geographic_scope": "Northern Ireland; candidates filtered to rows whose address block contains Belfast.",
            "granularity": "PDF table row with HB reference, update type, address/location text, and month heading.",
            "key_fields": ["HB Ref No", "Address", "Survey 2", "Current Use", "PDF month heading"],
            "reliability": "usable with caveats",
            "rejected_as_duplicates_or_invalid": len(belfast_rejected),
            "required_caveats": [
                "A Record Only row must not be presented as confirmed statutory listing status.",
                "The PDF row gives address text but no point geometry; candidates retain geometry_ref only.",
            ],
            "ingestion_recommendation": "Use as Belfast heritage-record administrative updates with month precision and no point geometry unless separately matched to an official spatial record.",
        },
    ]


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    existing = scan_existing()
    london_geometry = london_region_geometry()
    london_candidates, london_rejected, london_reviewed = fetch_london_nhle_amendment_candidates(existing, london_geometry)
    london_conservation_audit = fetch_london_conservation_area_audit()
    nyc_candidates, nyc_rejected, nyc_reviewed = fetch_nyc_lpc_candidates(existing)
    nyc_hd_audit = fetch_nyc_historic_district_audit(existing)
    belfast_candidates, belfast_rejected, belfast_pdf_heading = extract_dfc_belfast_rows(existing)

    candidates = london_candidates + nyc_candidates + belfast_candidates
    candidates.sort(key=lambda row: (row["city_id"], row.get("effective_date") or row.get("date") or "", row["candidate_id"]))
    source_audits = build_source_audits(
        london_reviewed,
        london_rejected,
        london_conservation_audit,
        nyc_reviewed,
        nyc_rejected,
        nyc_hd_audit,
        belfast_rejected,
    )

    metadata = {
        "schema_version": "round130_heritage_designations_more_candidates_v1",
        "generated_at": ACCESS_DATE,
        "task": "Cross-city official preservation/heritage/designation datasets for London, NYC, and Belfast, 2008-2026.",
        "date_window": {"start": DATE_START, "end": DATE_END},
        "candidate_count": len(candidates),
        "candidate_counts_by_city": {
            "london": len(london_candidates),
            "nyc": len(nyc_candidates),
            "belfast": len(belfast_candidates),
        },
        "duplicate_screening": {
            "files_scanned": existing["files_scanned"],
            "existing_nhle_amendment_keys_seen": len(existing["nhle_amend_keys"]),
            "existing_lpc_lp_numbers_seen": len(existing["lp_numbers"]),
            "existing_belfast_hb_refs_seen": len(existing["hb_refs"]),
            "screening_note": (
                "Scanned existing tmp/subagents, city-atlas event files, manual drops, and config JSON. "
                "Round130 output directory is excluded so reruns remain stable."
            ),
        },
        "critical_interpretation_note": (
            "These candidates are heritage/listing/designation administrative records. They are not evidence of "
            "construction completion, demolition, opening, occupation, repair, condition improvement, public use, "
            "impact, prediction, simulation, or causation."
        ),
        "belfast_pdf_heading": belfast_pdf_heading,
    }
    output = {"metadata": metadata, "source_audits": source_audits, "candidates": candidates}
    audit_output = {"metadata": metadata, "source_audits": source_audits}
    OUT_PATH.write_text(json.dumps(output, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    AUDIT_PATH.write_text(json.dumps(audit_output, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "candidate_count": len(candidates),
                "candidate_counts_by_city": metadata["candidate_counts_by_city"],
                "out_path": str(OUT_PATH),
                "audit_path": str(AUDIT_PATH),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"round130 heritage designation candidate fetch failed: {exc}", file=sys.stderr)
        raise
