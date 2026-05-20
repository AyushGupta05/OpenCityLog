# round120_nyc_libraries_sca_narrow notes

Stopped search expansion immediately per user instruction and packaged only the official, non-duplicate candidates already in hand.

## Output

- `candidates.json` contains `source_audits`, `candidates`, and `rejected`.
- Candidate count: 6.
- Rejected count: 8.
- Access date used throughout: `2026-05-19`.

## Method

- Used only official NYPL and NYC SCA sources already identified before the stop request.
- Promoted only records that had an official source URL and no matching corpus hit from local `rg` checks.
- Rejected official library URLs where the date/geometry had not been captured yet, where the item looked out of narrow branch scope, or where local search indicated an existing corpus duplicate.
- Did not add outcome, usage, access, impact, or causal claims.

## Duplicate Check

Local repository search was run for promoted titles/record ids:

`96th Street Branch|Arlington Library|Clinton Hill Library|Senator Abraham Bernstein|Flora Iannarelli|Rufus King School|X105|K597|Q026`

No promoted candidate title or SCA record id appeared as an existing architecture/city-change event. The only `X105` hits were unrelated transit timetable strings; `Q026` appeared in unrelated prior scratch/metadata contexts.

## Known Gaps

- SCA PDF text extraction was not completed before the stop request.
- SCA promoted records use year precision from the official SCA School Openings section; addresses and point geometry should be completed in a later pass from the fact sheets or an official NYC school-location source.
- The NYPL 96th Street coordinate is an approximate branch/address point and should be replaced by a verified geocode before production ingestion.
- BPL Arlington and Clinton Hill were intentionally left in `rejected` because the exact date and geometry were not captured before the stop request.

## Source Handling

All records are factual milestone candidates only. License notes are conservative because the official pages/PDFs did not have an open data license captured during this stopped pass.
