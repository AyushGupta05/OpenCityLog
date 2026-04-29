#!/usr/bin/env python3
"""Expand London/NYC city-atlas event seeds from official/open source rows.

The previous PDF identifies the source families to use. This script turns several of
those families into row-level, source-backed event records for the CivicReplay atlas:
- London: Planning Data England brownfield land records inside London LPAs, TfL road disruptions.
- NYC: DOB permits, street-construction permits, certificates of occupancy, ZAP projects,
  historical permitted events, and a bounded 311 complaint sample.

It deliberately stores only non-sensitive fields needed for atlas provenance and does
not persist phone numbers, owner names, permittee contact details, or credentials.
"""
from __future__ import annotations

import csv
import json
import re
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DISCOVERY = ROOT / "data-discovery"
RAW = DISCOVERY / "raw_metadata"
RAW.mkdir(parents=True, exist_ok=True)

USER_AGENT = "Bims-5-CivicReplay-event-expander/1.0 (+local research script)"
LONDON_BOUNDS = (-0.5103, 51.2868, 0.334, 51.6919)
NYC_BOUNDS = (-74.2591, 40.4774, -73.7004, 40.9176)

GENERATED_PREFIXES = (
    "lon_brownfield_",
    "lon_lfb_incident_",
    "lon_tfl_disruption_",
    "nyc_dob_permit_",
    "nyc_street_permit_",
    "nyc_street_permit_legacy_",
    "nyc_certificate_occupancy_",
    "nyc_dob_now_certificate_occupancy_",
    "nyc_zap_project_",
    "nyc_permitted_event_",
    "nyc_311_service_request_",
    "nyc_collision_crash_",
)

LONDON_LPA_NAMES = {
    "City of London", "Camden", "Hackney", "Hammersmith and Fulham", "Haringey", "Islington",
    "Kensington and Chelsea", "Lambeth", "Lewisham", "Newham", "Southwark", "Tower Hamlets",
    "Wandsworth", "Westminster", "Barking and Dagenham", "Barnet", "Bexley", "Brent",
    "Bromley", "Croydon", "Ealing", "Enfield", "Greenwich", "Harrow", "Havering",
    "Hillingdon", "Hounslow", "Kingston upon Thames", "Merton", "Redbridge",
    "Richmond upon Thames", "Sutton", "Waltham Forest", "London Legacy Development Corporation",
}


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


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


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


def in_bounds(point: tuple[float, float] | None, bounds: tuple[float, float, float, float]) -> bool:
    if not point:
        return False
    lon, lat = point
    return bounds[0] <= lon <= bounds[2] and bounds[1] <= lat <= bounds[3]


def first_date(*values: Any) -> str:
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
    return "2026"


def clean_text(value: Any, max_len: int = 220) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    return text[:max_len].rstrip()


def event_record(**kwargs: Any) -> dict[str, Any]:
    return {k: v for k, v in kwargs.items() if v not in (None, "", [], {})}


def load_london_lpas() -> list[dict[str, Any]]:
    url = "https://www.planning.data.gov.uk/entity.json?dataset=local-planning-authority&limit=500&field=name&field=entity"
    payload = fetch_json(url)
    lpas = []
    for entity in payload.get("entities", []):
        name = str(entity.get("name", "")).replace(" LPA", "")
        if name in LONDON_LPA_NAMES:
            lpas.append({"entity": entity["entity"], "name": name})
    return sorted(lpas, key=lambda row: row["name"])


