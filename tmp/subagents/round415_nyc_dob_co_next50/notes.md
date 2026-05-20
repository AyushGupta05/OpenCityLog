# Round415 NYC DOB CO Next50 Candidate Pack

Generated 200 certificate-of-occupancy candidates on 2026-05-20.

## Scope

- Official NYC Open Data legacy DOB Certificate Of Occupancy (`bs8b-p36w`) rows.
- Date window: 2008-01-01 through 2026-05-20. Accepted candidates were limited to the dataset's stated pre-DOB-NOW coverage period through 2021-03-31.

## Endpoint and Query

- Endpoint: https://data.cityofnewyork.us/resource/bs8b-p36w.json
- Metadata endpoint: https://data.cityofnewyork.us/api/views/bs8b-p36w
- Socrata query: $select=job_number,job_type,c_o_issue_date,bin_number,borough,house_number,street_name,block,lot,postcode,pr_dwelling_unit,ex_dwelling_unit,application_status_raw,filing_status_raw,item_number,issue_type,latitude,longitude,community_board,council_district,census_tract,bin,bbl,nta,:id; $where=c_o_issue_date between '2008-01-01T00:00:00' and '2026-05-20T23:59:59' AND latitude IS NOT NULL AND longitude IS NOT NULL AND application_status_raw='Issued' AND issue_type in('Final','Temporary') AND job_type in('NB','A1'); $order=c_o_issue_date,job_number.

## Counts

- Candidates retained: 200
- Legacy rows fetched: 142076
- Legacy grouped rows: 52945
- Duplicate/reject samples recorded: 51643
- Skipped as prior DOB/CO identifier duplicates: 8383
- Skipped as prior title/date duplicates: 16
- Skipped as prior address/date duplicates: 0
- Skipped because outside legacy-preferred CO period: 12422
- Skipped below high-signal selection threshold: 30822

## Selection

- Required issued status, row-level date, in-city coordinates, source row identifiers, and DOB/NYC Open Data provenance.
- Preferred final rows over temporary rows.
- Retained NB/A1 rows with at least 25 source-reported dwelling units or a source-row civic/public text signal.
- Grouped repeated rows by DOB job, BIN, and normalized address before selecting the best CO milestone for that group.

## Duplicate Screening

Screened 59 files, 251107 identifier tokens, 140859 source-date keys, and 64885 title/date keys, including the live manual corpus and prior DOB/CO candidate packs through round412.

## Caveats

- A CO row is a legal/admin DOB record, not a complete account of construction, occupancy, safety, or outcomes. It is not actual occupancy, public opening, completion for all spaces, construction completion, final built form, safety outcome, or affordability outcome.
- Dwelling-unit counts and job/CO type labels are source row values and may be corrected or superseded.
- Coordinates are DOB/Open Data geocoded points, not surveyed footprints or parcel boundaries.
- Keep DOB and NYC Open Data attribution with row-level Socrata URLs.

## Independent Validation

- Required provenance fields present: true.
- Unique event IDs: 200.
- Unique source/date keys: 200.
- Date window valid: true (2008-01-01 through 2026-05-20).
- NYC coordinate bounds valid: true.
- No exact event/source/date/source-URL/identifier overlap with the screened corpus and prior CO packs through round412: true.
- Status mix: bs8b-p36w|Issued=200.
