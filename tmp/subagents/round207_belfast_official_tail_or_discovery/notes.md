# Round 207 Belfast Official Tail / Discovery Notes

Generated: 2026-05-19

## Scope

This scratch-only pack targets one final conservative Belfast official/public tail. Belfast easy official sources are close to exhausted, so the accepted candidates are administrative records from BCC planning-validation, BCC land-monitoring and one DfC ministerial budget-allocation statement rather than built-work delivery records.

## Method

- Manual source-backed seeds only; no corpus or appender edits.
- Required provenance fields are emitted on every accepted candidate.
- Duplicate exclusion indexes the current manual corpus, Belfast atlas event chunks, all prior Belfast subagent packs, and explicitly rounds 177, 183, 189, 195 and 201.
- Duplicate keys checked: event id, source-record/date, source-url/date and title/date.
- Each accepted source URL is fetched into `source_audit.json` with HTTP status and content hash.

## Caveats

- These records are administrative planning checklist, consultation, monitoring-report, or budget-allocation milestones.
- They are not construction starts, completions, openings, occupations, final designs, policy outcomes, or delivery evidence.
- Representative points should not be treated as policy boundaries, parcels, asset footprints, public-realm extents, or map-viewer geometries.
- OSNI/LPS-linked map viewer material from BCC monitoring pages requires separate licence review before any reuse.
- No candidate claims causation, prediction, economic impact, housing delivery, environmental improvement, or transport/public-realm outcome.

## Outputs

- Candidates: tmp/subagents/round207_belfast_official_tail_or_discovery/candidates.json
- Source audit: tmp/subagents/round207_belfast_official_tail_or_discovery/source_audit.json
- Summary: tmp/subagents/round207_belfast_official_tail_or_discovery/summary.json
- Rejected: tmp/subagents/round207_belfast_official_tail_or_discovery/rejected.json

Accepted candidates: 10
Rejected seeds/records: 7
