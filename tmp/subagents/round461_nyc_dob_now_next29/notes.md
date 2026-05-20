# Round461 NYC DOB NOW Next29 Candidate Pack

Generated 200 fresh nonduplicate administrative DOB NOW approved-permit candidates on 2026-05-20.

## Scope

Official NYC Open Data DOB NOW Build approved permit rows (`rbx6-tga4`) joined to DOB NOW Build job application filing rows (`w9ak-ipjd`). Candidate dates are permit `issued_date` values. Requested window is 2008-01-01 through 2026-05-20; selected candidate rows in this run fall within the actual DOB NOW Build data returned by the API.
The request window starts in 2008, but actual DOB NOW Build rows available for this continuation start later; this pack's retained candidates begin on the candidate date range reported below.

## Caveats

- Rows are administrative permit/job filing records only.
- They do not document construction start, construction completion, public opening, occupancy, final built form, impact, causation, or outcome effects.
- Scale fields are source-reported filing attributes and can be amended by later DOB records.
- Coordinates are DOB/Open Data address geocodes, not footprints or work boundaries.
- NYC Open Data Socrata metadata did not expose a dataset-specific license field during this run; candidates retain NYC Open Data / NYC.gov terms notes and DOB attribution.

## Duplicate Screening

Screened against the live manual corpus (72376 records; Round429 present in manual corpus: true) plus prior DOB NOW packs through Round458 and available DOB administrative candidate packs.

## Counts

- Permit rows fetched: 191860
- Permit rows after duplicate/geography filters: 135897
- Application rows fetched: 107996
- Candidate pool before balancing: 5811
- Candidates retained: 200
- Candidate date range: 2021-06-04 through 2026-05-13
- Validation report: tmp/subagents/round461_nyc_dob_now_next29/validation_report.json

## Requested Duplicate Scope Check

Checked 88 prior DOB administrative candidate files plus the manual corpus through Round458.
Identifier tokens checked: 246261; source/date keys checked: 72669; title/date/site keys checked: 17051.
Overlap counts: event/source/job/permit tokens 0, source/date 0, title/date/site 0.
