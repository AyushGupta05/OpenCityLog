import importlib.util
import json
import sys
from pathlib import Path


sys.dont_write_bytecode = True

ACCESSED_AT = "2026-05-20"
SOURCE_ID = "london-development-database-archive"
TASK_ID = "round277_london_ldd_archive_next22_candidates"
SCRIPT_PATH = "scripts/fetch_round277_london_ldd_archive_next22_candidates.py"
OUT_DIR = Path("tmp/subagents/round277_london_ldd_archive_next22")
OUT_PATH = OUT_DIR / "candidates.json"
SOURCE_AUDIT_PATH = OUT_DIR / "source_audit.json"
SUMMARY_PATH = OUT_DIR / "summary.json"
NOTES_PATH = OUT_DIR / "notes.md"
REJECTED_PATH = OUT_DIR / "rejected.json"

ROUND271_SCRIPT_PATH = Path("scripts/fetch_round271_london_ldd_archive_next21_candidates.py")


def build_round_replacements():
    replacements = {
        "round271_london_ldd_archive_next21_candidates": TASK_ID,
        "scripts/fetch_round271_london_ldd_archive_next21_candidates.py": SCRIPT_PATH,
        "tmp/subagents/round271_london_ldd_archive_next21": OUT_DIR.as_posix(),
        "Round 271 London LDD archive next21 candidates": "Round 277 London LDD archive next22 candidates",
        "2026-05-19": ACCESSED_AT,
        "a administrative": "an administrative",
        "selected completion, started, or permission milestone dates": (
            "selected permission milestone dates"
        ),
        "selected completion, work-start, or permission milestone records": (
            "selected permission milestone records"
        ),
        "selected permission, commencement, or completion milestone dates": (
            "selected permission milestone dates"
        ),
        "selected permission, commencement, or completion milestone records": (
            "selected permission milestone records"
        ),
        "selected permission milestone dates": (
            "selected permission milestone dates"
        ),
        "selected permission milestone records": (
            "selected permission milestone records"
        ),
        "selected LDD `Permission Date`": (
            "selected LDD `Permission Date`, with commencement/completion fields retained as source caveats"
        ),
        "sorted by milestone priority, signal score, milestone date, and source row": (
            "sorted by signal score, permission date, and source row"
        ),
        "same fields inside the round271 batch scan": "same fields inside the round277 batch scan",
        "duplicate inside round271 batch scan": "duplicate inside round277 batch scan",
    }
    for round_number in [
        176,
        182,
        188,
        194,
        200,
        206,
        212,
        220,
        226,
        233,
        239,
        245,
        252,
        260,
    ]:
        replacements[f"through round{round_number}"] = "through round271"
        replacements[f"after round{round_number}"] = "after round271"
        replacements[f"same fields inside the round{round_number} batch scan"] = (
            "same fields inside the round277 batch scan"
        )
        replacements[f"duplicate inside round{round_number} batch scan"] = "duplicate inside round277 batch scan"
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
        (20, 260),
        (21, 271),
    ]:
        replacements[f"round{round_number}_london_ldd_archive_next{next_number}_candidates"] = TASK_ID
        replacements[f"scripts/fetch_round{round_number}_london_ldd_archive_next{next_number}_candidates.py"] = (
            SCRIPT_PATH
        )
        replacements[f"Round {round_number} London LDD archive next{next_number} candidates"] = (
            "Round 277 London LDD archive next22 candidates"
        )
        replacements[f"tmp/subagents/round{round_number}_london_ldd_archive_next{next_number}"] = (
            OUT_DIR.as_posix()
        )
    return replacements


ROUND_REPLACEMENTS = build_round_replacements()


