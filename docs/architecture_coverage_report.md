# Architecture Coverage Report

Generated: 2026-05-23T00:00:00Z

Target window: 2008-01-01 through 2026-05-23.

This report counts source-backed architecture-related administrative and documented milestones. It is not a claim of complete city coverage, construction outcomes, or causal impact.

## Current Event Coverage

| City | Events | Dominant source families |
| --- | --- | --- |
| belfast | 3823 | documented_milestones 2453, heritage 621, other_architecture 35, planning_admin 714 |
| london | 34857 | documented_milestones 33082, heritage 883, other_architecture 31, planning_admin 861 |
| nyc | 65937 | documented_milestones 28529, heritage 141, other_architecture 21, permits 36827, planning_admin 419 |

Total architecture events: 104617. Manual source entries: 439. Frozen priority inventory sources: 22.

## Frozen Priority Sources

| City | Source | Family | Coverage years | Event types |
| --- | --- | --- | --- | --- |
| london | london-pld-applications | planning_applications | 2004-2026 | planning_application, planning_decision, construction_start, completion |
| london | london-datastore-ldd-permissions | planning_permissions_archive | 2004-2020 | planning_decision, construction_start, completion |
| london | london-planning-data-listed-building-outlines | listed_building_geometry | 2008-2026 | listed_building_change |
| london | london-historic-england-nhle | heritage_designations | 2008-2026 | listed_building_change |
| london | london-borough-planning-portals | borough_planning_documents | 2008-2026 | planning_application, planning_decision, heritage_permit, demolition |
| nyc | nyc-dob-permit-issuance | building_permits | 2004-2026 | permit_issued, demolition |
| nyc | nyc-dob-job-application-filings | building_applications | 2000-2026 | planning_application, planning_decision, demolition |
| nyc | nyc-dob-now-job-application-filings | building_applications | 2019-2026 | planning_application, planning_decision, demolition |
| nyc | nyc-dob-now-approved-permits | building_permits | 2019-2026 | permit_issued, demolition |
| nyc | nyc-dob-certificate-occupancy | certificates_of_occupancy | 2012-2026 | completion, opening |
| nyc | nyc-dob-now-certificate-occupancy | certificates_of_occupancy | 2021-2026 | completion, opening |
| nyc | nyc-lpc-permit-application-finder | heritage_permits | 2016-2026 | heritage_permit, listed_building_change |
| nyc | nyc-zap-project-data | planning_records | 2010-2026 | planning_application, planning_decision |
| nyc | nyc-public-design-commission-annual-report | design_review_records | 2008-2026 | planning_decision, heritage_permit |
| nyc | nyc-hpd-affordable-housing-production | housing_completion_records | 2014-2026 | construction_start, completion |
| belfast | belfast-dfi-planning-statistics | planning_statistics | 2015-2026 | planning_application, planning_decision |
| belfast | belfast-ni-planning-portal | planning_portal_records | 2008-2026 | planning_application, planning_decision, heritage_permit, demolition |
| belfast | belfast-city-current-planning-applications | planning_applications | 2022-2026 | planning_application, planning_decision |
| belfast | belfast-city-committee-packs | planning_committee_records | 2008-2026 | planning_decision, heritage_permit, demolition |
| belfast | belfast-hed-buildings-database | listed_building_change | 2008-2026 | listed_building_change |
| belfast | belfast-harni | heritage_at_risk | 2008-2026 | listed_building_change |
| belfast | belfast-official-project-pages | official_project_pages | 2008-2026 | construction_start, opening, completion, demolition, planning_decision |

## Priority Gaps

- Belfast: continue application-level annual planning CSV and NI Planning Portal linking for row-level geometry and exact decisions.
- London: deepen borough planning document links beyond PLD summaries, especially for listed-building consent and demolition/refurbishment evidence.
- NYC: strengthen lifecycle linking across DOB NOW filings, approved permits, legacy DOB permits, LPC permits and certificates of occupancy.

## Caveats

- Counts are coverage of the current source-backed architecture package, not complete city coverage.
- Planning approval is not construction, permit issuance is not completion, and source-reported lifecycle fields are labelled by source date field.
- Manual project pages and official press releases support only the stated milestone. Forward-looking dates remain caveated and are not counted as delivered outcomes.
