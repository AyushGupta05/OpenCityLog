# Round426 NYC Public Design Commission next6 candidates

Created/accessed: 2026-05-20

## Scope

Official NYC Public Design Commission design-review certificate records only. These are administrative design-review approval milestones, not construction starts, completions, openings, forecasts, impacts, or causal/outcome claims.

## Outputs

- candidates.json: 36 candidate events.
- source_audit.json: source, terms, coverage, and geometry-ref caveat audit.
- summary.json: count, date range, source URLs, certificate IDs, milestone mix, and screening counts.
- rejected.json: selected-record rejections plus pool screening counts and sampled rejects.
- validation.json and validation_report.json: machine-readable validation results.
- readback.json: post-write JSON parse/readback validation.

## Result

- Date range: 2025-06-23 through 2025-10-21.
- Candidate count: 36.
- Certificate IDs: 30059, 30061, 30062, 30063, 30064, 30065, 30068, 30070, 30072, 30077, 30078, 30082, 30083, 30089, 30090, 30091, 30092, 30093, 30094, 30095, 30096, 30097, 30099, 30100, 30102, 30103, 30104, 30106, 30108, 30110, 30113, 30114, 30115, 30118, 30123, 30173.
- Milestone mix: amended final approval: 7; final approval: 5; preliminary and final approval: 7; preliminary approval: 17.
- Validation: passed with 0 errors and 0 warnings.
- Selected rejections: 0.

## Method

1. Read parsed certificate rows from the prior official-PDF extraction artifact created from NYC.gov PDC PDFs.
2. Screened certificate IDs, source record IDs, event IDs, and normalized title/date keys against the live manual corpus, generated NYC atlas events, and prior PDC packs through Round420.
3. Re-checked the current PDC meetings page, the PDC past-minutes archive, NYC.gov terms page, and all selected official NYC.gov PDF URLs.
4. Selected a fresh next6 set of public-realm, park/playground, waterfront, civic building, plaza, bridge, and facility design-review actions.
5. Preserved PDC certificate location text as geometry_ref and did not add third-party geocoded coordinates.

## Caveats

- PDC certificates document design review action dates. They do not independently prove construction, completion, opening, occupancy, operation, or project outcomes.
- PDC certificates provide descriptive location text rather than authoritative GIS geometry; candidates carry geometry_ref text only.
- PDFs do not state a separate open-data license. This pack treats them as official NYC.gov public records for citation evidence subject to NYC.gov terms.
- The current meetings page showed the May 18, 2026 meeting but no linked 5/18/26 minutes/certificates PDF at access time, so selected candidates use certificates available through April 20, 2026 and earlier official PDF records.

## Source URLs

- Current meetings page: https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page
- Past minutes archive: https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page
- NYC.gov terms: https://www.nyc.gov/home/terms-of-use.page
