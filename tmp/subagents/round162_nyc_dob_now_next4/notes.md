# Round162 NYC DOB NOW Next4 Candidate Pack

Generated 240 additional administrative DOB NOW approved-permit candidates on 2026-05-19.

## Scope

Official NYC Open Data DOB NOW Build approved permit rows (`rbx6-tga4`) joined to DOB NOW Build job application filing rows (`w9ak-ipjd`). Candidate dates are permit `issued_date` values.

## Caveats

- Rows are administrative permit/job filing records only.
- They do not document construction start, construction completion, public opening, occupancy, final built form, or outcome effects.
- Scale fields are source-reported filing attributes and can be amended by later DOB records.
- Coordinates are DOB/Open Data address geocodes, not footprints or work boundaries.
- NYC Open Data Socrata metadata did not expose a dataset-specific license field during this run; candidates retain NYC Open Data / NYC.gov terms notes and DOB attribution.

## Duplicate Screening

Screened against 139 manual-corpus/tmp candidate files and 84733 exact identifier tokens, including round133/round136/round143/round149/round152/round158/round162 outputs when present.

## Counts

- Permit rows fetched: 191708
- Permit rows after duplicate/geography filters: 141899
- Application rows fetched: 107896
- Candidate pool before balancing: 2850
- Candidates retained: 240
