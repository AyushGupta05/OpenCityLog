import json
import math
import re
import urllib.request
import zipfile
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET


ACCESSED_AT = "2026-05-19"
SOURCE_ID = "london-development-database-archive"
CORPUS_PATH = Path("data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json")
INPUT_DIR = Path("tmp/subagents/round124_london_ldd_archive_completions")
OUT_DIR = Path("tmp/subagents/round132_london_ldd_archive_next")
OUT_PATH = OUT_DIR / "candidates.json"
SOURCE_AUDIT_PATH = OUT_DIR / "source_audit.json"
NOTES_PATH = OUT_DIR / "notes.md"
CANDIDATE_LIMIT = 1000

DATASET_PAGE = "https://data.london.gov.uk/dataset/planning-permissions-on-the-london-development-database-ldd-2jxq0/"
PERMISSIONS_DOWNLOAD = "https://data.london.gov.uk/download/2jxq0/eb050c40-3e94-4384-8e59-1b8c49dbdf36/LDD%20Permissions%20for%20Datastore%20final.xlsx"
FLOORSPACE_DOWNLOAD = "https://data.london.gov.uk/download/2jxq0/be41e8e9-6005-4623-aa71-e8a160c89b81/LDD%20Permissions%20for%20Datastore%20-%20Non-residential%20floorspace%20final.xlsx"
BEDROOMS_DOWNLOAD = "https://data.london.gov.uk/download/2jxq0/b4faa4e6-2d91-4aba-8403-5b6c2739cec4/LDD%20Permissions%20for%20Datastore%20-%20Non-residential%20bedrooms%20final.xlsx"

PERMISSIONS_XLSX = INPUT_DIR / "LDD_Permissions_for_Datastore_final.xlsx"
FLOORSPACE_XLSX = INPUT_DIR / "LDD_Permissions_Non_residential_floorspace_final.xlsx"
BEDROOMS_XLSX = INPUT_DIR / "LDD_Permissions_Non_residential_bedrooms_final.xlsx"

LONDON_BNG = {
    "min_easting": 500000,
    "max_easting": 565000,
    "min_northing": 155000,
    "max_northing": 205000,
}

PUBLIC_CIVIC_RE = re.compile(
    r"\b("
    r"school|academy|college|university|campus|education|nursery|hospital|health|clinic|surgery|care home|"
    r"library|museum|gallery|theatre|cinema|arts?|cultural|community|leisure|sports?|stadium|pool|"
    r"church|mosque|synagogue|temple|police|fire station|court|civic|town hall|council|station|"
    r"transport|terminal|interchange|market|public realm|square|park|playground|open space|bridge|"
    r"hotel|hostel|laborator(?:y|ies)|research|medical|healthcare"
    r")\b",
    re.IGNORECASE,
)

ARCHITECTURE_RE = re.compile(
    r"\b("
    r"erection|redevelopment|development|new build|building|buildings|tower|storey|storeys|mixed use|mixed-use|"
    r"masterplan|regeneration|estate regeneration|refurbishment|extension|demolition|construction|"
    r"residential|homes|dwellings|affordable|office|commercial|retail|industrial|warehouse|workshop|"
    r"public realm|landscaping|basement|hotel|laboratory|campus|healthcare|student accommodation"
    r")\b",
    re.IGNORECASE,
)

MINOR_DOMESTIC_RE = re.compile(
    r"\b("
    r"single[- ]storey extension|two[- ]storey extension|rear extension|side extension|front extension|"
    r"roof extension|loft conversion|dormer|porch|conservatory|garage conversion|outbuilding|"
    r"single dwelling|dwellinghouse|private dwelling|householder|garden room|replacement windows|"
    r"satellite dish|dropped kerb|boundary wall|fence|fencing"
    r")\b",
    re.IGNORECASE,
)

ADMIN_MINOR_RE = re.compile(
    r"\b("
    r"details pursuant|approval of details|discharge of condition|condition \d+|reserved matters|"
    r"non[- ]material amendment|minor material amendment|variation of condition|section 73|s73|"
    r"advertisement consent|temporary permission|certificate of lawfulness|lawful development certificate|"
    r"listed building consent only|tree works|telecommunications cabinet|plant enclosure only"
    r")\b",
    re.IGNORECASE,
)


def clean_text(value, limit=None):
    if value is None:
        return ""
    text = (
        str(value)
        .replace("_x000D_", " ")
        .replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u00a0", " ")
    )
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\bdoes not prove\b", "is not evidence of", text, flags=re.IGNORECASE)
    text = re.sub(r"\bnot proof of\b", "not evidence of", text, flags=re.IGNORECASE)
    text = re.sub(r"\bproof\b", "evidence", text, flags=re.IGNORECASE)
    text = re.sub(r"\bcaused\b", "was associated with", text, flags=re.IGNORECASE)
    text = re.sub(r"\bcauses?\b", "is associated with", text, flags=re.IGNORECASE)
    text = re.sub(r"\bwill increase\b", "is described as intended to increase", text, flags=re.IGNORECASE)
    text = re.sub(r"\bwill decrease\b", "is described as intended to decrease", text, flags=re.IGNORECASE)
    if limit and len(text) > limit:
        return text[: limit - 1].rstrip() + "."
    return text


