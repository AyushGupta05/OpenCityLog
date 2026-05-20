import csv
import io
import json
import math
import os
import re
import tempfile
import urllib.request
from datetime import date, datetime
from pathlib import Path


ACCESSED_AT = "2026-05-19"
START_DATE = date(2008, 1, 1)
END_DATE = date(2026, 5, 19)
SOURCE_DATE_STAMP = "20260519"
SOURCE_ID = "dfe-gias-establishment-register"
DOWNLOAD_URL = (
    "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/"
    f"edubasealldata{SOURCE_DATE_STAMP}.csv"
)
SOURCE_PAGE = "https://www.get-information-schools.service.gov.uk/"
GOVUK_GUIDANCE_URL = "https://www.gov.uk/guidance/get-information-about-schools"
OUT_DIR = Path("tmp/subagents/round130_london_official_more")
OUT_PATH = OUT_DIR / "candidates.json"
CORPUS_PATH = Path("data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json")

TARGET_TYPES = {
    "Free schools",
    "Free schools special",
    "Free schools alternative provision",
    "Free schools 16 to 19",
    "University technical college",
    "Studio schools",
    "Special post 16 institution",
    "Sixth form centres",
    "Academy 16 to 19 sponsor led",
}


def clean_text(value):
    if value is None:
        return ""
    text = str(value).replace("\ufeff", "").replace("\u2019", "'").replace("\u2013", "-")
    return re.sub(r"\s+", " ", text).strip()


def slugify(value, limit=90):
    text = clean_text(value).lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return text[:limit].rstrip("_") or "gias_record"


def parse_date(value):
    text = clean_text(value)
    if not text:
        return None
    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text[:10], fmt).date()
        except ValueError:
            pass
    return None


def number(value):
    text = clean_text(value)
    if not text:
        return None
    try:
        parsed = float(text.replace(",", ""))
    except ValueError:
        return None
    if not math.isfinite(parsed):
        return None
    return parsed


def int_or_none(value):
    parsed = number(value)
    if parsed is None:
        return None
    return int(parsed)


def osgb36_to_wgs84(easting, northing):
    # Airy 1830 ellipsoid, British National Grid projection, then Helmert transform to WGS84.
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
    m = 0
    while northing - n0 - m >= 0.00001:
        lat = (northing - n0 - m) / (a * f0) + lat
        ma = (1 + n + (5 / 4) * n**2 + (5 / 4) * n**3) * (lat - lat0)
        mb = (3 * n + 3 * n**2 + (21 / 8) * n**3) * math.sin(lat - lat0) * math.cos(lat + lat0)
        mc = ((15 / 8) * n**2 + (15 / 8) * n**3) * math.sin(2 * (lat - lat0)) * math.cos(2 * (lat + lat0))
        md = (35 / 24) * n**3 * math.sin(3 * (lat - lat0)) * math.cos(3 * (lat + lat0))
        m = b * f0 * (ma - mb + mc - md)

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


def is_london_point(lat, lon):
    return 51.25 <= lat <= 51.75 and -0.55 <= lon <= 0.35


def load_csv_text():
    def decode_csv_bytes(data):
        for encoding in ("utf-8-sig", "cp1252", "latin-1"):
            try:
                return data.decode(encoding)
            except UnicodeDecodeError:
                pass
        return data.decode("utf-8", errors="replace")

    local_path = os.environ.get("GIAS_CSV_PATH")
    if local_path:
        return decode_csv_bytes(Path(local_path).read_bytes())

    temp_path = Path(tempfile.gettempdir()) / f"edubasealldata{SOURCE_DATE_STAMP}_full.csv"
    if temp_path.exists() and temp_path.stat().st_size > 60_000_000:
        return decode_csv_bytes(temp_path.read_bytes())

    with urllib.request.urlopen(DOWNLOAD_URL, timeout=120) as response:
        data = response.read()
    temp_path.write_bytes(data)
    return decode_csv_bytes(data)


