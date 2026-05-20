# round122_nyc_public_schools_geocoded notes

Generated: 2026-05-19

## Output

- candidates.json: 20 verified, geocoded NYC SCA public-school facility candidates, below the max of 40.
- source_audit.json: source-family audits for SCA listing/API, SCA fact sheets, and NYC Planning Labs Geosearch / NYC PAD.
- notes.md: this method and caveat summary.

## Method

1. Read round120 notes/candidates and local duplicate patterns.
2. Used the official SCA Projects page and its NYCSCA.Projects JSON endpoint to identify 2024-2025 School Openings records.
3. Used the linked SCA fact-sheet PDFs for project type, address, construction start, occupancy, district, capacity, grades, architect/engineer, and contractor fields.
4. Used NYC Planning Labs Geosearch / NYC PAD address points for coordinates, keeping the returned label in each candidate.
5. Promoted only records with exact or clean address-point geometry in this smaller pack.

## Duplicate Handling

- Round120 SCA records for X105, K597, Q026, Q160, and Q278 are included only because this pass adds SCA fact-sheet addresses and usable coordinates.
- X487 / LEAD was excluded as already represented in the manual corpus and prior scratch packs.
- K654 public-art-only rows, K653 Pacific Park, and Q489 P.S. 85 Annex were omitted from this smaller clean pack because the geometry or project fact-sheet evidence needed more follow-up.

## Caveats

- These are observed SCA occupancy/opening-list milestones only.
- No student outcome, access, enrollment, forecast, simulation, or causal claims were added.
- Construction-start values marked anticipated remain SCA schedule statements.
- Coordinates are address points, not building footprints, parcel polygons, annex footprints, or room footprints.
