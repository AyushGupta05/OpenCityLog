# Round119 NYC DOB legacy permit bulk extraction

Accessed: 2026-05-19

## Scope

This pack focuses on official NYC Department of Buildings rows from NYC Open Data for 2008-01-01 through 2026-05-19. It intentionally prioritizes legacy `DOB Permit Issuance` (`ipu4-2q9a`) because the current Bims corpus already has much heavier DOB NOW and certificate-of-occupancy coverage.

The selected records are administrative permit-issuance events linked to high-signal legacy `DOB Job Application Filings` (`ic3t-wcy2`) rows for scale/context. They are not construction-completion, opening, occupancy, or outcome claims.

## Method

- Queried `ic3t-wcy2` for doc 01 NB/A1 job applications with official GIS coordinates and either large proposed zoning square footage or city-owned/nonprofit flags.
- Screened out existing corpus/prior-candidate DOB job numbers and permit SI numbers before selection.
- Joined surviving jobs to `ipu4-2q9a` by `job__` and retained only initial, issued NB/AL permit rows with `issuance_date` in the requested window.
- Scored candidates using source-reported proposed dwelling units, construction floor area, plausible zoning square footage, height, stories, initial cost, and public/civic owner flags.
- Selected at most 200 records with year and borough spread.

## Output

- candidates.json: 200 candidates, 5 aggregate rejection buckets, 6 source audits.
- Eligible joined permit candidates before spread cap: 6684.

## Selected by borough

- Bronx: 44
- Brooklyn: 48
- Manhattan: 50
- Queens: 36
- Staten Island: 22

## Selected by year

- 2008: 10
- 2009: 8
- 2010: 10
- 2011: 10
- 2012: 10
- 2013: 10
- 2014: 12
- 2015: 16
- 2016: 12
- 2017: 17
- 2018: 16
- 2019: 13
- 2020: 14
- 2021: 14
- 2022: 10
- 2023: 8
- 2024: 6
- 2025: 4

## Source Audits

- `ipu4-2q9a` DOB Permit Issuance: selected source. Strong for permit issuance dates and permit SI row IDs; administrative only.
- `ic3t-wcy2` DOB Job Application Filings: supporting source for scale/context; proposed/application fields can be amended and can contain legacy anomalies.
- `bs8b-p36w` legacy CO and `rbx6-tga4` DOB NOW approved permits: audited but not prioritized because prior rounds already cover them more heavily.
- `bty7-2jhb` Historical DOB Permit Issuance: rejected because NYC Open Data metadata says it is redundant with `ipu4-2q9a`.
- `i296-73x5` DOB Stalled Construction Sites: rejected for this pack because it is an active stalled-status snapshot and lacks lat/lon fields in inspected metadata.

## Caveats

- Permit issuance is an administrative milestone. Do not display it as construction start, completion, opening, certificate of occupancy, or actual occupancy.
- Coordinates are DOB/Open Data geocoded points, not building footprints or work-area polygons.
- Job-application scale fields are proposed/source-reported context and may change through amendments.
- Extreme legacy scale values were screened from scoring, but raw source rows are retained in each candidate for review.
- NYC Open Data terms and DOB attribution should remain attached to derived records.
