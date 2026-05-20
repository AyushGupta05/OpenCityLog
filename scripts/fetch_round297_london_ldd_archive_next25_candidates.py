import importlib.util
import json
import re
import sys
from collections import Counter
from pathlib import Path


sys.dont_write_bytecode = True

ACCESSED_AT = "2026-05-20"
SOURCE_ID = "london-development-database-archive"
TASK_ID = "round297_london_ldd_archive_next25_candidates"
SCRIPT_PATH = "scripts/fetch_round297_london_ldd_archive_next25_candidates.py"
OUT_DIR = Path("tmp/subagents/round297_london_ldd_archive_next25")
OUT_PATH = OUT_DIR / "candidates.json"
SOURCE_AUDIT_PATH = OUT_DIR / "source_audit.json"
SUMMARY_PATH = OUT_DIR / "summary.json"
NOTES_PATH = OUT_DIR / "notes.md"
REJECTED_PATH = OUT_DIR / "rejected.json"
VALIDATION_PATH = OUT_DIR / "validation.json"
VALIDATION_REPORT_PATH = OUT_DIR / "validation_report.md"

ROUND285_SCRIPT_PATH = Path("scripts/fetch_round285_london_ldd_archive_next23_candidates.py")

DATASET_PAGE = "https://data.london.gov.uk/dataset/planning-permissions-on-the-london-development-database-ldd-2jxq0/"
OFFICIAL_DOWNLOAD_PREFIX = "https://data.london.gov.uk/download/2jxq0/"
LICENSE = "UK Open Government Licence (OGL v3)"
CANDIDATE_LIMIT = 240
DATE_FIELDS = {
    "completion": "Date construction completed (Completed Date)",
    "started": "Date work commenced on site (Started Date)",
    "permission": "Permission Date",
}
REQUIRED_FIELDS = [
    "city_id",
    "candidate_id",
    "event_id",
    "title",
    "summary",
    "effective_date",
    "geometry",
    "source_name",
    "publisher",
    "source_url",
    "source_file_url",
    "source_record_id",
    "source_type",
    "source_date_field",
    "source_date_value",
    "license",
    "license_url",
    "attribution",
    "accessed_at",
    "retrieved_at",
    "transformation_method",
    "confidence",
    "limitations",
    "source_row_references",
]


