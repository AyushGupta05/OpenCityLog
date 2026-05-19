# Round 119 London Planning Data high-volume notes

Accessed: 2026-05-19

## What was queried

- MHCLG Planning Data API entity rows for Greater London LPA geometries: listed-building, conservation-area, article-4-direction-area, archaeological-priority-area, asset-of-community-value, locally-listed-building, building-preservation-notice.
- Planning London Datahub application rows where the application type matched Listed Building Consent / Full planning & listed building consent and `decision_date` fell from 2008-01-01 through 2026-05-19.
- Existing duplicate context: `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json`.

## Output summary

- Candidate count: 120
- Candidate count by source: gla-planning-datahub-listed-building-consent: 120
- Planning Data rows inspected: 23663
- PLD rows inspected: 2371
- Reject samples written: 130

## Duplicate handling

Candidates were rejected when the existing corpus already appeared to contain the same source record/entity/reference/title/date. The duplicate index checks exact normalized source records/URLs/titles plus NHLE references, Planning Data entity IDs, PLD IDs, LPA references, and exact title/date pairs. This is conservative, but final ingestion should still do a manual near-duplicate pass for related planning applications that share a scheme name and date.

## Source caveats

- Planning Data listed-building rows are strong for statutory list-entry/designation milestones when `start-date` is present. They are not construction, opening, refurbishment, occupation, or impact records. Many listed-building geometries are points only.
- Planning Data conservation-area data is explicitly a work in progress and may include duplicate areas being reconciled. Use the source `start-date` wording rather than implying a newly built environment change.
- Article 4 direction areas record planning-control geography. They do not document physical alteration.
- Archaeological Priority Area rows often expose `entry-date` without original designation dates. Those rows are lower confidence and must not present entry-date as the original effective date.
- Asset of Community Value rows record a community-asset/local-land-charge planning consideration; they do not by themselves show reuse, preservation, or development outcome.
- Planning London Datahub Listed Building Consent rows are administrative application records. They support decision/consent timeline events only. They do not prove works began, completed, succeeded, or caused a city outcome.
- The London Datastore page for Planning London Datahub applications lists Licence: Not Specified. Treat PLD-derived candidates as factual pointers for review until reuse terms are resolved.
- Some PLD centroid values are visibly outside London; this pass used the supplied WGS84 polygon to derive a representative point when needed and rejected rows without reliable London geometry.

## Recommended next checks

- For selected PLD records, open the borough planning-register URL when present, or the PLD `_source` URL otherwise, before final ingestion.
- For selected Planning Data records, verify source rows against the dataset page and, for listed buildings, the NHLE `documentation-url` where present.
- Keep all event wording administrative: "records", "listed", "consent row", "designation", "start-date", and "entry-date" rather than construction, causality, forecast, or impact language.
