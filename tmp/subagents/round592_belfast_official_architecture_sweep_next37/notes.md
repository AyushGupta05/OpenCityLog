# round592_belfast_official_architecture_sweep_next37

Generated: 2026-05-20

## Result

- Accepted candidates: 30
- Rejected/retained lead groups: 8
- Point-backed candidates: 30
- Geometry-ref-only accepted candidates: 0
- Date range: 2024-04-19 to 2025-01-14
- Dedupe boundary: Round587
- Eligible non-duplicate DfI rows before target cap: 38

## Accepted Source Mix

- Department for Infrastructure planning statistics 2024/25: 30 selected Belfast planning, listed-building, demolition-consent or statutory-consent rows with official Easting/Northing and no APP_ID/source-record overlap with the manual architecture corpus or official Belfast architecture sweep candidate/rejected/readback packs through Round587.
- EPSG:29902 TM65 / Irish Grid CRS metadata: used only to convert source Easting/Northing to WGS84 points; it is not event evidence.
- The source mix is intentionally administrative: approvals and consents are recorded as planning milestones, not physical completion or opening evidence.

## Rejected/Retained Separately

- DfI 2025/26 provisional quarterly planning-statistics publications were checked as the current DfI planning-statistics context available on 2026-05-20, but they were not promoted because this pack requires application-level rows with Easting/Northing.
- DfC/HED layers were checked as official spatial/status context; they were not promoted in this DfI residual batch without a new dated planning/statutory-consent point-event row.
- Belfast City Council and Planning Portal pages remain citation-only/page-only or license-limited leads unless a source-backed point/boundary and compatible reuse terms are available.
- Duplicate rows, short-let/HMO-only rows without substantial fabric signal, signage/display-only rows, equipment-only rows, boundary/access-only rows, transport/telecom/street-furniture rows and condition/status-only rows were retained in rejected.json.

## Caveats

- Planning approvals and listed-building/demolition/other consents are administrative milestones only. They do not show site works started, physical works completed, opening, occupation, final built form or outcomes.
- Source-backed points come from official Easting/Northing fields converted from EPSG:29902 TM65 / Irish Grid to WGS84; use as application/site navigation points only.
- No accepted record uses invented coordinates or generic geocoding.
- No causality, prediction, simulation, service-performance, health, education, environmental, economic or heritage-condition impact claim is made.