def load_round285_module():
    spec = importlib.util.spec_from_file_location("round285_ldd_next23", ROUND285_SCRIPT_PATH)
    if not spec or not spec.loader:
        raise RuntimeError(f"Unable to load {ROUND285_SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


round285 = load_round285_module()
round176 = round285.round176
original_rewrite_candidate = round285.original_rewrite_candidate
original_source_audit = round285.original_source_audit

ROUND_REPLACEMENTS = {
    "round176_london_ldd_archive_next7_candidates": TASK_ID,
    "scripts/fetch_round176_london_ldd_archive_next7_candidates.py": SCRIPT_PATH,
    "tmp/subagents/round176_london_ldd_archive_next7": OUT_DIR.as_posix(),
    "Round 176 London LDD archive next7 candidates": "Round 297 London LDD archive next25 candidates",
    "after round170": "after round287",
    "through round170": "through round287",
    "through round277": "through round287",
    "through round285": "through round287",
    "through_round277": "through_round287",
    "through_round285": "through_round287",
    "same fields inside the round176 batch scan": "same fields inside the round297 batch scan",
    "duplicate inside round176 batch scan": "duplicate inside round297 batch scan",
    "No commencement/started or completion rows remained after dedupe through round277 and signal filters.": (
        "No commencement/started or completion rows remained after dedupe through round287 and signal filters."
    ),
    "No commencement/started or completion rows remained after dedupe through round285 and signal filters.": (
        "No commencement/started or completion rows remained after dedupe through round287 and signal filters."
    ),
    "manual corpus and prior LDD packs through round277 dedupe intersections": (
        "manual corpus and prior LDD packs through round287 dedupe intersections"
    ),
    "manual corpus and prior LDD packs through round285 dedupe intersections": (
        "manual corpus and prior LDD packs through round287 dedupe intersections"
    ),
    "2026-05-19": ACCESSED_AT,
}


def base_module():
    return round176.base


def configure_round297_globals():
    round176.ACCESSED_AT = ACCESSED_AT
    round176.SOURCE_ID = SOURCE_ID
    round176.TASK_ID = TASK_ID
    round176.SCRIPT_PATH = SCRIPT_PATH
    round176.OUT_DIR = OUT_DIR
    round176.OUT_PATH = OUT_PATH
    round176.SOURCE_AUDIT_PATH = SOURCE_AUDIT_PATH
    round176.SUMMARY_PATH = SUMMARY_PATH
    round176.NOTES_PATH = NOTES_PATH
    round176.REJECTED_PATH = REJECTED_PATH
    round176.CANDIDATE_LIMIT = CANDIDATE_LIMIT
    round176.MILESTONE_MINIMUM_TARGETS = {
        "completion": 80,
        "started": 80,
        "permission": 80,
    }
    round176.base.title_date_key = round285.strict_title_date_key


def prior_ldd_pack_paths():
    paths = []
    base = base_module()
    for path in sorted(Path("tmp/subagents").glob("round*_london_ldd_archive*/candidates.json")):
        if OUT_DIR in path.parents:
            continue
        match = base.re.search(r"round(\d+)_", path.parent.name)
        if not match or int(match.group(1)) > 287:
            continue
        paths.append(path)
    return paths


def apply_replacements(value):
    if isinstance(value, str):
        for old, new in ROUND_REPLACEMENTS.items():
            value = value.replace(old, new)
        return value
    if isinstance(value, list):
        return [apply_replacements(item) for item in value]
    if isinstance(value, dict):
        return {apply_replacements(key): apply_replacements(item) for key, item in value.items()}
    return value


def write_json(path, payload):
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def rewrite_candidate(candidate, row, excel_row, milestone, milestone_date):
    candidate = original_rewrite_candidate(candidate, row, excel_row, milestone, milestone_date)
    base = base_module()
    authority = base.clean_text(row.get("Planning Authority"))
    borough_ref = base.clean_text(row.get("Borough Reference"))
    event_id = (
        f"lon_ldd_archive_next25_round297_{milestone}_row_{excel_row}_"
        f"{base.slugify(authority, 36)}_{base.slugify(borough_ref, 48)}"
    )
    candidate["candidate_id"] = event_id
    candidate["event_id"] = event_id
    candidate["transformation_method"] = (
        f"Generated by {SCRIPT_PATH}. Parsed official London Datastore LDD archive XLSX workbooks with a "
        "stdlib OOXML reader; deduplicated against the manual architecture corpus and prior LDD archive "
        "candidate packs through round287 by LDD workbook row, planning authority/borough reference, source "
        "URL/record id, title/date, event id, and source/date key; selected source-defined Permission Date, "
        f"Started Date, or Completed Date milestones from 2008-01-01 through {ACCESSED_AT} with a valid Greater "
        "London Easting/Northing point and architecture/public/civic/mixed-use or large-development signal; "
        "excluded domestic/minor/admin-only rows below override thresholds; sorted by milestone priority, signal "
        f"score, milestone date, and source row; retained all remaining eligible rows up to the {CANDIDATE_LIMIT} "
        "candidate cap. LDD milestones are source-reported administrative lifecycle records, not independent "
        "evidence of built outcome."
    )
    return apply_replacements(candidate)


def source_audit(selection_summary):
    audit = apply_replacements(original_source_audit(selection_summary))
    audit["generated_at"] = ACCESSED_AT
    audit["task"] = TASK_ID
    source = audit["source_audits"][0]
    source["coverage_years_checked"] = (
        f"Permission, work-start/commencement, and completion milestone rows dated from 2008-01-01 through "
        f"{ACCESSED_AT}, with archive workbooks retained under the official London Datastore LDD dataset."
    )
    source["source_url"] = DATASET_PAGE
    source["license"] = LICENSE
    source["required_caveats"] = [
        "LDD rows are administrative planning/development lifecycle records and should not be presented as independent evidence of construction, opening, occupation, service delivery, final built form, or current use.",
        "Permission Date, Started Date, Completed Date, and real-world delivery are separate facts.",
        "The source-defined status/date fields may reflect phasing, amendments, administrative updates, or planning-authority interpretation.",
        "Coordinates are LDD point locations from Easting/Northing fields; they are not footprints or precise entrance locations.",
        "Figures describe the permission row and may differ from unaffected uses, phases, split permissions, later amendments, or the final built form.",
    ]
    source["ingestion_recommendation"] = (
        "Use selected rows only as candidate LDD administrative permission, work-start/commencement, or completion "
        "milestones with visible provenance and caveats."
    )
    return audit


def write_notes(candidate_count, summary):
    exclusion_counts = apply_replacements(summary.get("exclusion_counts", {}))
    eligible_count = int(summary.get("eligible_scored_rows_after_dedupe_and_signal_filters") or 0)
    headroom = max(0, eligible_count - candidate_count)
    text = f"""# Round 297 London LDD archive next25 candidates

Generated the next bounded London Development Database archive candidate pack after round287. This pack selects source-defined permission, work-start/commencement, or completion milestone records while deduplicating against the manual corpus and prior LDD archive packs through round287.

- Source ID: `{SOURCE_ID}`
- Candidate output: `{OUT_PATH.as_posix()}`
- Candidate count: {candidate_count}
- Cap: {CANDIDATE_LIMIT}
- Remaining eligible headroom after retained candidates: {headroom}
- Accessed/retrieved date retained in outputs: {ACCESSED_AT}
- Input LDD planning-permissions rows scanned: {summary.get("input_rows_scanned")}
- Eligible rows after dedupe and signal filters: {eligible_count}
- Validation JSON: `{VALIDATION_PATH.as_posix()}`
- Validation report: `{VALIDATION_REPORT_PATH.as_posix()}`

## Dedupe

The generator excludes manual-corpus LDD records and prior LDD archive candidate packs through round287 by workbook row, planning authority plus borough reference, source URL plus source record id, event id, candidate title/date, and source/date key. It also removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected `Permission Date`, `Date work commenced on site (Started Date)`, or `Date construction completed (Completed Date)` from 2008-01-01 through {ACCESSED_AT}, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals.

Small domestic, low-score alteration/extension, and administrative-only rows are excluded unless they meet a high-signal or large-development override. This keeps the batch useful for architecture/city-change review rather than turning the LDD archive into a minor-applications export.

## Caveats

These are LDD administrative planning/development lifecycle records only. The source fields are not independent evidence of delivery, construction, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting a candidate into canonical event status.

## Exclusion Counts

```json
{json.dumps(exclusion_counts, indent=2)}
```
"""
    NOTES_PATH.write_text(text, encoding="utf-8")


def clean_text(value):
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).strip())


