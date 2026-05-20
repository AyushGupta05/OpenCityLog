# Round408 NYC Public Design Commission next3 candidates

Created/accessed: 2026-05-20

## Scope

Official NYC Public Design Commission design-review certificate records only. These are administrative design-review approval milestones, not construction starts, completions, openings, forecasts, impacts, or causal/outcome claims.

## Outputs

- candidates.json: 36 candidate events.
- source_audit.json: source, terms, coverage, geometry, and caveat audit.
- summary.json: count, date range, source URLs, certificate IDs, milestone mix, and screening counts.
- rejected.json: seeded-record rejections plus pool screening counts and sampled rejects.
- validation.json and validation_report.json: machine-readable validation results.
- readback.json: post-write JSON parse/readback validation.

## Result

- Date range: 2025-11-17 through 2026-04-20.
- Candidate count: 36.
- Certificate IDs: 30219, 30220, 30221, 30222, 30224, 30226, 30227, 30230, 30231, 30236, 30237, 30239, 30240, 30242, 30247, 30248, 30249, 30250, 30251, 30252, 30260, 30274, 30277, 30283, 30291, 30295, 30261, 30311, 30312, 30320, 30335, 30341, 30343, 30356, 30366, 30370.
- Milestone mix: amended final approval: 10; final approval: 10; preliminary and final approval: 10; preliminary approval: 6.
- Validation: passed with 0 errors and 0 warnings.
- Seeded rejections: 0.

## Method

1. Read parsed certificate rows from the prior official-PDF extraction artifact created from NYC.gov PDC PDFs.
2. Screened certificate IDs, source record IDs, event IDs, and normalized title/date keys against the live manual corpus, generated NYC atlas events, and prior PDC packs through Round403.
3. Re-checked the current PDC meetings page, the PDC past-minutes archive, NYC.gov terms page, and all selected official NYC.gov PDF URLs.
4. Selected a fresh next3 set of recent civic buildings, parks/playgrounds, public realm, waterfront/transport, and public facility design-review actions.
5. Added approximate point geometry from NYC Planning Labs Geosearch where it matched the borough; used one curated approximate point for an ambiguous High Line access record.

## Caveats

- PDC certificates document design review action dates. They do not independently prove construction, completion, opening, occupancy, operation, or project outcomes.
- Coordinates are approximate map-placement points derived from certificate location text; they are not official PDC GIS geometry.
- PDFs do not state a separate open-data license. This pack treats them as official NYC.gov public records for citation evidence subject to NYC.gov terms.
- The current meetings page showed the May 18, 2026 meeting but no linked 5/18/26 minutes/certificates PDF at access time, so selected candidates use certificates available through April/December 2025-2026 official PDF records.

## Source URLs

- Current meetings page: https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page
- Past minutes archive: https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page
- NYC.gov terms: https://www.nyc.gov/home/terms-of-use.page
