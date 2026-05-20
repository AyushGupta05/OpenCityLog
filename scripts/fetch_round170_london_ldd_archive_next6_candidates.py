import importlib.util
import json
import sys
from collections import Counter
from pathlib import Path


sys.dont_write_bytecode = True

ACCESSED_AT = "2026-05-19"
SOURCE_ID = "london-development-database-archive"
TASK_ID = "round170_london_ldd_archive_next6_candidates"
SCRIPT_PATH = "scripts/fetch_round170_london_ldd_archive_next6_candidates.py"
OUT_DIR = Path("tmp/subagents/round170_london_ldd_archive_next6")
OUT_PATH = OUT_DIR / "candidates.json"
SOURCE_AUDIT_PATH = OUT_DIR / "source_audit.json"
SUMMARY_PATH = OUT_DIR / "summary.json"
NOTES_PATH = OUT_DIR / "notes.md"
REJECTED_PATH = OUT_DIR / "rejected.json"
CANDIDATE_LIMIT = 240
MILESTONE_MINIMUM_TARGETS = {
    "completion": 80,
    "started": 80,
    "permission": 80,
}

BASE_SCRIPT_PATH = Path("scripts/fetch_round144_london_ldd_archive_next3_candidates.py")
DATE_FIELDS = {
    "completion": "Date construction completed (Completed Date)",
    "started": "Date work commenced on site (Started Date)",
    "permission": "Permission Date",
}