def fetch_london_brownfield(max_events: int = 10000) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    lpas = load_london_lpas()
    events: list[dict[str, Any]] = []
    raw_summary: dict[str, Any] = {"retrieved_at": datetime.now(timezone.utc).isoformat(), "source": "planning.data.gov.uk brownfield-land", "lpas": []}
    seen: set[int] = set()
    for lpa in lpas:
        if len(events) >= max_events:
            break
        url = (
            "https://www.planning.data.gov.uk/entity.json?"
            + urllib.parse.urlencode({
                "dataset": "brownfield-land",
                "geometry_entity": str(lpa["entity"]),
                "geometry_relation": "within",
                "limit": "500",
            })
        )
        try:
            payload = fetch_json(url, timeout=90)
        except Exception as exc:  # noqa: BLE001
            raw_summary["lpas"].append({**lpa, "error": str(exc)})
            continue
        rows = payload.get("entities", [])
        raw_summary["lpas"].append({**lpa, "count": payload.get("count"), "sample_count": len(rows)})
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
            date = first_date(row.get("planning-permission-date"), row.get("start-date"), row.get("entry-date"))
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
                summary=clean_text(row.get("notes") or f"{permission_status} brownfield land register record in {lpa['name']}.", 420),
                observed_change=clean_text(f"Planning/development evidence record: {permission_status}; brownfield land capacity marker" + (f" for {dwellings} net dwellings" if dwellings else "") + ".", 260),
                confidence="documented",
                limitations="Planning Data is authoritative but local-authority coverage and field completeness vary; use the linked source record for final application-level validation.",
            ))
    return events, raw_summary


def fetch_london_tfl_disruptions(max_events: int = 200) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    url = "https://api.tfl.gov.uk/Road/all/Disruption"
    rows = fetch_json(url, timeout=45)
    events: list[dict[str, Any]] = []
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
        events.append(event_record(
            event_id=f"lon_tfl_disruption_{slug(rid, 48)}",
            title=f"TfL road disruption: {location or rid}",
            date=first_date(row.get("startDateTime"), row.get("currentUpdateDateTime"), row.get("lastModifiedTime")),
            bucket="transport/traffic/roadworks",
            area=location,
            location=location,
            latitude=lat,
            longitude=lon,
            source_ids=["tfl-road-disruptions", "lon-hue-tfl-routes-timetables-accessibility-demand-and-cycle-hire"],
            source_record_id=str(rid),
            summary=clean_text(row.get("comments"), 420),
            observed_change=clean_text(f"{category} disruption with status {row.get('status','unknown')} and severity {row.get('severity','unknown')}.", 240),
            confidence="documented",
            limitations="TfL road disruption feed is live/current; records may change or expire and should be refreshed before formal analysis.",
        ))
    return events, {"retrieved_at": datetime.now(timezone.utc).isoformat(), "source": url, "record_count": len(rows), "sample": rows[:3]}


