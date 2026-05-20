# round286_belfast_official_planning_tail3

Generated: 2026-05-20
Accessed: 2026-05-20

## Scope

Official Belfast architecture/city-change tail3 pass after round281 for records dated 2008-01-01 through 2026-05-20. The accepted candidates are Department for Infrastructure planning-statistics approval rows that were still missing after screening the current manual architecture corpus, round270, round281, and prior Belfast candidate packs through round281 through round281 under `tmp/subagents`.

## Result

- Accepted candidates: 12
- Eligible before cap: 12
- Candidate cap: 150
- Accepted date range: 2016-07-29 to 2023-11-21
- Rejected/detail rows retained: 1254
- Prior files screened: 74
- Prior records indexed: 47782
- Validation report: tmp/subagents/round286_belfast_official_planning_tail3/validation_report.json

## Accepted Source Mix

- Department for Infrastructure, Northern Ireland: 12

## Audited Sources

- Department for Infrastructure, Northern Ireland: Northern Ireland planning activity statistics (HTTP 200)
- Belfast City Council: Current planning applications (HTTP 200)
- Department for Communities Historic Environment Division: Historic Buildings Record / Listed Buildings Northern Ireland (HTTP 200)

## Caveats

- Planning approvals are administrative decision records. They are not evidence of construction, completion, opening, occupation, final built form, delivery, demolition completion, public use, outcomes, or causation.
- DfI CSV Easting/Northing values were converted to approximate WGS84 review points; they are not surveyed footprints, parcels, legal boundaries, or planning red lines.
- BCC current-planning rows were audited but not emitted because the council page is mutable and lacks row-level official geometry.
- HED listed-building data was audited but not emitted from the current ArcGIS layer because public fields expose construction-era dates/current snapshot fields rather than a row-level modern listing/change date.