def slugify(value, limit=96):
    text = clean_text(value).lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return (text[:limit].rstrip("_") or "ldd_record")


def number(value):
    try:
        text = clean_text(value)
        if text == "":
            return 0.0
        return float(text)
    except (TypeError, ValueError):
        return 0.0


def as_int(value):
    return int(round(number(value)))


def as_date(value):
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    text = clean_text(value)
    if not text:
        return ""
    if re.fullmatch(r"\d+(?:\.\d+)?", text):
        # Excel's 1900 date system, matching the source workbook serials.
        serial = int(float(text))
        if 1 <= serial <= 70000:
            return (date(1899, 12, 30) + timedelta(days=serial)).isoformat()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(text[:10], fmt).date().isoformat()
        except ValueError:
            pass
    return ""


def authority_ref_key(authority, borough_ref):
    return (clean_text(authority).lower(), clean_text(borough_ref).lower())


def source_key(source_url, source_record_id):
    return (clean_text(source_url).lower(), clean_text(source_record_id).lower())


def ldd_title_token(title):
    text = clean_text(title).lower()
    text = re.sub(r"^ldd (?:administrative )?completion(?:-status)? record:\s*", "", text)
    text = re.sub(r"^ldd completion record:\s*", "", text)
    return text


def title_date_key(city_id, title, event_date):
    return (clean_text(city_id).lower(), ldd_title_token(title), clean_text(event_date))


def ensure_file(path, url):
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "Bims-5 provenance candidate generator"})
    with urllib.request.urlopen(request, timeout=300) as response, path.open("wb") as handle:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            handle.write(chunk)


def xlsx_column_index(cell_ref):
    letters = re.match(r"([A-Z]+)", str(cell_ref or ""))
    if not letters:
        return 0
    result = 0
    for char in letters.group(1):
        result = result * 26 + (ord(char) - ord("A") + 1)
    return result


def xlsx_shared_strings(archive):
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
    strings = []
    with archive.open("xl/sharedStrings.xml") as handle:
        for _, elem in ET.iterparse(handle, events=("end",)):
            if elem.tag == ns + "si":
                strings.append("".join(t.text or "" for t in elem.iter(ns + "t")))
                elem.clear()
    return strings


def worksheet_path_for(archive, sheet_name):
    main_ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    rel_ns = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    rel_targets = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels.findall("r:Relationship", rel_ns)}
    for sheet in workbook.findall("m:sheets/m:sheet", main_ns):
        if sheet.attrib.get("name") != sheet_name:
            continue
        rel_id = sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        target = rel_targets[rel_id]
        return "xl/" + target.lstrip("/")
    raise ValueError(f"Sheet {sheet_name!r} not found")


def iter_xlsx_dict_rows(path, sheet_name="LDD data", header_row=2, data_start_row=3):
    ns = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
    with zipfile.ZipFile(path) as archive:
        shared = xlsx_shared_strings(archive)
        worksheet = worksheet_path_for(archive, sheet_name)
        headers = None
        with archive.open(worksheet) as handle:
            for _, row in ET.iterparse(handle, events=("end",)):
                if row.tag != ns + "row":
                    continue
                excel_row = int(row.attrib.get("r", "0") or 0)
                if excel_row < header_row:
                    row.clear()
                    continue
                values = {}
                for cell in row.findall(ns + "c"):
                    idx = xlsx_column_index(cell.attrib.get("r", ""))
                    if not idx:
                        continue
                    value_node = cell.find(ns + "v")
                    value = value_node.text if value_node is not None else ""
                    cell_type = cell.attrib.get("t")
                    if cell_type == "s" and value != "":
                        value = shared[int(value)]
                    elif cell_type == "inlineStr":
                        value = "".join(t.text or "" for t in cell.iter(ns + "t"))
                    values[idx] = value or ""
                if excel_row == header_row:
                    max_idx = max(values.keys() or [0])
                    headers = [clean_text(values.get(i, "")) for i in range(1, max_idx + 1)]
                elif excel_row >= data_start_row and headers:
                    yield excel_row, {
                        headers[i - 1]: values.get(i, "")
                        for i in range(1, len(headers) + 1)
                        if headers[i - 1]
                    }
                row.clear()


