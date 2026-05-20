import importlib.util
import json
import re
import sys
from pathlib import Path


sys.dont_write_bytecode = True

ACCESSED_AT = "2026-05-20"
SOURCE_ID = "london-development-database-archive"
TASK_ID = "round287_london_ldd_archive_next24_candidates"
SCRIPT_PATH = "scripts/fetch_round287_london_ldd_archive_next24_candidates.py"
OUT_DIR = Path("tmp/subagents/round287_london_ldd_archive_next24")
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
DATE_FIELDS = {
    "completion": "Date construction completed (Completed Date)",
    "started": "Date work commenced on site (Started Date)",
    "permission": "Permission Date",
}


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
    "Round 176 London LDD archive next7 candidates": "Round 287 London LDD archive next24 candidates",
    "after round170": "after round285",
    "through round170": "through round285",
    "through round277": "through round285",
    "through_round277": "through_round285",
    "same fields inside the round176 batch scan": "same fields inside the round287 batch scan",
    "duplicate inside round176 batch scan": "duplicate inside round287 batch scan",
    "No commencement/started or completion rows remained after dedupe through round277 and signal filters.": (
        "No commencement/started or completion rows remained after dedupe through round285 and signal filters."
    ),
    "manual corpus and prior LDD packs through round277 dedupe intersections": (
        "manual corpus and prior LDD packs through round285 dedupe intersections"
    ),
    "2026-05-19": ACCESSED_AT,
}


def base_module():
    return round285.base_module()


def configure_round287_globals():
    round285.ACCESSED_AT = ACCESSED_AT
    round285.SOURCE_ID = SOURCE_ID
    round285.TASK_ID = TASK_ID
    round285.SCRIPT_PATH = SCRIPT_PATH
    round285.OUT_DIR = OUT_DIR
    round285.OUT_PATH = OUT_PATH
    round285.SOURCE_AUDIT_PATH = SOURCE_AUDIT_PATH
    round285.SUMMARY_PATH = SUMMARY_PATH
    round285.NOTES_PATH = NOTES_PATH
    round285.REJECTED_PATH = REJECTED_PATH
    round285.VALIDATION_PATH = VALIDATION_PATH
    round285.ROUND_REPLACEMENTS = ROUND_REPLACEMENTS

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
    round176.CANDIDATE_LIMIT = 240
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
        if not match or int(match.group(1)) > 285:
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
        f"lon_ldd_archive_next24_round287_{milestone}_row_{excel_row}_"
        f"{base.slugify(authority, 36)}_{base.slugify(borough_ref, 48)}"
    )
    candidate["candidate_id"] = event_id
    candidate["event_id"] = event_id
    candidate["transformation_method"] = (
        f"Generated by {SCRIPT_PATH}. Parsed official London Datastore LDD archive XLSX workbooks with a "
        "stdlib OOXML reader; deduplicated against the manual architecture corpus and prior LDD archive "
        "candidate packs through round285 by LDD workbook row, planning authority/borough reference, source "
        "URL/record id, title/date, event id, and source/date key; selected source-defined Permission Date, "
        f"Started Date, or Completed Date milestones from 2008-01-01 through {ACCESSED_AT} with a valid Greater "
        "London Easting/Northing point and architecture/public/civic/mixed-use or large-development signal; "
        "excluded domestic/minor/admin-only rows below override thresholds; sorted by milestone priority, signal "
        f"score, milestone date, and source row; capped at {round176.CANDIDATE_LIMIT}. LDD milestones are "
        "source-reported administrative lifecycle records, not independent evidence of built outcome."
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
    text = f"""# Round 287 London LDD archive next24 candidates

Generated the next bounded London Development Database archive candidate pack after round285. This pack selects source-defined permission, work-start/commencement, or completion milestone records while deduplicating against the manual corpus and prior LDD archive packs through round285.

- Source ID: `{SOURCE_ID}`
- Candidate output: `{OUT_PATH.as_posix()}`
- Candidate count: {candidate_count}
- Cap: {round176.CANDIDATE_LIMIT}
- Accessed/retrieved date retained in outputs: {ACCESSED_AT}
- Input LDD planning-permissions rows scanned: {summary.get("input_rows_scanned")}
- Eligible rows after dedupe and signal filters: {summary.get("eligible_scored_rows_after_dedupe_and_signal_filters")}
- Validation JSON: `{VALIDATION_PATH.as_posix()}`
- Validation report: `{VALIDATION_REPORT_PATH.as_posix()}`

## Dedupe

The generator excludes manual-corpus LDD records and prior LDD archive candidate packs through round285 by workbook row, planning authority plus borough reference, source URL plus source record id, event id, candidate title/date, and source/date key. It also removes duplicate event IDs and source/date keys inside this batch.

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


def postprocess_validation_json():
    validation = json.loads(VALIDATION_PATH.read_text(encoding="utf-8"))
    validation = apply_replacements(validation)
    write_json(VALIDATION_PATH, validation)
    return validation


def write_validation_report(validation):
    summary = json.loads(SUMMARY_PATH.read_text(encoding="utf-8"))
    output_files = summary.setdefault("output_files", [])
    report_path = str(VALIDATION_REPORT_PATH)
    if report_path not in output_files:
        output_files.append(report_path)
    summary["validation_report"] = report_path
    write_json(SUMMARY_PATH, summary)

    issues = validation.get("issues", [])
    warnings = validation.get("warnings", [])
    lines = [
        "# Round 287 London LDD archive next24 validation report",
        "",
        f"- OK: {str(validation.get('ok')).lower()}",
        f"- Candidate count: {validation.get('candidate_count')}",
        f"- Date range: {validation.get('date_range', {}).get('start')} to {validation.get('date_range', {}).get('end')}",
        f"- Prior LDD packs checked through round285: {validation.get('prior_ldd_packs_checked_through_round285')}",
        f"- Manual LDD rows checked: {validation.get('manual_ldd_rows_checked')}",
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
    configure_round287_globals()
    round285.configure_round285_globals = configure_round287_globals
    round285.prior_ldd_pack_paths = prior_ldd_pack_paths
    round285.apply_replacements = apply_replacements
    round285.rewrite_candidate = rewrite_candidate
    round285.source_audit = source_audit
    round285.write_notes = write_notes
    round285.main()
    validation = postprocess_validation_json()
    write_validation_report(validation)
    if not validation["ok"]:
        raise RuntimeError(f"Round287 validation failed: {validation['issues']}")


if __name__ == "__main__":
    main()
