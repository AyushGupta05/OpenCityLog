#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

const pythonProgram = String.raw`
import importlib.util
import json
import re
import sys
from collections import Counter
from pathlib import Path


sys.dont_write_bytecode = True

ACCESSED_AT = "2026-05-20"
SOURCE_ID = "london-development-database-archive"
TASK_ID = "round396_london_ldd_archive_next26_candidates"
SCRIPT_PATH = "scripts/fetch_round396_london_ldd_archive_next26_candidates.js"
OUT_DIR = Path("tmp/subagents/round396_london_ldd_archive_next26")
OUT_PATH = OUT_DIR / "candidates.json"
SOURCE_AUDIT_PATH = OUT_DIR / "source_audit.json"
SUMMARY_PATH = OUT_DIR / "summary.json"
NOTES_PATH = OUT_DIR / "notes.md"
REJECTED_PATH = OUT_DIR / "rejected.json"
VALIDATION_PATH = OUT_DIR / "validation.json"
VALIDATION_REPORT_PATH = OUT_DIR / "validation_report.md"

ROUND297_SCRIPT_PATH = Path("scripts/fetch_round297_london_ldd_archive_next25_candidates.py")

DATASET_PAGE = "https://data.london.gov.uk/dataset/planning-permissions-on-the-london-development-database-ldd-2jxq0/"
OFFICIAL_DOWNLOAD_PREFIX = "https://data.london.gov.uk/download/2jxq0/"
LICENSE = "UK Open Government Licence (OGL v3)"
CANDIDATE_LIMIT = 240
DATE_FIELDS = {
    "completion": "Date construction completed (Completed Date)",
    "started": "Date work commenced on site (Started Date)",
    "permission": "Permission Date",
}


def load_round297_module():
    spec = importlib.util.spec_from_file_location("round297_ldd_next25", ROUND297_SCRIPT_PATH)
    if not spec or not spec.loader:
        raise RuntimeError(f"Unable to load {ROUND297_SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


round297 = load_round297_module()
round176 = round297.round176
original_rewrite_candidate = round297.original_rewrite_candidate
original_source_audit = round297.original_source_audit

ROUND_REPLACEMENTS = {
    "round297_london_ldd_archive_next25_candidates": TASK_ID,
    "scripts/fetch_round297_london_ldd_archive_next25_candidates.py": SCRIPT_PATH,
    "tmp/subagents/round297_london_ldd_archive_next25": OUT_DIR.as_posix(),
    "Round 297 London LDD archive next25 candidates": "Round 396 London LDD archive next26 candidates",
    "round176_london_ldd_archive_next7_candidates": TASK_ID,
    "scripts/fetch_round176_london_ldd_archive_next7_candidates.py": SCRIPT_PATH,
    "tmp/subagents/round176_london_ldd_archive_next7": OUT_DIR.as_posix(),
    "Round 176 London LDD archive next7 candidates": "Round 396 London LDD archive next26 candidates",
    "after round170": "after round297",
    "after round287": "after round297",
    "through round170": "through round297",
    "through round287": "through round297",
    "through_round287": "through_round297",
    "same fields inside the round176 batch scan": "same fields inside the round396 batch scan",
    "duplicate inside round176 batch scan": "duplicate inside round396 batch scan",
    "same fields inside the round297 batch scan": "same fields inside the round396 batch scan",
    "duplicate inside round297 batch scan": "duplicate inside round396 batch scan",
    "No commencement/started or completion rows remained after dedupe through round287 and signal filters.": (
        "No commencement/started or completion rows remained after dedupe through round297 and signal filters."
    ),
    "No remaining clean LDD candidates passed the round297 filters.": (
        "No remaining clean LDD candidates passed the round396 filters after dedupe through round297."
    ),
}


def base_module():
    return round176.base


def configure_round396_globals():
    for module in (round297, round176):
        module.ACCESSED_AT = ACCESSED_AT
        module.SOURCE_ID = SOURCE_ID
        module.TASK_ID = TASK_ID
        module.SCRIPT_PATH = SCRIPT_PATH
        module.OUT_DIR = OUT_DIR
        module.OUT_PATH = OUT_PATH
        module.SOURCE_AUDIT_PATH = SOURCE_AUDIT_PATH
        module.SUMMARY_PATH = SUMMARY_PATH
        module.NOTES_PATH = NOTES_PATH
        module.REJECTED_PATH = REJECTED_PATH
        module.CANDIDATE_LIMIT = CANDIDATE_LIMIT
    round297.VALIDATION_PATH = VALIDATION_PATH
    round297.VALIDATION_REPORT_PATH = VALIDATION_REPORT_PATH
    round297.ROUND_REPLACEMENTS = ROUND_REPLACEMENTS
    round176.MILESTONE_MINIMUM_TARGETS = {
        "completion": 80,
        "started": 80,
        "permission": 80,
    }
    round176.base.title_date_key = round297.round285.strict_title_date_key


def prior_ldd_pack_paths():
    paths = []
    base = base_module()
    for path in sorted(Path("tmp/subagents").glob("round*_london_ldd_archive*/candidates.json")):
        if OUT_DIR in path.parents:
            continue
        match = base.re.search(r"round(\d+)_", path.parent.name)
        if not match or int(match.group(1)) > 297:
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
        f"lon_ldd_archive_next26_round396_{milestone}_row_{excel_row}_"
        f"{base.slugify(authority, 36)}_{base.slugify(borough_ref, 48)}"
    )
    candidate["candidate_id"] = event_id
    candidate["event_id"] = event_id
    candidate["transformation_method"] = (
        f"Generated by {SCRIPT_PATH}. Parsed official London Datastore LDD archive XLSX workbooks with a "
        "stdlib OOXML reader; deduplicated against the manual architecture corpus and prior LDD archive "
        "candidate packs through round297 by LDD workbook row, planning authority/borough reference, source "
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
    source["source_url"] = DATASET_PAGE
    source["license"] = LICENSE
    source["coverage_years_checked"] = (
        f"Permission, work-start/commencement, and completion milestone rows dated from 2008-01-01 through "
        f"{ACCESSED_AT}, with archive workbooks retained under the official London Datastore LDD dataset."
    )
    source["required_caveats"] = [
        "LDD rows are administrative planning/development lifecycle records and should not be presented as independent evidence of construction, opening, occupation, service delivery, final built form, or current use.",
        "Permission Date, Started Date, Completed Date, and real-world delivery are separate facts.",
        "The source-defined status/date fields may reflect phasing, amendments, administrative updates, or planning-authority interpretation.",
        "Coordinates are LDD point locations from Easting/Northing fields; they are not footprints or precise entrance locations.",
        "Figures describe the permission row and may differ from unaffected uses, phases, split permissions, later amendments, or the final built form.",
    ]
    source["ingestion_recommendation"] = (
        "Use selected rows only as candidate LDD administrative permission, work-start/commencement, or completion "
        "milestones with visible provenance and caveats. Round396 found no fresh non-duplicate rows after screening "
        "against the manual corpus and prior LDD archive candidate packs through round297."
    )
    source["official_source_identified_from_prior_ldd_fetchers"] = {
        "dataset_page": DATASET_PAGE,
        "download_prefix": OFFICIAL_DOWNLOAD_PREFIX,
        "download_urls": source.get("download_urls", {}),
    }
    return audit


def write_notes(candidate_count, summary):
    exclusion_counts = apply_replacements(summary.get("exclusion_counts", {}))
    eligible_count = int(summary.get("eligible_scored_rows_after_dedupe_and_signal_filters") or 0)
    headroom = max(0, eligible_count - candidate_count)
    text = f"""# Round 396 London LDD archive next26 candidates

Generated the next bounded London Development Database archive candidate pack after round297. This worker scans the same official London Datastore LDD archive workbooks as the earlier LDD archive rounds and deduplicates against the live manual corpus plus prior LDD archive packs through round297.

- Source ID: {SOURCE_ID}
- Official dataset page: {DATASET_PAGE}
- Candidate output: {OUT_PATH.as_posix()}
- Candidate count: {candidate_count}
- Cap: {CANDIDATE_LIMIT}
- Remaining eligible headroom after retained candidates: {headroom}
- Accessed/retrieved date retained in outputs: {ACCESSED_AT}
- Input LDD planning-permissions rows scanned: {summary.get("input_rows_scanned")}
- Eligible rows after dedupe and signal filters: {eligible_count}
- Validation JSON: {VALIDATION_PATH.as_posix()}
- Validation report: {VALIDATION_REPORT_PATH.as_posix()}

## Dedupe

The generator excludes manual-corpus LDD records and prior LDD archive candidate packs through round297 by workbook row, planning authority plus borough reference, source URL plus source record id, event id, candidate title/date, and source/date key. It also removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected Permission Date, Date work commenced on site (Started Date), or Date construction completed (Completed Date) from 2008-01-01 through {ACCESSED_AT}, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals.

No fresh non-duplicate rows remained after the round297 pack was included in the dedupe set. This pack is therefore an exhaustion/validation marker rather than a new source of candidate events.

## Caveats

These are LDD administrative planning/development lifecycle records only. The source fields are not independent evidence of delivery, construction, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting any LDD candidate to canonical event status.

## Exclusion Counts

{json.dumps(exclusion_counts, indent=2)}
"""
    NOTES_PATH.write_text(text, encoding="utf-8")


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
    checks = validation.get("checks", [])
    lines = [
        "# Round 396 London LDD archive next26 validation report",
        "",
        f"- OK: {str(validation.get('ok')).lower()}",
        f"- Candidate count: {validation.get('candidate_count')}",
        f"- Date range: {validation.get('date_range', {}).get('start')} to {validation.get('date_range', {}).get('end')}",
        f"- Milestone mix: {json.dumps(validation.get('milestone_mix', {}), sort_keys=True)}",
        f"- Prior LDD packs checked through round297: {validation.get('prior_ldd_packs_checked_through_round297')}",
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
    lines.extend(f"- {check}" for check in checks)
    lines.extend(["", "## Warnings", ""])
    lines.extend(f"- {warning}" for warning in warnings) if warnings else lines.append("- None")
    lines.extend(["", "## Issues", ""])
    lines.extend(f"- {issue}" for issue in issues) if issues else lines.append("- None")
    lines.append("")
    VALIDATION_REPORT_PATH.write_text("\n".join(lines), encoding="utf-8")


def configure_round297_validation_helpers():
    round297.prior_ldd_pack_paths = prior_ldd_pack_paths
    round297.apply_replacements = apply_replacements
    round297.write_json = write_json


def main():
    configure_round396_globals()
    configure_round297_validation_helpers()
    round176.prior_ldd_pack_paths = prior_ldd_pack_paths
    round176.rewrite_candidate = rewrite_candidate
    round176.source_audit = source_audit
    round176.write_notes = write_notes
    round176.main()
    postprocess_outputs()
    validation = apply_replacements(round297.validate_generated_pack())
    write_json(VALIDATION_PATH, validation)
    write_validation_report(validation)
    postprocess_outputs(validation)
    if not validation["ok"]:
        raise RuntimeError(f"Round396 validation failed: {validation['issues']}")
    print(json.dumps({
        "outPath": str(OUT_PATH),
        "sourceAuditPath": str(SOURCE_AUDIT_PATH),
        "summaryPath": str(SUMMARY_PATH),
        "notesPath": str(NOTES_PATH),
        "rejectedPath": str(REJECTED_PATH),
        "validationPath": str(VALIDATION_PATH),
        "validationReportPath": str(VALIDATION_REPORT_PATH),
        "candidates": validation.get("candidate_count"),
        "dateRange": validation.get("date_range"),
        "priorLddPacksCheckedThroughRound297": validation.get("prior_ldd_packs_checked_through_round297"),
        "warnings": validation.get("warnings", []),
    }, indent=2))


if __name__ == "__main__":
    main()
`;

const candidates = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];
let sawExecutable = false;

for (const command of candidates) {
  const args = command === "py" ? ["-3", "-c", pythonProgram] : ["-c", pythonProgram];
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.error && result.error.code === "ENOENT") {
    continue;
  }

  sawExecutable = true;

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status === null ? 1 : result.status);
}

if (!sawExecutable) {
  console.error("Unable to find a Python 3 executable for the LDD workbook parser.");
  process.exit(1);
}
