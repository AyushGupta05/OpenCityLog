# NYC DOB CO high-signal scan

Accessed: 2026-05-19

Queried official NYC Open Data Socrata datasets:

- DOB NOW: Certificate of Occupancy (`pkdm-hqz6`): https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Certificate-of-Occupancy/pkdm-hqz6
- DOB Certificate Of Occupancy (`bs8b-p36w`): https://data.cityofnewyork.us/Housing-Development/DOB-Certificate-Of-Occupancy/bs8b-p36w

## Date handling

- Legacy `bs8b-p36w` exposes `c_o_issue_date` as a calendar date, so the full 2008-01-01 through 2026-05-19 window was filtered with SoQL.
- DOB NOW `pkdm-hqz6` exposes `c_of_o_issuance_date` as text, so rows were fetched from the official API and parsed locally before applying the same date window.
- The legacy dataset description says it covers 2012-07-12 through March 2021 and points users to DOB NOW for COs since March 2021. Accepted legacy candidates therefore come from the stated pre-DOB-NOW coverage period.

## Selection

- Accepted 33 candidates: 23 DOB NOW rows and 10 legacy rows.
- Prioritized issued rows with coordinates, final/initial DOB NOW filing types, final/temporary legacy issue types, and large dwelling-unit counts.
- Grouped repeated records by application/job number, BIN, and normalized address. Final CO rows were preferred over temporary rows in legacy groups.
- Screened `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json` by CO application number, DOB job number, source URL/record ID, and normalized address/title text.

## Terms and attribution

NYC Open Data terms apply. Keep Department of Buildings and NYC Open Data attribution with row-level Socrata URLs. The portal terms also disclaim completeness, accuracy, and fitness for purpose, so downstream UI should show source limitations inline.

## Use caveats

- A CO row is an official administrative/legal-occupancy record. Do not convert it into a construction completion, building opening, resident move-in, or project-impact claim.
- Dwelling-unit counts are the values published by DOB in the row; nonresidential use details are not fully represented in these two table schemas.
- Renewal rows can be high-count but noisy; this pass excluded renewal-only candidates except in the rejected audit examples.
- Coordinates are DOB/Open Data geocoded points, not measured footprints.
