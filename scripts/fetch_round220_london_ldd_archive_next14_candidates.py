import importlib.util
import json
import sys
from pathlib import Path


sys.dont_write_bytecode = True

ACCESSED_AT = "2026-05-19"
SOURCE_ID = "london-development-database-archive"
TASK_ID = "round220_london_ldd_archive_next14_candidates"
SCRIPT_PATH = "scripts/fetch_round220_london_ldd_archive_next14_candidates.py"
OUT_DIR = Path("tmp/subagents/round220_london_ldd_archive_next14")
OUT_PATH = OUT_DIR / "candidates.json"
SOURCE_AUDIT_PATH = OUT_DIR / "source_audit.json"
SUMMARY_PATH = OUT_DIR / "summary.json"
NOTES_PATH = OUT_DIR / "notes.md"
REJECTED_PATH = OUT_DIR / "rejected.json"

ROUND212_SCRIPT_PATH = Path("scripts/fetch_round212_london_ldd_archive_next13_candidates.py")
ROUND_REPLACEMENTS = {
    "round200_london_ldd_archive_next11_candidates": TASK_ID,
    "round206_london_ldd_archive_next12_candidates": TASK_ID,
    "round212_london_ldd_archive_next13_candidates": TASK_ID,
    "scripts/fetch_round200_london_ldd_archive_next11_candidates.py": SCRIPT_PATH,
    "scripts/fetch_round206_london_ldd_archive_next12_candidates.py": SCRIPT_PATH,
    "scripts/fetch_round212_london_ldd_archive_next13_candidates.py": SCRIPT_PATH,
    "tmp/subagents/round200_london_ldd_archive_next11": OUT_DIR.as_posix(),
    "tmp/subagents/round206_london_ldd_archive_next12": OUT_DIR.as_posix(),
    "tmp/subagents/round212_london_ldd_archive_next13": OUT_DIR.as_posix(),
    "through round182": "through round212",
    "through round188": "through round212",
    "through round194": "through round212",
    "through round200": "through round212",
    "through round206": "through round212",
    "after round182": "after round212",
    "after round188": "after round212",
    "after round194": "after round212",
    "after round200": "after round212",
    "after round206": "after round212",
    "same fields inside the round182 batch scan": "same fields inside the round220 batch scan",
    "same fields inside the round188 batch scan": "same fields inside the round220 batch scan",
    "same fields inside the round194 batch scan": "same fields inside the round220 batch scan",
    "same fields inside the round200 batch scan": "same fields inside the round220 batch scan",
    "same fields inside the round206 batch scan": "same fields inside the round220 batch scan",
    "same fields inside the round212 batch scan": "same fields inside the round220 batch scan",
    "duplicate inside round182 batch scan": "duplicate inside round220 batch scan",
    "duplicate inside round188 batch scan": "duplicate inside round220 batch scan",
    "duplicate inside round194 batch scan": "duplicate inside round220 batch scan",
    "duplicate inside round200 batch scan": "duplicate inside round220 batch scan",
    "duplicate inside round206 batch scan": "duplicate inside round220 batch scan",
    "duplicate inside round212 batch scan": "duplicate inside round220 batch scan",
    "Round 200 London LDD archive next11 candidates": "Round 220 London LDD archive next14 candidates",
    "Round 206 London LDD archive next12 candidates": "Round 220 London LDD archive next14 candidates",
    "Round 212 London LDD archive next13 candidates": "Round 220 London LDD archive next14 candidates",
    "a administrative": "an administrative",
}


def load_round212_module():
    spec = importlib.util.spec_from_file_location("round212_ldd_next13", ROUND212_SCRIPT_PATH)
    if not spec or not spec.loader:
        raise RuntimeError(f"Unable to load {ROUND212_SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


round212 = load_round212_module()
original_rewrite_candidate = round212.rewrite_candidate


def configure_round220_globals():
    round212.ACCESSED_AT = ACCESSED_AT
    round212.SOURCE_ID = SOURCE_ID
    round212.TASK_ID = TASK_ID
    round212.SCRIPT_PATH = SCRIPT_PATH
    round212.OUT_DIR = OUT_DIR
    round212.OUT_PATH = OUT_PATH
    round212.SOURCE_AUDIT_PATH = SOURCE_AUDIT_PATH
    round212.SUMMARY_PATH = SUMMARY_PATH
    round212.NOTES_PATH = NOTES_PATH
    round212.REJECTED_PATH = REJECTED_PATH
    round212.ROUND_REPLACEMENTS = ROUND_REPLACEMENTS


def base_module():
    return round212.base_module()


def prior_ldd_pack_paths():
    paths = []
    base = base_module()
    for path in sorted(Path("tmp/subagents").glob("round*_london_ldd_archive*/candidates.json")):
        if OUT_DIR in path.parents:
            continue
        match = base.re.search(r"round(\d+)_", path.parent.name)
        if not match or int(match.group(1)) > 212:
            continue
        paths.append(path)
    return paths


def rewrite_candidate(candidate, row, excel_row, milestone, milestone_date):
    candidate = original_rewrite_candidate(candidate, row, excel_row, milestone, milestone_date)
    base = base_module()
    authority = base.clean_text(row.get("Planning Authority"))
    borough_ref = base.clean_text(row.get("Borough Reference"))
    event_id = (
        f"lon_ldd_archive_next14_round220_{milestone}_row_{excel_row}_"
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
    return round212.candidate_limit()


def write_notes(candidate_count, summary):
    exclusion_counts = apply_replacements(summary.get("exclusion_counts", {}))
    text = f"""# Round 220 London LDD archive next14 candidates

Generated the next bounded London Development Database archive candidate pack after round212. This pack selects source-defined completion, work-start, or permission milestone records, while deduplicating against the manual corpus and previous LDD archive packs through round212.

- Source ID: `{SOURCE_ID}`
- Candidate output: `{OUT_PATH.as_posix()}`
- Candidate count: {candidate_count}
- Cap: {candidate_limit()}
- Accessed/retrieved date retained in outputs: {ACCESSED_AT}
- Input LDD planning-permissions rows scanned: {summary.get("input_rows_scanned")}
- Eligible rows after dedupe and signal filters: {summary.get("eligible_scored_rows_after_dedupe_and_signal_filters")}

## Dedupe

The generator excludes manual-corpus LDD records and previous LDD archive candidate packs through round212 by workbook row, planning authority plus borough reference, source URL plus source record id, candidate title/date, and source/date key. It also removes duplicate event IDs and source/date keys inside this batch.

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
    configure_round220_globals()
    round212.prior_ldd_pack_paths = prior_ldd_pack_paths
    round212.rewrite_candidate = rewrite_candidate
    round212.write_notes = write_notes
    round212.main()
    postprocess_outputs()


if __name__ == "__main__":
    main()
