import importlib.util
import json
import sys
from pathlib import Path


sys.dont_write_bytecode = True

ACCESSED_AT = "2026-05-20"
SOURCE_ID = "london-development-database-archive"
TASK_ID = "round260_london_ldd_archive_next20_candidates"
SCRIPT_PATH = "scripts/fetch_round260_london_ldd_archive_next20_candidates.py"
OUT_DIR = Path("tmp/subagents/round260_london_ldd_archive_next20")
OUT_PATH = OUT_DIR / "candidates.json"
SOURCE_AUDIT_PATH = OUT_DIR / "source_audit.json"
SUMMARY_PATH = OUT_DIR / "summary.json"
NOTES_PATH = OUT_DIR / "notes.md"
REJECTED_PATH = OUT_DIR / "rejected.json"

ROUND252_SCRIPT_PATH = Path("scripts/fetch_round252_london_ldd_archive_next19_candidates.py")


def build_round_replacements():
    replacements = {
        "round252_london_ldd_archive_next19_candidates": TASK_ID,
        "scripts/fetch_round252_london_ldd_archive_next19_candidates.py": SCRIPT_PATH,
        "tmp/subagents/round252_london_ldd_archive_next19": OUT_DIR.as_posix(),
        "Round 252 London LDD archive next19 candidates": "Round 260 London LDD archive next20 candidates",
        "2026-05-19": ACCESSED_AT,
        "a administrative": "an administrative",
    }
    for round_number in [176, 182, 188, 194, 200, 206, 212, 220, 226, 233, 239, 245]:
        replacements[f"through round{round_number}"] = "through round252"
        replacements[f"after round{round_number}"] = "after round252"
    for round_number in [176, 182, 188, 194, 200, 206, 212, 220, 226, 233, 239, 245, 252]:
        replacements[f"same fields inside the round{round_number} batch scan"] = (
            "same fields inside the round260 batch scan"
        )
        replacements[f"duplicate inside round{round_number} batch scan"] = "duplicate inside round260 batch scan"
    for next_number, round_number in [
        (7, 176),
        (8, 182),
        (9, 188),
        (10, 194),
        (11, 200),
        (12, 206),
        (13, 212),
        (14, 220),
        (15, 226),
        (16, 233),
        (17, 239),
        (18, 245),
        (19, 252),
    ]:
        replacements[f"round{round_number}_london_ldd_archive_next{next_number}_candidates"] = TASK_ID
        replacements[f"scripts/fetch_round{round_number}_london_ldd_archive_next{next_number}_candidates.py"] = (
            SCRIPT_PATH
        )
        replacements[f"Round {round_number} London LDD archive next{next_number} candidates"] = (
            "Round 260 London LDD archive next20 candidates"
        )
    for next_number, round_number in [
        (7, 176),
        (8, 182),
        (9, 188),
        (10, 194),
        (11, 200),
        (12, 206),
        (13, 212),
        (14, 220),
        (15, 226),
        (16, 233),
        (17, 239),
        (18, 245),
        (19, 252),
    ]:
        replacements[f"tmp/subagents/round{round_number}_london_ldd_archive_next{next_number}"] = (
            OUT_DIR.as_posix()
        )
    return replacements


ROUND_REPLACEMENTS = build_round_replacements()


