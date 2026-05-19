# Round130 NYC Official More Candidates

Generated 59 candidate records from official NYC DCP open-data sources on 2026-05-19.

## Sources Checked And Used

- Privately Owned Public Spaces (POPS), dataset rvih-nhyn: retained completed rows with year_completed from 2008 through 2026.
- Waterfront Public Access Areas (WPAAs), dataset 388s-pnvc: retained rows with chair certification or CPC approval dates from 2008-01-01 through 2026-05-19.

## Candidate Count By Source

- nyc-dcp-pops-rvih-nhyn: 17
- nyc-dcp-wpaa-388s-pnvc: 42

## Integration Caveats

- POPS year_completed is year precision and should not be treated as an exact public opening or compliance date.
- WPAA chair certification and CPC approval dates are administrative milestones, not observed construction or opening dates.
- Candidate geometry is point geometry for review. WPAA production geometry should point back to the official source multipolygon.
- Existing manual corpus text was scanned for source IDs, addresses, names, ZAP IDs, and report links; records with related-site hits carry duplicate_check_note for integration review.
