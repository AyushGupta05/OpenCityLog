import json
import re
from pathlib import Path


ROOT = Path("tmp/subagents/round305_london_nhle_heritage_tail3")
DATE_START = "2008-01-01"
DATE_END = "2026-05-20"
ACCESS_DATE = "2026-05-20"
LONDON_BBOX = (-0.5103, 51.2868, 0.334, 51.6919)
REQUIRED_FIELDS = [
    "city_id",
    "candidate_id",
    "event_id",
    "title",
    "summary",
    "effective_date",
    "date",
    "source_date_field",
    "geometry",
    "latitude",
    "longitude",
    "source_record_id",
    "source_url",
    "publisher",
    "license",
    "attribution",
    "accessed_at",
    "confidence",
    "limitations",
    "transformation_method",
]
CANONICAL_FIELDS = {
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
    "DateRemovedFromList",
}


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8").lstrip("\ufeff"))


def one_line(value):
    return re.sub(r"\s+", " ", "" if value is None else str(value)).strip()


def iso(value):
    text = one_line(value)
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        return text
    return ""


def candidate_pack_json_files():
    root = Path("tmp/subagents")
    skip = re.compile(r"(rejected|summary|source_audit|validation|query|raw)", re.I)
    name_pattern = re.compile(r"(candidates|arch_candidates|heritage_candidates)", re.I)
    for path in root.rglob("*.json"):
        try:
            resolved = path.resolve()
            if ROOT.resolve() in resolved.parents:
                continue
            if skip.search(path.name):
                continue
            if path.stat().st_size > 50_000_000:
                continue
        except OSError:
            continue
        if name_pattern.search(path.name) or ("heritage" in str(path).lower() and path.name.lower() == "candidates.json"):
            yield path


def eventish_rows(value):
    if isinstance(value, dict):
        if any(key in value for key in ("event_id", "candidate_id", "source_record_id", "source_url", "evidence", "provenance")):
            yield value
        for item in value.values():
            yield from eventish_rows(item)
    elif isinstance(value, list):
        for item in value:
            yield from eventish_rows(item)


def text_for_row(row):
    return json.dumps(row, ensure_ascii=False, sort_keys=True)


def entries_from_text(text):
    entries = set()
    for match in re.finditer(r"historicengland\.org\.uk/listing/the-list/list-entry/(\d{6,8})", text, re.I):
        entries.add(match.group(1))
    for match in re.finditer(r"\bNHLE\s+(?:COI\s+)?ListEntry\s*(\d{6,8})\b", text, re.I):
        entries.add(match.group(1))
    for match in re.finditer(r"\bOriginalListEntryNumber\D{0,24}(\d{6,8})\b", text, re.I):
        entries.add(match.group(1))
    if re.search(r"(NHLE|Historic England|historicengland\.org\.uk|ListEntry)", text, re.I):
        for match in re.finditer(r"\bListEntry\D{0,24}(\d{6,8})\b", text, re.I):
            entries.add(match.group(1))
    if re.search(r"(De-designated|DateRemovedFromList|ARTICLEUID)", text, re.I):
        for match in re.finditer(r"\bARTICLEUID\D{0,24}(\d{6,8})\b", text, re.I):
            entries.add(f"article-{match.group(1)}")
    return entries


def canonical_field(value, text=""):
    value = one_line(value)
    text_lower = text.lower()
    if value in CANONICAL_FIELDS:
        return value
    if value == "start-date" and ("certificate of immunity" in text_lower or "coi" in text_lower):
        return "COIStart"
    if value == "end-date" and ("certificate of immunity" in text_lower or "coi" in text_lower):
        return "COIExpire"
    return ""


