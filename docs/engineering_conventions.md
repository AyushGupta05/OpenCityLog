# Engineering Conventions

These conventions support the Bims-5 pivot from legacy replay/simulation toward a provenance-first city change atlas.

## Data Contracts

- Prefer schema-first JSON/NDJSON contracts for events, sources, indicators, layers, and city manifests.
- Keep event identity stable. Corrections should append a correction record or version note rather than silently changing meaning.
- Separate source metadata from derived artifacts. Derived data should point back to source IDs, row IDs, scripts, and retrieval dates.
- Treat generated files in `build/` and `web/data/` as outputs, not source of truth.
- Do not rely on path names as dates. Use explicit metadata fields for capture date, effective date, and retrieval date.

## ETL

- Keep raw input reading, normalization, validation, and artifact writing as separate steps.
- Use fixtures that include missing license, ambiguous date, invalid geometry, and stale source examples.
- Fail fast when required provenance is missing.
- Emit machine-readable manifests and human-readable summaries.
- Preserve source attribution and license fields through every transformation.

## Frontend

- Design around event inspection: list, map, timeline, evidence, and export should work together.
- Do not add new simulator vocabulary or future-forecast affordances.
- Distinguish documented, corroborated, inferred, disputed, modeled, missing, and stale records visually and textually.
- Keep map state shareable where practical: city, bounds, year/date range, filters, selected event.
- Provide non-map access to the same event and source information.

## Legacy Simulation

Legacy forecast/simulation runtime surfaces have been removed or guarded by tombstone verifiers. New code should not restore those paths or route users toward future-outcome claims.

If a future spec restores simulation, require:

- A named user need.
- A validated modelling method.
- Source and training data provenance.
- Error bounds and calibration evidence.
- UI copy that distinguishes observation, inference, and forecast.

## Verification

- Add focused verifiers for schemas and manifests.
- Run `python -m unittest discover tests` for Python ETL changes.
- Run `npm run verify` for current manifest/contract checks.
- Run `npm run verify:browser` for UI changes.
- Explain any legacy verifier failure separately from new work.
