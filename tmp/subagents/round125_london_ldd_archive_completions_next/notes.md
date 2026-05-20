# Round 125 London LDD archive completion candidates

Generated an additional scratch pack of London architecture-related observed-change candidates from the official London Development Database archive, excluding planning-permissions source rows already used in `tmp/subagents/round124_london_ldd_archive_completions/candidates.json`.

Files produced:

- `candidates.json` - 80 additional candidate completion records.
- `source_audit.json` - source/license/coverage audit and selection summary.
- `notes.md` - this note.

## Source

- Source ID: `london-development-database-archive`
- Dataset page: https://data.london.gov.uk/dataset/planning-permissions-on-the-london-development-database-ldd-2jxq0/
- Main workbook: `LDD_Permissions_for_Datastore_final.xlsx`
- Publisher: Greater London Authority (GLA), with data supplied by London planning authorities.
- Licence: UK Open Government Licence v3.
- Accessed/retrieved date recorded in outputs: 2026-05-19.

## Method

Parsed the downloaded official LDD archive XLSX files already present in the round124 scratch folder. Candidate rows were selected from the scheme-level planning-permissions workbook where:

- `Current permission status` is `Completed`.
- `Date construction completed (Completed Date)` is from 2008-01-01 through 2026-05-19.
- LDD Easting/Northing is present and within broad Greater London bounds.
- The row has public/civic, architecture, mixed-use, regeneration, or large-development signal.
- The main planning-permissions workbook row was not already referenced by round124.

Rows were scored deterministically and the top 80 retained. Related non-residential floorspace/bedroom workbook row references are attached when available by planning authority and borough reference.

## Validation

JSON syntax validation passed after writing. Candidate count: 80. Unique candidate IDs: 80. Unique main planning workbook rows: 80.

## Caveats

These are candidate observed-change records only. LDD completion status is an archived planning/development progress record, not direct evidence of public opening, occupation, current use, public access, design quality, service delivery, outcomes, or causation. Coordinates are point locations from LDD Easting/Northing fields converted to WGS84; they are not footprints, parcels, or entrances.
