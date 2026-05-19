# Open Citylog data discovery package: London + New York

Part implemented now: **Part 1 — finding all data**.

Part 2, not implemented in this pass, should ingest selected sources into production event/source/indicator schemas, build geometry joins, and wire city adapters.

Retrieved: 2026-04-28T11:07:11.795950+00:00

## What is in this package

- `london/source_catalog.json`: London official source inventory across the Open Citylog buckets.
- `london/events_seed.json`: Stratford / Olympic Park / Lower Lea Valley seed event cards plus citywide London change chronology seeds.
- `new_york/source_catalog.json`: NYC official source inventory across the Open Citylog buckets.
- `new_york/events_seed.json`: Hudson Yards / West Chelsea seed event cards plus citywide NYC change chronology seeds.
- `shared/dataset_inventory.csv`: combined dataset/source inventory.
- `shared/coverage_matrix.csv`: bucket coverage counts.
- `london/city_timeline.csv` and `new_york/city_timeline.csv`: flat year-by-year chronology tables derived from source-backed event seeds.
- `london/timeline_by_year.json` and `new_york/timeline_by_year.json`: grouped yearly timeline artifacts for UI ingestion or later ETL.
- `raw_metadata/`: fetched API metadata, documents, small samples, and lightweight page metadata snapshots proving official access paths.
- `scripts/fetch_london_pld_sample.py`: repeatable PLD discovery fetch.
- `scripts/fetch_nyc_socrata_metadata.py`: repeatable Socrata metadata/sample fetch.

## Design split requested

### Part 1 — Data discovery, implemented here

Goal: find as many credible official data sources as possible for London and New York, especially for full-city history over time, traffic/mobility, built-environment change, and event/change chronologies; record provenance, access paths, licences/limits, and seed flagship-area plus citywide event leads.

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
- Additional page-metadata snapshots now exist for London and NYC official source pages, including migrated London City Hall / NYC Planning URLs.

## Production warning

This is intentionally source-first. It should not yet power public claims without Part 2 row-level validation, geometry attachment, licence review, and schema tests.

## Current package counts

- London sources: 46
- London event seeds: 33
- NYC sources: 54
- NYC event seeds: 33
- Raw metadata / document files listed in package manifest: 163


## Timeline artifacts added in this pass

- London timeline rows: 33 spanning 2003–2023.
- NYC timeline rows: 33 spanning 2005–2026.
- These are chronology tables built from the discovery package's source-backed event seeds; they are ready for ingestion work but not yet row-normalized into final production schemas.