def osgb36_to_wgs84(easting, northing):
    # Airy 1830 / British National Grid to WGS84 via Helmert transform.
    a = 6377563.396
    b = 6356256.909
    f0 = 0.9996012717
    lat0 = math.radians(49)
    lon0 = math.radians(-2)
    n0 = -100000
    e0 = 400000
    e2 = 1 - (b * b) / (a * a)
    n = (a - b) / (a + b)

    lat = lat0
    meridional_arc = 0
    while northing - n0 - meridional_arc >= 0.00001:
        lat = (northing - n0 - meridional_arc) / (a * f0) + lat
        ma = (1 + n + (5 / 4) * n**2 + (5 / 4) * n**3) * (lat - lat0)
        mb = (3 * n + 3 * n**2 + (21 / 8) * n**3) * math.sin(lat - lat0) * math.cos(lat + lat0)
        mc = ((15 / 8) * n**2 + (15 / 8) * n**3) * math.sin(2 * (lat - lat0)) * math.cos(2 * (lat + lat0))
        md = (35 / 24) * n**3 * math.sin(3 * (lat - lat0)) * math.cos(3 * (lat + lat0))
        meridional_arc = b * f0 * (ma - mb + mc - md)

    sin_lat = math.sin(lat)
    cos_lat = math.cos(lat)
    nu = a * f0 / math.sqrt(1 - e2 * sin_lat**2)
    rho = a * f0 * (1 - e2) / (1 - e2 * sin_lat**2) ** 1.5
    eta2 = nu / rho - 1
    tan_lat = math.tan(lat)
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

    h = 0
    sin_phi = math.sin(lat_osgb)
    cos_phi = math.cos(lat_osgb)
    sin_lam = math.sin(lon_osgb)
    cos_lam = math.cos(lon_osgb)
    nu = a / math.sqrt(1 - e2 * sin_phi**2)
    x1 = (nu + h) * cos_phi * cos_lam
    y1 = (nu + h) * cos_phi * sin_lam
    z1 = ((1 - e2) * nu + h) * sin_phi

    tx, ty, tz = 446.448, -125.157, 542.060
    s = 20.4894 * 1e-6
    rx = math.radians(0.1502 / 3600)
    ry = math.radians(0.2470 / 3600)
    rz = math.radians(0.8421 / 3600)
    x2 = tx + (1 + s) * x1 + (-rz) * y1 + ry * z1
    y2 = ty + rz * x1 + (1 + s) * y1 + (-rx) * z1
    z2 = tz + (-ry) * x1 + rx * y1 + (1 + s) * z1

    a2 = 6378137.000
    b2 = 6356752.3141
    e22 = 1 - (b2 * b2) / (a2 * a2)
    p = math.sqrt(x2 * x2 + y2 * y2)
    lat2 = math.atan2(z2, p * (1 - e22))
    while True:
        nu2 = a2 / math.sqrt(1 - e22 * math.sin(lat2) ** 2)
        next_lat = math.atan2(z2 + e22 * nu2 * math.sin(lat2), p)
        if abs(next_lat - lat2) < 1e-12:
            lat2 = next_lat
            break
        lat2 = next_lat
    lon2 = math.atan2(y2, x2)
    return round(math.degrees(lat2), 6), round(math.degrees(lon2), 6)


def existing_ldd_dedupe():
    doc = json.loads(CORPUS_PATH.read_text(encoding="utf-8-sig"))
    rows = set()
    refs = set()
    source_keys = set()
    title_dates = set()
    source_id_count = 0
    for event in doc.get("events", []):
        source_ids = event.get("source_ids") or [event.get("source_dataset_id")]
        if SOURCE_ID not in source_ids:
            title_dates.add(title_date_key(event.get("city_id"), event.get("title"), event.get("date")))
            continue
        source_id_count += 1
        record_id = clean_text(event.get("source_record_id"))
        row_match = re.search(r"workbook row (\d+)", record_id, re.IGNORECASE)
        if row_match:
            rows.add(int(row_match.group(1)))
        ref_match = re.search(r"planning_authority=([^;]+);\s*borough_reference=(.+)$", record_id, re.IGNORECASE)
        if ref_match:
            refs.add(authority_ref_key(ref_match.group(1), ref_match.group(2)))
        source_keys.add(source_key(event.get("source_url"), record_id))
        title_dates.add(title_date_key(event.get("city_id"), event.get("title"), event.get("date")))
    return {
        "rows": rows,
        "refs": refs,
        "source_keys": source_keys,
        "title_dates": title_dates,
        "source_id_count": source_id_count,
    }


def label_for(row):
    scheme = clean_text(row.get("Scheme Name"))
    site = clean_text(row.get("Site Name/Number"))
    street = clean_text(row.get("Primary Street Name"))
    if scheme:
        return scheme
    if site and street:
        return f"{site}, {street}"
    return site or street or clean_text(row.get("Development Description"), 80) or "LDD archive row"


def all_text(row):
    return " ".join(
        clean_text(row.get(key))
        for key in (
            "Development Description",
            "Scheme Name",
            "Site Name/Number",
            "Subdivision of Building",
            "Primary Street Name",
            "Secondary Street(s)",
            "Permission Type",
        )
    )


def signal_text(row):
    return " ".join(
        clean_text(row.get(key))
        for key in (
            "Development Description",
            "Scheme Name",
            "Site Name/Number",
            "Subdivision of Building",
            "Permission Type",
        )
    )