def fetch_london_lfb_incidents(max_per_year: int = 125) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Stream a real row-level London Fire Brigade incident CSV and sample each year.

    The 2009-2017 file is a CSV behind a London Datastore download URL. Reading it
    sequentially avoids storing the 300MB+ raw file in the repo while still giving
    the atlas thousands of genuine incidents across multiple years.
    """
    url = "https://data.london.gov.uk/download/em8xy/73728cf4-b70e-48e2-9b97-4e4341a2110d/LFB%20Incident%20data%20from%202009%20-%202017.xlsx"
    target_years = {str(y) for y in range(2009, 2018)}
    counts = {year: 0 for year in target_years}
    events: list[dict[str, Any]] = []
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=180) as response:
        text_stream = (line.decode("utf-8-sig", "replace") for line in response)
        reader = csv.DictReader(text_stream)
        for row in reader:
            year = str(row.get("CalYear") or "")
            if year not in target_years or counts[year] >= max_per_year:
                if all(v >= max_per_year for v in counts.values()):
                    break
                continue
            lat = safe_float(row.get("Latitude"))
            lon = safe_float(row.get("Longitude"))
            if lat is None or lon is None or not in_bounds((lon, lat), LONDON_BOUNDS):
                continue
            incident_number = clean_text(row.get("IncidentNumber"), 60)
            incident_group = clean_text(row.get("IncidentGroup"), 80)
            stop_code = clean_text(row.get("StopCodeDescription"), 100)
            special = clean_text(row.get("SpecialServiceType"), 100)
            borough = clean_text(row.get("IncGeo_BoroughName") or row.get("ProperCase") or "London", 80)
            ward = clean_text(row.get("IncGeo_WardNameNew") or row.get("IncGeo_WardName"), 80)
            postcode = clean_text(row.get("Postcode_district") or row.get("Postcode_full"), 24)
            descriptor = special or stop_code or incident_group or "incident"
            events.append(event_record(
                event_id=f"lon_lfb_incident_{slug(incident_number, 64)}",
                title=f"London Fire Brigade incident: {descriptor} in {borough}",
                date=first_date(row.get("DateOfCall"), year),
                bucket="public services/fire/emergency incidents",
                area=borough,
                location=f"{ward} {postcode}".strip(),
                latitude=lat,
                longitude=lon,
                source_ids=["london-fire-brigade-incidents"],
                source_record_id=incident_number,
                summary=clean_text(f"LFB {incident_group} record: {stop_code or descriptor}; property category {row.get('PropertyCategory') or 'unknown'}; ward {ward}; first pump attendance {row.get('FirstPumpArriving_AttendanceTime') or 'not recorded'} seconds.", 420),
                observed_change=clean_text(f"Emergency service incident record ({descriptor}) with spatial evidence at borough/ward/postcode scale.", 260),
                confidence="documented",
                limitations="Fire incident rows are operational emergency-service events; use as urban-stress/context evidence, not direct built-form change evidence.",
            ))
            counts[year] += 1
    return events, {"retrieved_at": datetime.now(timezone.utc).isoformat(), "source": url, "sampled_per_year": counts, "event_count": len(events)}


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


def fetch_nyc_events() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    events: list[dict[str, Any]] = []
    raw: dict[str, Any] = {"retrieved_at": datetime.now(timezone.utc).isoformat(), "sources": {}}

    def add_with_point(prefix: str, rows: list[dict[str, Any]], source_id: str, title_fn, date_fn, bucket: str, summary_fn, record_id_fn, lat_key: str, lon_key: str, area_fn, limit: int) -> None:
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
            events.append(event_record(
                event_id=f"{prefix}_{slug(rid, 70)}",
                title=clean_text(title_fn(row), 180),
                date=date_fn(row),
                bucket=bucket,
                area=clean_text(area_fn(row), 120),
                latitude=lat,
                longitude=lon,
                source_ids=[source_id],
                source_record_id=rid,
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
        borough = clean_text(row.get("boroughname") or "NYC", 40)
        street = clean_text(row.get("onstreetname") or row.get("fromstreetname") or "street segment", 80)
        events.append(event_record(
            event_id=f"nyc_street_permit_{slug(rid, 64)}",
            title=f"Street construction permit: {street}, {borough}",
            date=first_date(row.get("permitissuedate"), row.get("issuedworkstartdate")),
            bucket="transport/traffic/roadworks",
            area=borough,
            location=f"{street} from {clean_text(row.get('fromstreetname'), 50)} to {clean_text(row.get('tostreetname'), 50)}".strip(),
            source_ids=["tqtj-sjs8"],
            source_record_id=str(rid),
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
        borough = clean_text(row.get("boroughname") or "NYC", 40)
        street = clean_text(row.get("onstreetname") or row.get("fromstreetname") or "street segment", 80)
        events.append(event_record(
            event_id=f"nyc_street_permit_legacy_{slug(rid, 64)}",
            title=f"Legacy street construction permit: {street}, {borough}",
            date=first_date(row.get("permitissuedate"), row.get("issuedworkstartdate"), row.get("createdon")),
            bucket="transport/traffic/roadworks",
            area=borough,
            location=f"{street} from {clean_text(row.get('fromstreetname'), 50)} to {clean_text(row.get('tostreetname'), 50)}".strip(),
            source_ids=["c9sj-fmsg"],
            source_record_id=str(rid),
            summary=clean_text(f"{row.get('permittypedesc','Street permit')} ({row.get('permitstatusshortdesc','status unknown')}) on {street}; purpose: {row.get('permitpurposecomments') or row.get('permitlocationcomments') or 'not specified'}.", 420),
            observed_change=clean_text(f"Street/right-of-way work permit affecting {street} in {borough}.", 220),
            confidence="documented",
            limitations="Legacy street permit feed does not always expose public coordinates; atlas point is borough-distributed unless a later geocoder attaches segment geometry.",
        ))

    zap_rows = socrata("data.cityofnewyork.us", "hgx4-8ukb", {
        "$limit": "500",
        "$select": "project_id,project_status,public_status,ceqr_number,borough,certified_referred",
        "$order": "certified_referred ASC",
        "$where": "certified_referred IS NOT NULL",
    }, timeout=90)
    raw["sources"]["hgx4-8ukb"] = {"fetched": len(zap_rows), "sample_fields": list(zap_rows[0].keys()) if zap_rows else []}
    for row in zap_rows[:500]:
        rid = row.get("project_id") or row.get("ceqr_number")
        borough = clean_text(row.get("borough") or "NYC", 60)
        status = clean_text(row.get("public_status") or row.get("project_status") or "ZAP project", 80)
        events.append(event_record(
            event_id=f"nyc_zap_project_{slug(rid, 60)}",
            title=f"ZAP land-use project: {rid} ({borough})",
            date=first_date(row.get("certified_referred")),
            bucket="planning/development/zoning",
            area=borough,
            source_ids=["hgx4-8ukb"],
            source_record_id=str(rid),
            summary=clean_text(f"Zoning Application Portal project {rid}; CEQR {row.get('ceqr_number','n/a')}; public status {status}; borough {borough}.", 360),
            observed_change=clean_text(f"Land-use/zoning application milestone with public status {status}.", 220),
            confidence="documented",
            limitations="ZAP project records may require BBL/action joins for exact parcel geometry and project description.",
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
        borough = clean_text(row.get("event_borough") or "NYC", 60)
        events.append(event_record(
            event_id=f"nyc_permitted_event_{slug(rid, 60)}",
            title=f"Permitted civic event: {clean_text(row.get('event_name') or rid, 120)}",
            date=first_date(row.get("start_date_time")),
            bucket="public services/major event/street use",
            area=borough,
            location=clean_text(row.get("event_location"), 160),
            source_ids=["bkfu-528j"],
            source_record_id=str(rid),
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
    payload["metadata"]["expanded_from_official_rows_at"] = datetime.now(timezone.utc).isoformat()
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
        "expanded_from_official_rows_at": datetime.now(timezone.utc).isoformat(),
        "generated_event_count": len(new_events),
        "total_chronology_milestones": len(chronology),
        "generated_event_prefixes": list(GENERATED_PREFIXES),
    }
    write_json(path, payload)


def main() -> None:
    london_brownfield, london_brownfield_raw = fetch_london_brownfield(max_events=10000)
    london_lfb, london_lfb_raw = fetch_london_lfb_incidents(max_per_year=125)
    london_tfl, london_tfl_raw = fetch_london_tfl_disruptions(max_events=250)
    london_events = london_brownfield + london_lfb + london_tfl
    update_london_seed(london_events)

    nyc_events, nyc_raw = fetch_nyc_events()
    update_nyc_seed(nyc_events)

    write_json(RAW / "generated_event_expansion_london_brownfield_summary.json", london_brownfield_raw)
    write_json(RAW / "generated_event_expansion_london_lfb_incidents_summary.json", london_lfb_raw)
    write_json(RAW / "generated_event_expansion_london_tfl_disruptions_summary.json", london_tfl_raw)
    write_json(RAW / "generated_event_expansion_nyc_summary.json", nyc_raw)
    nyc_source_counts = {source_id: details.get("fetched") for source_id, details in nyc_raw.get("sources", {}).items()}
    write_json(DISCOVERY / "shared/generated_event_expansion_summary.json", {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "london": {
            "brownfield_events": len(london_brownfield),
            "lfb_incident_events": len(london_lfb),
            "tfl_disruption_events": len(london_tfl),
            "total_generated_events": len(london_events),
        },
        "nyc": {"total_generated_events": len(nyc_events), "source_event_counts": nyc_source_counts},
        "notes": [
            "Official/open source rows are converted to source-backed atlas events, not causal impact claims.",
            "Sensitive contact, owner, permittee and personal fields from permit/admin datasets are intentionally not persisted.",
            "Records without public coordinates rely on the atlas builder's deterministic city/borough point distribution.",
            "London brownfield rows are fetched from Planning Data England per London LPA; LFB rows are sampled from a very large London Datastore incident CSV to keep the repo lightweight.",
        ],
    })
    print(json.dumps({
        "london_generated": len(london_events),
        "london_brownfield": len(london_brownfield),
        "london_lfb_incidents": len(london_lfb),
        "london_tfl_disruptions": len(london_tfl),
        "nyc_generated": len(nyc_events),
        "nyc_source_counts": nyc_source_counts,
    }, indent=2))


if __name__ == "__main__":
    main()
