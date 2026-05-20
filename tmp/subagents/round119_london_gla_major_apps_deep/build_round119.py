import datetime as dt
import hashlib
import io
import json
import re
import textwrap
import time
from pathlib import Path
from urllib.parse import unquote, urljoin

import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[3]
OUT_DIR = Path(__file__).resolve().parent
ACCESS_DATE = "2026-05-19"
PLD_SEARCH = "https://planningdata.london.gov.uk/api-guest/applications/_search"
PLD_SOURCE = "https://planningdata.london.gov.uk/api-guest/applications/_source"
GLA_DECISIONS = "https://www.london.gov.uk/programmes-strategies/planning/planning-applications-and-decisions/planning-application-decisions"
PLD_HEADERS = {
    "Content-Type": "application/json",
    "X-API-AllowRequest": "be2rmRnt&",
    "User-Agent": "Bims-5-round119-london-gla-major-apps/0.1",
}
HTTP_HEADERS = {"User-Agent": "Bims-5-round119-london-gla-major-apps/0.1"}


def clean(value, limit=None):
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if limit and len(text) > limit:
        return textwrap.shorten(text, width=limit, placeholder="...")
    return text


def slug(value, limit=76):
    text = unquote(str(value or "")).lower()
    text = re.sub(r"[^a-z0-9]+", "_", text).strip("_")
    return text[:limit].strip("_") or "record"


def norm_text(value):
    return re.sub(r"[^a-z0-9]+", " ", unquote(str(value or "")).lower()).strip()


def iso_date(value):
    value = clean(value)
    if not value:
        return ""
    for fmt in ("%d/%m/%Y", "%d %B %Y", "%Y-%m-%d"):
        try:
            return dt.datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            pass
    return ""


def filename_key(url):
    if not url:
        return ""
    return norm_text(unquote(str(url).rstrip("/").split("/")[-1]))


def canonical_url(url):
    if not url:
        return ""
    absolute = urljoin("https://www.london.gov.uk", str(url))
    return unquote(absolute).replace(" ", "%20")


def read_text_if_exists(path):
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except FileNotFoundError:
        return ""


def collect_existing_index():
    blobs = []
    paths = [
        ROOT / "data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json",
        ROOT / "tmp/round116_existing_london_planning_events.json",
        ROOT / "tmp/round116_existing_london_events_snapshot.json",
    ]
    paths.extend((ROOT / "tmp/subagents").glob("london*.json"))
    paths.extend(p for p in (ROOT / "tmp/subagents").glob("round*/candidates.json") if "london" in str(p).lower())
    for path in paths:
        if path.resolve() == (OUT_DIR / "candidates.json").resolve():
            continue
        text = read_text_if_exists(path)
        if text:
            blobs.append(text)
    blob = "\n".join(blobs)
    lowered = blob.lower()
    urls = set(re.findall(r'https?://[^"\s]+', blob))
    filenames = {filename_key(url) for url in urls if filename_key(url)}
    pld_ids = {m.group(1).lower() for m in re.finditer(r"applications/_(?:source|doc)/([^\"'\s,}]+)", blob)}
    pld_ids.update(m.group(1).lower() for m in re.finditer(r"\bPLD:([A-Za-z0-9_&./-]+)", blob))
    gla_refs = {m.group(0).lower() for m in re.finditer(r"GLA/\s*[0-9][0-9A-Za-z/ &-]*", blob)}
    return {
        "text": lowered,
        "urls": {unquote(url).lower() for url in urls},
        "filenames": filenames,
        "pld_ids": pld_ids,
        "gla_refs": gla_refs,
    }


def pld_post(body, attempts=3):
    last_exc = None
    for attempt in range(attempts):
        try:
            response = requests.post(PLD_SEARCH, headers=PLD_HEADERS, json=body, timeout=90)
            response.raise_for_status()
            return response.json()
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"PLD query failed: {last_exc}")


PLD_FIELDS = [
    "id",
    "lpa_name",
    "lpa_app_no",
    "site_name",
    "site_number",
    "street_name",
    "secondary_street_name",
    "postcode",
    "description",
    "decision_date",
    "valid_date",
    "decision",
    "status",
    "application_type_full",
    "application_type",
    "development_type",
    "centroid",
    "wgs84_polygon",
    "url_planning_app",
    "application_details.scheme_name",
    "application_details.total_gia_gained",
    "application_details.total_gia_lost",
    "application_details.site_area",
    "application_details.projected_cost_of_works",
    "application_details.residential_details.total_no_proposed_residential_units",
    "application_details.residential_details.total_no_proposed_residential_affordable_units",
    "application_details.building_details.no_storeys",
    "application_details.building_details.max_height",
    "last_updated",
]


