# Round246 NYC HPD Affordable Housing Production Candidate Pack

Generated 200 candidates from 7374 fetched HPD building rows on 2026-05-19.

## Scope

- Source: NYC Open Data: Affordable Housing Production by Building (hg8x-zxpr).
- Source page: https://data.cityofnewyork.us/Housing-Development/Affordable-Housing-Production-by-Building/hg8x-zxpr
- Date window: 2008-01-01 through 2026-05-19.
- Dataset only: NYC HPD Affordable Housing Production by Building. No parks records are included.

## Counts

- Candidates retained: 200
- Eligible unique HPD rows after required-field and duplicate screening: 3709
- Headroom after this candidate pack: 3509
- Rejected/source-screened rows: 3665

## Date Fields

- building_completion_date: 200

## Program Fields

- Reporting construction type New Construction: 200
- Extended affordability status No: 200
- Prevailing wage status Non Prevailing Wage: 200

## Caveats

- HPD production rows are administrative affordable-housing program/building delivery evidence, not a complete citywide construction inventory or full building-completion survey.
- Completion/start dates come from HPD source fields and are not DOB certificate dates, first occupancy, tenant move-in, project closeout, or proof of occupancy/outcomes unless another source independently documents that.
- Coordinates are HPD/Open Data geocoded points, not surveyed building footprints or project boundaries.
- NYC Open Data Terms of Use / NYC.gov Terms of Use apply; no dataset-specific license field was exposed in the metadata checked during this run.
- Duplicate screening used the live manual corpus and HPD-family candidate packs through round241, explicitly including round229, round234, round236, and round241; this script did not edit the corpus, appender, or generated atlas files.
