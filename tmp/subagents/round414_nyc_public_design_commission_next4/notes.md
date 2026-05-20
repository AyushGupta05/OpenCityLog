# Round414 NYC Public Design Commission next4 candidates

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

- Date range: 2025-10-21 through 2026-04-20.
- Candidate count: 36.
- Certificate IDs: 30174, 30175, 30176, 30177, 30178, 30179, 30180, 30181, 30182, 30187, 30188, 30189, 30190, 30200, 30206, 30207, 30213, 30214, 30215, 30216, 30217, 30218, 30229, 30234, 30235, 30244, 30245, 30254, 30300, 30333, 30337, 30340, 30347, 30359, 30363, 30367.
- Milestone mix: amended final approval: 2; final approval: 11; preliminary and final approval: 10; preliminary approval: 13.
- Validation: passed with 0 errors and 0 warnings.
- Selected rejections: 0.

## Method

1. Read parsed certificate rows from the prior official-PDF extraction artifact created from NYC.gov PDC PDFs.
2. Screened certificate IDs, source record IDs, event IDs, and normalized title/date keys against the live manual corpus, generated NYC atlas events, and prior PDC packs through Round408.
3. Re-checked the current PDC meetings page, the PDC past-minutes archive, NYC.gov terms page, and all selected official NYC.gov PDF URLs.
4. Selected a fresh next4 set of public-realm, park/playground, waterfront, civic building, plaza, bridge, and facility design-review actions.
5. Added approximate point geometry from NYC Planning Labs Geosearch where it matched the borough; used one curated approximate point for a Riverside Park record where the geocoder returned poor street matches.

## Caveats

- PDC certificates document design review action dates. They do not independently prove construction, completion, opening, occupancy, operation, or project outcomes.
- Coordinates are approximate map-placement points derived from certificate location text; they are not official PDC GIS geometry.
- PDFs do not state a separate open-data license. This pack treats them as official NYC.gov public records for citation evidence subject to NYC.gov terms.
- The current meetings page showed the May 18, 2026 meeting but no linked 5/18/26 minutes/certificates PDF at access time, so selected candidates use certificates available through April 20, 2026 and earlier official PDF records.

## Source URLs

- Current meetings page: https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page
- Past minutes archive: https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page
- NYC.gov terms: https://www.nyc.gov/home/terms-of-use.page
