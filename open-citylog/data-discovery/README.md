# Open Citylog data discovery package: London + New York

Part implemented now: **Part 1 — finding all data**.

Part 2, not implemented in this pass, should ingest selected sources into production event/source/indicator schemas, build geometry joins, and wire city adapters.

Retrieved: 2026-04-28T09:52:10.257166+01:00

## What is in this package

- `london/source_catalog.json`: London official source inventory across the Open Citylog buckets.
- `london/events_seed.json`: Stratford / Olympic Park / Lower Lea Valley seed event cards.
- `new_york/source_catalog.json`: NYC official source inventory across the Open Citylog buckets.
- `new_york/events_seed.json`: Hudson Yards / West Chelsea seed event cards.
- `shared/dataset_inventory.csv`: combined dataset/source inventory.
- `shared/coverage_matrix.csv`: bucket coverage counts.
- `raw_metadata/`: fetched API metadata, documents and small samples proving access paths.
- `scripts/fetch_london_pld_sample.py`: repeatable PLD discovery fetch.
- `scripts/fetch_nyc_socrata_metadata.py`: repeatable Socrata metadata/sample fetch.

## Design split requested

### Part 1 — Data discovery, implemented here

Goal: find as many credible official data sources as possible for London and New York, record provenance, access paths, licences/limits, and seed flagship-area event leads.

Outputs: source catalogs, raw metadata samples, event seed files, limitations, and manifests.

### Part 2 — Ingestion and product integration, next

Goal: choose MVP sources, normalize into Open Citylog `Source`, `Event`, and `IndicatorSnapshot` schemas, build geospatial joins, generate city-adapter artifacts, and add UI evidence drawers/compare-year snapshots.

Part 2 should not treat all seed events as final; it should validate every event against source rows/documents and attach geometry.

## Discovery verification already performed

- Browser + browser vision used on London City Hall PLD page and NYC Open Data PLUTO page.
- PLD public guest API root fetched: `raw_metadata/london_pld_api_root.json`.
- PLD technical docs/schema downloaded from London City Hall.
- Stratford/Olympic discovery query fetched 7,791 PLD matches into `raw_metadata/london_pld_stratford_olympic_search_sample.json`.
- NYC Socrata metadata/sample rows fetched for PLUTO, ZAP, DOB, HPD, boundaries, parks, facilities, air quality, bike routes, zoning, buildings and more.
- NYC ZAP Hudson query fetched 25 rows into `raw_metadata/nyc_zap_hudson_projects.json`.

## Production warning

This is intentionally source-first. It should not yet power public claims without Part 2 row-level validation, geometry attachment, licence review, and schema tests.
