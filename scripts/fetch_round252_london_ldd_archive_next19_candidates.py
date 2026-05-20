import importlib.util
import json
import sys
from pathlib import Path


sys.dont_write_bytecode = True

ACCESSED_AT = "2026-05-19"
SOURCE_ID = "london-development-database-archive"
TASK_ID = "round252_london_ldd_archive_next19_candidates"
SCRIPT_PATH = "scripts/fetch_round252_london_ldd_archive_next19_candidates.py"
OUT_DIR = Path("tmp/subagents/round252_london_ldd_archive_next19")
OUT_PATH = OUT_DIR / "candidates.json"
SOURCE_AUDIT_PATH = OUT_DIR / "source_audit.json"
SUMMARY_PATH = OUT_DIR / "summary.json"
NOTES_PATH = OUT_DIR / "notes.md"
REJECTED_PATH = OUT_DIR / "rejected.json"

ROUND245_SCRIPT_PATH = Path("scripts/fetch_round245_london_ldd_archive_next18_candidates.py")


def build_round_replacements():
    replacements = {
        "round245_london_ldd_archive_next18_candidates": TASK_ID,
        "scripts/fetch_round245_london_ldd_archive_next18_candidates.py": SCRIPT_PATH,
        "tmp/subagents/round245_london_ldd_archive_next18": OUT_DIR.as_posix(),
        "Round 245 London LDD archive next18 candidates": "Round 252 London LDD archive next19 candidates",
        "a administrative": "an administrative",
    }
    for round_number in [176, 182, 188, 194, 200, 206, 212, 220, 226, 233, 239]:
        replacements[f"through round{round_number}"] = "through round245"
        replacements[f"after round{round_number}"] = "after round245"
    for round_number in [176, 182, 188, 194, 200, 206, 212, 220, 226, 233, 239, 245]:
        replacements[f"same fields inside the round{round_number} batch scan"] = (
            "same fields inside the round252 batch scan"
        )
        replacements[f"duplicate inside round{round_number} batch scan"] = "duplicate inside round252 batch scan"
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
    ]:
        replacements[f"round{round_number}_london_ldd_archive_next{next_number}_candidates"] = TASK_ID
        replacements[f"scripts/fetch_round{round_number}_london_ldd_archive_next{next_number}_candidates.py"] = (
            SCRIPT_PATH
        )
        replacements[f"Round {round_number} London LDD archive next{next_number} candidates"] = (
            "Round 252 London LDD archive next19 candidates"
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
    ]:
        replacements[f"tmp/subagents/round{round_number}_london_ldd_archive_next{next_number}"] = (
            OUT_DIR.as_posix()
        )
    return replacements


ROUND_REPLACEMENTS = build_round_replacements()


def load_round245_module():
    spec = importlib.util.spec_from_file_location("round245_ldd_next18", ROUND245_SCRIPT_PATH)
    if not spec or not spec.loader:
        raise RuntimeError(f"Unable to load {ROUND245_SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


round245 = load_round245_module()
original_rewrite_candidate = round245.rewrite_candidate


def configure_round252_globals():
    round245.ACCESSED_AT = ACCESSED_AT
    round245.SOURCE_ID = SOURCE_ID
    round245.TASK_ID = TASK_ID
    round245.SCRIPT_PATH = SCRIPT_PATH
    round245.OUT_DIR = OUT_DIR
    round245.OUT_PATH = OUT_PATH
    round245.SOURCE_AUDIT_PATH = SOURCE_AUDIT_PATH
    round245.SUMMARY_PATH = SUMMARY_PATH
    round245.NOTES_PATH = NOTES_PATH
    round245.REJECTED_PATH = REJECTED_PATH
    round245.ROUND_REPLACEMENTS = ROUND_REPLACEMENTS


def base_module():
    return round245.base_module()


def prior_ldd_pack_paths():
    paths = []
    base = base_module()
    for path in sorted(Path("tmp/subagents").glob("round*_london_ldd_archive*/candidates.json")):
        if OUT_DIR in path.parents:
            continue
        match = base.re.search(r"round(\d+)_", path.parent.name)
        if not match or int(match.group(1)) > 245:
            continue
        paths.append(path)
    return paths


def rewrite_candidate(candidate, row, excel_row, milestone, milestone_date):
    candidate = original_rewrite_candidate(candidate, row, excel_row, milestone, milestone_date)
    base = base_module()
    authority = base.clean_text(row.get("Planning Authority"))
    borough_ref = base.clean_text(row.get("Borough Reference"))
    event_id = (
        f"lon_ldd_archive_next19_round252_{milestone}_row_{excel_row}_"
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


def candidate_limit():
    return round245.candidate_limit()


def write_notes(candidate_count, summary):
    exclusion_counts = apply_replacements(summary.get("exclusion_counts", {}))
    text = f"""# Round 252 London LDD archive next19 candidates

Generated the next bounded London Development Database archive candidate pack after round245. This pack selects source-defined completion, work-start, or permission milestone records, while deduplicating against the manual corpus and previous/pending LDD archive packs through round245, including the round226, round233, round239, and round245 packs.

- Source ID: `{SOURCE_ID}`
- Candidate output: `{OUT_PATH.as_posix()}`
- Candidate count: {candidate_count}
- Cap: {candidate_limit()}
- Accessed/retrieved date retained in outputs: {ACCESSED_AT}
- Input LDD planning-permissions rows scanned: {summary.get("input_rows_scanned")}
- Eligible rows after dedupe and signal filters: {summary.get("eligible_scored_rows_after_dedupe_and_signal_filters")}

## Dedupe

The generator excludes manual-corpus LDD records and previous/pending LDD archive candidate packs through round245 by workbook row, planning authority plus borough reference, source URL plus source record id, candidate title/date, and source/date key. It explicitly screens the prior/pending LDD packs through round226, round233, round239, and round245, and removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected `Permission Date`, `Date work commenced on site (Started Date)`, or `Date construction completed (Completed Date)` from 2008-01-01 through {ACCESSED_AT}, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals.

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
        write_json(path, apply_replacements(payload))


def main():
    configure_round252_globals()
    round245.prior_ldd_pack_paths = prior_ldd_pack_paths
    round245.rewrite_candidate = rewrite_candidate
    round245.write_notes = write_notes
    round245.main()
    postprocess_outputs()


if __name__ == "__main__":
    main()