def workbook_row(candidate):
    record_id = clean_text(candidate.get("source_record_id"))
    match = re.search(r"workbook row (\d+)", record_id, re.IGNORECASE)
    return int(match.group(1)) if match else None


def authority_ref(candidate):
    record_id = clean_text(candidate.get("source_record_id"))
    match = re.search(r"planning_authority=([^;]+);\s*borough_reference=(.+)$", record_id, re.IGNORECASE)
    if not match:
        return None
    return (clean_text(match.group(1)).lower(), clean_text(match.group(2)).lower())


def source_date_key(candidate):
    source_url = clean_text(candidate.get("source_url")).lower()
    source_record_id = clean_text(candidate.get("source_record_id")).lower()
    date_value = clean_text(candidate.get("date") or candidate.get("effective_date"))
    if not source_url or not source_record_id or not date_value:
        return None
    return (source_url, source_record_id, date_value)


def title_date_key(candidate):
    city = clean_text(candidate.get("city_id")).lower()
    title = round285.strict_ldd_title_token(candidate.get("title"))
    date_value = clean_text(candidate.get("date") or candidate.get("effective_date"))
    if not city or not title or not date_value:
        return None
    return (city, title, date_value)


def prior_candidates_from(path):
    if not path.exists():
        return []
    payload = json.loads(path.read_text(encoding="utf-8-sig"))
    return payload.get("candidates", [])


