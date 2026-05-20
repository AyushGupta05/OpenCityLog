# Round 297 London LDD archive next25 validation report

- OK: true
- Candidate count: 162
- Date range: 2008-01-24 to 2020-03-20
- Milestone mix: {"permission": 162}
- Prior LDD packs checked through round287: 27
- Manual LDD rows checked: 11280
- Eligible headroom after retained candidates: 0
- Duplicate event IDs: 0
- Duplicate source/date keys: 0
- Cross-dedupe intersections: {"manual_event_ids": 0, "manual_refs": 0, "manual_rows": 0, "manual_source_dates": 0, "manual_title_dates": 0, "prior_event_ids": 0, "prior_refs": 0, "prior_rows": 0, "prior_source_dates": 0, "prior_title_dates": 0}
- Warnings: 1
- Issues: 0

## Checks

- candidate count does not exceed cap
- all remaining eligible scored rows retained
- required provenance fields
- official London Datastore/LDD URLs only
- OGL v3 license and attribution fields
- accessed_at/retrieved_at fixed to 2026-05-20
- 2008-01-01 through 2026-05-20 date window
- London coordinate envelope and GeoJSON point consistency
- manual corpus and prior LDD packs through round287 dedupe intersections
- overclaim wording guard

## Warnings

- No commencement/started or completion rows remained after dedupe through round287 and signal filters.

## Issues

- None
