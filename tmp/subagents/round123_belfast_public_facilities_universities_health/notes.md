# Round 123 Belfast Public Facilities, Universities And Health Notes

Created: 2026-05-19

## Scope

This pack contains 12 official-source candidate records for Belfast public facilities, universities, libraries, health/social-care facilities and civic justice facilities between 2008 and 2026. I kept the pack small and only included records that had an observed milestone: opening, launch, completion, reopening, construction start, or first-use.

## Method

- Searched official/public-body sources: Libraries NI, Department for the Economy, Queen's University Belfast Estates, Belfast Health and Social Care Trust, Department of Justice and Translink.
- Screened candidate names and source terms with `rg` against `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json` and prior `tmp/subagents` Belfast outputs.
- Used reporting-year or month precision where official annual reports did not provide a day.
- Avoided prediction, simulation, impact claims, and causal claims.
- Left confidential or uncertain geometry as `geometry_ref` instead of inventing coordinates.

## Accepted Candidates

- Lisburn Road Library refurbishment/extension completion in Libraries NI 2017/18 annual report. This is distinct from the existing DfC funding-stage record.
- Whiterock Reimagined Children's Library launch in December 2023 from Libraries NI equality progress reporting.
- Ulster Virtual Production Studio launch at Ulster University's Belfast campus on 10 February 2022 from Department for the Economy.
- Queen's campus-wide lecture theatre refresh completion entries for summer 2020 and summer 2022 from Queen's Estates.
- Queen's David Keir Building bespoke computer suite/postgraduate/architecture spaces start-on-site milestone from Queen's Estates construction-stage page.
- Cullingtree Meadows supported housing opening during 2019/20 from Belfast Trust quality reporting.
- Cullingtree Meadows and Brae Valley House reopening after make-over during 2023/24 from Belfast Trust annual reporting.
- Children's Hospital Programme Treatment Unit opening during 2023/24 from Belfast Trust annual reporting.
- Belfast City Hospital two-theatre refurbishment operational completion marker on 22 January 2024 from Belfast Trust annual reporting.
- Mater Hospital Surgical Overnight Stay Centre first-use milestone during 2023/24 from Belfast Trust annual reporting.
- Belfast Remote Evidence Centre official opening on 28 September 2023 from Department of Justice, with city-level geometry only because the source says the location should not be publicly disclosed.

## Held Or Rejected

- Stranmillis University College sports pitches were not included because the consolidated manual file already contains that 2026 official-opening record.
- Queen's 2025 lecture-theatre refresh was not included because the consolidated manual file already contains that record.
- Multiple Belfast Trust health garden, quiet-room, staff-hub, macular, orthopaedic, maternity, ED, MAU and Glenmona records were not included because they are already represented in the manual file or prior accepted candidate rounds.
- Boyne Bridge removal was held. Translink has an official page saying the 1936 bridge has now been removed, but the page did not provide a stable removal date; a later dated official community update or works notice would make that candidate cleaner.
- Belfast Remote Evidence Centre was included only as a confidential-location civic facility. It should be excluded from map layers that require precise public coordinates.

## Data Quality Notes

- Annual-report records are useful provenance but often coarse. The event date should remain `reporting_year` unless a more precise official source is later added.
- Multi-building Queen's lecture-theatre records use a representative campus point; a future ingestion could split them by room/building if Queen's publishes a structured room list with coordinates.
- No source text, images or long quotations are reproduced in the JSON. The files retain factual metadata, attribution and URLs.
