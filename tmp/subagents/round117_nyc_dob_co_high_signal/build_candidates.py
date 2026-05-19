import json
import re
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from urllib.parse import quote, urlencode

import requests


ROOT = Path(r"C:\Users\ayush\dev\Bims-5")
OUT_DIR = ROOT / "tmp" / "subagents" / "round117_nyc_dob_co_high_signal"
MANUAL_FILE = ROOT / "data" / "manual_drops" / "architecture_milestones" / "architecture_milestones_2008_2026.json"
START = date(2008, 1, 1)
END = date(2026, 5, 19)
ACCESSED_AT = "2026-05-19"

DOB_NOW_ID = "pkdm-hqz6"
LEGACY_ID = "bs8b-p36w"
BASE = "https://data.cityofnewyork.us"
API_BASE = f"{BASE}/resource"
TERMS_URL = "https://opendata.cityofnewyork.us/overview/#open-data-terms-of-use"
NYC_GOV_TERMS_URL = "https://www.nyc.gov/home/terms-of-use.page"

DOB_NOW_SOURCE_ID = "nyc-dob-now-certificate-of-occupancy-pkdm-hqz6"
LEGACY_SOURCE_ID = "nyc-dob-certificate-of-occupancy-bs8b-p36w"

DOB_NOW_SELECTED = [
    "CO-000068219",
    "CO-000041946",
    "CO-000007083",
    "CO-000038687",
    "CO-000004232",
    "CO-000068451",
    "CO-000024128",
    "CO-000037239",
    "CO-000026598",
    "CO-000033669",
    "CO-000032541",
    "CO-000083272",
    "CO-000032009",
    "CO-000081698",
    "CO-000011539",
    "CO-000081701",
    "CO-000051691",
    "CO-000034531",
    "CO-000072641",
    "CO-000086285",
    "CO-000088325",
    "CO-000083179",
    "CO-000092356",
]

LEGACY_SELECTED = [
    "120986077",
    "402295556",
    "103199245",
    "420504635",
    "104372741",
    "102677550",
    "104856942",
    "320040629",
    "402563454",
    "420651823",
]

MANUAL_REJECTS = [
    {
        "source_dataset_id": DOB_NOW_ID,
        "source_record_id": "CO-000088558",
        "address": "22-44 JACKSON AVENUE, QUEENS",
        "date": "2026-03-09",
        "reason": "Already present in manual architecture milestones as DOB NOW final CO for 22-44 JACKSON AVENUE.",
    },
    {
        "source_dataset_id": DOB_NOW_ID,
        "source_record_id": "CO-000072800",
        "address": "625 FULTON STREET, BROOKLYN",
        "date": "2025-05-09",
        "reason": "Manual file already has a 625 Fulton Street development/planning milestone; adding the initial CO row would need project-level reconciliation first.",
    },
    {
        "source_dataset_id": DOB_NOW_ID,
        "source_record_id": "CO-000075452",
        "address": "150 WEST 48TH STREET, MANHATTAN",
        "date": "2025-06-05",
        "reason": "Already present in manual architecture milestones as DOB NOW final CO for 150 WEST 48TH STREET.",
    },
    {
        "source_dataset_id": DOB_NOW_ID,
        "source_record_id": "CO-000068672",
        "address": "43-25 HUNTER STREET, QUEENS",
        "date": "2025-03-03",
        "reason": "Already present in manual architecture milestones as DOB NOW final CO for 43-25 HUNTER STREET.",
    },
    {
        "source_dataset_id": DOB_NOW_ID,
        "source_record_id": "CO-000067632",
        "address": "400 WEST 61 STREET, MANHATTAN",
        "date": "2025-04-01",
        "reason": "Already present in manual architecture milestones as DOB NOW final CO for 400 WEST 61 STREET.",
    },
    {
        "source_dataset_id": DOB_NOW_ID,
        "source_record_id": "CO-000009990",
        "address": "1 WALL STREET, MANHATTAN",
        "date": "2021-10-29",
        "reason": "Same building already appears in manual milestones through 1 Wall Street landmark/interior records; CO row should be merged only with project-level duplicate review.",
    },
    {
        "source_dataset_id": DOB_NOW_ID,
        "source_record_id": "CO-000036216",
        "address": "9 DEKALB AVENUE, BROOKLYN",
        "date": "2023-05-02",
        "reason": "Manual file already contains a Downtown Brooklyn / 9 DeKalb Avenue architecture milestone.",
    },
    {
        "source_dataset_id": DOB_NOW_ID,
        "source_record_id": "CO-000062375",
        "address": "60 WHARF DRIVE, BROOKLYN",
        "date": "2024-09-17",
        "reason": "Already present in manual architecture milestones as DOB NOW final CO for 60 WHARF DRIVE.",
    },
    {
        "source_dataset_id": LEGACY_ID,
        "source_record_id": "120481246",
        "address": "625 WEST 57 STREET, MANHATTAN",
        "date": "2016-03-14",
        "reason": "Manual file already contains VIA 57 West completion; legacy temporary CO would duplicate that project without adding a distinct observed-change type.",
    },
    {
        "source_dataset_id": LEGACY_ID,
        "source_record_id": "121331059",
        "address": "626 1ST AVENUE, MANHATTAN",
        "date": "2016-11-25",
        "reason": "Manual file already contains the American Copper Buildings residential-use milestone for 626 First Avenue.",
    },
    {
        "source_dataset_id": LEGACY_ID,
        "source_record_id": "121328205",
        "address": "217 WEST 57TH STREET, MANHATTAN",
        "date": "2019-09-12",
        "reason": "Manual file already contains Central Park Tower completed-status milestone; a temporary CO row would need reconciliation with the existing source.",
    },
    {
        "source_dataset_id": DOB_NOW_ID,
        "source_record_id": "CO-000061990",
        "address": "8 SPRUCE STREET, MANHATTAN",
        "date": "2024-10-04",
        "reason": "Renewal-with-change row for an already documented major building; excluded because it is not final/initial and is likely renewal noise.",
    },
    {
        "source_dataset_id": DOB_NOW_ID,
        "source_record_id": "CO-000021826",
        "address": "555 WEST 38TH STREET, MANHATTAN",
        "date": "2022-07-07",
        "reason": "High-unit renewal-with-change row excluded because this pass prioritized final, temporary, or initial occupancy milestones.",
    },
]


