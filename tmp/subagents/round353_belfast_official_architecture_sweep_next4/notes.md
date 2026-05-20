# Round353 Belfast Official Architecture Sweep Next4

Generated/accessed: 2026-05-20

## Result

- Accepted candidates: 0
- Rejected/detail rows retained: 10
- Accepted date range: none
- Sources checked: 9
- Prior files screened: 187
- Prior records indexed: 87702
- Validation: passed

## Sources Checked

- Belfast City Council: New residential developments in east Belfast and grade A office block approved at council's Planning Committee (https://www.belfastcity.gov.uk/news/new-residential-developments-in-east-belfast-and-g)
- Belfast City Council: Planning Committee agenda, 10 March 2026 (https://minutes.belfastcity.gov.uk/ieListDocuments.aspx?CId=167&MId=12349)
- Belfast City Council: LA04/2025/1272/F - Harberton Special School final (https://minutes.belfastcity.gov.uk/documents/s126543/LA04%202025%201272%20F%20-%20Harberton%20Special%20School%20final.pdf)
- Belfast City Council: LA04/2025/0463/F - Redcar Street (https://minutes.belfastcity.gov.uk/documents/s126484/LA04%202025%200463%20F%20Redcar%20St.pdf)
- Belfast City Council: Neighbourhood Regeneration Fund (https://www.belfastcity.gov.uk/business-and-investment/physical-investment/funding-programmes/neighbourhood-regeneration-fund)
- Belfast City Council: West Belfast Area Working Group - Neighbourhood Regeneration Fund, 26 February 2026 (https://minutes.belfastcity.gov.uk/documents/s126858/WBAWG%2026.02.26.pdf)
- Belfast City Council: Belfast Region already reaping rewards from City Deal programme of investment (https://www.belfastcity.gov.uk/news/belfast-region-already-reaping-rewards-from-city-d)
- Department for Communities Historic Environment Division: Changes to the List of Buildings of special architectural or historic interest (https://www.communities-ni.gov.uk/publications/changes-list-buildings-special-architectural-or-historic-interest)
- Department for Communities Historic Environment Division / nidirect: Historic Building Details / HED Buildings Database ArcGIS layer (https://services2.arcgis.com/BdBkthNLO9mzGAMO/ArcGIS/rest/services/Historic_Environment_Division_GIS_Data/FeatureServer/1)

## Exhaustion Notes

The March 2026 Belfast Planning Committee approval cluster looked promising, but every ingestible application lead was already represented in the current manual corpus or prior Belfast packs. The NRF and Area Working Group pages are useful discovery sources, but this pass did not find a new distinct dated milestone that was not already represented.

## Rejected Or Overlapping Leads

- mount_masonic_hall_social_housing_approval: duplicate_existing_event - Existing manual corpus and Round95 already contain the LA04/2025/0837/F approval for demolition of Mount Masonic Hall and 35 social homes at 45 Park Avenue.
- cabin_hill_residential_approval: duplicate_existing_event - Existing manual corpus, Round119 and Round126 already contain the LA04/2024/0015/F Cabin Hill residential approval.
- harberton_mobile_classroom_approval: duplicate_existing_event - Existing manual corpus, Round110 and Round126 already contain the LA04/2025/1272/F Harberton temporary classroom village milestone.
- mays_meadow_lanyon_place_office_approval: duplicate_existing_event - Existing manual corpus, Round95 and Round126 already contain LA04/2025/0574/F for the Mays Meadow/Lanyon Place office scheme.
- redcar_street_padel_approval: duplicate_existing_event - Existing manual corpus, Round110 and Round112 already contain LA04/2025/0463/F for the Decco Ltd / Redcar Street warehouse change-of-use approval.
- nrf_underway_projects_page: mutable_programme_page_or_duplicate - The current NRF page is useful discovery context, but the named underway projects checked here are already represented by more specific committee, news or project-status rows, or lack a fresh dated physical milestone on the page.
- west_awg_michael_davitt_act_glencairn_mountainview: duplicate_or_not_ingestible - Michael Davitt, ACT Initiative and Mountainview status rows are already in the current manual corpus. Glencairn was awaiting a planning-application response in this report, so it is not a clean new approval, works-start, completion or opening milestone.
- city_deal_studio_ulster_digital_twin_ireach: duplicate_existing_event - Studio Ulster opening, UK Digital Twin Centre opening and iREACH Health construction-start/approval records are already present in the manual corpus from more direct project or partner sources.
- dfc_hed_list_changes_page: no_new_safe_row_in_this_pass - Recent Belfast HED/list-change leads visible from prior rounds were already screened or ingested, including All Saints, Knock Burial Ground and Victoria College-related rows. No additional distinct Belfast HB26 row with safe date, status and geometry was isolated in this round.
- hed_buildings_layer: supporting_endpoint_only - The ArcGIS layer remains useful for HB references and point geometry, but this pass did not identify a non-duplicate Belfast list-status change needing HED geometry support.

## Next Manual Checks

- Recheck future Belfast Planning Committee decisions-issued lists for new post-March 2026 decisions rather than reusing the March approval cluster.
- Recheck DfC/HED list-change attachments for new Belfast HB26 rows with explicit status, date and point geometry.
- Recheck NRF and PEACEPLUS pages only when a dated official page or committee pack adds a fresh award, works-start, completion, opening or statutory milestone.

## Caveat

This pack is an exhaustion record. It should not be appended as event data; it is meant to prevent duplicate ingestion and point the next sweep toward manual checks with a better chance of distinct provenance.
