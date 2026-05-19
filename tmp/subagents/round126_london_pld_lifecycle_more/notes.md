# Round 126 London PLD lifecycle candidates

Generated 80 scratch candidates from official Planning London Datahub application rows accessed on 2026-05-19.

Selection prioritised `actual_completion_date`, `actual_commencement_date`, `date_building_work_started_under_previous_permission`, `date_building_work_completed_under_previous_permission`, and `application_details.commencement_notice_received` rather than approval-only rows.

These records intentionally do not claim opening, occupation, operational outcomes, design quality, or causation. Lifecycle/status fields are treated as administrative observed-change candidates with visible limitations.

Deduplication scanned existing London atlas event files and prior London candidate scratch packs for source record IDs, PLD IDs, candidate/event IDs, and title/date pairs.

Files produced:
- `candidates.json`
- `source_audit.json`
- `notes.md`

Source IDs reused where appropriate: `gla-planning-datahub-applications`, `gla-planning-datahub-listed-building-consent`, and `london-planning-datahub-api/core`.
