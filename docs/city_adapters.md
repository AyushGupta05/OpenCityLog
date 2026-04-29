# City Adapters

City adapters are small, reproducible transformations from local public data into the normalized Bims city atlas contract.

## Current Configs

- `config/cities/belfast.json`: MVP pilot with normalized events generated from the existing local Belfast catalog.
- `config/cities/london.json`: England placeholder for a future London adapter.
- `config/cities/nyc.json`: US placeholder for a future New York City adapter.

## Adapter Contract

An adapter should produce normalized event records with:

- Stable ids.
- Effective dates or date ranges.
- GeoJSON geometry or an affected area label.
- Source ids from `config/source_registry.json`.
- Evidence URLs, local file paths, or source record ids.
- Confidence and caveats.
- Transformation provenance.

Write static output under:

```text
web/data/city-atlas/cities/<city_id>/
```

Do not require a database for MVP ingestion. Large source files can stay outside git; commit small fixtures, metadata, checksums, and generated browser chunks.

## Adding A City

1. Add `config/cities/<city_id>.json`.
2. Add or reuse source entries in `config/source_registry.json`.
3. Add an adapter path in `scripts/build_data.js` or a helper script called by it.
4. Generate `events_<year>.json` and `events_<year>.geojson` chunks.
5. Run `npm run build:data`.
6. Run `npm run verify:data`.
7. Document source coverage, caveats, and contribution gaps.

## Recommended Adapter Boundaries

Keep raw parsing separate from normalization:

- Parser: reads CSV, JSON, GeoJSON, API exports, or source manifests.
- Normalizer: maps source rows into Bims event/source fields.
- Validator: checks source references, licences, attribution, years, and geometry.
- Writer: writes deterministic JSON/GeoJSON chunks.

## Belfast Notes

The Belfast adapter uses the infrastructure event catalog as an input. It downgrades OSM-derived records to `inferred` confidence because an OSM edit timestamp is not the same thing as an opening, construction, or demolition date.

Official project pages and planning statistics can be `documented`, but their caveats still travel with the event. A planning approval remains an administrative event unless a later source confirms completion.

## Placeholder Notes

London and NYC configs are contribution-ready but intentionally empty. They define bounds, source families, and source registry entries so contributors can add adapters without changing the public schema.

