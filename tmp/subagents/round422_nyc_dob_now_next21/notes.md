# Round422 NYC DOB NOW Next21 Candidate Pack

Generated 200 fresh nonduplicate administrative DOB NOW approved-permit candidates on 2026-05-20.

## Scope

Official NYC Open Data DOB NOW Build approved permit rows (`rbx6-tga4`) joined to DOB NOW Build job application filing rows (`w9ak-ipjd`). Candidate dates are permit `issued_date` values.

## Caveats

- Rows are administrative permit/job filing records only.
- They do not document construction start, construction completion, public opening, occupancy, final built form, impact, causation, or outcome effects.
- Scale fields are source-reported filing attributes and can be amended by later DOB records.
- Coordinates are DOB/Open Data address geocodes, not footprints or work boundaries.
- NYC Open Data Socrata metadata did not expose a dataset-specific license field during this run; candidates retain NYC Open Data / NYC.gov terms notes and DOB attribution.

## Duplicate Screening

Screened against the live manual corpus (66394 records; Round413 present: true) plus prior DOB NOW packs through Round413 and available DOB administrative candidate packs.

## Counts

- Permit rows fetched: 191860
- Permit rows after duplicate/geography filters: 137499
- Application rows fetched: 107996
- Candidate pool before balancing: 7411
- Candidates retained: 200
- Validation report: tmp/subagents/round422_nyc_dob_now_next21/validation_report.json
