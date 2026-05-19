# City Atlas Local API

The local server is intentionally small: it serves the static atlas frontend, the browser-ready city-atlas data files, a health endpoint, and the optional Wayback imagery tile proxy used by the before/after map.

## Active endpoints

- `GET /api/health` returns local server health and confirms the city-atlas data index exists.
- `GET /api/imagery/wayback/{itemId}/{z}/{y}/{x}` proxies ArcGIS Wayback imagery tiles for source-backed before/after comparison.
- `GET /...` serves static files from `web/` with path traversal protection.

## Retired endpoints

The old replay-manifest route and layer API are no longer public runtime paths. They should not be re-added unless a future spec restores them with tests and a clear city-atlas use case.