def flatten_lon_lat(value):
    points = []
    def as_float(item):
        try:
            return float(item)
        except (TypeError, ValueError):
            return None

    if isinstance(value, list):
        lon_value = as_float(value[0]) if len(value) >= 1 else None
        lat_value = as_float(value[1]) if len(value) >= 2 else None
        if lon_value is not None and lat_value is not None:
            lon, lat = lon_value, lat_value
            if -0.7 <= lon <= 0.35 and 51.2 <= lat <= 51.75:
                points.append((lon, lat))
        else:
            for item in value:
                points.extend(flatten_lon_lat(item))
    elif isinstance(value, dict):
        for item in value.values():
            points.extend(flatten_lon_lat(item))
    return points


def geometry_from_row(row):
    polygon = row.get("wgs84_polygon")
    points = flatten_lon_lat(polygon)
    if points:
        lon = sum(p[0] for p in points) / len(points)
        lat = sum(p[1] for p in points) / len(points)
        if -0.7 <= lon <= 0.35 and 51.2 <= lat <= 51.75:
            return {
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "source": "Representative point computed from PLD wgs84_polygon coordinates.",
                "precision": "Representative point from supplied application polygon; not a measured building footprint or statutory red-line boundary.",
            }
    centroid = row.get("centroid") or {}
    try:
        lat = float(centroid.get("lat"))
        lon = float(centroid.get("lon"))
    except (TypeError, ValueError):
        lat = None
        lon = None
    if lat is not None and lon is not None and -0.7 <= lon <= 0.35 and 51.2 <= lat <= 51.75:
        return {
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "source": "Planning London Datahub centroid.",
            "precision": "Source centroid; approximate application navigation point, not a measured footprint.",
        }
    return None


def project_name(row):
    details = row.get("application_details") or {}
    return clean(details.get("scheme_name") or row.get("site_name") or row.get("street_name") or "unnamed major planning application", 120)


def application_summary_bits(row):
    details = row.get("application_details") or {}
    residential = details.get("residential_details") or {}
    bits = []
    units = residential.get("total_no_proposed_residential_units")
    affordable = residential.get("total_no_proposed_residential_affordable_units")
    gia = details.get("total_gia_gained")
    lost = details.get("total_gia_lost")
    building_details = details.get("building_details") or []
    storeys = [b.get("no_storeys") for b in building_details if isinstance(b, dict) and b.get("no_storeys")]
    heights = [b.get("max_height") for b in building_details if isinstance(b, dict) and b.get("max_height")]
    if units not in (None, "", 0):
        bits.append(f"{int(float(units))} proposed residential units")
    if affordable not in (None, "", 0):
        bits.append(f"{int(float(affordable))} proposed affordable units")
    if gia not in (None, "", 0):
        bits.append(f"{int(float(gia)):,} sqm GIA gained")
    if lost not in (None, "", 0):
        bits.append(f"{int(float(lost)):,} sqm GIA lost")
    if storeys:
        bits.append(f"building storeys recorded up to {int(max(float(s) for s in storeys))}")
    if heights:
        bits.append(f"building height recorded up to {int(max(float(h) for h in heights))}m")
    return bits


def classify_project(row):
    details = row.get("application_details") or {}
    text = " ".join(
        [
            project_name(row),
            clean(row.get("site_name")),
            clean(row.get("description")),
            clean(details.get("scheme_name")),
        ]
    ).lower()
    if "hospital" in text or "health" in text:
        return "healthcare / mixed-use redevelopment"
    if "station" in text or "rail" in text or "transport" in text:
        return "transport-adjacent mixed-use redevelopment"
    if "school" in text or "university" in text or "student" in text:
        return "education or student accommodation development"
    if "estate" in text or "regeneration" in text:
        return "estate regeneration / residential-led mixed-use redevelopment"
    if "gasworks" in text or "wharf" in text or "industrial" in text:
        return "former industrial land mixed-use redevelopment"
    if "office" in text or "commercial" in text:
        return "commercial or office-led mixed-use redevelopment"
    if "masterplan" in text or "comprehensive" in text:
        return "masterplan / comprehensive mixed-use redevelopment"
    return "major residential-led mixed-use planning application"