def score_row(row):
    text = signal_text(row)
    residential_units = number(row.get("Proposed Total Residential Units"))
    affordable_units = number(row.get("Proposed Total Affordable Units"))
    floorspace = number(row.get("Proposed Total Floorspace"))
    bedrooms = number(row.get("Proposed Total Bedrooms"))
    site_area = number(row.get("Total Site Area (Proposed) Hectares (ha)"))
    non_res_area = number(row.get("Non Res Site Area (Proposed) Hectares (ha)"))
    public_match = bool(PUBLIC_CIVIC_RE.search(text))
    architecture_match = bool(ARCHITECTURE_RE.search(text))
    large_match = (
        residential_units >= 80
        or affordable_units >= 25
        or floorspace >= 5000
        or bedrooms >= 150
        or site_area >= 1.0
        or non_res_area >= 1.0
    )

    score = 0.0
    if public_match:
        score += 45
    if architecture_match:
        score += 22
    if large_match:
        score += 35
    if residential_units:
        score += min(80, residential_units / 8)
    if affordable_units:
        score += min(45, affordable_units / 5)
    if floorspace:
        score += min(90, floorspace / 1200)
    if bedrooms:
        score += min(55, bedrooms / 15)
    if site_area:
        score += min(50, site_area * 3)
    if non_res_area:
        score += min(25, non_res_area * 3)
    if re.search(r"\b(masterplan|regeneration|mixed[- ]use|public realm|campus|hospital|school|library|museum|station|town centre)\b", text, re.IGNORECASE):
        score += 28
    if MINOR_DOMESTIC_RE.search(text):
        score -= 60
    if ADMIN_MINOR_RE.search(text):
        score -= 20

    return score, {
        "public_civic_keyword_match": public_match,
        "architecture_keyword_match": architecture_match,
        "large_scale_threshold_match": large_match,
        "minor_domestic_keyword_match": bool(MINOR_DOMESTIC_RE.search(text)),
        "administrative_minor_keyword_match": bool(ADMIN_MINOR_RE.search(text)),
    }


def should_reject_by_signal(row, score, flags):
    text = signal_text(row)
    large_override = flags["large_scale_threshold_match"] and score >= 45
    public_or_architecture = flags["public_civic_keyword_match"] or flags["architecture_keyword_match"]
    if flags["minor_domestic_keyword_match"] and not large_override:
        return "minor/domestic row below large-development override"
    if flags["administrative_minor_keyword_match"] and not (large_override or score >= 90):
        return "administrative-only/minor planning row below high-signal override"
    if not public_or_architecture and not large_override:
        return "below architecture/public/large-development signal threshold"
    if score < 40:
        return "below score threshold"
    if re.search(r"\b(extension|alteration|conversion)\b", text, re.IGNORECASE) and score < 75:
        return "alteration/extension row below score threshold"
    return ""


def related_row_index(path, download_url, workbook_name):
    if not path.exists():
        return defaultdict(list)
    index = defaultdict(list)
    for excel_row, row in iter_xlsx_dict_rows(path):
        authority = clean_text(row.get("Planning Authority"))
        borough_ref = clean_text(row.get("Borough Reference"))
        if not authority or not borough_ref:
            continue
        ref = {
            "workbook": workbook_name,
            "sheet": "LDD data",
            "excel_row": excel_row,
            "row_reference": f"{authority} / {borough_ref}",
            "download_url": download_url,
        }
        use_class = clean_text(row.get("Use Class"))
        completed_date = as_date(row.get("Date construction completed (Completed Date)"))
        proposed_floorspace = as_int(row.get("Proposed Floorspace"))
        proposed_bedrooms = as_int(row.get("Proposed Bedrooms"))
        if use_class:
            ref["use_class"] = use_class
        if proposed_floorspace:
            ref["proposed_floorspace_sqm"] = proposed_floorspace
        if proposed_bedrooms:
            ref["proposed_bedrooms"] = proposed_bedrooms
        if completed_date:
            ref["completed_date"] = completed_date
        index[authority_ref_key(authority, borough_ref)].append(ref)
    return index


def metric_text_for(row):
    metrics = []
    residential_units = as_int(row.get("Proposed Total Residential Units"))
    affordable_units = as_int(row.get("Proposed Total Affordable Units"))
    floorspace = as_int(row.get("Proposed Total Floorspace"))
    bedrooms = as_int(row.get("Proposed Total Bedrooms"))
    site_area = number(row.get("Total Site Area (Proposed) Hectares (ha)"))
    if residential_units:
        metrics.append(f"{residential_units} proposed homes")
    if affordable_units:
        metrics.append(f"{affordable_units} proposed affordable homes")
    if bedrooms:
        metrics.append(f"{bedrooms} proposed bedrooms")
    if floorspace:
        metrics.append(f"{floorspace} sqm proposed floorspace")
    if site_area:
        metrics.append(f"{site_area:g} ha proposed site area")
    return "; ".join(metrics) or "no headline quantity fields supplied"


