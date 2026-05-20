# round419_belfast_official_architecture_sweep_next14

Round419 continued the Belfast official-source architecture/built-environment sweep after Round409.
The pack keeps only source-backed observed milestones and excludes prediction, causation, simulation, and outcome claims.

## Method

- Queried official/public sources only: Belfast Harbour, Belfast City Council, Department of Education, Department for Communities, Department of Justice, Queen's University Belfast and Ulster University.
- Fetched all audited source URLs live on 2026-05-20 and checked required markers on accepted pages.
- Screened candidates against the live manual corpus, generated Belfast atlas event JSON files, and prior Belfast tmp packs through Round409.
- Used conservative date and location precision where official pages gave a source-stated site reference rather than a coordinate.

## Accepted

- bfs_arch_round419_belfast_harbour_offshore_wind_terminal_handover_2013: Belfast Harbour offshore wind terminal was handed over (2013-02-13) from Belfast Harbour
- bfs_arch_round419_city_quays_multi_storey_car_park_opening_2019: City Quays multi-storey car park opened (2019-01-24) from Belfast Harbour
- bfs_arch_round419_belfast_harbour_cruise_terminal_opening_2019: Belfast Harbour dedicated cruise terminal opened (2019-07-29) from Belfast Harbour

## Rejected

- round419_reject_deanby_centre_duplicate: Deanby Centre Special School official opening - Rejected as duplicate: live/manual corpus already contains the Deanby Centre Special School opening.
- round419_reject_saint_patricks_primary_duplicate: Saint Patrick's Primary School official opening - Rejected as duplicate: live/manual corpus already contains the Saint Patrick's Primary School opening.
- round419_reject_elmgrove_primary_duplicate: Elmgrove Primary School official opening - Rejected as duplicate: live/manual corpus already contains the Elmgrove Primary School opening/building milestone.
- round419_reject_qub_wellcome_wolfson_duplicate: Wellcome-Wolfson Institute for Experimental Medicine opening - Rejected as duplicate: live/manual corpus already contains the Wellcome-Wolfson Institute opening.
- round419_reject_ulster_belfast_campus_phase_one_duplicate: Ulster University Belfast campus Phase One official opening - Rejected as duplicate: live/manual corpus already contains the Phase One opening.
- round419_reject_qub_intersim_duplicate: KN Cheung SK Chin InterSim Centre launch - Rejected as duplicate: live/manual corpus already contains both completion/launch InterSim records.
- round419_reject_qub_allstate_software_studio_duplicate: Allstate Software Studio opening at Queen's University Belfast - Rejected as duplicate: live/manual corpus already contains the Allstate Software Studio opening.
- round419_reject_doj_yja_charles_house_duplicate: Youth Justice Agency headquarters opening at Charles House - Rejected as duplicate: live/manual corpus already contains the Youth Justice Agency Charles House headquarters opening.
- round419_reject_remote_evidence_centre_location_withheld: Belfast Remote Evidence Centre official opening - Rejected because the official source intentionally withholds the public location, so Round419 cannot provide a public geometry/address reference.
- round419_reject_city_quays_gardens_duplicate: City Quays Gardens opening - Rejected as duplicate: live/manual corpus already contains City Quays Gardens milestones.
- round419_reject_st_comgalls_duplicate: St Comgall's regeneration project official opening - Rejected as duplicate: live/manual corpus already contains the St Comgall's official-opening event.

## Validation

- ok: true
- accepted_count: 3
- rejected_count: 11
- accepted_date_range: 2013-02-13 to 2019-07-29
- warnings: none
- errors: none
