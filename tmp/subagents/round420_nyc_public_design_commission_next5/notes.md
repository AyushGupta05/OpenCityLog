# Round420 NYC Public Design Commission next5 candidates

Created/accessed: 2026-05-20

## Scope

Official NYC Public Design Commission design-review certificate records only. These are administrative design-review approval milestones, not construction starts, completions, openings, forecasts, impacts, or causal/outcome claims.

## Outputs

- candidates.json: 36 candidate events.
- source_audit.json: source, terms, coverage, geometry, and caveat audit.
- summary.json: count, date range, source URLs, certificate IDs, milestone mix, and screening counts.
- rejected.json: selected-record rejections plus pool screening counts and sampled rejects.
- validation.json and validation_report.json: machine-readable validation results.
- readback.json: post-write JSON parse/readback validation.

## Result

- Date range: 2025-08-18 through 2026-04-08.
- Candidate count: 36.
- Certificate IDs: 30119, 30120, 30122, 30125, 30126, 30127, 30129, 30130, 30131, 30132, 30133, 30134, 30135, 30137, 30139, 30142, 30143, 30145, 30146, 30147, 30148, 30149, 30151, 30153, 30154, 30155, 30157, 30160, 30161, 30165, 30167, 30171, 30228, 30256, 30287, 30354.
- Milestone mix: amended final approval: 8; final approval: 13; preliminary and final approval: 6; preliminary approval: 9.
- Validation: passed with 0 errors and 0 warnings.
- Selected rejections: 0.

## Method

1. Read parsed certificate rows from the prior official-PDF extraction artifact created from NYC.gov PDC PDFs.
2. Screened certificate IDs, source record IDs, event IDs, and normalized title/date keys against the live manual corpus, generated NYC atlas events, and prior PDC packs through Round414.
3. Re-checked the current PDC meetings page, the PDC past-minutes archive, NYC.gov terms page, and all selected official NYC.gov PDF URLs.
4. Selected a fresh next5 set of public-realm, park/playground, waterfront, civic building, plaza, bridge, and facility design-review actions.
5. Added approximate point geometry from NYC Planning Labs Geosearch where it matched the borough; geometry is kept separate from the official PDC record evidence.

## Caveats

- PDC certificates document design review action dates. They do not independently prove construction, completion, opening, occupancy, operation, or project outcomes.
- Coordinates are approximate map-placement points derived from certificate location text; they are not official PDC GIS geometry.
- PDFs do not state a separate open-data license. This pack treats them as official NYC.gov public records for citation evidence subject to NYC.gov terms.
- The current meetings page showed the May 18, 2026 meeting but no linked 5/18/26 minutes/certificates PDF at access time, so selected candidates use certificates available through April 20, 2026 and earlier official PDF records.

## Source URLs

- Current meetings page: https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page
- Past minutes archive: https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page
- NYC.gov terms: https://www.nyc.gov/home/terms-of-use.page