def candidate_for(row, excel_row, score, flags, floorspace_refs, bedroom_refs):
    completed_date = as_date(row.get("Date construction completed (Completed Date)"))
    permission_date = as_date(row.get("Permission Date"))
    started_date = as_date(row.get("Date work commenced on site (Started Date)"))
    easting = number(row.get("Easting"))
    northing = number(row.get("Northing"))
    latitude, longitude = osgb36_to_wgs84(easting, northing)
    authority = clean_text(row.get("Planning Authority"))
    borough_ref = clean_text(row.get("Borough Reference"))
    title_label = label_for(row)
    description = clean_text(row.get("Development Description"), 700)
    metric_text = metric_text_for(row)
    source_record_id = f"LDD planning permissions workbook row {excel_row}; planning_authority={authority}; borough_reference={borough_ref}"
    candidate_id = f"lon_ldd_archive_next_round132_row_{excel_row}_{slugify(authority, 36)}_{slugify(borough_ref, 48)}"
    row_reference = f"{authority} / {borough_ref}"
    source_row_references = [
        {
            "workbook": "LDD_Permissions_for_Datastore_final.xlsx",
            "sheet": "LDD data",
            "excel_row": excel_row,
            "row_reference": row_reference,
            "download_url": PERMISSIONS_DOWNLOAD,
        }
    ]
    source_row_references.extend(floorspace_refs.get(authority_ref_key(authority, borough_ref), [])[:12])
    source_row_references.extend(bedroom_refs.get(authority_ref_key(authority, borough_ref), [])[:12])

    limitations = (
        "This is an archived LDD planning/development administrative completion-status record. "
        "The source-supplied Completed Date has no formal single definition in the LDD notes and may reflect "
        "building-control certification, planning-authority judgement, phasing, or later administrative updates. "
        "It is not evidence of public opening, occupation, current use, service delivery, final built form, "
        "design quality, local outcomes, or causal relationships. Some rows may represent phases, outline permissions, "
        "reserved matters, variations, or condition/details records; local planning authority records should be checked "
        "before promoting the candidate to a canonical event."
    )

    transformation_method = (
        "Generated by scripts/fetch_round132_london_ldd_archive_next_candidates.py. Parsed official LDD archive XLSX "
        "workbooks with a stdlib OOXML reader; deduplicated against the manual architecture corpus by LDD workbook row, "
        "planning authority/borough reference, source URL/record id, and title/date; filtered to Current permission status "
        "Completed, Completed Date from 2008-01-01 through 2026-05-19, valid Greater London Easting/Northing point, and "
        "architecture/public/civic/mixed-use or large-development signal; excluded domestic/minor/admin-only rows below "
        "override thresholds; sorted by signal score then date and source row; capped at 1000."
    )

    return {
        "city_id": "london",
        "candidate_id": candidate_id,
        "date": completed_date,
        "effective_date": completed_date,
        "date_precision": "day",
        "bucket": "planning/development/architecture/ldd_completion_record",
        "title": f"LDD administrative completion-status record: {title_label}",
        "summary": (
            f"The London Development Database archive row for {title_label} in {authority} lists Current permission "
            f"status 'Completed' and a source-supplied Completed Date of {completed_date}. The row records {metric_text}. "
            f"Source proposal description: {description}"
        ),
        "observed_change": (
            "Administrative LDD archive row records current permission status 'Completed' and a source-supplied Completed Date; "
            "this is retained as a planning/development status record, not as independent evidence of opening, occupation, "
            "or final built form."
        ),
        "event_type": "development_administrative_completion_status_record",
        "category": "architecture_related_ldd_archive_status_record",
        "area": f"{authority}; {title_label}",
        "latitude": latitude,
        "longitude": longitude,
        "geometry": {"type": "Point", "coordinates": [longitude, latitude]},
        "geometry_source": "LDD Easting/Northing point fields from the official planning-permissions workbook, converted from British National Grid to WGS84.",
        "geometry_precision": "LDD point location only; not a building footprint, parcel boundary, entrance, or current as-built geometry.",
        "location": {
            "site_name_or_number": clean_text(row.get("Site Name/Number")),
            "scheme_name": clean_text(row.get("Scheme Name")),
            "subdivision_of_building": clean_text(row.get("Subdivision of Building")),
            "primary_street_name": clean_text(row.get("Primary Street Name")),
            "secondary_streets": clean_text(row.get("Secondary Street(s)")),
            "postcode": clean_text(row.get("Post Code")),
            "ward": clean_text(row.get("Ward")),
            "easting": easting,
            "northing": northing,
            "latitude": latitude,
            "longitude": longitude,
            "source_crs": "British National Grid / OSGB36 point fields in LDD workbook",
            "derived_crs": "WGS84 latitude/longitude converted from source BNG point",
        },
        "source_id": SOURCE_ID,
        "source_ids": [SOURCE_ID],
        "source_dataset_id": SOURCE_ID,
        "source_name": "Planning permissions on the London Development Database (LDD)",
        "publisher": "Greater London Authority / London Development Database / relevant London planning authority",
        "source_url": DATASET_PAGE,
        "source_file_url": PERMISSIONS_DOWNLOAD,
        "source_record_id": source_record_id,
        "source_type": "official archived spreadsheet row",
        "source_date_field": "Date construction completed (Completed Date) in the LDD planning-permissions workbook",
        "source_row_references": source_row_references,
        "accessed_at": ACCESSED_AT,
        "retrieved_at": ACCESSED_AT,
        "license": "UK Open Government Licence (OGL v3)",
        "licence": "UK Open Government Licence (OGL v3)",
        "license_url": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
        "license_or_terms_note": "London Datastore / Greater London Authority archive under the UK Open Government Licence v3.0; preserve workbook row references and attribution.",
        "attribution": "Contains public sector information licensed under the Open Government Licence v3.0. Attribute Greater London Authority, London Development Database, and the relevant London planning authority.",
        "confidence": "documented",
        "architect": "Source record does not name a project architect.",
        "project_type": "LDD archived planning/development administrative completion-status record",
        "limitations": limitations,
        "transformation_method": transformation_method,
        "permission_date": permission_date,
        "started_date": started_date,
        "completed_financial_year": clean_text(row.get("Completed Financial Year")),
        "planning_authority": authority,
        "borough_reference": borough_ref,
        "permission_type": clean_text(row.get("Permission Type")),
        "decision_agency": clean_text(row.get("Decision Agency")),
        "current_permission_status": clean_text(row.get("Current permission status")),
        "development_description": description,
        "metrics": {
            "existing_total_residential_units": as_int(row.get("Existing Total Residential Units")),
            "proposed_total_residential_units": as_int(row.get("Proposed Total Residential Units")),
            "proposed_total_affordable_units": as_int(row.get("Proposed Total Affordable Units")),
            "proposed_total_affordable_percentage": number(row.get("Proposed Total Affordable Percentage")),
            "existing_total_bedrooms": as_int(row.get("Existing Total Bedrooms")),
            "proposed_total_bedrooms": as_int(row.get("Proposed Total Bedrooms")),
            "existing_total_floorspace_sqm": as_int(row.get("Existing Total Floorspace")),
            "proposed_total_floorspace_sqm": as_int(row.get("Proposed Total Floorspace")),
            "residential_site_area_ha": number(row.get("Residential Site Area (Proposed) Hectares (ha)")),
            "non_residential_site_area_ha": number(row.get("Non Res Site Area (Proposed) Hectares (ha)")),
            "total_site_area_ha": number(row.get("Total Site Area (Proposed) Hectares (ha)")),
            "total_open_space_existing_ha": number(row.get("Total Open Space (Existing) Hectares (ha)")),
            "total_open_space_proposed_ha": number(row.get("Total Open Space (Proposed) Hectares (ha)")),
        },
        "selection_score": round(score, 3),
        "selection_flags": flags,
        "raw_row": {
            "planning_authority": authority,
            "borough_reference": borough_ref,
            "development_description": description,
            "scheme_name": clean_text(row.get("Scheme Name")),
            "site_name_number": clean_text(row.get("Site Name/Number")),
            "primary_street_name": clean_text(row.get("Primary Street Name")),
            "postcode": clean_text(row.get("Post Code")),
            "ward": clean_text(row.get("Ward")),
            "easting": easting,
            "northing": northing,
            "permission_date": permission_date,
            "started_date": started_date,
            "completed_date": completed_date,
        },
    }