def corpus_dedupe_sets():
    base = base_module()
    rows = set()
    refs = set()
    source_dates = set()
    title_dates = set()
    event_ids = set()
    if not base.CORPUS_PATH.exists():
        return rows, refs, source_dates, title_dates, event_ids
    payload = json.loads(base.CORPUS_PATH.read_text(encoding="utf-8-sig"))
    for event in payload.get("events", []):
        event_id = clean_text(event.get("event_id") or event.get("id"))
        if event_id:
            event_ids.add(event_id)
        record_id = clean_text(event.get("source_record_id"))
        row_match = re.search(r"workbook row (\d+)", record_id, re.IGNORECASE)
        if row_match:
            rows.add(int(row_match.group(1)))
        ref_match = re.search(r"planning_authority=([^;]+);\s*borough_reference=(.+)$", record_id, re.IGNORECASE)
        if ref_match:
            refs.add((clean_text(ref_match.group(1)).lower(), clean_text(ref_match.group(2)).lower()))
        key = source_date_key(event)
        if key:
            source_dates.add(key)
        tkey = title_date_key(event)
        if tkey:
            title_dates.add(tkey)
    return rows, refs, source_dates, title_dates, event_ids


def prior_dedupe_sets(paths):
    rows = set()
    refs = set()
    source_dates = set()
    title_dates = set()
    event_ids = set()
    for path in paths:
        for candidate in prior_candidates_from(path):
            row = workbook_row(candidate)
            if row:
                rows.add(row)
            ref = authority_ref(candidate)
            if ref:
                refs.add(ref)
            key = source_date_key(candidate)
            if key:
                source_dates.add(key)
            tkey = title_date_key(candidate)
            if tkey:
                title_dates.add(tkey)
            event_id = clean_text(candidate.get("event_id") or candidate.get("candidate_id"))
            if event_id:
                event_ids.add(event_id)
    return rows, refs, source_dates, title_dates, event_ids


def duplicate_count(values):
    values = [value for value in values if value not in (None, "")]
    return len(values) - len(set(values))


