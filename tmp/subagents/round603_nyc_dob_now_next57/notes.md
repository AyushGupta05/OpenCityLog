# Round603 NYC DOB NOW Next57 Candidate Pack

Generated 200 residual, nonduplicate administrative DOB NOW approved-permit candidates on 2026-05-20.

## Official Endpoints

- Approved permits: https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4
- Approved permits API: https://data.cityofnewyork.us/resource/rbx6-tga4.json
- Approved permits metadata: https://data.cityofnewyork.us/api/views/rbx6-tga4
- Job application filings: https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Job-Application-Filings/w9ak-ipjd
- Job application filings API: https://data.cityofnewyork.us/resource/w9ak-ipjd.json
- Job application filings metadata: https://data.cityofnewyork.us/api/views/w9ak-ipjd

## Scope

Official NYC Open Data DOB NOW Build approved permit rows (`rbx6-tga4`) joined to DOB NOW Build job application filing rows (`w9ak-ipjd`). Candidate dates are permit `issued_date` values. Requested window: 2008-01-01 through 2026-05-20. Retained candidate date range: 2021-07-14 through 2026-05-20.

## Caveats

- Rows are administrative permit/job filing records only.
- They do not document construction start, construction completion, public opening, occupancy, final built form, causation, impacts, or outcome effects.
- Scale fields are source-reported filing attributes and can be amended by later DOB records.
- Coordinates are DOB/Open Data address geocodes, not footprints or work boundaries.
- NYC Open Data Socrata metadata did not expose a dataset-specific license field during this run; candidates retain NYC Open Data / NYC.gov terms notes and DOB attribution.

## Duplicate Screening

Strict requested audit checked 144 prior DOB administrative candidate files plus the manual corpus through Round602. Round602 pack checked: true.
Identifier tokens checked: 367833; source URL/record tokens checked: 197126; source/date keys checked: 159565; title/date/site keys checked: 122213.
Overlap counts: {"identifier_token_records":0,"source_record_or_url_records":0,"source_date_records":0,"title_date_site_records":0}. Internal duplicate counts: {"duplicate_event_ids":0,"duplicate_candidate_ids":0,"duplicate_source_record_ids":0,"duplicate_source_date_keys":0,"duplicate_title_date_site_keys":0}.

## Counts

- Permit rows fetched: 192148
- Permit rows after duplicate/geography filters: 130496
- Application rows fetched: 108238
- Candidate pool before balancing: 235
- Candidates retained: 200
- Validation report: tmp/subagents/round603_nyc_dob_now_next57/validation_report.json
