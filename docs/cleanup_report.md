# Cleanup Report

Date: 2026-04-28

## Summary

The repository has been pivoted away from the retired simulation-studio surface. The active product is the city atlas/changelog UI, source-backed event records, evidence drawers, before/after imagery, timeline scrubbing, and context/evidence lenses for place, movement, services, utilities, planning, and economy records.

## Retired Surfaces

Removed or quarantined surfaces include:

- Retired provenance proof flows.
- Scenario Studio and branch-workspace runtime.
- Long-horizon forecast framing.
- Forecast, transformer, trend-baseline, and traffic-microsimulation builders/verifiers.
- Retired dashboard visual/smoke scripts that only covered removed surfaces.
- Retired model artifacts for future forecasts and trend branches.
- Retired Proposal Lens implementation, schema, verifier, and skipped tests.
- Retired Mode A replay data, replay-manifest tombstone, wayback imagery manifest, and spatial replay ETL outputs.

## Active Runtime

The current served frontend is:

- `web/index.html`
- `web/atlas.js`
- `web/atlas.css`
- `server.js`

The runtime now serves the atlas UI and the source-backed city data under `web/data/city-atlas/`. It no longer exposes the retired replay-manifest API route or checked-in Mode A/wayback artifacts, and package verification includes a focused legacy-path guard.

## Active Verification

Run:

```text
npm run verify
npm run verify:browser
```

The active verifier checks source/event validity, confirms retired runtime paths are absent, and runs the atlas browser smoke coverage. Browser coverage includes city switching, filters, map overlay, timeline changes, event evidence, and legacy-copy guards.

## Remaining Migration Note

Some historical Belfast replay artifacts and old raw-source artifacts can still exist as data inputs or provenance material. They are not public simulator UI paths and should not be reintroduced into runtime routes, navigation, scripts, or copy unless a future accepted spec restores them with a validated model and clear planner value.
