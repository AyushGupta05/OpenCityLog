# Round310 Belfast Official Architecture Tail

Generated/accessed: 2026-05-20

## Result

- Accepted candidates: 0
- Rejected/detail rows retained: 10
- Accepted date range: none
- Prior files screened: 163
- Prior records indexed: 81490
- Validation: passed

## Sources Checked

- Belfast City Council: Current planning applications
- Department for Infrastructure / Northern Ireland planning authorities: Northern Ireland Planning Portal public register
- Belfast City Council / Department for Communities Historic Environment Division: Planning Committee agenda and HED listing papers, 19 May 2026
- Belfast City Council / Department for Communities Historic Environment Division: HED Listing Structures report, 19 May 2026
- Belfast City Council / Department for Communities Historic Environment Division: HED Listing Structures Appendix 1-2, 19 May 2026
- Department for Communities Historic Environment Division: Changes to the List of Buildings of special architectural or historic interest
- Department for Communities Historic Environment Division / nidirect: Historic Building Details / HED Buildings Database ArcGIS layer
- Belfast City Council: Major projects in Belfast city centre
- Belfast City Council: Cathedral Gardens
- Department for Infrastructure, Northern Ireland: Northern Ireland planning activity statistics datasets

## Exhaustion Notes

No new clean, geometry-backed Belfast official architecture candidate survived this pass. DfC/HED March 2026 Belfast rows are already present from a prior heritage-designation pack and still lack a matching HED point geometry in the historic-buildings ArcGIS layer. Belfast City Council current-planning rows are already represented or rejected in prior Belfast packs and remain mutable advertisement rows. Recent committee/project pages duplicate existing manual-corpus events.

## Rejected Leads

- dfc_march_2026_knock_burial_ground_record_only: duplicate_prior_record_and_no_official_point - Prior cross-city heritage-designation output already contains this Belfast HED row, and the current HED point layer did not return a matching geometry.
- dfc_march_2026_victoria_college_pool_record_only: duplicate_prior_record_and_no_official_point - Prior cross-city heritage-designation output already contains this Belfast HED row, and the current HED point layer did not return a matching geometry.
- bcc_current_planning_2026_05_15_core_architecture_rows: duplicate_or_mutable_current_list - Rows are already present in current manual/prior Belfast candidate coverage or later planning-tail reject detail; the page remains an application list rather than a clean mapped event source.
- bcc_current_planning_2026_05_08_core_architecture_rows: duplicate_or_mutable_current_list - Rows are already present in current manual/prior Belfast candidate coverage or later planning-tail reject detail; the page remains an application list rather than a clean mapped event source.
- bcc_planning_committee_2026_05_19_hed_listing_structures: duplicate_prior_committee_record - The current manual corpus and prior Belfast official-source packs already contain the May 2026 HED listing-structures report and appendix rows.
- bcc_planning_committee_2026_05_19_hed_listing_appendix: duplicate_prior_committee_record - The current manual corpus and prior Belfast official-source packs already contain the May 2026 HED listing-structures report and appendix rows.
- bcc_major_projects_city_quays_and_assembly_rooms: duplicate_project_page_status - City Quays Gardens, Assembly Rooms acquisition, repair-programme status and related city-centre project records are already present in the current manual corpus.
- bcc_cathedral_gardens_project_page: duplicate_project_page_status - Cathedral Gardens works-start and memorial design-stage records are already present in the current manual corpus and prior Belfast packs.
- dfi_planning_statistics_2024_25_tail: exhausted_prior_planning_tail - Rounds 270, 281, 286 and 291 already screened the official DfI planning-statistics tail against the current corpus and prior Belfast packs; round291 emitted no accepted candidates.
- ni_planning_portal_public_register_live_search: source_checked_no_stable_export - Application references found through the council current list were already represented or rejected by prior Belfast packs; no new clean mapped row was extracted from the public register shell.

## Caveat

Rows checked here are administrative or project-page observations. Use only the date and status explicitly stated by the cited official source, and keep application advertisements separate from approvals, works, openings, occupation, and final built form.