def existing_source_tokens():
    tokens = set()
    paths = []
    if CORPUS_PATH.exists():
        paths.append(CORPUS_PATH)
    paths.extend(Path("tmp/subagents").glob("**/candidates.json"))
    for path in paths:
        if path == OUT_PATH:
            continue
        try:
            text = path.read_text(encoding="utf-8-sig", errors="ignore").lower()
        except OSError:
            continue
        for match in re.finditer(r"get-information-schools\.service\.gov\.uk/establishments/establishment/details/(\d+)", text):
            tokens.add(match.group(1))
        for match in re.finditer(r"\bgias urn\s+(\d+)\b", text):
            tokens.add(match.group(1))
    return tokens


def selected_raw_fields(row):
    keys = [
        "URN",
        "EstablishmentName",
        "TypeOfEstablishment (name)",
        "EstablishmentTypeGroup (name)",
        "EstablishmentStatus (name)",
        "ReasonEstablishmentOpened (name)",
        "OpenDate",
        "PhaseOfEducation (name)",
        "LA (name)",
        "Street",
        "Locality",
        "Address3",
        "Town",
        "Postcode",
        "SchoolCapacity",
        "NumberOfPupils",
        "GOR (name)",
        "DistrictAdministrative (name)",
        "AdministrativeWard (name)",
        "Easting",
        "Northing",
        "UPRN",
    ]
    return {key: clean_text(row.get(key)) for key in keys if clean_text(row.get(key))}


def make_candidate(row, row_number):
    urn = clean_text(row.get("URN"))
    name = clean_text(row.get("EstablishmentName"))
    open_date = parse_date(row.get("OpenDate"))
    type_name = clean_text(row.get("TypeOfEstablishment (name)"))
    phase = clean_text(row.get("PhaseOfEducation (name)"))
    borough = clean_text(row.get("LA (name)"))
    postcode = clean_text(row.get("Postcode"))
    easting = number(row.get("Easting"))
    northing = number(row.get("Northing"))
    lat, lon = osgb36_to_wgs84(easting, northing)
    capacity = int_or_none(row.get("SchoolCapacity"))
    pupils = int_or_none(row.get("NumberOfPupils"))
    details_url = f"https://www.get-information-schools.service.gov.uk/Establishments/Establishment/Details/{urn}"
    date_iso = open_date.isoformat()
    title_name = name if len(name) <= 80 else f"{name[:77].rstrip()}..."
    capacity_text = f" The row records school capacity {capacity}." if capacity is not None else ""
    pupils_text = f" Latest pupil count in the extract is {pupils}." if pupils is not None else ""
    address_bits = [clean_text(row.get(k)) for k in ("Street", "Locality", "Address3", "Town")]
    address = ", ".join(bit for bit in address_bits if bit)
    if postcode:
        address = f"{address}, {postcode}" if address else postcode

    return {
        "city_id": "london",
        "candidate_id": f"round130_london_gias_opening_urn_{urn}_{date_iso.replace('-', '_')}",
        "title": f"DfE GIAS opening record: {title_name}",
        "summary": (
            f"Department for Education Get Information About Schools records {name} in {borough} as an open "
            f"{type_name} with OpenDate {date_iso} and opening reason 'New Provision'.{capacity_text}{pupils_text}"
        ),
        "observed_change": (
            "The official establishment register records a school or education-establishment opening date and current "
            "open status; physical construction or building completion is not claimed."
        ),
        "effective_date": date_iso,
        "date": date_iso,
        "date_precision": "day",
        "bucket": "planning/development/architecture/public_facility_education_register",
        "area": f"{name}, {borough}",
        "address": address,
        "latitude": lat,
        "longitude": lon,
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "source_id": SOURCE_ID,
        "source_ids": [SOURCE_ID],
        "source_name": "Get Information About Schools establishment extract",
        "publisher": "Department for Education",
        "source_url": details_url,
        "source_record_id": f"GIAS URN {urn}; edubasealldata{SOURCE_DATE_STAMP}.csv row {row_number}",
        "source_type": "official public establishment register CSV row",
        "accessed_at": ACCESSED_AT,
        "source_date_field": "OpenDate",
        "source_dataset_id": SOURCE_ID,
        "source_file_url": DOWNLOAD_URL,
        "source_page_url": SOURCE_PAGE,
        "confidence": "documented",
        "architect": "Source record does not name a project architect.",
        "project_type": f"{type_name} establishment opening register record",
        "phase_of_education": phase,
        "geometry_source": "GIAS Easting/Northing fields converted from British National Grid to WGS84.",
        "geometry_precision": "official establishment/address grid point, not a measured building footprint, entrance, campus boundary, or works extent",
        "license_or_terms_note": "GIAS public data/GOV.UK content is reusable under Open Government Licence v3.0 except where otherwise stated.",
        "license": "Open Government Licence v3.0",
        "license_url": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
        "attribution": "Department for Education, Get Information About Schools",
        "limitations": (
            "GIAS OpenDate is an establishment-register date. It may record institution opening, registration, or "
            "organisational status rather than a new building. It is not evidence of construction start, practical "
            "completion, first occupation, permanent accommodation, capacity delivery, educational outcomes, or causal "
            "effects. Some schools may operate in temporary, shared, or reused buildings; pair with local planning or "
            "capital-project records before promoting as a built-form completion event."
        ),
        "duplicate_screen_note": (
            "Round130 screened existing corpus and candidate packs for the same GIAS details URL or 'GIAS URN' token. "
            "Name-only overlaps were not rejected because a separate school-building or planning event can coexist with "
            "the DfE establishment-opening record."
        ),
        "source_row_references": [
            {
                "source_file": f"edubasealldata{SOURCE_DATE_STAMP}.csv",
                "csv_row": row_number,
                "urn": urn,
                "download_url": DOWNLOAD_URL,
                "details_url": details_url,
            }
        ],
        "raw_row": selected_raw_fields(row),
    }