def validate_candidate(candidate):
    required = [
        "city_id",
        "candidate_id",
        "date",
        "date_precision",
        "bucket",
        "title",
        "summary",
        "observed_change",
        "area",
        "latitude",
        "longitude",
        "source_ids",
        "source_id",
        "source_name",
        "publisher",
        "source_url",
        "source_record_id",
        "source_type",
        "source_date_field",
        "confidence",
        "geometry_source",
        "geometry_precision",
        "license_or_terms_note",
        "attribution",
        "accessed_at",
        "limitations",
        "transformation_method",
    ]
    for field in required:
        value = candidate.get(field)
        if value in (None, "") or (isinstance(value, list) and not value):
            raise ValueError(f"Missing {field} for {candidate.get('candidate_id')}")
    if candidate["confidence"] not in {"documented", "corroborated", "inferred", "disputed"}:
        raise ValueError(f"Invalid confidence for {candidate['candidate_id']}")
    if not candidate["source_url"].startswith("http"):
        raise ValueError(f"Invalid source_url for {candidate['candidate_id']}")
    if not ("2008-01-01" <= candidate["date"] <= ACCESSED_AT):
        raise ValueError(f"Out-of-window date for {candidate['candidate_id']}: {candidate['date']}")
    lat = number(candidate["latitude"])
    lon = number(candidate["longitude"])
    if not (51.2868 <= lat <= 51.6919 and -0.5103 <= lon <= 0.334):
        raise ValueError(f"Outside London envelope for {candidate['candidate_id']}: {lat},{lon}")
    checked = " ".join(
        clean_text(candidate.get(field))
        for field in ("title", "summary", "observed_change", "limitations", "transformation_method")
    )
    banned = re.compile(r"\b(caused|proves?|proof|predicts?|forecasts?|forecasted|forecasting|simulates?|impact score|will increase|will decrease)\b", re.IGNORECASE)
    if banned.search(checked):
        raise ValueError(f"Overclaim wording for {candidate['candidate_id']}")


