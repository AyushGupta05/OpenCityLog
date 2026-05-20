# round511_belfast_official_architecture_sweep_next25

Generated: 2026-05-20

## Result

- Accepted candidates: 25
- Rejected/retained leads: 7
- Point-backed candidates: 25
- Geometry-ref-only accepted candidates: 0
- Date range: 2024-10-16 to 2025-03-31
- Dedupe boundary: Round503

## Accepted Source Mix

- Department for Infrastructure planning statistics 2024/25: 25 selected Belfast planning/statutory-consent rows with official Easting/Northing and no APP_ID/source-record overlap with the manual architecture corpus or official Belfast architecture sweep candidate packs through Round503.
- EPSG:29902 TM65 / Irish Grid CRS metadata: used only to convert source Easting/Northing to WGS84 points; it is not event evidence.
- Categories include commercial facade/frontage works, hospitality/commercial use changes, listed-building consents, school estate works, residential/commercial conversions, mixed-use refurbishment and care/residential-home alterations.

## Rejected/Retained Separately

- DfI 2025/26 provisional quarterly planning-statistics publications were checked as the current DfI planning-statistics coverage available by 2026-05-20, but they were not promoted because this pack requires application-level rows with Easting/Northing.
- DfC/HED layers were checked: Historic Buildings is point-backed but lacks a usable event date for a new designation/listing event in this pack; HARNI Date_Added rows are status/register records and retained outside this DfI residual pack.
- Belfast City Council project/news pages remain citation-only/page-only or license-limited leads unless a source-backed point/boundary and compatible reuse terms are available.
- Minor private domestic rows, short-let/HMO-only rows without substantial fabric or public/commercial signal, signage/display-only rows, equipment-only rows, bus/telecom/street-furniture rows and duplicate same-project rows were retained in rejected.json.

## Caveats

- Planning approvals and listed-building/demolition/other consents are administrative milestones only. They do not show site works started, physical works completed, opening, occupation, final built form or outcomes.
- Source-backed points come from official Easting/Northing fields converted from EPSG:29902 TM65 / Irish Grid to WGS84; use as application/site navigation points only.
- No accepted record uses invented coordinates or generic geocoding.
- No causality, prediction, simulation, service-performance, health, education, environmental, economic or heritage-condition impact claim is made.