def fetch_json(url, params=None):
    response = requests.get(url, params=params, timeout=60)
    response.raise_for_status()
    return response.json()


def soda_rows(dataset_id, params):
    return fetch_json(f"{API_BASE}/{dataset_id}.json", params)


def all_soda_rows(dataset_id, params):
    rows = []
    offset = 0
    while True:
        page_params = dict(params)
        page_params["$limit"] = 50000
        page_params["$offset"] = offset
        page = soda_rows(dataset_id, page_params)
        rows.extend(page)
        if len(page) < 50000:
            return rows
        offset += 50000


def parse_dob_now_date(value):
    if not value:
        return None
    normalized = re.sub(r"\s+", " ", value.strip())
    for fmt in ("%m/%d/%y %I:%M:%S %p", "%m/%d/%Y %I:%M:%S %p"):
        try:
            return datetime.strptime(normalized, fmt).date()
        except ValueError:
            continue
    return None


def parse_legacy_date(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "")).date()


def to_int(value):
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return None


def to_float(value):
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return None


def row_url(dataset_id, socrata_row_id):
    return f"{API_BASE}/{dataset_id}/{quote(socrata_row_id, safe='~_-')}.json"


def dataset_page_url(dataset_id):
    if dataset_id == DOB_NOW_ID:
        return f"{BASE}/Housing-Development/DOB-NOW-Certificate-of-Occupancy/{dataset_id}"
    return f"{BASE}/Housing-Development/DOB-Certificate-Of-Occupancy/{dataset_id}"


def query_url(dataset_id, params):
    return f"{API_BASE}/{dataset_id}.json?{urlencode(params)}"


def normalize_text(value):
    return re.sub(
        r"\s+",
        " ",
        str(value).upper().replace("AVENUE", "AVE").replace("STREET", "ST").replace("BOULEVARD", "BLVD"),
    ).strip()


def address_dob_now(row):
    return normalize_text(f"{row.get('house_no', '')} {row.get('street_name', '')}, {row.get('borough', '')}")


def address_legacy(row):
    return normalize_text(f"{row.get('house_number', '')} {row.get('street_name', '')}, {row.get('borough', '')}")


def slugify(value):
    slug = re.sub(r"[^a-z0-9]+", "_", str(value).lower()).strip("_")
    return re.sub(r"_+", "_", slug)


def iso_date(value):
    return value.isoformat() if value else None


