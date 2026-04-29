# Implementation Plan

## Current Direction

Bims is now an open-source city changelog and city change atlas. The public runtime is the static atlas interface in `web/index.html`, `web/atlas.js`, and `web/atlas.css`, served by a small Node server that exposes only health, manifest, static files, and Proposal Lens endpoints.

## Preserved Core

- City adapter configs in `config/cities/`.
- Source registry and provenance metadata in `config/source_registry.json`.
- Normalized atlas artifacts in `web/data/city-atlas/`.
- Source-backed historical atlas layers where they support observed context.
- Proposal Lens as an analogue/context screen, not a forecast.

## Removed Direction

The retired Scenario Studio, long-horizon forecast, traffic microsimulation, transformer forecast, and proof-flow paths are no longer part of the product or quality gate. Future work should not restore them without a validated modelling spec, a provenance model, and explicit user need.

## Next Build Priorities

1. Curate higher-quality event records for the current Belfast pilot.
2. Add real London and NYC adapters instead of demo-only placeholders.
3. Improve evidence export and correction workflows.
4. Add language validation for overclaiming terms in event/source artifacts.
5. Keep browser smoke tests centered on list, map, timeline, evidence, source drawer, compare, and Proposal Lens paths.
