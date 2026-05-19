# Round117 NYC DOB Filing/Permit Candidates

Created: 2026-05-19

## Scope

Queried official NYC Open Data DOB datasets only for administrative filing/permit milestones from 2008-01-01 through 2026-05-19. These rows are framed as DOB approvals or permit issuances, not completed construction, openings, occupancy, or causal impact.

Official source universe:

- DOB Job Application Filings (`ic3t-wcy2`): https://data.cityofnewyork.us/Housing-Development/DOB-Job-Application-Filings/ic3t-wcy2/about_data
- DOB Permit Issuance (`ipu4-2q9a`): https://data.cityofnewyork.us/Housing-Development/DOB-Permit-Issuance/ipu4-2q9a/about_data
- DOB NOW: Build - Job Application Filings (`w9ak-ipjd`): https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Job-Application-Filings/w9ak-ipjd/about_data
- DOB NOW: Build - Approved Permits (`rbx6-tga4`): https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4/about_data

## Method

- Legacy BIS application rows were filtered to `job_type in ('NB','A1')`, `doc__='01'`, valid DOB latitude/longitude, and an in-window `approved`, `fully_permitted`, or `latest_action_date` value.
- DOB NOW application rows were filtered to `New Building`, `Alteration CO`, and `ALT-CO - New Building with Existing Elements to Remain`, with valid coordinates and in-window `approved_date` or `first_permit_date`.
- Shortlisted application rows were joined to the earliest matching official permit row where available: legacy by `job__`, DOB NOW by `job_filing_number`.
- Candidate scoring favored large/review-worthy administrative rows with floor area, proposed units, proposed height/stories, cost, and permit/approval date completeness.
- Exact duplicate screening used existing NYC source record IDs, DOB job numbers, DOB NOW filing numbers, and source IDs found in `architecture_milestones_2008_2026.json`. Same-site records from other source families were not treated as exact duplicates if this DOB row was absent.

## Output

Wrote `28` candidates to `candidates.json`.

Candidate buckets:

- DOB NOW ALT-CO - New Building with Existing Elements to Remain filing / permit: 4
- DOB NOW Alteration CO filing / permit: 5
- DOB NOW New Building filing / permit: 7
- DOB New Building filing / permit (legacy BIS job type NB): 7
- DOB major alteration filing / permit (legacy BIS job type A1): 5

## Rejection Summary

Rows were rejected when they lacked an in-window administrative date, stable source ID, valid NYC geometry, official URL path, or New Building / major Alteration semantics. I also rejected withdrawn legacy rows, on-hold DOB NOW rows, low-signal small jobs, implausible scale values, and exact source-record duplicates already present in the architecture milestone file.

Top rejection counts:

- legacy_missing_or_out_of_range_date: 173275
- legacy_low_signal_a1_alteration: 81953
- dob_now_low_signal_major_alteration: 48426
- legacy_low_signal_new_building: 41363
- dob_now_low_signal_new_building: 29080
- legacy_withdrawn_row: 7079
- dob_now_on_hold_status: 396
- legacy_implausible_scale_value: 60
- dob_now_implausible_scale_value: 45
- legacy_duplicate_existing_job_or_missing_id: 22

## Caveats

- These are administrative DOB filing/permit records. They do not establish construction start, completion, opening, occupancy, public benefit, design quality, or causal urban impact.
- DOB scale/use fields can be amended by later filings and should be displayed as source-reported filing attributes.
- DOB/Open Data coordinates are geocoded address/building points, not surveyed parcel boundaries or construction footprints.
- Legacy BIS and DOB NOW datasets are split systems. The source audits in `candidates.json` preserve which system each candidate came from.
- NYC Open Data Socrata metadata reported a null dataset-specific license field for these views; candidates retain factual metadata and source URLs under NYC Open Data / NYC.gov terms with DOB attribution.