def extract_keys(row):
    text = text_for_row(row)
    if not re.search(r"(NHLE|Historic England|historicengland\.org\.uk|ListEntry|DateRemovedFromList|De-designated)", text, re.I):
        return set()
    entries = entries_from_text(text)
    keys = set()
    field = canonical_field(row.get("source_date_field", ""), text)
    date = iso(row.get("date") or row.get("effective_date"))
    if entries and field and date:
        for entry in entries:
            keys.add(f"{entry}|{field}|{date}")
    if entries and not field and date:
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
    source_row = row.get("source_row") if isinstance(row, dict) else None
    for item in [row, source_row]:
        if not isinstance(item, dict):
            continue
        entry = one_line(item.get("ListEntry") or item.get("OriginalListEntryNumber") or item.get("nhle_list_entry") or "")
        if not entry and item.get("ARTICLEUID"):
            entry = f"article-{one_line(item.get('ARTICLEUID'))}"
        if not entry:
            continue
        for source_field in CANONICAL_FIELDS:
            value = iso(item.get(source_field))
            if value:
                keys.add(f"{entry}|{source_field}|{value}")
    snippets = []
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
    for snippet in snippets:
        snippet_entries = entries_from_text(snippet) or entries
        for source_field in CANONICAL_FIELDS:
            for match in re.finditer(rf"\b{source_field}\b[^\d]{{0,80}}(\d{{4}}-\d{{2}}-\d{{2}})", snippet, re.I):
                for entry in snippet_entries:
                    keys.add(f"{entry}|{source_field}|{match.group(1)}")
    return keys


def scan_existing_keys():
    keys = set()
    files_scanned = 0
    corpus_events = 0
    corpus_path = Path("data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json")
    if corpus_path.exists():
        corpus = read_json(corpus_path)
        for event in corpus.get("events", []):
            corpus_events += 1
            if one_line(event.get("city_id")) == "london":
                keys.update(extract_keys(event))
    for path in candidate_pack_json_files():
        try:
            payload = read_json(path)
        except (OSError, json.JSONDecodeError):
            continue
        files_scanned += 1
        for row in eventish_rows(payload):
            keys.update(extract_keys(row))
    return keys, files_scanned, corpus_events


