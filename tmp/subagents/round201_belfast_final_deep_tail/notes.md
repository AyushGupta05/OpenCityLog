# Round 201 Belfast Final Deep Tail Notes

Generated: 2026-05-19

## Scope

This scratch-only pack targets a conservative Belfast administrative tail from official/public source families not used in rounds 177, 183, 189, and 195: BCC Local Development Plan / Supplementary Planning Guidance, BCC developer-contributions monitoring, and DfC Belfast regeneration plans/frameworks/news records.

## Method

- Manual source-backed seeds only; no corpus or appender edits.
- Required provenance fields are emitted on every candidate.
- Duplicate exclusion indexes the current manual corpus, Belfast atlas event chunks, all prior Belfast subagent packs, and explicitly rounds 177, 183, 189, and 195.
- Duplicate keys checked: event id, source-record/date, source-url/date, and title/date.
- Each source URL is fetched into `source_audit.json` with HTTP status and content hash.

## Caveats

- These are administrative planning-policy, guidance, consultation, monitoring, strategy, or framework records.
- They are not construction starts, completions, openings, occupations, final designs, or delivery evidence.
- Representative points should not be treated as policy boundaries, parcels, asset footprints, or public-realm extents.
- No candidate claims causation, prediction, economic impact, housing delivery, environmental improvement, or transport/public-realm outcome.

## Outputs

- Candidates: tmp/subagents/round201_belfast_final_deep_tail/candidates.json
- Source audit: tmp/subagents/round201_belfast_final_deep_tail/source_audit.json
- Summary: tmp/subagents/round201_belfast_final_deep_tail/summary.json
- Rejected: tmp/subagents/round201_belfast_final_deep_tail/rejected.json

Accepted candidates: 25
Rejected seeds: 1