def load_existing_keys():
    manual = json.loads(MANUAL_FILE.read_text(encoding="utf-8"))
    apps = set()
    jobs = set()
    address_text = []
    dob_like_count = 0
    nyc_count = 0
    for event in manual.get("events", []):
        if event.get("city_id") != "nyc":
            continue
        nyc_count += 1
        text = " ".join(
            str(event.get(key, ""))
            for key in [
                "event_id",
                "title",
                "summary",
                "observed_change",
                "area",
                "source_record_id",
                "source_url",
                "project_type",
            ]
        )
        normalized = normalize_text(text)
        address_text.append(normalized)
        apps.update(re.findall(r"CO-\d{6,}", text))
        jobs.update(re.findall(r"(?<!\d)([12345]\d{8})(?!\d)", text))
        if DOB_NOW_ID in text or LEGACY_ID in text or "DOB" in text.upper():
            dob_like_count += 1
    return {
        "nyc_event_count": nyc_count,
        "dob_like_event_count": dob_like_count,
        "application_numbers": apps,
        "job_numbers": jobs,
        "address_text": address_text,
    }


def manual_address_match(address, existing):
    normalized = normalize_text(address)
    tokens = [part for part in re.split(r"[\s,]+", normalized) if part and part not in {"MANHATTAN", "BROOKLYN", "BRONX", "QUEENS", "STATEN", "ISLAND"}]
    if len(tokens) < 3:
        return False
    needles = [normalize_text(" ".join(tokens)), normalize_text(" ".join(tokens[:3]))]
    return any(any(needle and needle in event_text for needle in needles) for event_text in existing["address_text"])


def selected_row_by_key(rows, key_field, selected_keys, date_parser, status_field=None, final_field=None):
    grouped = defaultdict(list)
    for row in rows:
        key = row.get(key_field)
        if key in selected_keys:
            grouped[key].append(row)
    missing = [key for key in selected_keys if key not in grouped]
    if missing:
        raise RuntimeError(f"Missing selected rows for {key_field}: {missing}")

    selected = {}
    for key, group in grouped.items():
        if final_field == "c_of_o_filing_type":
            rank = {"Final": 0, "Initial": 1}
            selected[key] = sorted(group, key=lambda r: (rank.get(r.get(final_field), 9), date_parser(r.get("c_of_o_issuance_date")) or date.max))[0]
        elif final_field == "issue_type":
            finals = [row for row in group if row.get(final_field) == "Final"]
            pool = finals or group
            selected[key] = sorted(pool, key=lambda r: date_parser(r.get("c_o_issue_date")) or date.max)[0]
        else:
            selected[key] = sorted(group, key=lambda r: date_parser(r.get(status_field)) or date.max)[0]
    return selected


def grouped_related(rows, dataset_id, group_key):
    related = []
    for row in rows:
        if dataset_id == DOB_NOW_ID:
            key = (row.get("job_filing_name"), row.get("bin"), address_dob_now(row))
            source_date = parse_dob_now_date(row.get("c_of_o_issuance_date"))
            record_id = row.get("application_number")
            filing_type = row.get("c_of_o_filing_type")
            source_date_raw = row.get("c_of_o_issuance_date")
        else:
            key = (row.get("job_number"), row.get("bin_number") or row.get("bin"), address_legacy(row))
            source_date = parse_legacy_date(row.get("c_o_issue_date"))
            record_id = row.get("job_number")
            filing_type = row.get("issue_type")
            source_date_raw = row.get("c_o_issue_date")
        if key != group_key:
            continue
        related.append(
            {
                "source_record_id": record_id,
                "socrata_row_id": row.get(":id"),
                "socrata_row_url": row_url(dataset_id, row.get(":id")),
                "source_date": iso_date(source_date),
                "source_date_raw": source_date_raw,
                "co_milestone_type": filing_type,
            }
        )
    return sorted(related, key=lambda item: (item.get("source_date") or "", item.get("source_record_id") or ""))


