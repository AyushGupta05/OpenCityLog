# Round 121 Belfast Decisions / Committee More

Partial pack written on 2026-05-19 after the status nudge, prioritising a smaller provenance-clean set over a maximum-size list.

## What Was Searched

- Belfast City Council Planning Committee / current-major-application material, especially the official `Live Major Applications not previously considered by Committee at 14.04.26` PDF.
- Belfast City Council monthly decisions-issued PDFs for September 2025 and February 2026.
- Existing local duplicate sources:
  - `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json`
  - `tmp/subagents/round118_belfast_planning_committees_deep/candidates.json`
  - `tmp/subagents/round118_belfast_public_heritage_projects/candidates.json`
  - `tmp/subagents/round119_belfast_planning_portal_more/candidates.json`
  - `tmp/subagents/round119_belfast_public_facilities_more/candidates.json`
  - `tmp/subagents/round120_belfast_heritage_harni_more/candidates.json`

## Output

- `source_audit.json`
- `candidates.json`
- `notes.md`

The retained pack has 15 candidates:

- 11 current/live major application records from the 14 April 2026 Belfast City Council live-major list.
- 1 September 2025 monthly decision record covering Kings Hall condition/variation permissions.
- 3 February 2026 monthly decision records for smaller but clear architecture/change-of-use permissions.

## Important Caveats

- Live/current major applications are application-stage records only. They must not be presented as approved, built, open, occupied or operational.
- Monthly decisions PDFs were retained at month precision where this pass did not separately extract row-level decision-notice dates from the NI Planning Portal.
- Coordinates are approximate review points only. Belfast City Council PDFs supplied addresses/site descriptions, not red-line boundaries or reusable coordinates. Production import should replace these with Planning Portal easting/northing or reviewed red-line geometry where possible.
- OSM/Nominatim was used only as a geometry aid. It is not event evidence and should not be used to infer event dates.

## Duplicate Handling

Application-reference checks rejected several attractive records already present in the seed file or round118-120 packs, including Clarendon Dock `LA04/2025/2210/O`, Dalton Street `LA04/2026/0496/F`, Ann Street hotel `LA04/2025/0556/F`, Albertbridge Road `LA04/2025/0605/F`, Santander House `LA04/2025/1716/F`, St Mary's sports hall `LA04/2025/2113/F`, Stormont Hotel `LA04/2024/0569/O` and `LA04/2024/0570/F`, Apollo Road `LA04/2024/2077/F`, Centre House related records, and Fortwilliam Park `LA04/2024/0058/F`.

## Suggested Follow-Up

- Validate retained application refs in the NI Planning Portal for exact decision dates, decision notices, easting/northing and document links.
- For current/live records, check later committee minutes after 2026-04-14 before moving them from application-stage to decision-stage.
- If the atlas wants only larger architectural/civic records, consider dropping the smaller February 2026 permissions before ingestion.
