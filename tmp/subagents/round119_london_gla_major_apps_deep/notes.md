# Round119 London GLA / Planning Datahub Major Applications Deep Pass

Accessed: 2026-05-19

## Scope

This scratch pass looks for additional official London planning/development records from 2008-01-01 through 2026-05-19, emphasizing Planning London Datahub major application rows and Mayor of London strategic planning decision records. Candidate language is deliberately administrative: planning decision, Stage 2 referral, direction, call-in, or public-hearing milestone only.

## Method

- Read the existing manual London architecture corpus, prior London subagent candidate files, and round116 planning snapshots for duplicate screening.
- Queried the Planning London Datahub guest API for 2008-2019 high-unit major applications, major redevelopment keywords, and a 2020-2026 strategic/backfill check.
- Scraped the official GLA planning application decisions page into this scratch directory and parsed linked PDF reports/decision letters where the report could be matched back to a PLD row for geometry.
- Rejected records by PLD id, GLA/PDU reference, source URL/PDF filename, exact source row, and obvious scheme/title coverage already represented in the existing London corpus.

## Output Counts

- Candidates retained: 76
- PLD candidates retained: 50
- GLA mayoral decision candidates retained: 26
- Rejected records captured: 102

## Caveats

- PLD decision/status dates are planning-process dates, not real-world construction, completion, occupation, or opening evidence.
- PLD geometry is a representative point from source polygons or centroids. It is useful for atlas navigation, not a measured building footprint.
- London Datastore licence for the PLD applications package is recorded as Not Specified in the existing source audit context; factual metadata and URLs are retained pending reuse review.
- GLA PDFs are strong evidence for mayoral process milestones, but they should not be converted into claims about delivered buildings or impacts without separate evidence.
- Some well-known schemes were intentionally rejected because they are already represented by public opening, built-status, or prior PLD/GLA records in the corpus.

## Files

- `candidates.json`: source audits, retained candidates, query stats, and rejected records.
- `gla_planning_decisions_20260519.html`: cached official GLA decision page used for parsing.
- `pdf_cache/`: cached GLA PDFs/text extracted for candidates and rejects that reached the GLA parsing step.
