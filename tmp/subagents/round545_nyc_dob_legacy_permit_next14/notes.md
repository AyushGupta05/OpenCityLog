# Round545 NYC DOB legacy permit next14

Accessed: 2026-05-20

## Scope

This pack uses official NYC Open Data DOB Permit Issuance (`ipu4-2q9a`) rows from 2008-01-01 through 2026-05-20, with DOB Job Application Filings (`ic3t-wcy2`) used only as linked scale/status context.

The records are administrative permit issuance milestones. They are not construction-start, construction-completion, opening, occupancy, outcome, or causation evidence.

## Method

- Queried high-signal legacy DOB Job Application Filings rows with official GIS coordinates.
- Queried official DOB Permit Issuance rows for initial issued NB/AL permits with source GIS coordinates.
- Joined by legacy DOB job number and retained one permit row per non-duplicate job.
- Screened against the manual architecture milestone corpus, NYC generated events, and prior NYC DOB legacy permit, DOB NOW, DOB CO, and screened permit candidate packs by permit SI number, job number, source URL, source/date, title/date, and address/date.
- Selected up to 200 candidates with score, year, and borough spread.

## Outputs

- candidates.json
- source_audit.json
- summary.json
- rejected.json
- validation.json
- validation_report.json
- readback.json
- notes.md
- duplicate_audit.json

## Selected counts

- Candidates: 200
- Date range: 2008-04-28 to 2024-08-26
- Source audit rows: 2

## By borough

- Bronx: 29
- Brooklyn: 52
- Manhattan: 52
- Queens: 50
- Staten Island: 17

## By year

- 2008: 16
- 2009: 14
- 2010: 16
- 2011: 16
- 2012: 14
- 2013: 16
- 2014: 16
- 2015: 16
- 2016: 12
- 2017: 16
- 2018: 15
- 2019: 15
- 2020: 10
- 2021: 5
- 2022: 2
- 2024: 1

## Caveats

- Permit issuance is an administrative DOB milestone and must not be displayed as construction start, completion, opening, occupancy, design quality, safety condition, affordability, or neighborhood outcome.
- Coordinates are DOB/Open Data geocoded points, not surveyed footprints, parcels, entrances, or work limits.
- Linked job-application scale fields are proposed/source-reported context and can be amended or corrected.
- NYC Open Data / NYC.gov terms and DOB attribution remain attached to every candidate.
