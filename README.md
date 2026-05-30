# OpenCityLog

OpenCityLog is an open-source city-change atlas for exploring how real decisions, developments, infrastructure, policy, and environmental events changed cities over time, with every claim tied to public evidence.

The MVP is static-data first: city configs, source/provenance records, normalized event chunks, and browser-ready JSON/GeoJSON in `web/data`.

The project should show observed historical changes with evidence and caveats. It should not claim prediction, causality, or simulated impact.

## Build The Data Foundation

```powershell
npm run build:data
npm run build:lens-contract
npm run verify:data
npm run verify:lens-contract
```

Generated artifacts are written to:

```text
web/data/city-atlas/
```

Belfast is the default atlas pilot, with London and New York City available through the same city selector. Belfast, Greater London, and NYC all expose the shared 15-lens atlas contract across their full official city scopes. The generated records are source-backed coverage available in this repository; they are not complete histories of every urban change.

## Run The Local Product

```powershell
npm start
```

Open `http://localhost:5173`.

The served frontend is the atlas-first public website in `web/index.html`,
`web/atlas.js`, and `web/atlas.css`. It reads `web/data/city-atlas/` directly,
draws source-backed markers over OpenStreetMap raster tiles, and does not require
a Mapbox token for open-source deployment. Retired proof-flow,
branch-simulation, forecast, and legacy replay-manifest runtime paths are
guarded by `npm run verify`.

Belfast also has a generated detail layer at
`web/data/city-atlas/cities/belfast/detail_layers.geojson`. It renders exact
OSM-derived road centerlines and building footprints over the timeline. Road
years come from OSM edit metadata, and building years are generated
first-visible proxies, so they are mapped-visibility evidence rather than
certified construction dates.

The timeline also loads
`web/data/city-atlas/cities/belfast/lens_overlays.geojson` for source-backed
visual change surfaces. Planning, public-service, economy, and transport lenses
draw event-density heatmaps for the selected year window. The transport lens
adds green-to-red OSM road coloring based on mapped road-change activity and
nearby documented transport records; it is a hotspot/context overlay, not a
measured traffic-volume or congestion model.

The 15-lens contract is generated into:

```text
web/data/city-atlas/lens-manifest.json
web/data/city-atlas/cities/<city_id>/lens_manifest.json
web/data/city-atlas/cities/<city_id>/lens_year_coverage.json
```

Each launched city must expose all 15 lenses with compatible source-backed
records or explicit source-backed no-record coverage context for every year
from 2007 through 2026. Source licences, official boundary scope, freshness
notes, export flags, and reference-screen coverage are validated. Filtered
CSV/GeoJSON and selected-record Markdown briefs include source rows, confidence,
dates, licences, caveats, and correction-path metadata.

Browser smoke coverage checks the core user path:

```powershell
npm run verify:browser
```

The smoke scripts default to `http://127.0.0.1:5173` and also honor `URL=...`
for alternate local ports.

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

- `CONTRIBUTING.md`
- `DATA_LICENSE.md`
- `docs/data_model.md`
- `docs/city_adapters.md`
- `docs/data_sources_uk_us.md`
- `docs/15_lens_city_design_contract.md`
- `docs/15_lens_source_audit.md`
- `docs/provenance.md`
- `docs/data_acquisition.md`
- `docs/release_notes.md`

## Historical Research Notes

These notes are retained for context only and are not active runtime scope:

- `docs/lightweight_impact.md`
- `docs/city_architect_research.md`