def bad_pld_row(row):
    text = " ".join([project_name(row), clean(row.get("description"))]).lower()
    bad_terms = [
        "variation of condition",
        "non-material",
        "non material",
        "reserved matters",
        "approval of reserved matters",
        "details pursuant",
        "discharge of",
        "minor amendment",
        "screening opinion",
        "scoping opinion",
        "eia screening",
        "eia scoping",
        "certificate of",
        "deed of variation",
        "variation of section 106",
        "application under section 73",
    ]
    return next((term for term in bad_terms if term in text), "")


def pld_candidate(row, query_label):
    rid = row.get("id")
    date = iso_date(row.get("decision_date"))
    year = date[:4]
    name = project_name(row)
    bits = application_summary_bits(row)
    description = clean(row.get("description"), 300)
    decision = clean(row.get("decision") or row.get("status") or "decision")
    lpa = clean(row.get("lpa_name") or row.get("borough") or "London planning authority")
    lpa_ref = clean(row.get("lpa_app_no"))
    geometry = geometry_from_row(row)
    detail_bits = f", including {', '.join(bits[:4])}" if bits else ""
    source_url = f"{PLD_SOURCE}/{rid}"
    return {
        "city_id": "london",
        "candidate_id": f"lon_arch_pld_{slug(name, 50)}_{year}_{hashlib.sha1(str(rid).encode()).hexdigest()[:7]}",
        "title": f"Planning London Datahub decision row for {name}",
        "summary": clean(
            f"The Planning London Datahub row {rid} records a {decision.lower()} planning decision on {date} for {name} in {lpa}{detail_bits}. Proposal text: {description}",
            600,
        ),
        "observed_change": clean(f"An official PLD application record documents the planning decision for the {name} proposal.", 260),
        "date": date,
        "effective_date": date,
        "date_precision": "day",
        "source_id": "gla-planning-datahub-applications",
        "source_ids": ["gla-planning-datahub-applications"],
        "source_name": "Planning London Datahub applications",
        "publisher": f"Greater London Authority / {lpa}",
        "source_url": source_url,
        "source_record_id": f"PLD:{rid}; LPA:{lpa_ref}" if lpa_ref else f"PLD:{rid}",
        "source_type": "official Planning London Datahub application API record",
        "accessed_at": ACCESS_DATE,
        "source_date_field": "PLD decision_date",
        "latitude": geometry["latitude"],
        "longitude": geometry["longitude"],
        "geometry_source": geometry["source"],
        "geometry_precision": geometry["precision"],
        "confidence": "documented",
        "project_type": classify_project(row),
        "license_or_terms_note": "London Datastore dataset page lists Licence: Not Specified; retain factual metadata, source row URL, and attribution pending reuse review.",
        "attribution": f"Greater London Authority / {lpa} / Planning London Datahub",
        "limitations": "Administrative planning decision row only. It does not prove demolition, construction start, completion, occupation, opening, delivery of homes/floorspace/public realm, design quality, or impacts. PLD status and geometry can vary by authority feed and should be checked against the local planning-register documents before publication.",
        "transformation_method": f"Round119 PLD major-applications query ({query_label}); retained decision_date within 2008-01-01 to 2026-05-19, official PLD row id, source geometry, major-development indicators, and duplicate screening against existing London titles, PLD ids, GLA/PDU refs, and source URLs.",
    }


