# Round 148 London LDD archive next5 candidates

Generated the next/final London Development Database archive candidate pack beyond already ingested LDD rows in the manual architecture corpus and the prior round124/round132/round135/round144/round146 LDD candidate packs.

- Source ID: `london-development-database-archive`
- Candidate output: `tmp/subagents/round148_london_ldd_archive_next5/candidates.json`
- Candidate count: 0
- Cap: 1000
- Accessed/retrieved date retained in outputs: 2026-05-19
- Input LDD planning-permissions rows scanned: 94948
- Eligible rows after dedupe and signal filters: 0
- Manual-corpus LDD events seen during this run: 6480

## Final-State Result

This run found no remaining eligible LDD Completed rows after deduplicating against the current manual corpus and the prior LDD candidate packs. `candidates.json` is intentionally an empty final pack for this scan.


## Dedupe

The generator excludes manual-corpus LDD records by workbook row, planning authority plus borough reference, source URL plus source record id, and candidate title/date. It also checks the prior round124, round132, round135, round144, and round146 candidate packs as fallback dedupe inputs and removes duplicate source rows and authority/reference pairs inside this final batch.

## Selection

Rows must have `Current permission status = Completed`, a `Date construction completed (Completed Date)` from 2008-01-01 through 2026-05-19, and a valid Greater London LDD Easting/Northing point. Selection then prioritizes public/civic/institutional terms, architecture/development terms, large residential/floorspace/bedroom/site-area thresholds, and named regeneration/mixed-use/public-realm signals.

Small domestic, low-score alteration/extension, and administrative-only rows are excluded unless they meet a high-signal or large-development override. This keeps the batch useful for architecture/city-change review rather than turning the LDD archive into a minor-applications export.

## Caveats

These are LDD administrative/source-defined completion-status records. The source field is not independent evidence of construction, opening, occupation, final built form, current use, outcomes, or causation. Local planning authority records should be checked before promoting a candidate into canonical event status.

## Exclusion Counts

```json
{
  "not completed status": 36283,
  "below score threshold": 18892,
  "minor/domestic row below large-development override": 15384,
  "missing or outside 2008-2026 completed-date window": 7804,
  "below architecture/public/large-development signal threshold": 7057,
  "existing manual-corpus LDD workbook row": 6480,
  "administrative-only/minor planning row below high-signal override": 2227,
  "alteration/extension row below score threshold": 653,
  "existing manual-corpus title/date": 109,
  "previous round124 candidate title/date not found in corpus": 59
}
```
