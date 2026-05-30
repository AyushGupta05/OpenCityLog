# Retired Proposal Analogue Lens

## Status

This document is a historical design note. The Proposal Lens is not an active runtime feature in the current city-change atlas contract.

The current product scope is the 15 mandatory historical/current lenses described in `docs/15_lens_city_design_contract.md`. Those lenses must use source-backed city records, visible confidence and limitations, evidence panels, list/table paths, and Markdown/CSV/GeoJSON exports. They must not present future proposal analogues as active atlas coverage.

## Retired Runtime Paths

The local server now returns `410` tombstones for the retired proposal endpoints:

- `GET /api/proposal-impact/schema`
- `POST /api/proposal-impact`

The old implementation file, schema, verifier, and skipped tests have been deleted. The legacy-path verifier now fails if those retired Proposal Lens files are restored. The server keeps only explicit `410` responses so old clients receive a clear tombstone instead of an active analogue feature.

## Why It Is Quarantined

The user-approved lens contract says current lenses should show observed historical/current change only. Future/proposal workflows may be revisited later, but they are not part of this implementation pass.

Keeping the proposal analogue path active would blur the public product from an evidence atlas into a proposal-screening tool. That is out of scope until the method, validation, provenance, UI contract, and user need are specified separately.

## Reinstatement Requirements

Do not restore proposal/future runtime paths unless a future spec provides:

- a clear public-facing user need distinct from the 15 city lenses
- a source-backed method that avoids forecast, causality, and approval claims
- schema validation for inputs, outputs, evidence, caveats, confidence, and licenses
- UI copy that states the feature is not a prediction, simulation, or impact score
- tests proving retired overclaiming language and opaque scoring cannot re-enter
- documentation explaining sources, transformations, limitations, and correction flow

Until then, all engineering work should point users to the city-specific 15-lens atlas, evidence drawers, source summaries, and audit exports.