def collect_pld_rows(existing):
    queries = [
        (
            "2008-2019 residential >= 400 units",
            {
                "size": 500,
                "query": {
                    "bool": {
                        "must": [
                            {"range": {"decision_date": {"gte": "01/01/2008", "lte": "31/12/2019", "format": "dd/MM/yyyy"}}},
                            {"range": {"application_details.residential_details.total_no_proposed_residential_units": {"gte": 400}}},
                            {"exists": {"field": "wgs84_polygon"}},
                        ]
                    }
                },
                "sort": [
                    {"application_details.residential_details.total_no_proposed_residential_units": {"order": "desc"}},
                    {"decision_date": {"order": "desc"}},
                ],
                "_source": PLD_FIELDS,
            },
        ),
        (
            "2008-2019 major redevelopment keywords",
            {
                "size": 500,
                "query": {
                    "bool": {
                        "must": [
                            {"range": {"decision_date": {"gte": "01/01/2008", "lte": "31/12/2019", "format": "dd/MM/yyyy"}}},
                            {"exists": {"field": "wgs84_polygon"}},
                            {
                                "query_string": {
                                    "query": '"mixed use" OR "mixed-use" OR masterplan OR "estate regeneration" OR "comprehensive redevelopment" OR "public realm" OR hospital OR station OR university',
                                    "fields": ["description", "site_name", "application_details.scheme_name"],
                                }
                            },
                        ]
                    }
                },
                "sort": [{"decision_date": {"order": "desc"}}],
                "_source": PLD_FIELDS,
            },
        ),
        (
            "2020-2026 stage/large backfill check",
            {
                "size": 350,
                "query": {
                    "bool": {
                        "must": [
                            {"range": {"decision_date": {"gte": "01/01/2020", "lte": "19/05/2026", "format": "dd/MM/yyyy"}}},
                            {"exists": {"field": "wgs84_polygon"}},
                            {
                                "query_string": {
                                    "query": '"call in" OR "called in" OR "public hearing" OR "stage 2" OR "strategic" OR "referable" OR "mayor"',
                                    "fields": ["description", "site_name", "application_details.scheme_name"],
                                }
                            },
                        ]
                    }
                },
                "sort": [{"decision_date": {"order": "desc"}}],
                "_source": PLD_FIELDS,
            },
        ),
    ]
    rows = []
    query_stats = []
    seen_ids = set()
    rejected = []
    for label, body in queries:
        payload = pld_post(body)
        hits = payload.get("hits", {}).get("hits", [])
        query_stats.append({"label": label, "total": payload.get("hits", {}).get("total"), "fetched": len(hits)})
        for hit in hits:
            row = hit.get("_source") or {}
            row["id"] = row.get("id") or hit.get("_id")
            rid = clean(row.get("id"))
            if not rid or rid in seen_ids:
                continue
            seen_ids.add(rid)
            geom = geometry_from_row(row)
            name = project_name(row)
            source_url = f"{PLD_SOURCE}/{rid}"
            reject_reason = ""
            if rid.lower() in existing["pld_ids"] or source_url.lower() in existing["urls"]:
                reject_reason = "duplicate PLD source row already present in corpus or prior subagent outputs"
            elif bad_pld_row(row):
                reject_reason = f"lower-signal PLD administrative amendment/detail row ({bad_pld_row(row)})"
            elif len(name) > 8 and name.lower() in existing["text"]:
                reject_reason = "scheme/site name already represented in the existing London architecture corpus"
            elif not geom:
                reject_reason = "no usable London point or polygon geometry"
            if reject_reason:
                if len(rejected) < 90:
                    rejected.append(
                        {
                            "city_id": "london",
                            "title": f"PLD row for {name}",
                            "source_record_id": f"PLD:{rid}",
                            "source_url": source_url,
                            "reason": reject_reason,
                        }
                    )
                continue
            rows.append((row, label))
    return rows, rejected, query_stats


def fetch_binary(url):
    response = requests.get(url, headers=HTTP_HEADERS, timeout=80)
    response.raise_for_status()
    return response.content


def pdf_text(url):
    pdf_dir = OUT_DIR / "pdf_cache"
    pdf_dir.mkdir(exist_ok=True)
    key = hashlib.sha1(url.encode("utf-8")).hexdigest()[:14]
    pdf_path = pdf_dir / f"{key}_{slug(filename_key(url), 60)}.pdf"
    txt_path = pdf_path.with_suffix(".txt")
    if txt_path.exists():
        return txt_path.read_text(encoding="utf-8", errors="ignore")
    data = fetch_binary(url)
    pdf_path.write_bytes(data)
    reader = PdfReader(io.BytesIO(data))
    pages = []
    for page in reader.pages[:4]:
        try:
            pages.append(page.extract_text() or "")
        except Exception:  # noqa: BLE001
            continue
    text = "\n".join(pages)
    txt_path.write_text(text, encoding="utf-8")
    return text