def load_round252_module():
    spec = importlib.util.spec_from_file_location("round252_ldd_next19", ROUND252_SCRIPT_PATH)
    if not spec or not spec.loader:
        raise RuntimeError(f"Unable to load {ROUND252_SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


round252 = load_round252_module()
original_rewrite_candidate = round252.rewrite_candidate


def configure_round260_globals():
    round252.ACCESSED_AT = ACCESSED_AT
    round252.SOURCE_ID = SOURCE_ID
    round252.TASK_ID = TASK_ID
    round252.SCRIPT_PATH = SCRIPT_PATH
    round252.OUT_DIR = OUT_DIR
    round252.OUT_PATH = OUT_PATH
    round252.SOURCE_AUDIT_PATH = SOURCE_AUDIT_PATH
    round252.SUMMARY_PATH = SUMMARY_PATH
    round252.NOTES_PATH = NOTES_PATH
    round252.REJECTED_PATH = REJECTED_PATH
    round252.ROUND_REPLACEMENTS = ROUND_REPLACEMENTS


def base_module():
    return round252.base_module()


def prior_ldd_pack_paths():
    paths = []
    base = base_module()
    for path in sorted(Path("tmp/subagents").glob("round*_london_ldd_archive*/candidates.json")):
        if OUT_DIR in path.parents:
            continue
        match = base.re.search(r"round(\d+)_", path.parent.name)
        if not match or int(match.group(1)) > 252:
            continue
        paths.append(path)
    return paths


def rewrite_candidate(candidate, row, excel_row, milestone, milestone_date):
    candidate = original_rewrite_candidate(candidate, row, excel_row, milestone, milestone_date)
    base = base_module()
    authority = base.clean_text(row.get("Planning Authority"))
    borough_ref = base.clean_text(row.get("Borough Reference"))
    event_id = (
        f"lon_ldd_archive_next20_round260_{milestone}_row_{excel_row}_"
        f"{base.slugify(authority, 36)}_{base.slugify(borough_ref, 48)}"
    )
    candidate["candidate_id"] = event_id
    candidate["event_id"] = event_id
    candidate["transformation_method"] = apply_replacements(candidate["transformation_method"])
    return candidate


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


def normalize_permission_only_metadata(payload):
    payload = apply_replacements(payload)
    if isinstance(payload, dict):
        date_window = payload.get("date_window")
        if isinstance(date_window, dict):
            date_window["source_fields"] = ["Permission Date"]
        for audit in payload.get("source_audits", []):
            if not isinstance(audit, dict):
                continue
            audit["coverage_years_checked"] = (
                f"Permission milestone rows dated from 2008-01-01 through {ACCESSED_AT}, "
                "with archive workbooks retained under the London Datastore LDD dataset."
            )
            audit["ingestion_recommendation"] = (
                "Use selected rows only as candidate LDD administrative permission milestones "
                "with visible provenance and caveats."
            )
        selection_summary = payload.get("selection_summary")
        if isinstance(selection_summary, dict):
            filters = selection_summary.get("filters")
            if isinstance(filters, list):
                selection_summary["filters"] = [
                    (
                        f"Selected Permission Date between 2008-01-01 and {ACCESSED_AT}"
                        if isinstance(item, str) and item.startswith("Selected Permission Date, Started Date, or Completed Date")
                        else item
                    )
                    for item in filters
                ]
        candidates = payload.get("candidates")
        if isinstance(candidates, list):
            for candidate in candidates:
                if not isinstance(candidate, dict) or candidate.get("ldd_milestone_type") != "permission":
                    continue
                candidate["started_date"] = ""
                candidate["completed_date"] = ""
                candidate["completed_financial_year"] = ""
                raw_row = candidate.get("raw_row")
                if isinstance(raw_row, dict):
                    raw_row["started_date"] = ""
                    raw_row["completed_date"] = ""
    return payload


def candidate_limit():
    return round252.candidate_limit()


def write_notes(candidate_count, summary):
    exclusion_counts = apply_replacements(summary.get("exclusion_counts", {}))
    text = f"""# Round 260 London LDD archive next20 candidates

Generated the next bounded London Development Database archive candidate pack after round252. This pack selects source-defined permission milestone records, while deduplicating against the manual corpus and previous/pending LDD archive packs through round252, including the round226, round233, round239, round245, and round252 packs.

- Source ID: `{SOURCE_ID}`
- Candidate output: `{OUT_PATH.as_posix()}`
- Candidate count: {candidate_count}
- Cap: {candidate_limit()}
- Accessed/retrieved date retained in outputs: {ACCESSED_AT}
- Input LDD planning-permissions rows scanned: {summary.get("input_rows_scanned")}
- Eligible rows after dedupe and signal filters: {summary.get("eligible_scored_rows_after_dedupe_and_signal_filters")}

## Dedupe

The generator excludes manual-corpus LDD records and previous/pending LDD archive candidate packs through round252 by workbook row, planning authority plus borough reference, source URL plus source record id, candidate title/date, and source/date key. It explicitly screens the prior/pending LDD packs through round226, round233, round239, round245, and round252, and removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected LDD `Permission Date` from 2008-01-01 through {ACCESSED_AT}, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals.

Small domestic, low-score alteration/extension, and administrative-only rows are excluded unless they meet a high-signal or large-development override. This keeps the batch useful for architecture/city-change review rather than turning the LDD archive into a minor-applications export.

## Caveats

These are LDD administrative planning/development records only. They are not direct evidence of delivery, construction completion, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting a candidate into canonical event status.

## Exclusion Counts

```json
{json.dumps(exclusion_counts, indent=2)}
```
"""
    NOTES_PATH.write_text(text, encoding="utf-8")


def postprocess_outputs():
    for path in [OUT_PATH, SOURCE_AUDIT_PATH, SUMMARY_PATH, REJECTED_PATH]:
        payload = json.loads(path.read_text(encoding="utf-8"))
        write_json(path, normalize_permission_only_metadata(payload))


def main():
    configure_round260_globals()
    round252.prior_ldd_pack_paths = prior_ldd_pack_paths
    round252.rewrite_candidate = rewrite_candidate
    round252.write_notes = write_notes
    round252.main()
    postprocess_outputs()


if __name__ == "__main__":
    main()