def validate_generated_pack():
    payload = json.loads(OUT_PATH.read_text(encoding="utf-8"))
    source_audit_payload = json.loads(SOURCE_AUDIT_PATH.read_text(encoding="utf-8"))
    summary = json.loads(SUMMARY_PATH.read_text(encoding="utf-8"))
    candidates = payload.get("candidates", [])
    selection_summary = payload.get("selection_summary", {})
    issues = []
    warnings = []

    if payload.get("candidate_count") != len(candidates):
        issues.append("candidate_count does not match candidates length")
    if summary.get("candidate_count") != len(candidates):
        issues.append("summary candidate_count does not match candidates length")
    if selection_summary.get("retained_candidates") != len(candidates):
        issues.append("selection_summary retained_candidates does not match candidates length")
    if len(candidates) > CANDIDATE_LIMIT:
        issues.append(f"candidate count {len(candidates)} exceeds cap {CANDIDATE_LIMIT}")
    if len(candidates) == 0:
        warnings.append("No remaining clean LDD candidates passed the round297 filters.")
    if summary.get("eligible_headroom_after_retained_candidates") != 0:
        issues.append(
            "eligible_headroom_after_retained_candidates is not zero; round297 did not retain all remaining clean rows"
        )
    if payload.get("license") != LICENSE:
        issues.append("pack-level license is not OGL v3")
    if not source_audit_payload.get("source_audits"):
        issues.append("missing source audit")

    event_ids = []
    candidate_ids = []
    rows = []
    refs = []
    source_dates = []
    title_dates = []
    accessed_at_values = Counter()
    retrieved_at_values = Counter()
    milestone_mix = Counter()
    status_mix = Counter()

    overclaim_re = re.compile(
        r"\b(caused|proves?|proof|predicts?|forecasts?|forecasted|forecasting|simulates?|impact score|will increase|will decrease)\b",
        re.IGNORECASE,
    )
    allowed_milestones = set(DATE_FIELDS)
    allowed_date_fields = {f"{field} in the LDD planning-permissions workbook" for field in DATE_FIELDS.values()}

    for index, candidate in enumerate(candidates):
        label = candidate.get("event_id") or candidate.get("candidate_id") or f"candidate[{index}]"
        for field in REQUIRED_FIELDS:
            value = candidate.get(field)
            if value in (None, "") or (isinstance(value, list) and not value):
                issues.append(f"{label}: missing required field {field}")
        event_ids.append(clean_text(candidate.get("event_id")))
        candidate_ids.append(clean_text(candidate.get("candidate_id")))
        row = workbook_row(candidate)
        rows.append(row)
        ref = authority_ref(candidate)
        refs.append(ref)
        source_dates.append(source_date_key(candidate))
        title_dates.append(title_date_key(candidate))
        accessed_at_values[clean_text(candidate.get("accessed_at"))] += 1
        retrieved_at_values[clean_text(candidate.get("retrieved_at"))] += 1
        milestone = clean_text(candidate.get("ldd_milestone_type"))
        milestone_mix[milestone] += 1
        status_mix[clean_text(candidate.get("current_permission_status"))] += 1

        date_value = clean_text(candidate.get("date") or candidate.get("effective_date"))
        if not ("2008-01-01" <= date_value <= ACCESSED_AT):
            issues.append(f"{label}: date outside 2008-01-01..{ACCESSED_AT}: {date_value}")
        if clean_text(candidate.get("effective_date")) != date_value:
            issues.append(f"{label}: date and effective_date differ")
        if candidate.get("city_id") != "london":
            issues.append(f"{label}: city_id is not london")
        if candidate.get("source_id") != SOURCE_ID or SOURCE_ID not in candidate.get("source_ids", []):
            issues.append(f"{label}: missing canonical LDD source id")
        if candidate.get("source_dataset_id") != SOURCE_ID:
            issues.append(f"{label}: source_dataset_id is not canonical LDD source id")
        if candidate.get("source_url") != DATASET_PAGE:
            issues.append(f"{label}: source_url is not the official London Datastore LDD dataset page")
        if not clean_text(candidate.get("source_file_url")).startswith(OFFICIAL_DOWNLOAD_PREFIX):
            issues.append(f"{label}: source_file_url is not an official London Datastore LDD download URL")
        if candidate.get("license") != LICENSE or candidate.get("licence") != LICENSE:
            issues.append(f"{label}: candidate license/licence is not OGL v3")
        if candidate.get("license_url") != "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/":
            issues.append(f"{label}: license_url is not OGL v3")
        if "Greater London Authority" not in clean_text(candidate.get("attribution")):
            issues.append(f"{label}: attribution does not name Greater London Authority")
        if "Open Government Licence" not in clean_text(candidate.get("attribution")):
            issues.append(f"{label}: attribution does not preserve OGL notice")
        if candidate.get("confidence") != "documented":
            issues.append(f"{label}: confidence is not documented")
        if milestone not in allowed_milestones:
            issues.append(f"{label}: unexpected milestone type {milestone}")
        if candidate.get("source_date_field") not in allowed_date_fields:
            issues.append(f"{label}: unexpected source_date_field {candidate.get('source_date_field')}")
        if candidate.get("source_date_value") != date_value:
            issues.append(f"{label}: source_date_value does not match selected date")

        geometry = candidate.get("geometry") or {}
        coords = geometry.get("coordinates") if isinstance(geometry, dict) else None
        if geometry.get("type") != "Point" or not isinstance(coords, list) or len(coords) != 2:
            issues.append(f"{label}: geometry is not a GeoJSON point")
        else:
            lon, lat = coords
            if not (51.2868 <= float(lat) <= 51.6919 and -0.5103 <= float(lon) <= 0.334):
                issues.append(f"{label}: geometry outside London envelope")
            if abs(float(candidate.get("latitude", 0)) - float(lat)) > 0.000001:
                issues.append(f"{label}: latitude does not match geometry")
            if abs(float(candidate.get("longitude", 0)) - float(lon)) > 0.000001:
                issues.append(f"{label}: longitude does not match geometry")

        for ref_row in candidate.get("source_row_references", []):
            if not clean_text(ref_row.get("download_url")).startswith(OFFICIAL_DOWNLOAD_PREFIX):
                issues.append(f"{label}: source_row_references contains non-London-Datastore download URL")
            if not ref_row.get("excel_row"):
                issues.append(f"{label}: source_row_references missing excel_row")

        wording = " ".join(
            clean_text(candidate.get(field))
            for field in ("title", "summary", "observed_change", "limitations", "transformation_method")
        )
        if overclaim_re.search(wording):
            issues.append(f"{label}: overclaim wording detected")

    prior_paths = prior_ldd_pack_paths()
    manual_rows, manual_refs, manual_source_dates, manual_title_dates, manual_event_ids = corpus_dedupe_sets()
    prior_rows, prior_refs, prior_source_dates, prior_title_dates, prior_event_ids = prior_dedupe_sets(prior_paths)

    row_set = {row for row in rows if row}
    ref_set = {ref for ref in refs if ref}
    source_date_set = {key for key in source_dates if key}
    title_date_set = {key for key in title_dates if key}
    event_id_set = {event_id for event_id in event_ids if event_id}

    duplicates = {
        "event_ids": duplicate_count(event_ids),
        "candidate_ids": duplicate_count(candidate_ids),
        "source_date_keys": duplicate_count(source_dates),
        "workbook_rows": duplicate_count(rows),
    }
    for name, count in duplicates.items():
        if count:
            issues.append(f"duplicate {name}: {count}")

    cross = {
        "manual_rows": len(row_set & manual_rows),
        "manual_refs": len(ref_set & manual_refs),
        "manual_source_dates": len(source_date_set & manual_source_dates),
        "manual_title_dates": len(title_date_set & manual_title_dates),
        "manual_event_ids": len(event_id_set & manual_event_ids),
        "prior_rows": len(row_set & prior_rows),
        "prior_refs": len(ref_set & prior_refs),
        "prior_source_dates": len(source_date_set & prior_source_dates),
        "prior_title_dates": len(title_date_set & prior_title_dates),
        "prior_event_ids": len(event_id_set & prior_event_ids),
    }
    for name, count in cross.items():
        if count:
            issues.append(f"cross-dedupe intersection {name}: {count}")

    if set(accessed_at_values) != {ACCESSED_AT} and candidates:
        issues.append(f"accessed_at values are not all {ACCESSED_AT}: {dict(accessed_at_values)}")
    if set(retrieved_at_values) != {ACCESSED_AT} and candidates:
        issues.append(f"retrieved_at values are not all {ACCESSED_AT}: {dict(retrieved_at_values)}")
    if not milestone_mix and candidates:
        issues.append("milestone mix is empty")
    if set(milestone_mix) == {"permission"}:
        warnings.append("No commencement/started or completion rows remained after dedupe through round287 and signal filters.")

    dates = [clean_text(candidate.get("date") or candidate.get("effective_date")) for candidate in candidates]
    validation = {
        "ok": not issues,
        "generated_at": ACCESSED_AT,
        "task": TASK_ID,
        "validator": f"{SCRIPT_PATH} independent post-generation validator",
        "candidate_count": len(candidates),
        "date_range": {"start": min(dates) if dates else None, "end": max(dates) if dates else None},
        "milestone_mix": dict(milestone_mix.most_common()),
        "status_mix": dict(status_mix.most_common()),
        "accessed_at_values": dict(accessed_at_values),
        "retrieved_at_values": dict(retrieved_at_values),
        "prior_ldd_packs_checked_through_round287": len(prior_paths),
        "manual_ldd_rows_checked": len(manual_rows),
        "manual_ldd_refs_checked": len(manual_refs),
        "eligible_headroom_after_retained_candidates": summary.get("eligible_headroom_after_retained_candidates"),
        "duplicates": duplicates,
        "cross_dedupe_intersections": cross,
        "required_fields_checked": REQUIRED_FIELDS,
        "checks": [
            "candidate count does not exceed cap",
            "all remaining eligible scored rows retained",
            "required provenance fields",
            "official London Datastore/LDD URLs only",
            "OGL v3 license and attribution fields",
            "accessed_at/retrieved_at fixed to 2026-05-20",
            "2008-01-01 through 2026-05-20 date window",
            "London coordinate envelope and GeoJSON point consistency",
            "manual corpus and prior LDD packs through round287 dedupe intersections",
            "overclaim wording guard",
        ],
        "warnings": warnings,
        "issues": issues,
    }
    write_json(VALIDATION_PATH, validation)
    return validation