def parse_gla_page():
    html_path = OUT_DIR / "gla_planning_decisions_20260519.html"
    if html_path.exists():
        html = html_path.read_text(encoding="utf-8", errors="ignore")
    else:
        html = requests.get(GLA_DECISIONS, headers=HTTP_HEADERS, timeout=90).text
        html_path.write_text(html, encoding="utf-8")
    soup = BeautifulSoup(html, "html.parser")
    records = []
    for date_header in soup.find_all("h3"):
        date_text = clean(date_header.get_text(" "))
        date_iso = iso_date(date_text)
        if not date_iso:
            continue
        content = date_header.find_next_sibling("div")
        if not content:
            continue
        current_stage = ""
        for tag in content.find_all(["h2", "h3", "p", "ul"], recursive=True):
            if tag.name == "h2":
                stage = clean(tag.get_text(" "))
                if "Stage" in stage or "Public" in stage or "Call" in stage:
                    current_stage = stage
            if tag.name != "h3":
                continue
            site = clean(tag.get_text(" "))
            if not site or len(site) > 140 or site.lower().startswith(("final decision", "report", "stage")):
                continue
            links = []
            for sib in tag.find_next_siblings():
                if sib.name == "h3":
                    break
                if sib.name == "h2":
                    break
                for a in sib.find_all("a", href=True):
                    label = clean(a.get_text(" ")).lower()
                    href = canonical_url(a["href"])
                    if href.lower().endswith(".pdf"):
                        links.append((label, href))
                if links:
                    break
            if not links:
                continue
            decision_url = next((href for label, href in links if "decision" in label or "representation" in label), "")
            report_url = next((href for label, href in links if "report" in label), "")
            records.append(
                {
                    "date": date_iso,
                    "stage": current_stage or "Mayoral planning decision",
                    "site": site,
                    "decision_url": decision_url,
                    "report_url": report_url or decision_url,
                    "links": links,
                }
            )
    return records


def extract_after(label, text, stop_labels):
    match = re.search(label, text, re.IGNORECASE)
    if not match:
        return ""
    start = match.end()
    end = len(text)
    for stop in stop_labels:
        m = re.search(stop, text[start:], re.IGNORECASE)
        if m:
            end = min(end, start + m.start())
    return clean(text[start:end], 500)


def extract_gla_refs(text):
    gla = ""
    lpa = ""
    m = re.search(r"\bGLA/\s*([0-9][0-9A-Za-z]*(?:/[0-9A-Za-z]+)*(?:\s*&\s*[0-9][0-9A-Za-z]*(?:/[0-9A-Za-z]+)*)?)", text)
    if m:
        gla = clean("GLA/" + m.group(1), 80)
    patterns = [
        r"Local planning authority reference:\s*([A-Za-z0-9/._-]+)",
        r"planning application no\.?\s*([A-Za-z0-9/._-]+)",
        r"Your ref:\s*([A-Za-z0-9/._-]+)",
    ]
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            lpa = clean(m.group(1), 80)
            break
    return gla, lpa


def pld_match_for_gla(site, lpa_ref):
    def row_haystack(row):
        return norm_text(
            " ".join(
                [
                    project_name(row),
                    clean(row.get("site_name")),
                    clean(row.get("site_number")),
                    clean(row.get("street_name")),
                    clean(row.get("postcode")),
                    clean(row.get("description")),
                ]
            )
        )

    def site_overlap(site_text, row):
        hay = row_haystack(row)
        tokens = [token for token in norm_text(site_text).split() if len(token) > 2 or token.isdigit()]
        return sum(1 for token in tokens if token in hay)

    if lpa_ref:
        body = {
            "size": 8,
            "query": {"match_phrase": {"lpa_app_no": lpa_ref}},
            "_source": PLD_FIELDS,
        }
        payload = pld_post(body, attempts=2)
        lpa_norm = norm_text(lpa_ref)
        site_norm = norm_text(site)
        best = None
        best_score = -1
        exact_rows = []
        for hit in payload.get("hits", {}).get("hits", []):
            row = hit.get("_source") or {}
            row["id"] = row.get("id") or hit.get("_id")
            if norm_text(row.get("lpa_app_no")) != lpa_norm:
                continue
            if not geometry_from_row(row):
                continue
            exact_rows.append(row)
        for row in exact_rows:
            score = 20
            overlap = site_overlap(site, row)
            score += overlap * 4
            if site_norm and site_norm in row_haystack(row):
                score += 8
            if score > best_score:
                best = row
                best_score = score
        if len(exact_rows) > 1 and best and site_overlap(site, best) == 0:
            return None
        return best
    should = []
    if site:
        should.append({"match_phrase": {"site_name": site}})
        should.append({"match_phrase": {"description": site}})
    if not should:
        return None
    body = {
        "size": 8,
        "query": {"bool": {"should": should, "minimum_should_match": 1}},
        "_source": PLD_FIELDS,
    }
    payload = pld_post(body, attempts=2)
    best = None
    best_score = -1
    site_norm = norm_text(site)
    lpa_norm = norm_text(lpa_ref)
    for hit in payload.get("hits", {}).get("hits", []):
        row = hit.get("_source") or {}
        row["id"] = row.get("id") or hit.get("_id")
        score = 0
        if lpa_norm and norm_text(row.get("lpa_app_no")) == lpa_norm:
            score += 20
        hay = row_haystack(row)
        if site_norm and site_norm in hay:
            score += 8
        score += site_overlap(site, row) * 2
        if geometry_from_row(row):
            score += 5
        if score > best_score:
            best = row
            best_score = score
    return best if best_score >= 10 else None


