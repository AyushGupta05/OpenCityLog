# Round 116 London Planning Official Candidate Notes

Accessed: 2026-05-19

## Scope

This pass gathered additional Greater London architecture/built-environment planning candidates for a later ingestion round. It focused on:

- MHCLG / Planning Inspectorate GOV.UK called-in and recovered appeal decision pages.
- Greater London Authority Planning London Datahub application rows.
- GLA planning application decision pages as an audited supporting source.

Planning decisions are treated as administrative records only. None of the candidates claim construction start, completion, opening, occupation, delivered design quality, causation, or predicted outcomes.

## Method

1. Loaded `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json` and checked London records by title, source URL, source record ID, and date.
2. Queried the GOV.UK content API for the called-in/recovered appeals collection and selected London records with architecture, heritage, mixed-use, housing, school, public-realm, or infrastructure relevance.
3. Queried the Planning London Datahub public guest Elasticsearch API using the documented `X-API-AllowRequest` header and selected high-signal 2026 approved rows with substantial built-environment proposals.
4. Rejected records already present in the seed file and records outside Greater London.
5. Added limitations where geometry is approximate or where PLD returned invalid centroids.

## Outputs

- `candidates.json` contains 3 source audits, 32 candidates, and 13 rejects.
- GOV.UK candidates use `GOVUK:{content_id}` plus the appeal/called-in reference as stable source row identifiers.
- PLD candidates use `PLD:{id}` plus the local planning authority application number.

## Key Caveats

- GOV.UK decision letters are strong provenance for ministerial planning decisions, but legal status can change through quashing, redetermination, later permissions, conditions, or section 106 variations.
- PLD is useful for row IDs, dates, proposal text, and sometimes centroids, but licence is not specified on the London Datastore page and some centroids are invalid. Bad centroids were not copied as if they were valid London geometry.
- Approximate manual points are marked as such and should be replaced by local-register geometry or decision-plan geometry before publication.
- Existing built/opening milestones near a site are not duplicates of planning decisions unless source URL, row ID, title, and date match. The file keeps these evidence types separate.

## Suggested Next Checks

- Download and parse the GOV.UK PDFs for each accepted candidate to confirm the exact decision outcome, inspector recommendation, local application reference, and any quashing/redetermination context.
- For each PLD candidate, verify the local planning-register page and licence/terms before promoting the row to a main event artifact.
- Add a verifier that rejects PLD centroids outside a Greater London bounding box unless a reviewed geometry override is present.
- Decide whether Westferry Printworks should become two separate administrative events or one linked planning-case bundle with 2020 and 2021 decision dates.
