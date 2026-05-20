# Round232 NYC DOB CO Next14 Candidate Pack

Generated 200 certificate-of-occupancy candidates on 2026-05-19.

## Scope

- Official NYC Open Data DOB NOW Certificate of Occupancy (`pkdm-hqz6`) rows.
- Official NYC Open Data legacy DOB Certificate Of Occupancy (`bs8b-p36w`) rows.
- Date window: 2008-01-01 through 2026-05-19. Legacy candidates were limited to the dataset's stated pre-DOB-NOW period through 2021-03-31.

## Counts

- Candidates retained: 200
- DOB NOW retained: 100
- Legacy retained: 100
- DOB NOW rows fetched: 75796
- Legacy rows fetched: 142076
- Duplicate/reject samples recorded: 68200

## Selection

- Required CO issued status, row-level date, in-city coordinates, source row identifiers, and DOB/NYC Open Data provenance.
- Preferred final or initial DOB NOW CO rows and final legacy CO rows; renewal-only DOB NOW rows were rejected as noisy repeat signals.
- Retained NB/New Building and Alteration CO/A1 rows with at least 25 source-reported dwelling units or a source-row civic/public text signal.
- Grouped repeated rows by DOB job/base job, BIN, and normalized address before selecting the best CO milestone for that group.

## Duplicate Screening

Screened 23 files, 126648 identifier tokens, and 75299 source-date keys, including the live manual corpus and prior DOB/CO candidate packs for rounds 117, 119, 133, 136, 143, 149, 152, 155, 160, 164, 169, 175, 181, 187, 193, 199, 205, 211, 219, and 225.

## Caveats

- A CO row is a legal/admin DOB record. It is not actual occupancy, public opening, project completion for all spaces, construction completion, final built form, safety outcome, affordability outcome, or causal evidence.
- Dwelling-unit counts and job/CO type labels are source row values and may be corrected or superseded.
- Coordinates are DOB/Open Data geocoded points, not surveyed footprints or parcel boundaries.
- Keep DOB and NYC Open Data attribution with row-level Socrata URLs.
