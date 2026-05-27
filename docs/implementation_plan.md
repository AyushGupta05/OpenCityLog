# Implementation Plan

## Current Direction

Bims is now an open-source city changelog and city change atlas. The public runtime is the static atlas interface in `web/index.html`, `web/atlas.js`, and `web/atlas.css`, served by a small Node server that exposes only health and static city-atlas files.

## Preserved Core

- City adapter configs in `config/cities/`.
- Source registry and provenance metadata in `config/source_registry.json`.
- Normalized atlas artifacts in `web/data/city-atlas/`.
- Source-backed historical atlas layers where they support observed context.
- The 15 mandatory historical/current city lenses defined in `docs/15_lens_city_design_contract.md`.

## Removed Direction

The retired Scenario Studio, long-horizon forecast, traffic microsimulation, transformer forecast, proof-flow paths, and proposal analogue runtime are no longer part of the product or quality gate. Future work should not restore them without a validated method spec, a provenance model, and explicit user need.

## Next Build Priorities

1. Replace London/NYC source-layer markers with more row-level event adapters where licences and source fields support it.
2. Curate higher-quality flagship stories for London and NYC so the public UI has fewer generic administrative records at the top of the changelog.
3. Improve evidence export and correction workflows.
4. Keep language validation strict around overclaiming terms and generated proxy metrics.
5. Keep browser smoke tests centered on list, map, timeline, evidence, source drawer, compare, exports, and the 15 lens paths.
