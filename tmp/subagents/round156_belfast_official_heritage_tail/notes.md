# Round156 Belfast Official Heritage Tail Candidate Pack

Generated: 2026-05-19

## Candidate Output

- Total candidates emitted: 164
- Defence Heritage candidates: 161
- Industrial Heritage candidates: 3

## Source/Date Coverage

- Defence Heritage date_visited range: 2017-02-24 to 2026-03-24.
- Industrial Heritage INSERTDATE/UPDATEDATE range: 2024-10-03 to 2024-10-03.

## Checked But Not Emitted

- HARNI and Scheduled Zones were checked but not emitted because they were already covered by rounds 128, 130 and 141/manual-corpus dedupe.
- Historic Buildings / Listed Buildings and Historic Parks were checked but not emitted because the public layers do not expose a defensible row-level 2008-2026 event/status-change date. Listed-building Date_Const is a construction-era field, not a modern listing date.
- Sites and Monuments, Areas of Archaeological Potential, Areas of Significant Archaeological Interest, Battlesites and Ship/Aircraft Wrecks were audit-only for this round because their public fields either lack a relevant modern event date or are out of scope for Belfast architecture/building-status candidates.

## Caveat

Heritage register/status dates are legal/admin/source-maintenance observations. They are not construction, repair completion, vacancy, occupancy, demolition timing, ownership change, condition outcome or causal evidence unless separately sourced.

## Deduplication

The script deduped against data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json and prior packs tmp/subagents/round128_belfast_harni_spatial/candidates.json, tmp/subagents/round130_belfast_official_more/candidates.json, tmp/subagents/round141_belfast_harni_gaps/candidates.json using source_record_id, source_url, candidate/event IDs and source-specific DHR/IHR references. Existing round156 output is read only to report overlap because this script overwrites its own output deterministically.
