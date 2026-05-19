# Round117 London Heritage And Civic Notes

## Method

- Worked only under `tmp/subagents/round117_london_heritage_civic`.
- Read the existing `architecture_milestones_2008_2026.json` and checked candidate source IDs, entity IDs, project names, and obvious title terms before adding records.
- Prioritized official public sources: Planning Data entity/dataset records, London borough pages, City of London Corporation, and NHS trust pages.
- Kept every accepted record as an administrative/designation/status/project-stage observation. No candidate claims construction, completion, opening, impact, or causality unless the official source directly states that stage.

## Main Findings

- The London Planning Data certificate-of-immunity batch is already almost entirely present in the existing milestone file. The only uncaptured bbox hits were outside Greater London or otherwise unsuitable, so they are listed in `rejected`.
- Article 4 direction areas were not present in the existing file and provide good additional London planning-control records with explicit dates and geometry.
- Conservation-area records add dated heritage-control observations, but the Planning Data conservation-area dataset itself warns it is incomplete and may contain duplicates. These should be displayed with that caveat.
- Three public-building/project-stage records were added where official sources clearly state the status date: Whipps Cross Mayoral Stage 2 approval, Smithfield Museum updated-plan approval, and Oriel breaking ground.

## Caveats

- Planning Data `entry-date` is not treated as the real-world event date. Accepted Planning Data records use `start-date`, `designation-date`, or an official borough/NHS page date.
- Camden launderette Article 4 has a date discrepancy: Camden's public page states "Adopted 1 June 2018"; the Planning Data area row has `start-date` 2018-02-19. The candidate uses Camden's adopted date and records the discrepancy in limitations.
- Project-stage records with address-derived coordinates are marked `address_approximate` or `site_approximate`; use Planning Data geometries where available before production ingestion.
- Article 4 and conservation-area records should be visually distinct from physical development milestones and excluded from construction/opening totals.

## Files Produced

- `candidates.json`: source audits, accepted candidates, rejected records.
- `notes.md`: this methodology and caveat summary.