def validate():
    errors = []
    warnings = []
    pack = read_json(ROOT / "candidates.json")
    summary = read_json(ROOT / "summary.json")
    source_audit = read_json(ROOT / "source_audit.json")
    rejected = read_json(ROOT / "rejected.json")
    candidates = pack.get("candidates", [])

    if pack.get("metadata", {}).get("candidate_count") != len(candidates):
        errors.append("candidates.json metadata candidate_count does not match candidates length.")
    if summary.get("candidate_count") != len(candidates):
        errors.append("summary.json candidate_count does not match candidates length.")
    if pack.get("metadata", {}).get("date_window") != {"start": DATE_START, "end": DATE_END}:
        errors.append("candidates metadata date_window is not the required round305 window.")
    if not source_audit.get("source_audits"):
        errors.append("source_audit.json has no source_audits entries.")
    if "reason_counts" not in rejected or "records" not in rejected:
        errors.append("rejected.json missing reason_counts or records.")

    candidate_ids = set()
    nhle_keys = set()
    field_mix = {}
    type_mix = {}
    dates = []
    for index, candidate in enumerate(candidates):
        label = candidate.get("candidate_id") or f"row {index}"
        for field in REQUIRED_FIELDS:
            if candidate.get(field) in (None, ""):
                errors.append(f"{label} missing required field {field}.")
        if candidate.get("city_id") != "london":
            errors.append(f"{label} city_id is not london.")
        if candidate.get("accessed_at") != ACCESS_DATE:
            errors.append(f"{label} accessed_at is not {ACCESS_DATE}.")
        date = iso(candidate.get("date"))
        if not date or candidate.get("effective_date") != date:
            errors.append(f"{label} has mismatched or invalid date/effective_date.")
        elif not (DATE_START <= date <= DATE_END):
            errors.append(f"{label} date outside required window.")
        else:
            dates.append(date)
        field = candidate.get("source_date_field")
        if field not in CANONICAL_FIELDS:
            errors.append(f"{label} has unsupported source_date_field {field}.")
        if candidate.get("confidence") != "documented":
            errors.append(f"{label} confidence is not documented.")
        if "not evidence of construction" not in one_line(candidate.get("limitations", "")).lower():
            errors.append(f"{label} limitations do not clearly block construction-date interpretation.")
        lon = candidate.get("longitude")
        lat = candidate.get("latitude")
        try:
            lon = float(lon)
            lat = float(lat)
        except (TypeError, ValueError):
            errors.append(f"{label} latitude/longitude are not numeric.")
            continue
        min_lon, min_lat, max_lon, max_lat = LONDON_BBOX
        if not (min_lon <= lon <= max_lon and min_lat <= lat <= max_lat):
            errors.append(f"{label} coordinates outside coarse London bbox.")
        coords = candidate.get("geometry", {}).get("coordinates", [])
        if len(coords) != 2 or abs(float(coords[0]) - lon) > 1e-9 or abs(float(coords[1]) - lat) > 1e-9:
            errors.append(f"{label} geometry coordinates do not match latitude/longitude.")
        if label in candidate_ids:
            errors.append(f"Duplicate candidate_id {label}.")
        candidate_ids.add(label)
        key = candidate.get("dedupe_key")
        if not key or not re.fullmatch(r"(?:\d{6,8}|article-\d{6,8})\|[A-Za-z]+\|\d{4}-\d{2}-\d{2}", key):
            errors.append(f"{label} has invalid dedupe_key {key}.")
        elif key not in extract_keys(candidate):
            errors.append(f"{label} dedupe_key is not supported by the candidate source fields.")
        elif key in nhle_keys:
            errors.append(f"Duplicate NHLE/admin key within round305: {key}.")
        else:
            nhle_keys.add(key)
        field_mix[field] = field_mix.get(field, 0) + 1
        record_type = candidate.get("record_type")
        type_mix[record_type] = type_mix.get(record_type, 0) + 1

    existing_keys, files_scanned, corpus_events = scan_existing_keys()
    duplicate_keys = sorted(nhle_keys & existing_keys)
    if duplicate_keys:
        errors.append(f"Round305 candidates duplicate existing NHLE/admin keys: {duplicate_keys[:20]}")

    if dates:
        expected_range = {"start": min(dates), "end": max(dates)}
        if summary.get("date_range") != expected_range:
            errors.append("summary date_range does not match candidate dates.")
    if summary.get("source_date_field_mix") != field_mix:
        errors.append("summary source_date_field_mix does not match candidates.")
    if summary.get("record_type_mix") != type_mix:
        errors.append("summary record_type_mix does not match candidates.")

    result = {
        "generated_at": f"{ACCESS_DATE}T00:00:00Z",
        "passed": not errors,
        "errors": errors,
        "warnings": warnings,
        "candidate_count": len(candidates),
        "date_range": {"start": min(dates) if dates else None, "end": max(dates) if dates else None},
        "source_date_field_mix": field_mix,
        "record_type_mix": type_mix,
        "independent_duplicate_scan": {
            "manual_corpus_events_scanned": corpus_events,
            "prior_candidate_pack_files_scanned": files_scanned,
            "existing_nhle_or_admin_keys_seen": len(existing_keys),
            "duplicate_keys_found": duplicate_keys,
        },
    }
    (ROOT / "validation.json").write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    report_lines = [
        "# Round305 Validation Report",
        "",
        f"- Passed: {result['passed']}",
        f"- Candidate count: {result['candidate_count']}",
        f"- Date range: {result['date_range']['start']} to {result['date_range']['end']}",
        f"- Manual corpus events scanned: {corpus_events}",
        f"- Prior candidate pack JSON files scanned: {files_scanned}",
        f"- Existing NHLE/admin keys seen: {len(existing_keys)}",
        "",
        "Source date field mix:",
        "",
    ]
    report_lines.extend(f"- {key}: {value}" for key, value in sorted(field_mix.items()))
    if errors:
        report_lines.extend(["", "Errors:", ""])
        report_lines.extend(f"- {error}" for error in errors)
    if warnings:
        report_lines.extend(["", "Warnings:", ""])
        report_lines.extend(f"- {warning}" for warning in warnings)
    (ROOT / "validation_report.md").write_text("\n".join(report_lines) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    validate()
