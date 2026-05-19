# Round123 London Heritage Designation Records

Created: 2026-05-19

This is a smaller clean pack produced under `tmp/subagents/round123_london_heritage_designations`.

## Files

- `candidates.json`: 36 verified London heritage-administrative candidates.
- `source_audit.json`: source suitability, license, update, and caveat notes.
- `notes.md`: this summary.

## Candidate Counts

- NHLE listed-building amendment/status records: 12
- Historic England de-designated/removal-from-NHLE records: 12
- Additional Planning Data certificate-of-immunity records not in the prior round119 COI batch: 12

## Interpretation Guardrail

These records are designation/list-entry, amendment, de-designation, or certificate-of-immunity administrative records. They are not construction dates, demolition dates, opening dates, occupation dates, repair dates, condition observations, forecasts, or causal-impact claims.

## Method

Official points or polygon centroids were filtered to ONS London region `E12000007`. NHLE amendments use `AmendDate`; de-designations use `DateRemovedFromList`; COI rows use Planning Data `start-date` and include the `end-date` where supplied. COI references/entities already selected in `round119_london_planning_data_local` were excluded.

## Sources Audited But Not Added

Building Preservation Notice sources were checked as audit-only for this clean pack. Camden Local List was also audited, but no local-list candidates were added because the readily available API date is `last_uploaded`, a source-row update/snapshot date rather than a verified per-asset addition/removal date.
