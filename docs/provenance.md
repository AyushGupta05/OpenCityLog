# Provenance

Bims should make every city-change claim traceable enough for a reviewer to reproduce, challenge, or correct it.

## Minimum Provenance Per Event

Each normalized event carries:

- `source_ids`: one or more ids from `config/source_registry.json`.
- `evidence`: source URL, local file path, changeset, or source record id.
- `confidence`: `documented`, `corroborated`, `inferred`, or `disputed`.
- `provenance`: transformation method, legacy/source ids, and source-specific metadata.
- `caveats`: limitations that must be visible in UI/source briefs.

## Minimum Provenance Per Source

Each source registry entry carries:

- Publisher/provider.
- Licence and licence URL.
- Coverage years and update frequency.
- URL and/or local paths.
- Reliability and confidence.
- Attribution text.
- Provenance notes.
- Caveats.

## Confidence Rules

- `documented`: one reliable public source directly records the event type/date being displayed.
- `corroborated`: at least two independent organizations support the same event/date.
- `inferred`: the event is derived from metadata, proximity, edit history, or transformation rules.
- `disputed`: sources conflict or known quality issues affect the claim.

OSM mapped history is usually `inferred` for real-world change timing because it records mapping activity. Planning approvals can be `documented` as approvals, but not as completions.

## Attribution Rules

Attribution must remain machine-readable in `sources.json` and visible in any source brief.

Do not merge data from different licences into a derived artifact unless the combined licence obligations are understood. OSM-derived datasets need special care because ODbL share-alike obligations can apply to derivative databases.

## Reproducibility

The build is deterministic by default:

- `scripts/build_data.js` uses a fixed generated timestamp unless `BIMS_DATA_GENERATED_AT` is supplied.
- Events are sorted by year and event id.
- Browser artifacts are year-chunked.
- Verification checks references, coverage, attribution, confidence, and basic geometries.

## Validation

Run:

```powershell
npm run build:data
npm run verify:data
```

`verify:data` checks:

- City config shape and year ranges.
- Source registry fields, source applicability, licence, and attribution.
- Event/source references.
- Event year coverage against city and source coverage.
- Confidence enums.
- Evidence pointers.
- Geometry coordinate validity where practical.
- Data availability matrix references.
- Basic overclaiming phrases.

## Correction Flow

For public corrections:

1. Identify the event id and source id.
2. Link the source row, URL, file path, or changeset being challenged.
3. Explain whether the correction affects date, geometry, category, confidence, caveat, or attribution.
4. Add an append-only correction record or source update. Do not silently overwrite raw source files.
5. Rebuild and rerun `npm run verify:data`.

