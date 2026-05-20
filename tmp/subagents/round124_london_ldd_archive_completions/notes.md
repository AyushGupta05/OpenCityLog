# Round 124 London LDD archive completions

Wrote a bounded candidate pack from the official London Datastore archive source **Planning permissions on the London Development Database (LDD)**.

Files produced:

- `candidates.json` - 60 candidate development-completion records, capped at 60.
- `source_audit.json` - source/license/coverage audit and selection summary.
- `notes.md` - this note.

## Source Used

- Source ID: `london-development-database-archive`
- Dataset page: https://data.london.gov.uk/dataset/planning-permissions-on-the-london-development-database-ldd-2jxq0/
- Publisher: Greater London Authority (GLA), with data supplied by London planning authorities.
- Licence: UK Open Government Licence v3 (https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)
- Retrieval/access date preserved in outputs: 2026-05-19

## Method

The pack parses the official LDD archive spreadsheets downloaded into this scratch folder, then filters the scheme-level planning-permissions workbook for:

- `Current permission status = Completed`.
- `Date construction completed (Completed Date)` from `2008-01-01` through `2019-12-31`.
- LDD Easting/Northing present and within a broad Greater London BNG range.
- Public/civic/institutional signal or large-development signal.
- Deduplication by planning authority and display title.

Related non-residential floorspace and bedroom workbook row references are attached when the same planning authority and borough reference are present.

## Caveats

- These are LDD completion-status records, not direct evidence of opening, occupation, current use, public access, design quality, outcomes, or causation.
- The LDD notes that `Completed Date` has no formal single definition. It is normally a building-control completion certificate date, or the planning authority may decide a permission is complete because it is ready for occupation even without a certificate.
- Planning permission date, work-start date, and construction-completed date are kept as separate fields.
- Coordinates are LDD point locations from Easting/Northing, converted to WGS84 for convenience. They are not surveyed footprints, parcels, or entrances.
- Some rows are outline, reserved matters, section 73, or variation-style planning records. The candidate wording deliberately says the LDD records completion status and does not claim the whole named place opened on that date.
- This is a high-signal candidate pack, not an exhaustive LDD export.
