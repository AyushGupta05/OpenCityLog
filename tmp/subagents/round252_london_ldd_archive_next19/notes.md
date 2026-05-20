# Round 252 London LDD archive next19 candidates

Generated the next bounded London Development Database archive candidate pack after round245. This pack selects source-defined completion, work-start, or permission milestone records, while deduplicating against the manual corpus and previous/pending LDD archive packs through round245, including the round226, round233, round239, and round245 packs.

- Source ID: `london-development-database-archive`
- Candidate output: `tmp/subagents/round252_london_ldd_archive_next19/candidates.json`
- Candidate count: 240
- Cap: 240
- Accessed/retrieved date retained in outputs: 2026-05-19
- Input LDD planning-permissions rows scanned: 94948
- Eligible rows after dedupe and signal filters: 1843

## Dedupe

The generator excludes manual-corpus LDD records and previous/pending LDD archive candidate packs through round245 by workbook row, planning authority plus borough reference, source URL plus source record id, candidate title/date, and source/date key. It explicitly screens the prior/pending LDD packs through round226, round233, round239, and round245, and removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected `Permission Date`, `Date work commenced on site (Started Date)`, or `Date construction completed (Completed Date)` from 2008-01-01 through 2026-05-19, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals.

Small domestic, low-score alteration/extension, and administrative-only rows are excluded unless they meet a high-signal or large-development override. This keeps the batch useful for architecture/city-change review rather than turning the LDD archive into a minor-applications export.

## Caveats

These are LDD administrative planning/development records only. They are not direct evidence of delivery, construction completion, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting a candidate into canonical event status.

## Exclusion Counts

```json
{
  "below score threshold": 32973,
  "minor/domestic row below large-development override": 25488,
  "missing or outside 2008-2026 permission/started/completed date window": 11579,
  "existing corpus or previous LDD candidate workbook row": 9608,
  "below architecture/public/large-development signal threshold": 9550,
  "administrative-only/minor planning row below high-signal override": 2528,
  "alteration/extension row below score threshold": 1195,
  "existing corpus or previous LDD candidate title/date": 175,
  "duplicate inside round252 batch scan": 8,
  "missing or outside Greater London LDD point range": 1
}
```
