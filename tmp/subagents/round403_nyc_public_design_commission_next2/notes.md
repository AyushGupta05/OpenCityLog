# Round403 NYC Public Design Commission next2 candidates

Created/accessed: 2026-05-20

## Scope

Official NYC Public Design Commission design-review certificate records only. These are administrative design-review approval milestones, not construction starts, completions, openings, forecasts, or causal/outcome claims.

## Outputs

- candidates.json: 36 candidate events.
- source_audit.json: source, terms, coverage, geometry, and caveat audit.
- summary.json: count, date range, source URLs, milestone mix, and screening counts.
- rejected.json: seeded-record rejections plus pool screening counts and sampled rejects.
- validation.json and validation_report.md: machine-readable and human-readable validation results.

## Result

- Date range: 2026-01-20 through 2026-04-20.
- Candidate count: 36.
- Milestone mix: amended final approval: 6; final approval: 16; preliminary and final approval: 8; preliminary approval: 6.
- Validation: passed with 0 errors and 0 warnings.
- Seeded rejections: 0.

## Method

1. Read the parsed PDC certificate rows from the prior official-PDF extraction artifact.
2. Screened certificate IDs, source record IDs, event IDs, and normalized title/date keys against the live manual architecture corpus and prior PDC packs through Round295.
3. Re-checked the current PDC meetings page, the PDC past-minutes archive, NYC.gov terms page, and all selected official NYC.gov PDF URLs.
4. Selected a fresh next2 set of recent civic buildings, park/playground, public realm, waterfront/resilience, and public facility design-review actions.
5. Added approximate point geometry from NYC Planning Labs Geosearch where it matched the borough; used curated approximate points for known ambiguous park/corridor sites.

## Caveats

- PDC certificates document design review action dates. They do not independently prove construction, completion, opening, occupancy, operation, or project outcomes.
- Coordinates are approximate map-placement points derived from certificate location text; they are not official PDC GIS geometry.
- PDFs do not state a separate open-data license. This pack treats them as official NYC.gov public records for citation evidence subject to NYC.gov terms.
- The current meetings page was checked because the access date is 2026-05-20; selected candidates come from certificate PDFs available in the parsed official source artifact and rechecked by URL.

## Source URLs

- Current meetings page: https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page
- Past minutes archive: https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page
- NYC.gov terms: https://www.nyc.gov/home/terms-of-use.page