def postprocess_outputs(validation=None):
    for path in [OUT_PATH, SOURCE_AUDIT_PATH, SUMMARY_PATH, REJECTED_PATH]:
        payload = json.loads(path.read_text(encoding="utf-8"))
        payload = apply_replacements(payload)
        if path == SUMMARY_PATH:
            output_files = payload.setdefault("output_files", [])
            for output_path in [str(VALIDATION_PATH), str(VALIDATION_REPORT_PATH)]:
                if output_path not in output_files:
                    output_files.append(output_path)
            if validation:
                payload["validation"] = {
                    "ok": validation["ok"],
                    "path": str(VALIDATION_PATH),
                    "warnings": validation.get("warnings", []),
                    "issues": validation.get("issues", []),
                }
                payload["validation_report"] = str(VALIDATION_REPORT_PATH)
        write_json(path, payload)


def write_validation_report(validation):
    issues = validation.get("issues", [])
    warnings = validation.get("warnings", [])
    lines = [
        "# Round 297 London LDD archive next25 validation report",
        "",
        f"- OK: {str(validation.get('ok')).lower()}",
        f"- Candidate count: {validation.get('candidate_count')}",
        f"- Date range: {validation.get('date_range', {}).get('start')} to {validation.get('date_range', {}).get('end')}",
        f"- Milestone mix: {json.dumps(validation.get('milestone_mix', {}), sort_keys=True)}",
        f"- Prior LDD packs checked through round287: {validation.get('prior_ldd_packs_checked_through_round287')}",
        f"- Manual LDD rows checked: {validation.get('manual_ldd_rows_checked')}",
        f"- Eligible headroom after retained candidates: {validation.get('eligible_headroom_after_retained_candidates')}",
        f"- Duplicate event IDs: {validation.get('duplicates', {}).get('event_ids')}",
        f"- Duplicate source/date keys: {validation.get('duplicates', {}).get('source_date_keys')}",
        f"- Cross-dedupe intersections: {json.dumps(validation.get('cross_dedupe_intersections', {}), sort_keys=True)}",
        f"- Warnings: {len(warnings)}",
        f"- Issues: {len(issues)}",
        "",
        "## Checks",
        "",
    ]
    lines.extend(f"- {check}" for check in validation.get("checks", []))
    lines.extend(["", "## Warnings", ""])
    lines.extend(f"- {warning}" for warning in warnings) if warnings else lines.append("- None")
    lines.extend(["", "## Issues", ""])
    lines.extend(f"- {issue}" for issue in issues) if issues else lines.append("- None")
    lines.append("")
    VALIDATION_REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def main():
    configure_round297_globals()
    round176.prior_ldd_pack_paths = prior_ldd_pack_paths
    round176.rewrite_candidate = rewrite_candidate
    round176.source_audit = source_audit
    round176.write_notes = write_notes
    round176.main()
    postprocess_outputs()
    validation = validate_generated_pack()
    write_validation_report(validation)
    postprocess_outputs(validation)
    if not validation["ok"]:
        raise RuntimeError(f"Round297 validation failed: {validation['issues']}")


if __name__ == "__main__":
    main()
