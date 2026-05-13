# City Atlas Local API

The local server is intentionally small: it serves the static atlas frontend, the browser-ready city-atlas data files, and the health/proposal endpoints. The frontend uses OpenStreetMap raster tiles directly for current basemap context.

## Active endpoints

- `GET /api/health` returns local server health and confirms the city-atlas data index exists.
- `GET /api/proposal-impact/schema` exposes the proposal input contract.
- `POST /api/proposal-impact` runs the lightweight source-backed proposal screen.
- `GET /...` serves static files from `web/` with path traversal protection.

## Retired endpoints

The old replay-manifest route and layer API are no longer public runtime paths. They should not be re-added unless a future spec restores them with tests and a clear city-atlas use case.
