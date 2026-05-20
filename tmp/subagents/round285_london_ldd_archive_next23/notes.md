# Round 285 London LDD archive next23 candidates

Generated the next bounded London Development Database archive candidate pack after round277. This pack selects source-defined permission, work-start/commencement, or completion milestone records while deduplicating against the manual corpus and prior LDD archive packs through round277.

- Source ID: `london-development-database-archive`
- Candidate output: `tmp/subagents/round285_london_ldd_archive_next23/candidates.json`
- Candidate count: 240
- Cap: 240
- Accessed/retrieved date retained in outputs: 2026-05-20
- Input LDD planning-permissions rows scanned: 94948
- Eligible rows after dedupe and signal filters: 882
- Validation report: `tmp/subagents/round285_london_ldd_archive_next23/validation.json`

## Dedupe

The generator excludes manual-corpus LDD records and prior LDD archive candidate packs through round277 by workbook row, planning authority plus borough reference, source URL plus source record id, event id, candidate title/date, and source/date key. It also removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected `Permission Date`, `Date work commenced on site (Started Date)`, or `Date construction completed (Completed Date)` from 2008-01-01 through 2026-05-20, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals.

Small domestic, low-score alteration/extension, and administrative-only rows are excluded unless they meet a high-signal or large-development override. This keeps the batch useful for architecture/city-change review rather than turning the LDD archive into a minor-applications export.

## Caveats

These are LDD administrative planning/development lifecycle records only. The source fields are not independent evidence of delivery, construction, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting a candidate into canonical event status.

## Exclusion Counts

```json
{
  "below score threshold": 32973,
  "minor/domestic row below large-development override": 25488,
  "missing or outside 2008-2026 permission/started/completed date window": 11568,
  "existing corpus or previous LDD candidate workbook row": 10568,
  "below architecture/public/large-development signal threshold": 9550,
  "administrative-only/minor planning row below high-signal override": 2526,
  "alteration/extension row below score threshold": 1195,
  "existing corpus or previous LDD candidate title/date": 193,
  "duplicate inside round285 batch scan": 4,
  "missing or outside Greater London LDD point range": 1
}
```
