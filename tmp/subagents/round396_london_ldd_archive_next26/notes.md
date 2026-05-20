# Round 396 London LDD archive next26 candidates

Generated the next bounded London Development Database archive candidate pack after round297. This worker scans the same official London Datastore LDD archive workbooks as the earlier LDD archive rounds and deduplicates against the live manual corpus plus prior LDD archive packs through round297.

- Source ID: london-development-database-archive
- Official dataset page: https://data.london.gov.uk/dataset/planning-permissions-on-the-london-development-database-ldd-2jxq0/
- Candidate output: tmp/subagents/round396_london_ldd_archive_next26/candidates.json
- Candidate count: 0
- Cap: 240
- Remaining eligible headroom after retained candidates: 0
- Accessed/retrieved date retained in outputs: 2026-05-20
- Input LDD planning-permissions rows scanned: 94948
- Eligible rows after dedupe and signal filters: 0
- Validation JSON: tmp/subagents/round396_london_ldd_archive_next26/validation.json
- Validation report: tmp/subagents/round396_london_ldd_archive_next26/validation_report.md

## Dedupe

The generator excludes manual-corpus LDD records and prior LDD archive candidate packs through round297 by workbook row, planning authority plus borough reference, source URL plus source record id, event id, candidate title/date, and source/date key. It also removes duplicate event IDs and source/date keys inside this batch.

## Selection

Rows must have a selected Permission Date, Date work commenced on site (Started Date), or Date construction completed (Completed Date) from 2008-01-01 through 2026-05-20, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes architecture/public/civic/mixed-use or large-development signals.

No fresh non-duplicate rows remained after the round297 pack was included in the dedupe set. This pack is therefore an exhaustion/validation marker rather than a new source of candidate events.

## Caveats

These are LDD administrative planning/development lifecycle records only. The source fields are not independent evidence of delivery, construction, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting any LDD candidate to canonical event status.

## Exclusion Counts

{
  "below score threshold": 32967,
  "minor/domestic row below large-development override": 25488,
  "missing or outside 2008-2026 permission/started/completed date window": 11568,
  "existing corpus or previous LDD candidate workbook row": 11450,
  "below architecture/public/large-development signal threshold": 9550,
  "administrative-only/minor planning row below high-signal override": 2526,
  "alteration/extension row below score threshold": 1195,
  "existing corpus or previous LDD candidate title/date": 203,
  "missing or outside Greater London LDD point range": 1
}
