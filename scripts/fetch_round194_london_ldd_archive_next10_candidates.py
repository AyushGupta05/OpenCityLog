import importlib.util
import json
import sys
from pathlib import Path


sys.dont_write_bytecode = True

ACCESSED_AT = "2026-05-19"
SOURCE_ID = "london-development-database-archive"
TASK_ID = "round194_london_ldd_archive_next10_candidates"
SCRIPT_PATH = "scripts/fetch_round194_london_ldd_archive_next10_candidates.py"
OUT_DIR = Path("tmp/subagents/round194_london_ldd_archive_next10")
OUT_PATH = OUT_DIR / "candidates.json"
SOURCE_AUDIT_PATH = OUT_DIR / "source_audit.json"
SUMMARY_PATH = OUT_DIR / "summary.json"
NOTES_PATH = OUT_DIR / "notes.md"
REJECTED_PATH = OUT_DIR / "rejected.json"

ROUND188_SCRIPT_PATH = Path("scripts/fetch_round188_london_ldd_archive_next9_candidates.py")
ROUND_REPLACEMENTS = {
    "round188_london_ldd_archive_next9_candidates": TASK_ID,
    "scripts/fetch_round188_london_ldd_archive_next9_candidates.py": SCRIPT_PATH,
    "tmp/subagents/round188_london_ldd_archive_next9": OUT_DIR.as_posix(),
    "through round182": "through round188",
    "after round182": "after round188",
    "same fields inside the round188 batch scan": "same fields inside the round194 batch scan",
    "duplicate inside round188 batch scan": "duplicate inside round194 batch scan",
    "duplicate inside round182 batch scan": "duplicate inside round194 batch scan",
    "Round 188 London LDD archive next9 candidates": "Round 194 London LDD archive next10 candidates",
    "a administrative": "an administrative",
    "next9": "next10",
    "round188": "round194",
}


def load_round188_module():
    spec = importlib.util.spec_from_file_location("round188_ldd_next9", ROUND188_SCRIPT_PATH)
    if not spec or not spec.loader:
        raise RuntimeError(f"Unable to load {ROUND188_SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


ldd = load_round188_module()
original_rewrite_candidate = ldd.rewrite_candidate


def configure_round194_globals():
    ldd.ACCESSED_AT = ACCESSED_AT
    ldd.SOURCE_ID = SOURCE_ID
    ldd.TASK_ID = TASK_ID
    ldd.SCRIPT_PATH = SCRIPT_PATH
    ldd.OUT_DIR = OUT_DIR
    ldd.OUT_PATH = OUT_PATH
    ldd.SOURCE_AUDIT_PATH = SOURCE_AUDIT_PATH
    ldd.SUMMARY_PATH = SUMMARY_PATH
    ldd.NOTES_PATH = NOTES_PATH
    ldd.REJECTED_PATH = REJECTED_PATH


def prior_ldd_pack_paths():
    paths = []
    for path in sorted(Path("tmp/subagents").glob("round*_london_ldd_archive*/candidates.json")):
        if OUT_DIR in path.parents:
            continue
        match = ldd.ldd.base.re.search(r"round(\d+)_", path.parent.name)
        if not match or int(match.group(1)) > 188:
            continue
        paths.append(path)
    return paths


def rewrite_candidate(candidate, row, excel_row, milestone, milestone_date):
    candidate = original_rewrite_candidate(candidate, row, excel_row, milestone, milestone_date)
    authority = ldd.ldd.base.clean_text(row.get("Planning Authority"))
    borough_ref = ldd.ldd.base.clean_text(row.get("Borough Reference"))
    event_id = (
        f"lon_ldd_archive_next10_round194_{milestone}_row_{excel_row}_"
        f"{ldd.ldd.base.slugify(authority, 36)}_{ldd.ldd.base.slugify(borough_ref, 48)}"
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


def write_notes(candidate_count, summary):
    exclusion_counts = apply_replacements(summary.get("exclusion_counts", {}))
    text = f"""# Round 194 London LDD archive next10 candidates

Generated the next bounded London Development Database archive candidate pack after round188. This pack selects source-defined completion, work-start, or permission milestone records, while deduplicating against the manual corpus and previous LDD archive packs through round188.

- Source ID: `{SOURCE_ID}`
- Candidate output: `{OUT_PATH.as_posix()}`
- Candidate count: {candidate_count}
- Cap: {ldd.ldd.CANDIDATE_LIMIT}
- Accessed/retrieved date retained in outputs: {ACCESSED_AT}
- Input LDD planning-permissions rows scanned: {summary.get("input_rows_scanned")}
- Eligible rows after dedupe and signal filters: {summary.get("eligible_scored_rows_after_dedupe_and_signal_filters")}

## Dedupe

The generator excludes manual-corpus LDD records and previous LDD archive candidate packs through round188 by workbook row, planning authority plus borough reference, source URL plus source record id, candidate title/date, and source/date key. It also removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected `Permission Date`, `Date work commenced on site (Started Date)`, or `Date construction completed (Completed Date)` from 2008-01-01 through {ACCESSED_AT}, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals.

Small domestic, low-score alteration/extension, and administrative-only rows are excluded unless they meet a high-signal or large-development override. This keeps the batch useful for architecture/city-change review rather than turning the LDD archive into a minor-applications export.

## Caveats

These are LDD administrative planning/development milestone records. The source fields are not independent evidence of construction, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting a candidate into canonical event status.

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
    configure_round194_globals()
    ldd.prior_ldd_pack_paths = prior_ldd_pack_paths
    ldd.rewrite_candidate = rewrite_candidate
    ldd.write_notes = write_notes
    ldd.main()
    postprocess_outputs()


if __name__ == "__main__":
    main()
