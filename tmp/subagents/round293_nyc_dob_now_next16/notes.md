# Round293 NYC DOB NOW Next16 Candidate Pack

Generated 200 residual administrative DOB NOW approved-permit candidates on 2026-05-20.

## Scope

Official NYC Open Data DOB NOW Build approved permit rows (`rbx6-tga4`) joined to DOB NOW Build job application filing rows (`w9ak-ipjd`). Candidate dates are permit `issued_date` values.

## Caveats

- Rows are administrative permit/job filing records only.
- They do not document construction start, construction completion, public opening, occupancy, final built form, or outcome effects.
- Scale fields are source-reported filing attributes and can be amended by later DOB records.
- Coordinates are DOB/Open Data address geocodes, not footprints or work boundaries.
- NYC Open Data Socrata metadata did not expose a dataset-specific license field during this run; candidates retain NYC Open Data / NYC.gov terms notes and DOB attribution.

## Duplicate Screening

Screened against 266 manual-corpus/tmp candidate files and 188051 exact identifier tokens, including DOB NOW through round237, DOB CO through round289, and prior DOB permit/application packs when present.

## Counts

- Permit rows fetched: 191860
- Permit rows after duplicate/geography filters: 138531
- Application rows fetched: 107996
- Candidate pool before balancing: 8434
- Candidates retained: 200
- Validation report: tmp/subagents/round293_nyc_dob_now_next16/validation_report.json