def candidate_from_dob_now(row, all_rows, existing):
    issue_date = parse_dob_now_date(row.get("c_of_o_issuance_date"))
    units = to_int(row.get("number_of_dwelling_units"))
    address = address_dob_now(row)
    row_id = row.get(":id")
    group_key = (row.get("job_filing_name"), row.get("bin"), address)
    related = grouped_related(all_rows, DOB_NOW_ID, group_key)
    filing_type = row.get("c_of_o_filing_type")
    candidate_id = f"nyc_dob_now_co_{slugify(row.get('application_number'))}_{slugify(address)}_{issue_date.year}"
    source_url = row_url(DOB_NOW_ID, row_id)
    duplicate_screen = {
        "application_number_in_manual": row.get("application_number") in existing["application_numbers"],
        "job_filing_name_in_manual": row.get("job_filing_name") in existing["job_numbers"],
        "address_text_match_in_manual": manual_address_match(address, existing),
    }

    return {
        "city_id": "nyc",
        "candidate_id": candidate_id,
        "title": f"DOB NOW {filing_type.lower()} certificate of occupancy issued for {address}",
        "summary": (
            f"NYC DOB NOW Certificate of Occupancy row {row.get('application_number')} records "
            f"c_of_o_status={row.get('c_of_o_status')}, c_of_o_filing_type={filing_type}, and "
            f"c_of_o_issuance_date={row.get('c_of_o_issuance_date')} for {address} with "
            f"{units} dwelling units."
        ),
        "observed_change": (
            f"DOB recorded a {filing_type.lower()} certificate-of-occupancy issuance for "
            f"{row.get('job_type')} filing {row.get('job_filing_name')} at {address}; the row lists "
            f"{units} dwelling units."
        ),
        "date": iso_date(issue_date),
        "effective_date": iso_date(issue_date),
        "date_precision": "day",
        "source_ids": [DOB_NOW_SOURCE_ID],
        "source_id": DOB_NOW_SOURCE_ID,
        "source_dataset_id": DOB_NOW_ID,
        "source_name": "DOB NOW: Certificate of Occupancy",
        "publisher": "NYC Department of Buildings via NYC Open Data",
        "source_url": source_url,
        "dataset_page_url": dataset_page_url(DOB_NOW_ID),
        "source_record_id": f"{row.get('application_number')} / Socrata row {row_id} / job filing {row.get('job_filing_name')}",
        "source_type": "official open dataset row",
        "accessed_at": ACCESSED_AT,
        "source_date_field": "c_of_o_issuance_date",
        "source_date_raw": row.get("c_of_o_issuance_date"),
        "latitude": to_float(row.get("latitude")),
        "longitude": to_float(row.get("longitude")),
        "geometry_source": "DOB NOW Certificate of Occupancy latitude and longitude fields.",
        "geometry_precision": "DOB geocoded address-level point; not a surveyed building footprint, unit boundary, or parcel polygon.",
        "confidence": "documented",
        "project_type": "large DOB NOW certificate-of-occupancy record with dwelling units",
        "license_or_terms_note": (
            "NYC Open Data states datasets are available without restriction, subject to NYC.gov terms, "
            "privacy policy, agency terms, and no warranty for completeness, accuracy, or fitness. Preserve DOB/NYC Open Data attribution."
        ),
        "terms_urls": [TERMS_URL, NYC_GOV_TERMS_URL],
        "attribution": "Department of Buildings (DOB), NYC Open Data",
        "limitations": (
            "This record supports only DOB certificate-of-occupancy status for the application. It does not claim construction "
            "completion, public opening, resident move-in, tenant operations, full project closeout, design authorship, or any "
            "causal outcome. The row does not describe nonresidential use details beyond the DOB fields shown."
        ),
        "transformation_method": (
            "Queried DOB NOW CO pkdm-hqz6, parsed the text issuance date locally, filtered to 2008-01-01 through "
            "2026-05-19, retained CO Issued rows with coordinates, final/initial filing type, and at least 100 dwelling "
            "units, grouped repeated rows by job_filing_name/BIN/address, ranked by dwelling units and milestone type, "
            "then screened data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json by application "
            "number, job filing name, and normalized address text."
        ),
        "group_key": {
            "application_number": row.get("application_number"),
            "job_filing_name": row.get("job_filing_name"),
            "bin": row.get("bin"),
            "address": address,
        },
        "duplicate_screen": duplicate_screen,
        "related_group_rows": related,
        "raw_row": row,
    }


