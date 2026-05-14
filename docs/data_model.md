# Bims City Atlas Data Model

Bims uses an event-first, source-backed model for an open-source urban changelog. The model is designed for static browser artifacts first; a database can be added later, but it is not required for the MVP.

## Artifact Layout

Run:

```powershell
npm run build:data
npm run verify:schema
npm run verify:data
```

The build writes:

```text
web/data/city-atlas/index.json
web/data/city-atlas/cities/<city_id>/city.json
web/data/city-atlas/cities/<city_id>/sources.json
web/data/city-atlas/cities/<city_id>/availability.json
web/data/city-atlas/cities/<city_id>/events.json
web/data/city-atlas/cities/<city_id>/events_<year>.json
web/data/city-atlas/cities/<city_id>/events_<year>.geojson
web/data/city-atlas/coverage-report.json
docs/data_coverage_report.md
```

`events.json` is an index. Browser clients should load a single `events_<year>.json` or `events_<year>.geojson` chunk for the active city/year rather than loading the whole catalog at once.

`coverage-report.json` is the compact audit artifact for emitted coverage. Its rows are keyed by `city_id`, `source_id`, `year`, and `layer`, and the companion Markdown report is intended for quick public review. The report counts what the pipeline actually emitted; it does not fill source gaps with synthetic events.

## City Config

City configs live in `config/cities/*.json` and validate against `schemas/city.schema.json`.

Required fields:

- `city_id`: stable lowercase id.
- `display_name`, `country`, `region`, `timezone`.
- `bounds`: WGS84 `[west, south, east, north]`.
- `default_center` and `default_zoom`.
- `available_years`: the schema supports 2000-now; actual demo coverage can be shorter.
- `source_families`: source groups, availability status, source ids, years, and caveats.
- `data_availability`: plain-English status for UI/docs.

## Source Registry

The normalized source registry lives at `config/source_registry.json` and validates against `schemas/source.schema.json`.

Every source must include:

- `source_id`
- `provider`
- `licence` and `licence_url`
- `coverage_years`
- `update_frequency`
- `url` and/or `local_paths`
- `reliability`
- `source_confidence`
- `attribution_text`
- `provenance_notes`
- `caveats`

Licences and attribution are machine-readable because the UI and source briefs should be able to show them without hardcoded copy.

## Event Schema

Events validate against `schemas/event.schema.json`.

Required fields:

- `city_id`
- `event_id`
- `title`
- `year`, `effective_date`, and `date_precision`
- `source_date_field`: the exact source field or adapter rule used to interpret the event date
- `category` and `lens`
- `geometry` or `affected_area`
- `source_ids`
- `evidence`
- `confidence`: `documented`, `corroborated`, `inferred`, or `disputed`
- `affected_signals`
- `explanation`
- `caveats`
- `provenance`, including `transform`, source row/path/URL identifiers where available, `source_date_field`, `geometry_source`, and `geometry_precision`

`geometry_source` and `geometry_precision` are required even for approximate markers. If the source only supports an area/city reference point, the event must say that explicitly so the UI can avoid presenting an exact-location claim.

Events describe observed public records. They do not claim that a change caused an outcome. Preferred language is "observed", "associated with", "near", and "evidence suggests".

`npm run verify:data` also rejects duplicate `event_id` values within a city, unknown source references, missing evidence pointers, missing date-basis labels, missing spatial provenance, non-observed generated metrics, source-layer markers posing as events, and unsupported causal or predictive language.

## Belfast Migration

The Belfast adapter currently normalizes `data/derived/2026/belfast_infrastructure_events_2016_2026.json`.

The migration preserves:

- OSM element ids, timestamps, versions, and changesets.
- Planning application ids and decision dates when available.
- Public source URLs from official project/facility pages.
- Caveats that distinguish OSM mapped visibility from real-world construction dates.

The retired artifacts are separate from the active city atlas contract. The atlas contract is the source-backed public data contract; retired replay artifacts are not public endpoints.
