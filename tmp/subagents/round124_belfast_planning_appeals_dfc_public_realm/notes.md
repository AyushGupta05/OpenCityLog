# Round 124 Belfast Planning Appeals / DfC Public Realm Notes

## Status

Wrote a partial but usable tranche of 30 candidate records, under the requested maximum of 35. The records are official-source candidates, not import-ready production events.

Artifacts:

- `candidates.json`
- `source_audit.json`
- `notes.md`

## Scope Used

Sources were limited to official records from:

- Planning Appeals Commission NI case search and case detail pages.
- Department for Communities regeneration, public realm, consultation and development brief pages.
- Department for Infrastructure and Northern Ireland Executive planning/infrastructure pages.
- Belfast Region City Deal official project and news pages.

## Duplicate Handling

I screened prior Belfast subagent packs for obvious duplicate coverage and avoided re-adding already-covered project/stage records from Belfast public pages, planning committee packs, public facilities packs and recent major-decision packs.

Examples deliberately avoided or only included as a different official milestone:

- Belfast Streets Ahead Phase 3 and Phase 5 public-page records.
- Five Cs 2024 screening/accessibility records; this tranche only keeps the earlier 2020 DfC consultation launch as a separate design_consultation milestone.
- Cathedral Gardens, Grand Central/Weavers Cross/Saltwater Square, Belfast Stories consultation/design-team records, 2 Royal Avenue and most public facilities.
- Planning committee approval/refusal decisions already captured in committee and major-decision rounds.
- University, health, library and public-facility records already captured in the public facilities/universities/health pack.

## Milestone Separation

The candidate records keep process stages separate instead of collapsing them into project outcomes:

- `appeal_decision`: PAC allowed/dismissed appeal records.
- `planning_process`: call-in or procedural planning stage.
- `planning_decision`: official approval or notice-of-opinion milestone.
- `design` and `design_consultation`: pilot/public-realm/design team/consultation pages.
- `development_procurement` and `development_brief`: preferred developer or development brief publication.
- `funding` and `funding_contract`: funding allocation or contract award announcements.
- `pre_construction_investigation`: preliminary/geotechnical works.
- `construction_start`: contractor appointment and construction commencement where the source says so.
- `opening`: launch/opening only where an official source says the facility launched.
- `plan_launch`: strategy/plan publication milestone.

No candidate claims that a planning approval, appeal decision, consultation, brief, or funding announcement caused a later outcome.

## Geometry And Provenance Caveats

The records are provenance-first but not cleanly geocoded. Most coordinates are approximate manual points from named addresses, streets or corridors. They should be treated as triage geometry only.

Before ingestion:

- Replace approximate points with authoritative planning polygons, site boundaries or reviewed internal geometry.
- Re-open PAC case documents where a decision notice or inspector report is needed.
- Reconcile PAC records with NI Planning Portal records where application IDs are available.
- Check each source page/PDF for exact Crown copyright, OGL or website reuse terms.
- Preserve the distinction between source publication date, decision date, retrieval date and any later effective/built dates.

## Known Limits

This tranche prioritised official provenance and deduplication over completeness. It almost certainly misses some official DfC/DfI/BRCD records and many PAC appeal records that are not easily discoverable through the public search results.

Records with `appeal_decision`, `planning_process`, `design_consultation`, `development_brief`, `funding`, or `funding_contract` milestone types should not be displayed as built change, completed construction, occupation, public use, or policy impact without a later official source.