def candidate_from_legacy(row, all_rows, existing):
    issue_date = parse_legacy_date(row.get("c_o_issue_date"))
    units = to_int(row.get("pr_dwelling_unit"))
    address = address_legacy(row)
    row_id = row.get(":id")
    group_key = (row.get("job_number"), row.get("bin_number") or row.get("bin"), address)
    related = grouped_related(all_rows, LEGACY_ID, group_key)
    issue_type = row.get("issue_type")
    candidate_id = f"nyc_dob_legacy_co_{slugify(row.get('job_number'))}_{slugify(address)}_{issue_date.year}"
    source_url = row_url(LEGACY_ID, row_id)
    duplicate_screen = {
        "job_number_in_manual": row.get("job_number") in existing["job_numbers"],
        "address_text_match_in_manual": manual_address_match(address, existing),
    }

    return {
        "city_id": "nyc",
        "candidate_id": candidate_id,
        "title": f"DOB {issue_type.lower()} certificate of occupancy issued for {address}",
        "summary": (
            f"NYC DOB Certificate Of Occupancy row for job {row.get('job_number')} records "
            f"application_status_raw={row.get('application_status_raw')}, issue_type={issue_type}, and "
            f"c_o_issue_date={row.get('c_o_issue_date')} for {address} with {units} proposed dwelling units."
        ),
        "observed_change": (
            f"DOB recorded a {issue_type.lower()} certificate-of-occupancy issuance for {row.get('job_type')} job "
            f"{row.get('job_number')} at {address}; the row lists {units} proposed dwelling units."
        ),
        "date": iso_date(issue_date),
        "effective_date": iso_date(issue_date),
        "date_precision": "day",
        "source_ids": [LEGACY_SOURCE_ID],
        "source_id": LEGACY_SOURCE_ID,
        "source_dataset_id": LEGACY_ID,
        "source_name": "DOB Certificate Of Occupancy",
        "publisher": "NYC Department of Buildings via NYC Open Data",
        "source_url": source_url,
        "dataset_page_url": dataset_page_url(LEGACY_ID),
        "source_record_id": f"job {row.get('job_number')} / Socrata row {row_id}",
        "source_type": "official open dataset row",
        "accessed_at": ACCESSED_AT,
        "source_date_field": "c_o_issue_date",
        "source_date_raw": row.get("c_o_issue_date"),
        "latitude": to_float(row.get("latitude")),
        "longitude": to_float(row.get("longitude")),
        "geometry_source": "DOB Certificate Of Occupancy latitude and longitude fields.",
        "geometry_precision": "DOB geocoded address-level point; not a surveyed building footprint, unit boundary, or parcel polygon.",
        "confidence": "documented",
        "project_type": "large legacy DOB certificate-of-occupancy record with proposed dwelling units",
        "license_or_terms_note": (
            "NYC Open Data states datasets are available without restriction, subject to NYC.gov terms, "
            "privacy policy, agency terms, and no warranty for completeness, accuracy, or fitness. Preserve DOB/NYC Open Data attribution."
        ),
        "terms_urls": [TERMS_URL, NYC_GOV_TERMS_URL],
        "attribution": "Department of Buildings (DOB), NYC Open Data",
        "limitations": (
            "This record supports only DOB certificate-of-occupancy status for the application. It does not claim construction "
            "completion, public opening, resident move-in, tenant operations, full project closeout, design authorship, or any "
            "causal outcome. Legacy rows can include repeated temporary COs and should be reconciled against DOB NOW for post-March-2021 records."
        ),
        "transformation_method": (
            "Queried legacy DOB CO bs8b-p36w with c_o_issue_date between 2008-01-01 and 2026-05-19, then for candidate "
            "selection retained the dataset's stated main coverage period through March 2021, issued NB/A1 rows with coordinates, "
            "Final or Temporary issue_type, and at least 100 proposed dwelling units. Repeated rows were grouped by "
            "job_number/BIN/address; final CO rows were preferred over temporary rows; candidates were screened against "
            "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json by job number and normalized address text."
        ),
        "group_key": {
            "job_number": row.get("job_number"),
            "bin_number": row.get("bin_number"),
            "bin": row.get("bin"),
            "address": address,
        },
        "duplicate_screen": duplicate_screen,
        "related_group_rows": related,
        "raw_row": row,
    }