def gla_candidate(record, existing):
    source_url = record.get("report_url") or record.get("decision_url")
    decision_url = record.get("decision_url")
    filename = filename_key(source_url)
    if filename in existing["filenames"] or source_url.lower() in existing["urls"]:
        return None, "duplicate GLA report/source URL already present"
    try:
        report_text = pdf_text(source_url)
        decision_text = pdf_text(decision_url) if decision_url and decision_url != source_url else ""
    except Exception as exc:  # noqa: BLE001
        return None, f"could not fetch/parse GLA PDF: {exc}"
    text = "\n".join([decision_text, report_text])
    gla_ref, lpa_ref = extract_gla_refs(text)
    if gla_ref.lower() in existing["gla_refs"]:
        return None, "duplicate GLA/PDU reference already present"
    proposal = extract_after(r"The proposal", report_text, [r"The applicant", r"Strategic issues", r"Recommendation", r"Site description"])
    applicant = extract_after(r"The applicant", report_text, [r"Strategic issues", r"Recommendation", r"Site description", r"Context"])
    pld_row = pld_match_for_gla(record["site"], lpa_ref)
    if not pld_row:
        return None, "no confident PLD geometry match for GLA report"
    geom = geometry_from_row(pld_row)
    if not geom:
        return None, "matched PLD row has no usable London geometry"
    rid = pld_row.get("id")
    if rid and rid.lower() in existing["pld_ids"]:
        return None, "matched PLD row already present in corpus"
    site = clean(record["site"])
    stage = clean(record["stage"] or "Mayoral planning decision")
    date = record["date"]
    source_ids = ["gla-planning-application-decisions", "gla-planning-datahub-applications"]
    source_record_bits = [bit for bit in [gla_ref, f"LPA:{lpa_ref}" if lpa_ref else "", f"PLD:{rid}" if rid else ""] if bit]
    candidate = {
        "city_id": "london",
        "candidate_id": f"lon_arch_gla_{slug(site, 48)}_{date[:4]}_{hashlib.sha1(source_url.encode()).hexdigest()[:7]}",
        "title": f"GLA {stage.lower()} record for {site}",
        "summary": clean(
            f"The Greater London Authority decision page records {stage} material dated {date} for {site}. "
            f"{'Proposal summary from the report: ' + proposal if proposal else 'The linked mayoral planning report/decision letter documents the strategic planning milestone.'}"
            f"{' Applicant/architect note: ' + applicant if applicant else ''}",
            700,
        ),
        "observed_change": clean(f"A Mayor of London strategic planning-process milestone was recorded for the {site} proposal.", 260),
        "date": date,
        "effective_date": date,
        "date_precision": "day",
        "source_id": "gla-planning-application-decisions",
        "source_ids": source_ids,
        "source_name": f"{site} {stage} report/decision",
        "publisher": "Greater London Authority / London City Hall",
        "source_url": source_url,
        "source_record_id": "; ".join(source_record_bits) or f"GLA decision page item: {site}",
        "source_type": "official mayoral strategic planning report or decision letter",
        "accessed_at": ACCESS_DATE,
        "source_date_field": "GLA planning application decisions page date heading / report date",
        "latitude": geom["latitude"],
        "longitude": geom["longitude"],
        "geometry_source": f"{geom['source']} Matched PLD row {rid} for LPA reference {lpa_ref or 'not extracted'} and site {site}.",
        "geometry_precision": geom["precision"],
        "confidence": "documented",
        "project_type": classify_project(pld_row),
        "license_or_terms_note": "GLA website terms apply to City Hall PDFs; PLD/London Datastore licence is Not Specified. Candidate retains factual metadata and source URLs only pending source-level reuse review.",
        "attribution": "Greater London Authority / London City Hall / Planning London Datahub",
        "limitations": "Mayoral Stage 1, Stage 2, public-hearing, call-in, or direction records are administrative planning-process milestones only. They do not document construction start, completion, occupation, opening, or effects. PLD geometry is used as an approximate navigation point and should be verified against application plans before publication.",
        "transformation_method": "Round119 scrape of official GLA planning application decisions page; parsed linked report/decision PDFs with pypdf, extracted GLA/LPA references and proposal text, matched LPA reference/site to Planning London Datahub geometry, and duplicate-screened by GLA/PDU ref, PLD id, title/site, and source URL.",
    }
    return candidate, ""