def load_base_module():
    spec = importlib.util.spec_from_file_location("round144_ldd_base", BASE_SCRIPT_PATH)
    if not spec or not spec.loader:
        raise RuntimeError(f"Could not load base LDD helper script at {BASE_SCRIPT_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


base = load_base_module()


def configure_base_globals():
    base.ACCESSED_AT = ACCESSED_AT
    base.TASK_ID = TASK_ID
    base.SCRIPT_PATH = SCRIPT_PATH
    base.OUT_DIR = OUT_DIR
    base.OUT_PATH = OUT_PATH
    base.SOURCE_AUDIT_PATH = SOURCE_AUDIT_PATH
    base.NOTES_PATH = NOTES_PATH


def prior_ldd_pack_paths():
    paths = []
    for path in sorted(Path("tmp/subagents").glob("round*_london_ldd_archive*/candidates.json")):
        if OUT_DIR in path.parents:
            continue
        paths.append(path)
    return paths


def load_prior_packs(dedupe):
    packs = []
    for path in prior_ldd_pack_paths():
        label = path.parent.name
        pack = base.previous_candidate_pack_dedupe(path)
        packs.append((label, path, pack))
        dedupe["rows"].update(pack["rows"])
        dedupe["refs"].update(pack["refs"])
        dedupe["source_keys"].update(pack["source_keys"])
        dedupe["title_dates"].update(pack["title_dates"])
    return packs


def corpus_source_date_keys():
    keys = set()
    corpus_path = base.CORPUS_PATH
    if not corpus_path.exists():
        return keys
    payload = json.loads(corpus_path.read_text(encoding="utf-8-sig"))
    for event in payload.get("events", []):
        source_url = base.clean_text(event.get("source_url")).lower()
        source_record_id = base.clean_text(event.get("source_record_id")).lower()
        date_value = base.clean_text(event.get("date") or event.get("effective_date"))
        if source_url and source_record_id and date_value:
            keys.add((source_url, source_record_id, date_value))
    return keys


def prior_source_date_keys(paths):
    keys = set()
    for path in paths:
        if not path.exists():
            continue
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
        for candidate in payload.get("candidates", []):
            source_url = base.clean_text(candidate.get("source_url")).lower()
            source_record_id = base.clean_text(candidate.get("source_record_id")).lower()
            date_value = base.clean_text(candidate.get("date") or candidate.get("effective_date"))
            if source_url and source_record_id and date_value:
                keys.add((source_url, source_record_id, date_value))
    return keys


def source_date_key(source_record_id, date_value):
    return (base.DATASET_PAGE.lower(), base.clean_text(source_record_id).lower(), date_value)


def select_scored_records(scored):
    selected = []
    selected_rows = set()
    for milestone, target in MILESTONE_MINIMUM_TARGETS.items():
        milestone_rows = [item for item in scored if item[7] == milestone]
        for item in milestone_rows[:target]:
            if len(selected) >= CANDIDATE_LIMIT:
                break
            excel_row = item[3]
            if excel_row in selected_rows:
                continue
            selected.append(item)
            selected_rows.add(excel_row)
    for item in scored:
        if len(selected) >= CANDIDATE_LIMIT:
            break
        excel_row = item[3]
        if excel_row in selected_rows:
            continue
        selected.append(item)
        selected_rows.add(excel_row)
    selected.sort()
    return selected


def choose_milestone(row):
    completed_date = base.as_date(row.get(DATE_FIELDS["completion"]))
    started_date = base.as_date(row.get(DATE_FIELDS["started"]))
    permission_date = base.as_date(row.get(DATE_FIELDS["permission"]))
    current_status = base.clean_text(row.get("Current permission status")).lower()

    if current_status == "completed" and "2008-01-01" <= completed_date <= ACCESSED_AT:
        return "completion", completed_date
    if current_status == "started" and "2008-01-01" <= started_date <= ACCESSED_AT:
        return "started", started_date
    if "2008-01-01" <= permission_date <= ACCESSED_AT:
        return "permission", permission_date
    if "2008-01-01" <= started_date <= ACCESSED_AT:
        return "started", started_date
    if "2008-01-01" <= completed_date <= ACCESSED_AT:
        return "completion", completed_date
    return "", ""


def milestone_words(milestone):
    if milestone == "completion":
        return {
            "bucket_suffix": "ldd_completion_record",
            "event_type": "development_administrative_completion_status_record",
            "title_prefix": "LDD administrative completion-status record",
            "date_phrase": "source-supplied Completed Date",
            "observed": "administrative completion-status",
        }
    if milestone == "started":
        return {
            "bucket_suffix": "ldd_started_record",
            "event_type": "development_administrative_started_status_record",
            "title_prefix": "LDD administrative work-start record",
            "date_phrase": "source-supplied Started Date",
            "observed": "administrative work-start",
        }
    return {
        "bucket_suffix": "ldd_permission_record",
        "event_type": "development_administrative_permission_record",
        "title_prefix": "LDD administrative permission record",
        "date_phrase": "source-supplied Permission Date",
        "observed": "administrative planning-permission",
    }


def rewrite_candidate(candidate, row, excel_row, milestone, milestone_date):
    authority = base.clean_text(row.get("Planning Authority"))
    borough_ref = base.clean_text(row.get("Borough Reference"))
    title_label = base.label_for(row)
    words = milestone_words(milestone)
    metric_text = base.metric_text_for(row)
    description = base.clean_text(row.get("Development Description"), 700)
    current_status = base.clean_text(row.get("Current permission status"))

    event_id = (
        f"lon_ldd_archive_next6_round170_{milestone}_row_{excel_row}_"
        f"{base.slugify(authority, 36)}_{base.slugify(borough_ref, 48)}"
    )
    candidate["candidate_id"] = event_id
    candidate["event_id"] = event_id
    candidate["date"] = milestone_date
    candidate["effective_date"] = milestone_date
    candidate["bucket"] = f"planning/development/architecture/{words['bucket_suffix']}"
    candidate["title"] = f"{words['title_prefix']}: {title_label}"
    candidate["summary"] = (
        f"The London Development Database archive row for {title_label} in {authority} lists Current permission "
        f"status '{current_status}' and a {words['date_phrase']} of {milestone_date}. The row records {metric_text}. "
        f"Source proposal description: {description}"
    )
    candidate["observed_change"] = (
        f"Administrative LDD archive row records a {words['observed']} milestone date; this is retained as a "
        "planning/development status record, not as independent evidence of opening, occupation, final built form, "
        "current use, outcomes, or causal relationships."
    )
    candidate["event_type"] = words["event_type"]
    candidate["category"] = "architecture_related_ldd_archive_status_record"
    candidate["source_date_field"] = f"{DATE_FIELDS[milestone]} in the LDD planning-permissions workbook"
    candidate["project_type"] = f"LDD archived planning/development administrative {milestone} record"
    candidate["ldd_milestone_type"] = milestone
    candidate["source_date_value"] = milestone_date
    candidate["limitations"] = (
        "This is an archived LDD planning/development administrative record. Planning permission, work-start, "
        "source-defined completion status, real-world opening, occupation, and current use are separate facts. "
        "The selected milestone date is a source field in the LDD workbook and may reflect planning-authority "
        "administration, phasing, amendments, reserved matters, or later updates. It is not evidence of public "
        "opening, occupation, service delivery, final built form, design quality, local outcomes, or causation. "
        "Local planning authority records should be checked before promoting the candidate to a canonical event."
    )
    candidate["transformation_method"] = (
        f"Generated by {SCRIPT_PATH}. Parsed official LDD archive XLSX workbooks with a stdlib OOXML reader; "
        "deduplicated against the manual architecture corpus and all previous LDD archive candidate packs by LDD "
        "workbook row, planning authority/borough reference, source URL/record id, title/date, and source/date key; "
        "selected completion, started, or permission milestone dates from 2008-01-01 through 2026-05-19 with a valid "
        "Greater London Easting/Northing point and architecture/public/civic/mixed-use or large-development signal; "
        "excluded domestic/minor/admin-only rows below override thresholds; sorted by milestone priority, signal "
        f"score, milestone date, and source row; capped at {CANDIDATE_LIMIT}."
    )
    candidate["raw_row"]["selected_milestone_type"] = milestone
    candidate["raw_row"]["selected_milestone_date"] = milestone_date
    return candidate


def candidate_for(row, excel_row, score, flags, floorspace_refs, bedroom_refs, milestone, milestone_date):
    candidate = base.candidate_for(row, excel_row, score, flags, floorspace_refs, bedroom_refs)
    return rewrite_candidate(candidate, row, excel_row, milestone, milestone_date)


def source_audit(selection_summary):
    audit = base.source_audit(selection_summary)
    audit["generated_at"] = ACCESSED_AT
    audit["task"] = TASK_ID
    source = audit["source_audits"][0]
    source["coverage_years_checked"] = (
        "Completion, work-start, and permission milestone rows dated from 2008-01-01 through 2026-05-19, "
        "with archive workbooks retained under the London Datastore LDD dataset."
    )
    source["required_caveats"] = [
        "LDD rows are administrative planning/development records and should not be presented as independent evidence of construction, opening, occupation, service delivery, final built form, or current use.",
        "Permission Date, Started Date, Completed Date, and real-world delivery are separate facts.",
        "The source-defined status/date fields may reflect phasing, amendments, administrative updates, or planning-authority interpretation.",
        "Coordinates are LDD point locations from Easting/Northing fields; they are not footprints or precise entrance locations.",
        "Figures describe the permission row and may differ from unaffected uses, phases, split permissions, later amendments, or the final built form.",
    ]
    source["ingestion_recommendation"] = (
        "Use selected rows only as candidate LDD administrative permission, work-start, or completion milestones with visible provenance and caveats."
    )
    return audit


def prior_pack_summary(prior_packs, current_dedupe):
    summary = {}
    for label, path, pack in prior_packs:
        summary[f"{label}_candidate_pack_path"] = str(path)
        summary[f"{label}_candidate_rows_seen"] = len(pack["rows"])
        summary[f"{label}_candidate_rows_now_in_manual_corpus"] = len(pack["rows"] & current_dedupe["rows"])
        summary[f"{label}_candidate_authority_reference_pairs_now_in_manual_corpus"] = len(pack["refs"] & current_dedupe["refs"])
    return summary


def write_notes(candidate_count, summary):
    text = f"""# Round 170 London LDD archive next6 candidates

Generated the next bounded London Development Database archive candidate pack after round148. This pack expands beyond exhausted strict completion rows by selecting source-defined completion, work-start, or permission milestone records, while deduplicating against the manual corpus and all previous LDD archive packs.

- Source ID: `{SOURCE_ID}`
- Candidate output: `{OUT_PATH.as_posix()}`
- Candidate count: {candidate_count}
- Cap: {CANDIDATE_LIMIT}
- Accessed/retrieved date retained in outputs: {ACCESSED_AT}
- Input LDD planning-permissions rows scanned: {summary.get("input_rows_scanned")}
- Eligible rows after dedupe and signal filters: {summary.get("eligible_scored_rows_after_dedupe_and_signal_filters")}

## Dedupe

The generator excludes manual-corpus LDD records and all previous LDD archive candidate packs by workbook row, planning authority plus borough reference, source URL plus source record id, candidate title/date, and source/date key. It also removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected `Permission Date`, `Date work commenced on site (Started Date)`, or `Date construction completed (Completed Date)` from 2008-01-01 through {ACCESSED_AT}, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals.

Small domestic, low-score alteration/extension, and administrative-only rows are excluded unless they meet a high-signal or large-development override. This keeps the batch useful for architecture/city-change review rather than turning the LDD archive into a minor-applications export.

## Caveats

These are LDD administrative planning/development milestone records. The source fields are not independent evidence of construction, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting a candidate into canonical event status.

## Exclusion Counts

```json
{json.dumps(summary.get("exclusion_counts", {}), indent=2)}
```
"""
    NOTES_PATH.write_text(text, encoding="utf-8")


def main():
    configure_base_globals()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    permissions_xlsx = base.ensure_file(base.PERMISSIONS_XLSX, base.PERMISSIONS_DOWNLOAD)
    floorspace_xlsx = base.ensure_file(base.FLOORSPACE_XLSX, base.FLOORSPACE_DOWNLOAD)
    bedrooms_xlsx = base.ensure_file(base.BEDROOMS_XLSX, base.BEDROOMS_DOWNLOAD)

    current_dedupe = base.existing_ldd_dedupe()
    dedupe = {
        "rows": set(current_dedupe["rows"]),
        "refs": set(current_dedupe["refs"]),
        "source_keys": set(current_dedupe["source_keys"]),
        "title_dates": set(current_dedupe["title_dates"]),
        "source_id_count": current_dedupe["source_id_count"],
    }
    prior_packs = load_prior_packs(dedupe)
    prior_paths = [path for _, path, _ in prior_packs]
    existing_source_date_keys = corpus_source_date_keys() | prior_source_date_keys(prior_paths)
    floorspace_refs = base.related_row_index(
        floorspace_xlsx,
        base.FLOORSPACE_DOWNLOAD,
        "LDD_Permissions_Non_residential_floorspace_final.xlsx",
    )
    bedroom_refs = base.related_row_index(
        bedrooms_xlsx,
        base.BEDROOMS_DOWNLOAD,
        "LDD_Permissions_Non_residential_bedrooms_final.xlsx",
    )

    scored = []
    exclusions = Counter()
    rejected = []
    seen_refs = set()
    seen_rows = set()
    seen_source_keys = set()
    seen_title_dates = set()
    seen_source_date_keys = set()
    total_rows = 0

    for excel_row, row in base.iter_xlsx_dict_rows(permissions_xlsx):
        total_rows += 1
        authority = base.clean_text(row.get("Planning Authority"))
        borough_ref = base.clean_text(row.get("Borough Reference"))
        easting = base.number(row.get("Easting"))
        northing = base.number(row.get("Northing"))
        title_label = base.label_for(row)
        source_record_id = f"LDD planning permissions workbook row {excel_row}; planning_authority={authority}; borough_reference={borough_ref}"
        milestone, milestone_date = choose_milestone(row)
        words = milestone_words(milestone or "permission")
        tdate_key = base.title_date_key("london", f"{words['title_prefix']}: {title_label}", milestone_date)
        ref_key = base.authority_ref_key(authority, borough_ref)
        skey = base.source_key(base.DATASET_PAGE, source_record_id)
        sdkey = source_date_key(source_record_id, milestone_date) if milestone_date else None

        reason = ""
        if excel_row in dedupe["rows"]:
            reason = "existing corpus or previous LDD candidate workbook row"
        elif ref_key in dedupe["refs"]:
            reason = "existing corpus or previous LDD candidate authority/reference"
        elif skey in dedupe["source_keys"]:
            reason = "existing corpus or previous LDD candidate source key"
        elif tdate_key in dedupe["title_dates"]:
            reason = "existing corpus or previous LDD candidate title/date"
        elif sdkey and sdkey in existing_source_date_keys:
            reason = "existing corpus or previous LDD candidate source/date key"
        elif excel_row in seen_rows or ref_key in seen_refs or skey in seen_source_keys or tdate_key in seen_title_dates or sdkey in seen_source_date_keys:
            reason = "duplicate inside round170 batch scan"
        elif not milestone:
            reason = "missing or outside 2008-2026 permission/started/completed date window"
        elif not (
            base.LONDON_BNG["min_easting"] <= easting <= base.LONDON_BNG["max_easting"]
            and base.LONDON_BNG["min_northing"] <= northing <= base.LONDON_BNG["max_northing"]
        ):
            reason = "missing or outside Greater London LDD point range"
        else:
            score, flags = base.score_row(row)
            reason = base.should_reject_by_signal(row, score, flags)
            if not reason:
                priority = {"completion": 0, "started": 1, "permission": 2}[milestone]
                scored.append((priority, -score, milestone_date, excel_row, row, flags, score, milestone))
                seen_rows.add(excel_row)
                seen_refs.add(ref_key)
                seen_source_keys.add(skey)
                seen_title_dates.add(tdate_key)
                if sdkey:
                    seen_source_date_keys.add(sdkey)
                continue

        exclusions[reason] += 1
        if len(rejected) < 500 and reason not in {
            "existing corpus or previous LDD candidate workbook row",
            "existing corpus or previous LDD candidate authority/reference",
            "existing corpus or previous LDD candidate source key",
        }:
            rejected.append({
                "excel_row": excel_row,
                "reason": reason,
                "planning_authority": authority,
                "borough_reference": borough_ref,
                "selected_milestone_type": milestone,
                "selected_milestone_date": milestone_date,
                "current_permission_status": base.clean_text(row.get("Current permission status")),
                "title_label": title_label,
            })

    scored.sort()
    selected_scored = select_scored_records(scored)
    eligible_milestone_mix = Counter(item[7] for item in scored)
    candidates = [
        candidate_for(row, excel_row, score, flags, floorspace_refs, bedroom_refs, milestone, milestone_date)
        for _, neg_score, milestone_date, excel_row, row, flags, score, milestone in selected_scored
    ]
    for candidate in candidates:
        base.validate_candidate(candidate)

    event_ids = [candidate["event_id"] for candidate in candidates]
    batch_source_date_keys = [
        source_date_key(candidate["source_record_id"], candidate["date"])
        for candidate in candidates
    ]
    if len(event_ids) != len(set(event_ids)):
        raise ValueError("Duplicate event_id generated")
    if len(batch_source_date_keys) != len(set(batch_source_date_keys)):
        raise ValueError("Duplicate source/date key generated")
    if set(batch_source_date_keys) & existing_source_date_keys:
        raise ValueError("Generated source/date key already exists in corpus or previous packs")

    milestone_mix = Counter(candidate["ldd_milestone_type"] for candidate in candidates)
    status_mix = Counter(candidate["current_permission_status"] for candidate in candidates)
    category_mix = Counter(candidate["event_type"] for candidate in candidates)
    dates = [candidate["date"] for candidate in candidates]
    selection_summary = {
        "input_workbook": str(permissions_xlsx),
        "input_rows_scanned": total_rows,
        "eligible_scored_rows_after_dedupe_and_signal_filters": len(scored),
        "retained_candidates": len(candidates),
        "candidate_limit": CANDIDATE_LIMIT,
        "date_range": {"start": min(dates) if dates else None, "end": max(dates) if dates else None},
        "milestone_mix": dict(milestone_mix.most_common()),
        "eligible_milestone_mix": dict(eligible_milestone_mix.most_common()),
        "status_mix": dict(status_mix.most_common()),
        "category_mix": dict(category_mix.most_common()),
        "manual_corpus_ldd_events_seen": current_dedupe["source_id_count"],
        "manual_corpus_ldd_workbook_rows_seen": len(current_dedupe["rows"]),
        "manual_corpus_ldd_authority_reference_pairs_seen": len(current_dedupe["refs"]),
        "prior_ldd_archive_candidate_pack_count": len(prior_packs),
        **prior_pack_summary(prior_packs, current_dedupe),
        "dedupe_fields": [
            "source_ids/source_dataset_id/source_id == london-development-database-archive",
            "source_record_id workbook row number",
            "source_record_id planning_authority and borough_reference",
            "source_url plus source_record_id",
            "city/title/date",
            "source_url/source_record_id/date",
            "all previous LDD archive candidate packs as fallback dedupe inputs if corpus ingestion is incomplete",
            "same fields inside the round170 batch scan",
        ],
        "filters": [
            f"Selected Permission Date, Started Date, or Completed Date between 2008-01-01 and {ACCESSED_AT}",
            "BNG Easting/Northing present and within a broad Greater London range",
            "Architecture/public/civic/mixed-use or large-development signal",
            "Minor domestic and administrative-only rows excluded unless high-signal/large-development overrides apply",
            f"Sorted by milestone priority, signal score, date, and workbook row; capped at {CANDIDATE_LIMIT}",
            f"Reserved up to {MILESTONE_MINIMUM_TARGETS['completion']} completion, {MILESTONE_MINIMUM_TARGETS['started']} started, and {MILESTONE_MINIMUM_TARGETS['permission']} permission records before filling remaining slots by the same deterministic ordering",
        ],
        "exclusion_counts": dict(exclusions.most_common()),
    }

    payload = {
        "generated_at": ACCESSED_AT,
        "task": TASK_ID,
        "source_id_used": SOURCE_ID,
        "candidate_count": len(candidates),
        "max_candidates": CANDIDATE_LIMIT,
        "date_window": {
            "start": "2008-01-01",
            "end": ACCESSED_AT,
            "source_fields": list(DATE_FIELDS.values()),
        },
        "accessed_at": ACCESSED_AT,
        "retrieved_at": ACCESSED_AT,
        "license": "UK Open Government Licence (OGL v3)",
        "license_url": "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
        "global_caveat": (
            "LDD rows are administrative/source-defined planning-development records; do not present them as "
            "independent evidence of construction, opening, occupation, completion, final built form, current use, "
            "outcomes, or causation."
        ),
        "selection_summary": selection_summary,
        "source_audits": source_audit(selection_summary)["source_audits"],
        "candidates": candidates,
    }
    summary = {
        "generated_at": ACCESSED_AT,
        "task": TASK_ID,
        "candidate_count": len(candidates),
        "date_range": selection_summary["date_range"],
        "milestone_mix": selection_summary["milestone_mix"],
        "eligible_milestone_mix": selection_summary["eligible_milestone_mix"],
        "status_mix": selection_summary["status_mix"],
        "category_mix": selection_summary["category_mix"],
        "eligible_headroom_after_retained_candidates": max(0, len(scored) - len(candidates)),
        "input_rows_scanned": total_rows,
        "exclusion_counts": selection_summary["exclusion_counts"],
        "output_files": [
            str(OUT_PATH),
            str(SOURCE_AUDIT_PATH),
            str(SUMMARY_PATH),
            str(NOTES_PATH),
            str(REJECTED_PATH),
        ],
    }
    rejected_payload = {
        "generated_at": ACCESSED_AT,
        "task": TASK_ID,
        "sample_limit": 500,
        "rejected_sample_count": len(rejected),
        "exclusion_counts": selection_summary["exclusion_counts"],
        "rejected_sample": rejected,
    }

    OUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    SOURCE_AUDIT_PATH.write_text(json.dumps(source_audit(selection_summary), indent=2) + "\n", encoding="utf-8")
    SUMMARY_PATH.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    REJECTED_PATH.write_text(json.dumps(rejected_payload, indent=2) + "\n", encoding="utf-8")
    write_notes(len(candidates), selection_summary)

    print(json.dumps({
        "outPath": str(OUT_PATH),
        "sourceAuditPath": str(SOURCE_AUDIT_PATH),
        "summaryPath": str(SUMMARY_PATH),
        "notesPath": str(NOTES_PATH),
        "rejectedPath": str(REJECTED_PATH),
        "inputRowsScanned": total_rows,
        "eligibleScoredRows": len(scored),
        "candidates": len(candidates),
        "dateRange": selection_summary["date_range"],
        "milestoneMix": selection_summary["milestone_mix"],
        "statusMix": selection_summary["status_mix"],
        "priorLddArchiveCandidatePackCount": len(prior_packs),
        "headroom": max(0, len(scored) - len(candidates)),
        "exclusionCounts": dict(exclusions.most_common(12)),
    }, indent=2))


if __name__ == "__main__":
    main()