def rejected_rows(existing):
    rejected = []
    for item in MANUAL_REJECTS:
        dataset_id = item["source_dataset_id"]
        source_record_id = item["source_record_id"]
        if dataset_id == DOB_NOW_ID:
            params = {"$select": "*, :id", "application_number": source_record_id}
        else:
            params = {"$select": "*, :id", "job_number": source_record_id}
        rows = soda_rows(dataset_id, params)
        row = rows[0] if rows else {}
        row_id = row.get(":id")
        rejected.append(
            {
                "source_dataset_id": dataset_id,
                "source_name": "DOB NOW: Certificate of Occupancy" if dataset_id == DOB_NOW_ID else "DOB Certificate Of Occupancy",
                "source_record_id": source_record_id,
                "socrata_row_id": row_id,
                "source_url": row_url(dataset_id, row_id) if row_id else query_url(dataset_id, params),
                "date": item["date"],
                "address": item["address"],
                "reason": item["reason"],
                "raw_row": row,
            }
        )

    rejected.append(
        {
            "source_dataset_id": LEGACY_ID,
            "source_record_id": "post_2021_legacy_rows",
            "source_url": dataset_page_url(LEGACY_ID),
            "reason": (
                "Rows after March 2021 were not accepted from bs8b-p36w unless separately reconciled, because the dataset "
                "description says DOB NOW pkdm-hqz6 should be used for COs issued since March 2021."
            ),
        }
    )
    rejected.append(
        {
            "source_dataset_id": DOB_NOW_ID,
            "source_record_id": "renewal_only_high_unit_rows",
            "source_url": dataset_page_url(DOB_NOW_ID),
            "reason": (
                "High-unit Renewal With Change and Renewal Without Change rows were not accepted as new candidates in this pass; "
                "they are useful audit signals but often represent repeated/ongoing CO renewals rather than distinct final or initial occupancy milestones."
            ),
        }
    )
    return rejected


def build_source_audits(dob_now_meta, legacy_meta, dob_now_all, legacy_window_rows, existing, candidates):
    dob_now_dates = [parse_dob_now_date(row.get("c_of_o_issuance_date")) for row in dob_now_all]
    dob_now_in_window = [value for value in dob_now_dates if value and START <= value <= END]
    legacy_count_window = soda_rows(
        LEGACY_ID,
        {
            "$select": "count(*)",
            "$where": "c_o_issue_date between '2008-01-01T00:00:00' and '2026-05-19T23:59:59'",
        },
    )[0]["count"]

    return [
        {
            "source_id": DOB_NOW_SOURCE_ID,
            "source_name": dob_now_meta.get("name"),
            "publisher": "NYC Department of Buildings via NYC Open Data",
            "dataset_id": DOB_NOW_ID,
            "dataset_page_url": dataset_page_url(DOB_NOW_ID),
            "api_url": f"{API_BASE}/{DOB_NOW_ID}.json",
            "metadata_url": f"{BASE}/api/views/{DOB_NOW_ID}",
            "source_type": "official open dataset",
            "attribution": dob_now_meta.get("attribution") or "Department of Buildings (DOB)",
            "terms_note": (
                "NYC Open Data terms apply; the portal states public datasets are available without restriction, "
                "but subject to NYC.gov terms/privacy/agency terms and no warranty. Cite DOB and NYC Open Data."
            ),
            "terms_urls": [TERMS_URL, NYC_GOV_TERMS_URL],
            "coverage_years_queried": {"start": 2008, "end": 2026},
            "published_coverage_note": "DOB NOW module was released in March 2021; use this dataset from that point onward per dataset description.",
            "update_frequency": dob_now_meta.get("metadata", {}).get("custom_fields", {}).get("Update", {}).get("Update Frequency"),
            "geographic_scope": "New York City DOB certificate-of-occupancy records with address/BIN/BBL and latitude/longitude fields when geocoded.",
            "granularity": "Certificate-of-occupancy application/sequence row; repeated rows can occur for renewal, sequence, or status changes.",
            "source_date_fields": ["submitted_date", "c_of_o_issuance_date"],
            "geometry_fields": ["latitude", "longitude", "bbl", "bin"],
            "row_url_pattern": f"{API_BASE}/{DOB_NOW_ID}/{{socrata_row_id}}.json",
            "query_window_method": "Fetched CO Issued rows with non-null c_of_o_issuance_date and coordinates, then parsed text dates locally.",
            "queried_rows_with_dates_and_coordinates_in_window": len(dob_now_in_window),
            "accepted_candidate_count": sum(1 for candidate in candidates if candidate["source_dataset_id"] == DOB_NOW_ID),
            "reliability_assessment": "strong for DOB-issued CO status; usable with caveats for project completion/opening semantics.",
            "required_caveats": [
                "CO issuance is an administrative/legal-occupancy record, not a public opening or full construction-completion claim.",
                "c_of_o_issuance_date is a text field and must be parsed carefully before date-window filtering.",
                "Renewal rows can duplicate earlier occupancy milestones and should not be counted as new city-change events without review.",
                "Dwelling-unit counts are DOB row values; nonresidential occupancy/use details may require CO PDFs or BIS/DOB NOW follow-up.",
            ],
        },
        {
            "source_id": LEGACY_SOURCE_ID,
            "source_name": legacy_meta.get("name"),
            "publisher": "NYC Department of Buildings via NYC Open Data",
            "dataset_id": LEGACY_ID,
            "dataset_page_url": dataset_page_url(LEGACY_ID),
            "api_url": f"{API_BASE}/{LEGACY_ID}.json",
            "metadata_url": f"{BASE}/api/views/{LEGACY_ID}",
            "source_type": "official open dataset",
            "attribution": "Department of Buildings (DOB)",
            "terms_note": (
                "NYC Open Data terms apply; the portal states public datasets are available without restriction, "
                "but subject to NYC.gov terms/privacy/agency terms and no warranty. Cite DOB and NYC Open Data."
            ),
            "terms_urls": [TERMS_URL, NYC_GOV_TERMS_URL],
            "coverage_years_queried": {"start": 2008, "end": 2026},
            "published_coverage_note": "Dataset description says it contains COs issued from 2012-07-12 to March 2021 and points users to DOB NOW for later COs.",
            "update_frequency": legacy_meta.get("metadata", {}).get("custom_fields", {}).get("Update", {}).get("Update Frequency"),
            "geographic_scope": "New York City DOB certificate-of-occupancy records with address/BIN/BBL and latitude/longitude/location fields when geocoded.",
            "granularity": "Certificate-of-occupancy application/job row; repeated temporary CO rows can occur for the same job and address.",
            "source_date_fields": ["c_o_issue_date"],
            "geometry_fields": ["latitude", "longitude", "location", "bbl", "bin", "bin_number"],
            "row_url_pattern": f"{API_BASE}/{LEGACY_ID}/{{socrata_row_id}}.json",
            "query_window_method": "Used calendar-date SoQL filter for 2008-01-01 through 2026-05-19; accepted candidates mainly from the dataset's stated pre-DOB-NOW coverage.",
            "queried_rows_in_full_date_window": int(legacy_count_window),
            "queried_candidate_pool_rows_pre_dob_now_with_coordinates": len(legacy_window_rows),
            "accepted_candidate_count": sum(1 for candidate in candidates if candidate["source_dataset_id"] == LEGACY_ID),
            "reliability_assessment": "strong for issued legacy CO status; usable with caveats for post-2021 coverage and repeated temporary rows.",
            "required_caveats": [
                "Legacy dataset's stated coverage begins 2012-07-12, so the 2008-01-01 query window has no earlier legacy CO coverage.",
                "For COs since March 2021, DOB NOW is the preferred source per the dataset description.",
                "Temporary CO rows can recur many times for one building and must be grouped by job/BIN/address.",
                "CO issuance does not document public opening, full occupation, construction completion, or outcome effects.",
            ],
        },
        {
            "source_id": "manual-architecture-milestones-duplicate-screen",
            "source_name": "Existing architecture milestones manual drop",
            "publisher": "Bims-5 local corpus",
            "source_url": str(MANUAL_FILE),
            "source_type": "local duplicate-screen input",
            "accessed_at": ACCESSED_AT,
            "nyc_event_count": existing["nyc_event_count"],
            "dob_like_event_count": existing["dob_like_event_count"],
            "application_numbers_detected": len(existing["application_numbers"]),
            "job_numbers_detected": len(existing["job_numbers"]),
            "method": "Screened source_record_id, source_url, event title/summary/area text, CO application numbers, DOB job numbers, and normalized address fragments before accepting candidates.",
        },
    ]


