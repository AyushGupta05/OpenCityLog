# Round117 NYC DOB bulk candidate fetch

Generated 900 high-signal candidates and 531296 rejects on 2026-05-19.

## Selected by source

- NYC Open Data: DOB Certificate Of Occupancy: 225
- NYC Open Data: DOB Job Application Filings: 225
- NYC Open Data: DOB NOW Build Job Application Filings: 225
- NYC Open Data: DOB NOW Certificate of Occupancy: 225

## Selection caveats

- Rows were selected from official NYC Open Data DOB datasets only.
- Candidate dates are DOB administrative date fields, not independent construction or opening observations.
- Point geometry is source geocoding, not a footprint or work-area polygon.
- Records below the dwelling-unit, floor-area, height, stories, cost, or public-owner thresholds were rejected.
- Existing manual-corpus source IDs, source URLs, and row identifiers were used for duplicate screening before writing candidates.