def build():
    existing = collect_existing_index()
    pld_rows, rejected, query_stats = collect_pld_rows(existing)
    candidates = []
    seen_titles = set()
    seen_sources = set()
    for row, label in pld_rows:
        candidate = pld_candidate(row, label)
        title_key = norm_text(candidate["title"])
        source_key = candidate["source_url"].lower()
        if title_key in seen_titles or source_key in seen_sources:
            rejected.append(
                {
                    "city_id": "london",
                    "title": candidate["title"],
                    "source_record_id": candidate["source_record_id"],
                    "source_url": candidate["source_url"],
                    "reason": "duplicate within round119 shortlist",
                }
            )
            continue
        seen_titles.add(title_key)
        seen_sources.add(source_key)
        candidates.append(candidate)
        if len([c for c in candidates if c["source_id"] == "gla-planning-datahub-applications"]) >= 50:
            break

    gla_records = parse_gla_page()
    gla_checked = 0
    for record in gla_records:
        if len(candidates) >= 76:
            break
        # Keep the GLA pass focused on Stage 2/public decision records with report links.
        if "stage 2" not in record.get("stage", "").lower() and "public" not in record.get("stage", "").lower() and "call" not in record.get("stage", "").lower():
            continue
        if not record.get("report_url"):
            continue
        candidate, reason = gla_candidate(record, existing)
        gla_checked += 1
        if candidate:
            title_key = norm_text(candidate["title"])
            source_key = candidate["source_url"].lower()
            if title_key not in seen_titles and source_key not in seen_sources:
                seen_titles.add(title_key)
                seen_sources.add(source_key)
                candidates.append(candidate)
        elif len(rejected) < 120:
            rejected.append(
                {
                    "city_id": "london",
                    "title": f"GLA record for {record.get('site')}",
                    "source_record_id": record.get("stage"),
                    "source_url": record.get("report_url") or record.get("decision_url"),
                    "reason": reason,
                }
            )
        if gla_checked >= 45 and len([c for c in candidates if c["source_id"] == "gla-planning-application-decisions"]) >= 12:
            break

    source_audits = [
        {
            "source_id": "gla-planning-datahub-applications",
            "source_name": "Planning London Datahub applications",
            "publisher": "Greater London Authority / London planning authorities",
            "source_url": "https://data.london.gov.uk/dataset/planning-london-datahub-applications-236qk/",
            "api_endpoint": PLD_SEARCH,
            "license_or_terms_note": "London Datastore dataset page lists Licence: Not Specified; this candidate file stores factual metadata, source row URLs, and derived representative coordinates pending reuse review.",
            "coverage_years": "Planning Datahub application rows include historical and current London planning authority feeds. This pass queried 2008-01-01 through 2026-05-19 and retained selected major-development rows.",
            "update_frequency": "Daily according to the London Datastore dataset page and existing source registry notes.",
            "geographic_scope": "Greater London planning authorities, including boroughs, LLDC, and OPDC-style planning authority feeds where present.",
            "key_fields_used": [
                "id",
                "lpa_name",
                "lpa_app_no",
                "site_name",
                "description",
                "decision",
                "status",
                "decision_date",
                "application_details.scheme_name",
                "application_details.residential_details.total_no_proposed_residential_units",
                "application_details.total_gia_gained",
                "application_details.building_details",
                "wgs84_polygon",
                "centroid",
                "url_planning_app",
            ],
            "reliability_assessment": "usable with caveats",
            "required_caveats": "PLD rows are administrative planning records and not evidence of construction, completion, occupation, opening, or effects. Borough feed coverage, backfill, status, and centroid quality vary. Candidate coordinates are representative navigation points from PLD geometry.",
            "ingestion_recommendation": "Use for selected administrative planning milestones where source row id, LPA reference, date field, geometry caveat, and limitations remain visible.",
            "accessed_at": ACCESS_DATE,
        },
        {
            "source_id": "gla-planning-application-decisions",
            "source_name": "Greater London Authority planning application decisions page and PDFs",
            "publisher": "Greater London Authority / London City Hall",
            "source_url": GLA_DECISIONS,
            "license_or_terms_note": "GLA website terms apply; this pass stores factual metadata and official PDF URLs, with minimal paraphrase.",
            "coverage_years": "The inspected decision page is a City Hall planning decision page with 2020 report/decision entries; PlanApps/City Hall strategic planning sources separately cover live/referred applications.",
            "update_frequency": "Decision/report-specific publication.",
            "geographic_scope": "Mayor of London strategic planning referrals, Stage 1/Stage 2 decisions, directions, call-in/public-hearing records, and related reports.",
            "key_fields_used": [
                "date heading",
                "stage heading",
                "site heading",
                "Final Decision PDF",
                "Report PDF",
                "GLA reference",
                "LPA planning application reference",
                "proposal block",
            ],
            "reliability_assessment": "strong for mayoral strategic planning-process milestones",
            "required_caveats": "GLA Stage 1, Stage 2, call-in, public-hearing, and direction records do not prove construction, completion, opening, or causal effects. Pair with PLD/local-register rows for geometry and source-row identifiers.",
            "ingestion_recommendation": "Use when the event wording is explicitly a mayoral planning-process milestone and links to the exact report/decision PDF.",
            "accessed_at": ACCESS_DATE,
        },
    ]

    output = {
        "generated_at": f"{ACCESS_DATE}T00:00:00Z",
        "task": "round119_london_gla_major_apps_deep",
        "source_audits": source_audits,
        "query_stats": query_stats,
        "candidates": candidates[:80],
        "rejected": rejected[:120],
    }
    (OUT_DIR / "candidates.json").write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    pld_count = sum(1 for c in candidates if c["source_id"] == "gla-planning-datahub-applications")
    gla_count = sum(1 for c in candidates if c["source_id"] == "gla-planning-application-decisions")
    notes = f"""# Round119 London GLA / Planning Datahub Major Applications Deep Pass

Accessed: {ACCESS_DATE}

## Scope

This scratch pass looks for additional official London planning/development records from 2008-01-01 through 2026-05-19, emphasizing Planning London Datahub major application rows and Mayor of London strategic planning decision records. Candidate language is deliberately administrative: planning decision, Stage 2 referral, direction, call-in, or public-hearing milestone only.

## Method

- Read the existing manual London architecture corpus, prior London subagent candidate files, and round116 planning snapshots for duplicate screening.
- Queried the Planning London Datahub guest API for 2008-2019 high-unit major applications, major redevelopment keywords, and a 2020-2026 strategic/backfill check.
- Scraped the official GLA planning application decisions page into this scratch directory and parsed linked PDF reports/decision letters where the report could be matched back to a PLD row for geometry.
- Rejected records by PLD id, GLA/PDU reference, source URL/PDF filename, exact source row, and obvious scheme/title coverage already represented in the existing London corpus.

## Output Counts

- Candidates retained: {len(candidates[:80])}
- PLD candidates retained: {pld_count}
- GLA mayoral decision candidates retained: {gla_count}
- Rejected records captured: {len(rejected[:120])}

## Caveats

- PLD decision/status dates are planning-process dates, not real-world construction, completion, occupation, or opening evidence.
- PLD geometry is a representative point from source polygons or centroids. It is useful for atlas navigation, not a measured building footprint.
- London Datastore licence for the PLD applications package is recorded as Not Specified in the existing source audit context; factual metadata and URLs are retained pending reuse review.
- GLA PDFs are strong evidence for mayoral process milestones, but they should not be converted into claims about delivered buildings or impacts without separate evidence.
- Some well-known schemes were intentionally rejected because they are already represented by public opening, built-status, or prior PLD/GLA records in the corpus.

## Files

- `candidates.json`: source audits, retained candidates, query stats, and rejected records.
- `gla_planning_decisions_20260519.html`: cached official GLA decision page used for parsing.
- `pdf_cache/`: cached GLA PDFs/text extracted for candidates and rejects that reached the GLA parsing step.
"""
    (OUT_DIR / "notes.md").write_text(notes, encoding="utf-8")


if __name__ == "__main__":
    build()
