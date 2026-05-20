# Round 170 London LDD archive next6 candidates

Generated the next bounded London Development Database archive candidate pack after round148. This pack expands beyond exhausted strict completion rows by selecting source-defined completion, work-start, or permission milestone records, while deduplicating against the manual corpus and all previous LDD archive packs.

- Source ID: `london-development-database-archive`
- Candidate output: `tmp/subagents/round170_london_ldd_archive_next6/candidates.json`
- Candidate count: 240
- Cap: 240
- Accessed/retrieved date retained in outputs: 2026-05-19
- Input LDD planning-permissions rows scanned: 94948
- Eligible rows after dedupe and signal filters: 4963

## Dedupe

The generator excludes manual-corpus LDD records and all previous LDD archive candidate packs by workbook row, planning authority plus borough reference, source URL plus source record id, candidate title/date, and source/date key. It also removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected `Permission Date`, `Date work commenced on site (Started Date)`, or `Date construction completed (Completed Date)` from 2008-01-01 through 2026-05-19, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals.

Small domestic, low-score alteration/extension, and administrative-only rows are excluded unless they meet a high-signal or large-development override. This keeps the batch useful for architecture/city-change review rather than turning the LDD archive into a minor-applications export.

## Caveats

These are LDD administrative planning/development milestone records. The source fields are not independent evidence of construction, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting a candidate into canonical event status.

## Exclusion Counts

```json
{
  "below score threshold": 32974,
  "minor/domestic row below large-development override": 25489,
  "missing or outside 2008-2026 permission/started/completed date window": 11579,
  "below architecture/public/large-development signal threshold": 9552,
  "existing corpus or previous LDD candidate workbook row": 6488,
  "administrative-only/minor planning row below high-signal override": 2531,
  "alteration/extension row below score threshold": 1195,
  "existing corpus or previous LDD candidate title/date": 101,
  "duplicate inside round170 batch scan": 75,
  "missing or outside Greater London LDD point range": 1
}
```
