# Data Acquisition and Provenance

This branch keeps the atlas data-source layer inspectable and deterministic. The default workflow is metadata-first: record where data should come from, preserve retrieval details, place small source summaries under a clear local path, then build normalized city-change events with explicit caveats.

## Source Inventory

The source catalogue is `config/source_inventory.json`. Each source entry records:

- coverage years for the 2016-2026 replay window
- access pattern, such as local repo, manual drop, API query, portal download, or feed
- licence and attribution notes
- ingestion status
- expected local paths and formats
- refresh notes for future automation

The inventory covers current repo rasters and vectors plus the recommended future sources: Google Earth/manual drops, OpenStreetMap via Overpass, Geofabrik and ohsome, Belfast City Council/OpenDataNI, Belfast Bikes, NI Planning Portal, Translink, Northern Ireland Air, NISRA population/deprivation/statistical boundaries, and Sentinel/Landsat/Copernicus products.

London and New York City are built from `data-discovery/<city>/source_catalog.json` and `events_seed.json`. The row-level expansion script fetches selected official sources and rewrites those seed files with bounded, source-backed event records:

```powershell
python .\scripts\expand_london_nyc_events_from_open_sources.py
npm run build:data
```

Current expansion families include London Planning Data brownfield/designation rows, Planning London Datahub application lifecycle records, London Fire Brigade incidents, DfT STATS19 road-collision rows, HM Land Registry Price Paid property-transaction rows, UK House Price Index borough-month aggregate rows, Food Standards Agency food-hygiene rating records, Police.uk anonymized street-level crime/ASB rows, privacy-minimized Police.uk stop-and-search rows, TfL road disruptions, NYC DOB/DOB NOW permits, DOB certificates of occupancy, DOT street work/closure/network-change records, DCP ZAP projects, LPC landmark and historic-district designations, HPD affordable housing production, FDNY dispatch incidents, capital project tracker/status rows, NYC Parks properties, the 2015 street tree census, 311 service requests, permitted events, and motor-vehicle collision records.

These rows are administrative or observed source records, not predictions and not proof of causal impact. Permit, planning, capital-project, and designation dates must be labelled by the source field that supports them. Forecast/projected fields may be retained in summaries only when the event date is the source reporting date or a recorded actual date.

The expansion follows Planning Data `links.next` pagination for London LPA queries and records page counts in `data-discovery/raw_metadata/generated_event_expansion_london_*_summary.json`. Planning London Datahub application rows are fetched through the documented guest API and stored only as minimal public provenance fields because the London Datastore licence field is currently "Not Specified". London Fire Brigade incident rows are sampled by year from the official 2009-2017 CSV and later 2018-2023/2024-onward XLSX files; DfT STATS19 road-collision rows are sampled by year from large official files. Both keep the repo usable while preserving source IDs, row IDs, retrieval time, and caveats. HM Land Registry Price Paid rows are sampled from yearly CSV files from 1995 onward and treated as property-transaction evidence; because the source address fields carry additional address-data conditions, the adapter omits PAON, SAON, street, locality, town/city, county, full postcode, and exact price before writing atlas events. UK House Price Index rows are aggregate borough-month records from the official full-file CSV; they carry average price, index, percentage change, and sales-volume fields as observed context, not as causal or site-specific evidence. Food Standards Agency FHRS rows are current-snapshot hygiene-rating records; the adapter omits business name, address lines, postcode, phone, email, and right-to-reply text before writing atlas events. Police.uk street-level rows are generated through the public custom-download flow for London police forces and kept as anonymized public-safety context, not exact incident-site evidence. Police.uk stop-and-search rows are also pulled through the public custom-download flow, but the adapter intentionally omits demographic fields, operation names, and exact timestamps before writing atlas events. Rows without a usable source date are skipped and counted instead of being assigned the current year. Generated row events carry `source_url`, `source_record_id`, `source_dataset_id`, and `source_retrieved_at` into the UI-facing provenance.

## Manifest Script

Run the indexer from the repository root:

```powershell
python .\scripts\index_sources.py --dry-run
```

To write or refresh the manifest:

```powershell
python .\scripts\index_sources.py --output .\manifests\provenance_manifest.json
```

The script scans `data/` by default and records:

- relative path
- sha256 checksum
- file size
- file extension and broad media type
- inferred layer name
- observed years, folder year, filename year, and primary year
- detected source ID and evidence
- lightweight GeoJSON metadata where practical, including feature count, geometry types, bbox, generator, copyright, and timestamp
- quality flags such as folder/filename year mismatch, skipped metadata for large files, and bbox outside the approximate Belfast, Northern Ireland validation envelope

The script does not download remote data. It can safely run in dry-run mode to validate inventory and preview counts.

## Adding Google Earth or Manual Drops

Place new manually acquired files under:

```text
data/manual_drops/<source_or_provider>/<year>/
```

Examples:

```text
data/manual_drops/google_earth/2019/cathedral_quarter_change_points.kml
data/manual_drops/manual_digitising/2024/york_street_notes.geojson
data/manual_drops/foi/2021/planning_reference_extract.csv
```

For each drop, add a small sidecar note when the source terms or interpretation method are not obvious:

```text
data/manual_drops/google_earth/2019/cathedral_quarter_change_points.provenance.json
```

Suggested sidecar fields:

```json
{
  "source_id": "manual_google_earth",
  "provider": "Google Earth",
  "capture_or_observation_date": "2019-06-15",
  "created_by": "name or initials",
  "method": "hand-digitized placemarks from visual inspection",
  "licence_or_terms_url": "https://www.google.com/permissions/geoguidelines/",
  "notes": "Describe what changed and any uncertainty."
}
```

Do not overwrite an earlier manual drop. Add a new dated file and refresh the manifest.

## Refreshing External Source Metadata

For external sources, commit small metadata and manifests before large data. A useful refresh cycle is:

1. Check `config/source_inventory.json` for the source path and licence notes.
2. Save only lightweight exports, query files, or metadata first.
3. Put large downloaded files outside git unless the project explicitly approves them.
4. Record source URL, query parameters, retrieval date, licence, checksum, and any clipping/filtering steps.
5. Run `python .\scripts\index_sources.py --dry-run`.
6. Run `python .\scripts\index_sources.py --output .\manifests\provenance_manifest.json`.

For London/NYC row expansion, also commit the generated summary files under `data-discovery/raw_metadata/` and `data-discovery/shared/generated_event_expansion_summary.json`. These summaries record retrieval time, source event counts, source IDs, and known caveats without storing large raw downloads.

For OpenStreetMap-derived files, preserve the Overpass QL query or ohsome request body. For official open-data files, preserve the dataset landing page and resource ID. For remote-sensing products, preserve catalogue/STAC metadata and scene IDs before deriving small rasters.

## Known Data Quality Checks

The current indexer is deliberately conservative. It flags evidence; it does not change source files. In particular:

- `outside_target_belfast_ni_bbox` means a parsed GeoJSON bbox does not intersect the approximate Belfast, Northern Ireland envelope.
- `folder_filename_year_mismatch` means the year in the folder and the year in the filename disagree.
- `metadata_skipped` means the file was too large for lightweight GeoJSON parsing under the configured size limit.

Review these flags before using a layer in replay analysis.
