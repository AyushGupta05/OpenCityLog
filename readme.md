# Bims City Atlas

Bims is becoming an open-source urban changelog and city change atlas. The MVP is static-data first: city configs, source/provenance records, normalized event chunks, and browser-ready JSON/GeoJSON in `web/data`.

The project should show observed historical changes with evidence and caveats. It should not claim prediction, causality, or simulated impact.

## Build The Data Foundation

```powershell
npm run build:data
npm run verify:data
```

Generated artifacts are written to:

```text
web/data/city-atlas/
```

Belfast is the current demo city. London and NYC are configured as contribution-ready placeholders.

## Run The Local Product

```powershell
npm start
```

Open `http://localhost:5173`.

The served frontend is the atlas-first public website in `web/index.html`,
`web/atlas.js`, and `web/atlas.css`. It reads `web/data/city-atlas/` directly,
draws a lightweight static geometry map, and does not require a Mapbox token for
open-source deployment. Legacy Mode A map/simulation artifacts remain in
`web/data/mode-a/` during migration but are not the public entry point.

Browser smoke coverage checks the core user path:

```powershell
npm run verify:browser
```

## Proposal Lens

The 2026+ workflow is now a lightweight proposal-impact screen. It validates proposal inputs, retrieves similar historical events, extracts current local context, and returns affected signals with confidence, evidence, and caveats. It is not a calibrated forecast or causal model.

```powershell
npm run verify:proposal
```

API:

- `GET /api/proposal-impact/schema`
- `POST /api/proposal-impact`

## Test

```powershell
npm test
```

## Add A New City

1. Add `config/cities/<city_id>.json`.
2. Add sources to `config/source_registry.json`.
3. Add or extend an adapter in `scripts/build_data.js`.
4. Run `npm run build:data`.
5. Run `npm run verify:data`.
6. Document source coverage and caveats.

## Key Docs

- `docs/data_model.md`
- `docs/city_adapters.md`
- `docs/data_sources_uk_us.md`
- `docs/provenance.md`
- `docs/data_acquisition.md`
- `docs/lightweight_impact.md`
