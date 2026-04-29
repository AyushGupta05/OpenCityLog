# London + New York civic city-change data discovery package

Updated: 2026-04-28T14:32:57.950450+00:00

Reproducible source-discovery pack for Bims-5: an open-source urban changelog / city-change atlas. It covers official/open data for spatial change, transport, planning, buildings, streets/curbs, events, environment, demographics, economy, public services, historic maps/imagery and source provenance.

This is Part 1 discovery, not a finished ingestion, prediction, simulation, or causal impact model.

## Current counts

- Total sources: 247
  - London: 112
  - NYC: 135
- Event seeds/patterns: 65
- Raw metadata/page/API snapshot files: 248

## Main files

- `manifest.json`
- `validation_report.json`
- `shared/dataset_inventory.csv`
- `shared/coverage_matrix.csv`
- `shared/round3_catalog_candidates.json`
- `shared/round3_catalog_candidates.csv`
- `london/source_catalog.json`
- `london/events_seed.json`
- `new_york/source_catalog.json`
- `new_york/events_seed.json`
- `raw_metadata/`

## Re-run

```bash
python3 data-discovery/scripts/catalog_search_round3.py
python3 data-discovery/scripts/fetch_missing_metadata.py --city all
python3 data-discovery/scripts/update_shared_package.py
python3 data-discovery/scripts/validate_discovery_package.py
```

## Product-use warning

Use this package to drive ETL/source adapters. Do not present candidate event seeds as proven causal impacts. Use labels such as documented, corroborated, inferred, disputed, and candidate_requires_row_validation.