def source_audit(selection_summary):
    return {
        "generated_at": ACCESSED_AT,
        "task": "round132_london_ldd_archive_next_candidates",
        "source_audits": [
            {
                "source_id": SOURCE_ID,
                "source_name": "Planning permissions on the London Development Database (LDD)",
                "publisher": "Greater London Authority / London Development Database / relevant London planning authority",
                "source_url": DATASET_PAGE,
                "download_urls": {
                    "planning_permissions": PERMISSIONS_DOWNLOAD,
                    "non_residential_floorspace": FLOORSPACE_DOWNLOAD,
                    "non_residential_bedrooms": BEDROOMS_DOWNLOAD,
                },
                "license": "UK Open Government Licence (OGL v3)",
                "license_url": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
                "attribution_requirements": "Attribute Greater London Authority, London Development Database, and relevant London planning authority; preserve OGL v3 notice.",
                "accessed_at": ACCESSED_AT,
                "retrieved_at": ACCESSED_AT,
                "coverage_years_checked": "Completed LDD planning-permissions rows from 2008-01-01 through 2026-05-19, with archive workbooks retained under the London Datastore LDD dataset.",
                "update_frequency": "One-off archived Datastore workbook; LDD was replaced by Planning London Datahub and is not treated as a live feed here.",
                "geographic_scope": "Greater London LDD point rows from planning authorities.",
                "granularity": "Planning-permission/scheme row, with optional related non-residential floorspace and bedroom workbook row references.",
                "key_fields_used": [
                    "Planning Authority",
                    "Borough Reference",
                    "Current permission status",
                    "Permission Type",
                    "Decision Agency",
                    "Development Description",
                    "Scheme Name",
                    "Site Name/Number",
                    "Easting",
                    "Northing",
                    "Permission Date",
                    "Date work commenced on site (Started Date)",
                    "Date construction completed (Completed Date)",
                    "Proposed Total Residential Units",
                    "Proposed Total Affordable Units",
                    "Proposed Total Bedrooms",
                    "Proposed Total Floorspace",
                    "Total Site Area (Proposed) Hectares (ha)",
                ],
                "reliability_assessment": "usable_with_caveats",
                "required_caveats": [
                    "LDD rows are administrative planning/development records and should not be presented as independent evidence of construction, opening, occupation, service delivery, or current use.",
                    "The LDD Completed Date is source-defined and has no single formal definition in the notes.",
                    "Planning permission, work-start, administrative completion-status date, and real-world opening/occupation are separate facts.",
                    "Coordinates are LDD point locations from Easting/Northing fields; they are not footprints or precise entrance locations.",
                    "Figures describe the permission row and may differ from unaffected uses, phases, split permissions, later amendments, or the final built form.",
                ],
                "ingestion_recommendation": "Use selected rows only as candidate LDD administrative completion-status milestones with visible provenance and caveats.",
            }
        ],
        "selection_summary": selection_summary,
    }


