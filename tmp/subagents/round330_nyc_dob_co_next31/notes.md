# Round330 NYC DOB CO Next31 Candidate Pack

Generated 200 certificate-of-occupancy candidates on 2026-05-20.

## Scope

- Official NYC Open Data legacy DOB Certificate Of Occupancy (`bs8b-p36w`) rows.
- Date window: 2008-01-01 through 2026-05-20. Accepted candidates were limited to the dataset's stated pre-DOB-NOW coverage period through 2021-03-31.

## Counts

- Candidates retained: 200
- Legacy rows fetched: 142076
- Legacy grouped rows: 52945
- Duplicate/reject samples recorded: 47820

## Selection

- Required issued status, row-level date, in-city coordinates, source row identifiers, and DOB/NYC Open Data provenance.
- Preferred final rows over temporary rows.
- Retained NB/A1 rows with at least 25 source-reported dwelling units or a source-row civic/public text signal.
- Grouped repeated rows by DOB job, BIN, and normalized address before selecting the best CO milestone for that group.

## Duplicate Screening

Screened 40 files, 197235 identifier tokens, and 111824 source-date keys, including the live manual corpus and prior DOB/CO candidate packs through round326.

## Caveats

- A CO row is a legal/admin DOB record. It is not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome.
- Dwelling-unit counts and job/CO type labels are source row values and may be corrected or superseded.
- Coordinates are DOB/Open Data geocoded points, not surveyed footprints or parcel boundaries.
- Keep DOB and NYC Open Data attribution with row-level Socrata URLs.

## Independent Validation

- Required provenance fields present: true.
- Unique event IDs: 200.
- Unique source/date keys: 200.
- Date window valid: true (2008-01-01 through 2026-05-20).
- NYC coordinate bounds valid: true.
- No exact event/source/date/source-URL/identifier overlap with the screened corpus and prior CO packs through round326: true.
- Status mix: bs8b-p36w|Issued=200.
