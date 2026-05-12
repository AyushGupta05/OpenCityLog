# Open Citylog work split

## Part 1: Find all data (done in this folder)

Deliver source/provenance inventory, raw metadata samples, limitations, and seed events for London and NYC.

Success criteria:
- all 10 core data buckets represented where credible public sources exist;
- 20+ seed events per flagship area;
- official access URLs/API endpoints recorded;
- licences/limitations visible;
- repeatable discovery scripts present.

## Part 2: Ingest and integrate (next)

Recommended order:
1. Freeze MVP source subset for London Stratford and NYC Hudson Yards.
2. Define JSON schemas for Source/Event/IndicatorSnapshot if repo schemas do not already fit.
3. Build ETL fetchers with small fixtures and tests.
4. Attach geometries from PLD/ZAP/PLUTO/boundary layers.
5. Resolve event dates from official rows/documents.
6. Generate city manifests and web-ready tiles/GeoJSON/NDJSON.
7. Build evidence drawer and compare-year snapshots.
8. Run licence review and source-brief export.
