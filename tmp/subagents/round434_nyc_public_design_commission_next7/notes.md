# Round434 NYC Public Design Commission next7 candidates

Created/accessed: 2026-05-20

## Scope

Official NYC Public Design Commission design-review certificate records only. These are administrative public-review approval milestones, not construction starts, completions, openings, forecasts, impacts, or causal/outcome claims.

## Outputs

- candidates.json: 36 candidate events.
- source_audit.json: source, terms, coverage, and geometry-ref caveat audit.
- summary.json: count, date range, source URLs, certificate IDs, milestone mix, and screening counts.
- rejected.json: sampled screening rejections and eligible records left after the target batch.
- validation.json and validation_report.json: machine-readable validation results.
- readback.json: post-write JSON parse/readback validation.

## Result

- Date range: 2025-05-27 through 2026-01-28.
- Candidate count: 36.
- Certificate IDs: 30007, 30008, 30009, 30013, 30016, 30017, 30018, 30019, 30020, 30021, 30022, 30023, 30024, 30025, 30027, 30028, 30035, 30038, 30040, 30045, 30046, 30048, 30051, 30052, 30053, 30054, 30056, 30057, 30058, 30079, 30084, 30101, 30109, 30205, 30225, 30294.
- Milestone mix: preliminary and final approval: 9; amended final approval: 4; preliminary approval: 10; final approval: 13.
- Validation: passed with 0 errors and 0 warnings.
- Sampled rejections: 80.

## Method

1. Read parsed certificate rows from the prior official-PDF extraction artifact created from NYC.gov PDC PDFs.
2. Screened certificate IDs, source record IDs, source_url/source_record_id pairs, event IDs, and normalized title/date keys against the live manual corpus, generated NYC atlas events, and prior PDC packs through Round426.
3. Filtered to architecture, public facility, park/playground, waterfront, infrastructure, access, and public-realm review records; excluded public-art, equipment-only, signage-only, and object-conservation records.
4. Selected the next deterministic batch by newest certificate adoption date, then certificate number, after duplicate screening.
5. Re-checked the current PDC meetings page, the PDC past-minutes archive, NYC.gov terms page, and all selected official NYC.gov PDF URLs.
6. Preserved PDC certificate location text as geometry_ref and did not add third-party geocoded coordinates.

## Caveats

- PDC certificates document design review action dates. They do not independently prove construction, completion, opening, occupancy, operation, or project outcomes.
- PDC certificates provide descriptive location text rather than authoritative GIS geometry; candidates carry geometry_ref text only.
- PDFs do not state a separate open-data license. This pack treats them as official NYC.gov public records for citation evidence subject to NYC.gov terms.
- The current meetings page showed the May 18, 2026 meeting but no linked 5/18/26 minutes/certificates PDF at access time, so selected candidates use certificates available through April 20, 2026 and earlier official PDF records.

## Source URLs

- Current meetings page: https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page
- Past minutes archive: https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page
- NYC.gov terms: https://www.nyc.gov/home/terms-of-use.page