def load_round271_module():
    spec = importlib.util.spec_from_file_location("round271_ldd_next21", ROUND271_SCRIPT_PATH)
    if not spec or not spec.loader:
        raise RuntimeError(f"Unable to load {ROUND271_SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


round271 = load_round271_module()
original_rewrite_candidate = round271.rewrite_candidate


def configure_round277_globals():
    round271.ACCESSED_AT = ACCESSED_AT
    round271.SOURCE_ID = SOURCE_ID
    round271.TASK_ID = TASK_ID
    round271.SCRIPT_PATH = SCRIPT_PATH
    round271.OUT_DIR = OUT_DIR
    round271.OUT_PATH = OUT_PATH
    round271.SOURCE_AUDIT_PATH = SOURCE_AUDIT_PATH
    round271.SUMMARY_PATH = SUMMARY_PATH
    round271.NOTES_PATH = NOTES_PATH
    round271.REJECTED_PATH = REJECTED_PATH
    round271.ROUND_REPLACEMENTS = ROUND_REPLACEMENTS


def base_module():
    return round271.base_module()


def prior_ldd_pack_paths():
    paths = []
    base = base_module()
    for path in sorted(Path("tmp/subagents").glob("round*_london_ldd_archive*/candidates.json")):
        if OUT_DIR in path.parents:
            continue
        match = base.re.search(r"round(\d+)_", path.parent.name)
        if not match or int(match.group(1)) > 271:
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
        f"lon_ldd_archive_next22_round277_{milestone}_row_{excel_row}_"
        f"{base.slugify(authority, 36)}_{base.slugify(borough_ref, 48)}"
    )
    candidate["candidate_id"] = event_id
    candidate["event_id"] = event_id
    candidate["transformation_method"] = apply_replacements(candidate["transformation_method"])
    return candidate


def candidate_limit():
    return round271.candidate_limit()


def write_notes(candidate_count, summary):
    exclusion_counts = apply_replacements(summary.get("exclusion_counts", {}))
    text = f"""# Round 277 London LDD archive next22 candidates

Generated the next bounded London Development Database archive candidate pack after round271. This pack selects source-defined permission milestone records, while preserving the LDD commencement and completion fields as source caveats and deduplicating against the manual corpus and previous/pending LDD archive packs through round271, including the round245, round252, round260, and round271 packs.

- Source ID: `{SOURCE_ID}`
- Candidate output: `{OUT_PATH.as_posix()}`
- Candidate count: {candidate_count}
- Cap: {candidate_limit()}
- Accessed/retrieved date retained in outputs: {ACCESSED_AT}
- Input LDD planning-permissions rows scanned: {summary.get("input_rows_scanned")}
- Eligible rows after dedupe and signal filters: {summary.get("eligible_scored_rows_after_dedupe_and_signal_filters")}

## Dedupe

The generator excludes manual-corpus LDD records and previous/pending LDD archive candidate packs through round271 by workbook row, planning authority plus borough reference, source URL plus source record id, candidate title/date, and source/date key. It explicitly screens the prior/pending LDD packs through round245, round252, round260, and round271, and removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected LDD `Permission Date` from 2008-01-01 through {ACCESSED_AT}, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals. LDD commencement and completion fields are retained in provenance/limitations but this next22 pass only accepts source-defined permission milestones because prior completion and commencement passes have already been screened through round271.

Small domestic, low-score alteration/extension, and administrative-only rows are excluded unless they meet a high-signal or large-development override. This keeps the batch useful for architecture/city-change review rather than turning the LDD archive into a minor-applications export.

## Caveats

These are LDD administrative planning/development records only. They are not direct evidence of delivery, construction commencement, construction completion, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting a candidate into canonical event status.

## Exclusion Counts

```json
{json.dumps(exclusion_counts, indent=2)}
```
"""
    NOTES_PATH.write_text(text, encoding="utf-8")


def postprocess_outputs():
    for path in [OUT_PATH, SOURCE_AUDIT_PATH, SUMMARY_PATH, REJECTED_PATH]:
        payload = json.loads(path.read_text(encoding="utf-8"))
        payload = round271.round260.normalize_permission_only_metadata(payload)
        payload = apply_replacements(payload)
        selection_summary = payload.get("selection_summary") if isinstance(payload, dict) else None
        if isinstance(selection_summary, dict):
            filters = selection_summary.get("filters")
            if isinstance(filters, list):
                normalized_filters = []
                for item in filters:
                    if item == "Sorted by milestone priority, signal score, date, and workbook row; capped at 240":
                        continue
                    normalized_filters.append(
                        "Sorted by signal score, permission date, and workbook row; capped at 240"
                        if item == (
                            "Reserved up to 80 completion, 80 started, and 80 permission records "
                            "before filling remaining slots by the same deterministic ordering"
                        )
                        else item
                    )
                selection_summary["filters"] = normalized_filters
        write_json(path, payload)


def main():
    configure_round277_globals()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    round271.prior_ldd_pack_paths = prior_ldd_pack_paths
    round271.rewrite_candidate = rewrite_candidate
    round271.write_notes = write_notes
    round271.postprocess_outputs = postprocess_outputs
    round271.main()


if __name__ == "__main__":
    main()