def score_candidate(candidate):
    raw = candidate["raw_row"]
    type_name = raw.get("TypeOfEstablishment (name)", "")
    capacity = int_or_none(raw.get("SchoolCapacity")) or 0
    pupils = int_or_none(raw.get("NumberOfPupils")) or 0
    type_score = {
        "Free schools": 90,
        "Free schools special": 86,
        "Free schools 16 to 19": 84,
        "University technical college": 83,
        "Studio schools": 80,
        "Sixth form centres": 78,
        "Special post 16 institution": 76,
        "Free schools alternative provision": 74,
        "Academy 16 to 19 sponsor led": 72,
    }.get(type_name, 50)
    return (
        type_score,
        min(capacity, 1500),
        min(pupils, 1500),
        candidate["effective_date"],
        candidate["candidate_id"],
    )


def main():
    text = load_csv_text()
    duplicate_urns = existing_source_tokens()
    reader = csv.DictReader(io.StringIO(text))
    candidates = []
    reject_counts = {
        "not_london": 0,
        "not_open": 0,
        "wrong_open_reason": 0,
        "out_of_date_range": 0,
        "wrong_type": 0,
        "missing_or_invalid_geometry": 0,
        "duplicate_gias_source": 0,
    }

    for row_number, row in enumerate(reader, start=2):
        urn = clean_text(row.get("URN"))
        if clean_text(row.get("GOR (name)")) != "London":
            reject_counts["not_london"] += 1
            continue
        if clean_text(row.get("EstablishmentStatus (name)")) != "Open":
            reject_counts["not_open"] += 1
            continue
        if clean_text(row.get("ReasonEstablishmentOpened (name)")) != "New Provision":
            reject_counts["wrong_open_reason"] += 1
            continue
        open_date = parse_date(row.get("OpenDate"))
        if open_date is None or open_date < START_DATE or open_date > END_DATE:
            reject_counts["out_of_date_range"] += 1
            continue
        if clean_text(row.get("TypeOfEstablishment (name)")) not in TARGET_TYPES:
            reject_counts["wrong_type"] += 1
            continue
        easting = number(row.get("Easting"))
        northing = number(row.get("Northing"))
        if not easting or not northing:
            reject_counts["missing_or_invalid_geometry"] += 1
            continue
        lat, lon = osgb36_to_wgs84(easting, northing)
        if not is_london_point(lat, lon):
            reject_counts["missing_or_invalid_geometry"] += 1
            continue
        if urn in duplicate_urns:
            reject_counts["duplicate_gias_source"] += 1
            continue
        candidates.append(make_candidate(row, row_number))

    candidates.sort(key=score_candidate, reverse=True)
    candidates.sort(key=lambda item: (item["effective_date"], item["candidate_id"]))

    payload = {
        "schema_version": "round130.london_official_more.v1",
        "created_at": ACCESSED_AT,
        "accessed_at": ACCESSED_AT,
        "scope": (
            "London official/public built-environment adjacent records beyond the already heavily used PLD, LDD, "
            "NHLE/Historic England, OPDC/LLDC, borough-project, and TfL sources. This pack uses DfE GIAS as an "
            "official education-establishment opening register and keeps all records caveated as establishment status, "
            "not construction completion."
        ),
        "source_audits": [
            {
                "source_id": SOURCE_ID,
                "source_name": "Get Information About Schools establishment extract",
                "publisher": "Department for Education",
                "source_url": SOURCE_PAGE,
                "source_file_url": DOWNLOAD_URL,
                "guidance_url": GOVUK_GUIDANCE_URL,
                "license_or_terms_note": "GOV.UK/GIAS public data is available under Open Government Licence v3.0 except where otherwise stated.",
                "coverage_years_checked": "London rows with OpenDate from 2008-01-01 through 2026-05-19 in the 2026-05-19 public extract.",
                "update_frequency": "GIAS download page states public downloads are updated daily.",
                "geographic_scope": "England establishment register; this pass retained records with GOR (name)=London and London-envelope Easting/Northing.",
                "key_fields_used": [
                    "URN",
                    "EstablishmentName",
                    "TypeOfEstablishment (name)",
                    "EstablishmentStatus (name)",
                    "ReasonEstablishmentOpened (name)",
                    "OpenDate",
                    "LA (name)",
                    "Postcode",
                    "Easting",
                    "Northing",
                    "SchoolCapacity",
                    "NumberOfPupils",
                ],
                "reliability": "strong for official establishment-register opening/status rows; usable with caveats for built-environment-adjacent changelog events",
                "ingestion_recommendation": "Use as education-facility establishment-opening evidence only. Pair with borough planning/capital sources before claiming a new building, completion, permanent accommodation, or built-form change.",
            },
            {
                "source_id": "planning-data-building-preservation-notice",
                "source_name": "Planning Data building preservation notice",
                "publisher": "Ministry of Housing, Communities and Local Government / Historic England",
                "source_url": "https://www.planning.data.gov.uk/dataset/building-preservation-notice",
                "license_or_terms_note": "Dataset page states OGL v3.0 with Historic England and Ordnance Survey/Crown copyright attribution.",
                "coverage_years_checked": "Current 2026-05-19 entity extract.",
                "reliability": "strong for BPN status where geometry/date are present, but not useful for this London pack",
                "ingestion_recommendation": "Checked and rejected for round130 because the current API extract had no London records with usable point geometry.",
            },
        ],
        "selection_summary": {
            "input_download": DOWNLOAD_URL,
            "target_types": sorted(TARGET_TYPES),
            "candidate_count": len(candidates),
            "reject_counts": reject_counts,
        },
        "candidates": candidates,
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(candidates)} candidates to {OUT_PATH}")


if __name__ == "__main__":
    main()