def main():
    existing = load_existing_keys()
    dob_now_meta = fetch_json(f"{BASE}/api/views/{DOB_NOW_ID}")
    legacy_meta = fetch_json(f"{BASE}/api/views/{LEGACY_ID}")

    dob_now_all = all_soda_rows(
        DOB_NOW_ID,
        {
            "$select": "*, :id",
            "$where": "c_of_o_status='CO Issued' AND c_of_o_issuance_date IS NOT NULL AND latitude IS NOT NULL AND longitude IS NOT NULL",
        },
    )
    dob_now_final_initial = [
        row
        for row in dob_now_all
        if row.get("c_of_o_filing_type") in {"Final", "Initial"}
        and (parse_dob_now_date(row.get("c_of_o_issuance_date")) is not None)
        and START <= parse_dob_now_date(row.get("c_of_o_issuance_date")) <= END
    ]
    dob_now_selected = selected_row_by_key(
        dob_now_final_initial,
        "application_number",
        set(DOB_NOW_SELECTED),
        parse_dob_now_date,
        final_field="c_of_o_filing_type",
    )

    legacy_full_window = all_soda_rows(
        LEGACY_ID,
        {
            "$select": "*, :id",
            "$where": (
                "c_o_issue_date between '2008-01-01T00:00:00' and '2026-05-19T23:59:59' "
                "AND latitude IS NOT NULL AND longitude IS NOT NULL AND application_status_raw='Issued' "
                "AND issue_type in('Final','Temporary') AND job_type in('NB','A1') "
                "AND pr_dwelling_unit IS NOT NULL AND pr_dwelling_unit != '0'"
            ),
        },
    )
    legacy_candidate_pool = [
        row
        for row in legacy_full_window
        if (parse_legacy_date(row.get("c_o_issue_date")) is not None)
        and parse_legacy_date(row.get("c_o_issue_date")) <= date(2021, 3, 31)
    ]
    legacy_selected = selected_row_by_key(
        legacy_candidate_pool,
        "job_number",
        set(LEGACY_SELECTED),
        parse_legacy_date,
        final_field="issue_type",
    )

    candidates = []
    for application_number in DOB_NOW_SELECTED:
        candidates.append(candidate_from_dob_now(dob_now_selected[application_number], dob_now_final_initial, existing))
    for job_number in LEGACY_SELECTED:
        candidates.append(candidate_from_legacy(legacy_selected[job_number], legacy_candidate_pool, existing))

    candidates = sorted(candidates, key=lambda item: (item["date"], item["candidate_id"]))
    source_audits = build_source_audits(dob_now_meta, legacy_meta, dob_now_all, legacy_candidate_pool, existing, candidates)
    rejected = rejected_rows(existing)

    output = {
        "schema_version": "1.0.0",
        "created_at": ACCESSED_AT,
        "task": "NYC official DOB Certificate of Occupancy high-signal candidate scan, 2008-01-01 through 2026-05-19.",
        "scope_note": (
            "Candidates are DOB certificate-of-occupancy records only. They do not claim construction completion, public opening, "
            "tenant move-in, or causal effects beyond the CO row's status and issue date."
        ),
        "source_audits": source_audits,
        "candidates": candidates,
        "rejected": rejected,
    }
    (OUT_DIR / "candidates.json").write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    notes = f"""# NYC DOB CO high-signal scan

Accessed: {ACCESSED_AT}

Queried official NYC Open Data Socrata datasets:

- DOB NOW: Certificate of Occupancy (`{DOB_NOW_ID}`): {dataset_page_url(DOB_NOW_ID)}
- DOB Certificate Of Occupancy (`{LEGACY_ID}`): {dataset_page_url(LEGACY_ID)}

## Date handling

- Legacy `bs8b-p36w` exposes `c_o_issue_date` as a calendar date, so the full 2008-01-01 through 2026-05-19 window was filtered with SoQL.
- DOB NOW `pkdm-hqz6` exposes `c_of_o_issuance_date` as text, so rows were fetched from the official API and parsed locally before applying the same date window.
- The legacy dataset description says it covers 2012-07-12 through March 2021 and points users to DOB NOW for COs since March 2021. Accepted legacy candidates therefore come from the stated pre-DOB-NOW coverage period.

## Selection

- Accepted {len(candidates)} candidates: {sum(1 for candidate in candidates if candidate['source_dataset_id'] == DOB_NOW_ID)} DOB NOW rows and {sum(1 for candidate in candidates if candidate['source_dataset_id'] == LEGACY_ID)} legacy rows.
- Prioritized issued rows with coordinates, final/initial DOB NOW filing types, final/temporary legacy issue types, and large dwelling-unit counts.
- Grouped repeated records by application/job number, BIN, and normalized address. Final CO rows were preferred over temporary rows in legacy groups.
- Screened `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json` by CO application number, DOB job number, source URL/record ID, and normalized address/title text.

## Terms and attribution

NYC Open Data terms apply. Keep Department of Buildings and NYC Open Data attribution with row-level Socrata URLs. The portal terms also disclaim completeness, accuracy, and fitness for purpose, so downstream UI should show source limitations inline.

## Use caveats

- A CO row is an official administrative/legal-occupancy record. Do not convert it into a construction completion, building opening, resident move-in, or project-impact claim.
- Dwelling-unit counts are the values published by DOB in the row; nonresidential use details are not fully represented in these two table schemas.
- Renewal rows can be high-count but noisy; this pass excluded renewal-only candidates except in the rejected audit examples.
- Coordinates are DOB/Open Data geocoded points, not measured footprints.
"""
    (OUT_DIR / "notes.md").write_text(notes, encoding="utf-8")


if __name__ == "__main__":
    main()
