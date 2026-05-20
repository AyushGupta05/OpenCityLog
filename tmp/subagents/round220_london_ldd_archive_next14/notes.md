# Round 220 London LDD archive next14 candidates

Generated the next bounded London Development Database archive candidate pack after round212. This pack selects source-defined completion, work-start, or permission milestone records, while deduplicating against the manual corpus and previous LDD archive packs through round212.

- Source ID: `london-development-database-archive`
- Candidate output: `tmp/subagents/round220_london_ldd_archive_next14/candidates.json`
- Candidate count: 240
- Cap: 240
- Accessed/retrieved date retained in outputs: 2026-05-19
- Input LDD planning-permissions rows scanned: 94948
- Eligible rows after dedupe and signal filters: 3043

## Dedupe

The generator excludes manual-corpus LDD records and previous LDD archive candidate packs through round212 by workbook row, planning authority plus borough reference, source URL plus source record id, candidate title/date, and source/date key. It also removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected `Permission Date`, `Date work commenced on site (Started Date)`, or `Date construction completed (Completed Date)` from 2008-01-01 through 2026-05-19, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals.

Small domestic, low-score alteration/extension, and administrative-only rows are excluded unless they meet a high-signal or large-development override. This keeps the batch useful for architecture/city-change review rather than turning the LDD archive into a minor-applications export.

## Caveats

These are LDD administrative planning/development milestone records. The source fields are not independent evidence of construction, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting a candidate into canonical event status.

## Exclusion Counts

```json
{
  "below score threshold": 32974,
  "minor/domestic row below large-development override": 25488,
  "missing or outside 2008-2026 permission/started/completed date window": 11579,
  "below architecture/public/large-development signal threshold": 9551,
  "existing corpus or previous LDD candidate workbook row": 8408,
  "administrative-only/minor planning row below high-signal override": 2528,
  "alteration/extension row below score threshold": 1195,
  "existing corpus or previous LDD candidate title/date": 157,
  "duplicate inside round220 batch scan": 24,
  "missing or outside Greater London LDD point range": 1
}
```