def write_notes(candidate_count, summary):
    text = f"""# Round 132 London LDD archive next candidates

Generated another bounded London Development Database archive candidate pack beyond already ingested LDD rows in the manual architecture corpus.

- Source ID: `{SOURCE_ID}`
- Candidate output: `{OUT_PATH.as_posix()}`
- Candidate count: {candidate_count}
- Cap: {CANDIDATE_LIMIT}
- Accessed/retrieved date retained in outputs: {ACCESSED_AT}

## Dedupe

The generator excludes manual-corpus LDD records by workbook row, planning authority plus borough reference, source URL plus source record id, and candidate title/date. It also removes duplicate source rows and authority/reference pairs inside the new batch.

## Selection

Rows must have `Current permission status = Completed`, a `Date construction completed (Completed Date)` from 2008-01-01 through {ACCESSED_AT}, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes public/civic/institutional terms, architecture/development terms, large residential/floorspace/bedroom/site-area thresholds, and named regeneration/mixed-use/public-realm signals.

Small domestic, low-score alteration/extension, and administrative-only rows are excluded unless they meet a high-signal or large-development override. This keeps the batch useful for architecture/city-change review rather than turning the LDD archive into a minor-applications export.

## Caveats

These are LDD administrative completion-status records. The source field is not independent evidence of construction, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting a candidate into canonical event status.

## Exclusion Counts

```json
{json.dumps(summary.get("exclusion_counts", {}), indent=2)}
```
"""
    NOTES_PATH.write_text(text, encoding="utf-8")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ensure_file(PERMISSIONS_XLSX, PERMISSIONS_DOWNLOAD)
    ensure_file(FLOORSPACE_XLSX, FLOORSPACE_DOWNLOAD)
    ensure_file(BEDROOMS_XLSX, BEDROOMS_DOWNLOAD)

    dedupe = existing_ldd_dedupe()
    floorspace_refs = related_row_index(FLOORSPACE_XLSX, FLOORSPACE_DOWNLOAD, "LDD_Permissions_Non_residential_floorspace_final.xlsx")
    bedroom_refs = related_row_index(BEDROOMS_XLSX, BEDROOMS_DOWNLOAD, "LDD_Permissions_Non_residential_bedrooms_final.xlsx")

    scored = []
    exclusions = Counter()
    rejected_sample = []
    seen_refs = set()
    seen_rows = set()
    seen_source_keys = set()
    seen_title_dates = set()
    total_rows = 0

    for excel_row, row in iter_xlsx_dict_rows(PERMISSIONS_XLSX):
        total_rows += 1
        authority = clean_text(row.get("Planning Authority"))
        borough_ref = clean_text(row.get("Borough Reference"))
        completed_date = as_date(row.get("Date construction completed (Completed Date)"))
        current_status = clean_text(row.get("Current permission status")).lower()
        easting = number(row.get("Easting"))
        northing = number(row.get("Northing"))
        title_label = label_for(row)
        source_record_id = f"LDD planning permissions workbook row {excel_row}; planning_authority={authority}; borough_reference={borough_ref}"
        tdate_key = title_date_key("london", f"LDD administrative completion-status record: {title_label}", completed_date)
        ref_key = authority_ref_key(authority, borough_ref)
        skey = source_key(DATASET_PAGE, source_record_id)

        reason = ""
        if excel_row in dedupe["rows"]:
            reason = "existing manual-corpus LDD workbook row"
        elif ref_key in dedupe["refs"]:
            reason = "existing manual-corpus LDD authority/reference"
        elif skey in dedupe["source_keys"]:
            reason = "existing manual-corpus LDD source key"
        elif tdate_key in dedupe["title_dates"]:
            reason = "existing manual-corpus title/date"
        elif excel_row in seen_rows or ref_key in seen_refs or skey in seen_source_keys or tdate_key in seen_title_dates:
            reason = "duplicate inside round132 batch scan"
        elif current_status != "completed":
            reason = "not completed status"
        elif not ("2008-01-01" <= completed_date <= ACCESSED_AT):
            reason = "missing or outside 2008-2026 completed-date window"
        elif not (
            LONDON_BNG["min_easting"] <= easting <= LONDON_BNG["max_easting"]
            and LONDON_BNG["min_northing"] <= northing <= LONDON_BNG["max_northing"]
        ):
            reason = "missing or outside Greater London LDD point range"
        else:
            score, flags = score_row(row)
            reason = should_reject_by_signal(row, score, flags)
            if not reason:
                scored.append((score, completed_date, excel_row, row, flags))
                seen_rows.add(excel_row)
                seen_refs.add(ref_key)
                seen_source_keys.add(skey)
                seen_title_dates.add(tdate_key)
                continue

        exclusions[reason] += 1
        if len(rejected_sample) < 300 and reason not in {
            "not completed status",
            "existing manual-corpus LDD workbook row",
            "existing manual-corpus LDD authority/reference",
        }:
            rejected_sample.append({
                "excel_row": excel_row,
                "reason": reason,
                "planning_authority": authority,
                "borough_reference": borough_ref,
                "completed_date": completed_date,
                "title_label": title_label,
            })

    scored.sort(key=lambda item: (-item[0], item[1], item[2]))
    candidates = [
        candidate_for(row, excel_row, score, flags, floorspace_refs, bedroom_refs)
        for score, completed_date, excel_row, row, flags in scored[:CANDIDATE_LIMIT]
    ]
    for candidate in candidates:
        validate_candidate(candidate)

    selection_summary = {
        "input_workbook": str(PERMISSIONS_XLSX),
        "input_rows_scanned": total_rows,
        "eligible_scored_rows_after_dedupe_and_signal_filters": len(scored),
        "retained_candidates": len(candidates),
        "candidate_limit": CANDIDATE_LIMIT,
        "manual_corpus_ldd_events_seen": dedupe["source_id_count"],
        "manual_corpus_ldd_workbook_rows_seen": len(dedupe["rows"]),
        "manual_corpus_ldd_authority_reference_pairs_seen": len(dedupe["refs"]),
        "dedupe_fields": [
            "source_ids/source_dataset_id == london-development-database-archive",
            "source_record_id workbook row number",
            "source_record_id planning_authority and borough_reference",
            "source_url plus source_record_id",
            "city/title/date",
            "same fields inside the round132 batch scan",
        ],
        "filters": [
            "Current permission status equals Completed",
            f"Date construction completed (Completed Date) between 2008-01-01 and {ACCESSED_AT}",
            "BNG Easting/Northing present and within a broad Greater London range",
            "Architecture/public/civic/mixed-use or large-development signal",
            "Minor domestic and administrative-only rows excluded unless high-signal/large-development overrides apply",
            f"Sorted by signal score, then date and workbook row; capped at {CANDIDATE_LIMIT}",
        ],
        "exclusion_counts": dict(exclusions.most_common()),
    }

    payload = {
        "generated_at": ACCESSED_AT,
        "task": "round132_london_ldd_archive_next_candidates",
        "source_id_used": SOURCE_ID,
        "candidate_count": len(candidates),
        "max_candidates": CANDIDATE_LIMIT,
        "date_window": {"start": "2008-01-01", "end": ACCESSED_AT, "source_field": "Date construction completed (Completed Date)"},
        "accessed_at": ACCESSED_AT,
        "retrieved_at": ACCESSED_AT,
        "license": "UK Open Government Licence (OGL v3)",
        "license_url": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
        "global_caveat": "LDD rows are administrative planning/development records; do not present them as independent evidence of construction, opening, occupation, completion, final built form, current use, outcomes, or causation.",
        "selection_summary": selection_summary,
        "source_audits": source_audit(selection_summary)["source_audits"],
        "candidates": candidates,
        "rejected_sample": rejected_sample,
    }
    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    SOURCE_AUDIT_PATH.write_text(json.dumps(source_audit(selection_summary), indent=2) + "\n", encoding="utf-8")
    write_notes(len(candidates), selection_summary)

    print(json.dumps({
        "outPath": str(OUT_PATH),
        "sourceAuditPath": str(SOURCE_AUDIT_PATH),
        "notesPath": str(NOTES_PATH),
        "inputRowsScanned": total_rows,
        "eligibleScoredRows": len(scored),
        "candidates": len(candidates),
        "manualCorpusLddEventsSeen": dedupe["source_id_count"],
        "exclusionCounts": dict(exclusions.most_common(12)),
    }, indent=2))


if __name__ == "__main__":
    main()
