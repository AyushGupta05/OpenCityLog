# City Atlas Local API

The local server is intentionally small: it serves the static atlas frontend, browser-ready city-atlas data files, and the health endpoint. The frontend uses OpenStreetMap raster tiles directly for current basemap context.

## Active endpoints

- `GET /api/health` returns local server health and confirms the city-atlas data index exists.
- `GET /...` serves static files from `web/` with path traversal protection.

## Retired endpoints

The old replay-manifest route, layer API, and proposal-impact analogue endpoints are no longer public runtime paths. `GET /api/proposal-impact/schema` and `POST /api/proposal-impact` return `410` tombstones so old clients do not mistake the retired feature for an active lens.

Do not re-add proposal/future endpoints unless a future accepted spec restores them with source-backed methods, tests, provenance, and clear limits. Current atlas work should use the 15 historical/current lenses, evidence panels, and Markdown/CSV/GeoJSON exports.
