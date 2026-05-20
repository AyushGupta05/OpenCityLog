# Round295 NYC Public Design Commission next candidates

Created: 2026-05-20

## Scope

Official NYC Public Design Commission design-review and certificate records only. These are administrative design review or approval milestones, not construction starts, completions, openings, forecasts, or causal claims.

## Outputs

- candidates.json: 36 candidate events.
- source_audit.json: source, terms, coverage, and caveat audit.
- summary.json: count, date range, milestone mix, source status, and reject counts.
- rejected.json: selected-record rejections plus screening counts and sampled non-selected rejects.
- validation.json and validation_report.md: machine-readable and human-readable validation results.

## Result

- Date range: 2024-02-12 through 2026-04-20.
- Milestone mix: final approval: 10; preliminary and final approval: 7; preliminary approval: 16; amended final approval: 3.
- Validation: passed with 0 errors and 0 warnings.
- Selected rejections: 4.

## Method

1. Reused the parsed official PDC certificate records from the round124 support artifact, whose source URLs are NYC.gov PDC PDF links.
2. Re-checked the current PDC meetings page, the past-minutes archive, NYC.gov terms URL, and selected source PDF URLs during this pass.
3. Excluded certificate IDs and normalized title/date keys already present in the manual architecture corpus or prior round124/round126 PDC candidate packs.
4. Selected a small next set of clean architecture, civic facility, park, bridge, waterfront, public-realm, and water-infrastructure design-review actions.
5. Added approximate point geometry from NYC Planning Labs Geosearch where possible, with curated midpoint points for multi-site/corridor projects.

## Caveats

- PDC certificates document design review action dates. They do not independently prove construction, completion, opening, occupancy, operation, or project outcomes.
- Coordinates are approximate map-placement points derived from certificate location text; they are not official PDC GIS geometry.
- PDFs do not state a separate open-data license. The pack treats them as official NYC.gov public records for citation evidence subject to NYC.gov terms.
- The official current meetings page listed the May 18, 2026 row at access time, but no linked May 18 minutes/certificates PDF was available in the page HTML used by this pass.

## Source URLs

- Current meetings page: https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page
- Past minutes archive: https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page
- NYC.gov terms: https://www.nyc.gov/home/terms-of-use.page
