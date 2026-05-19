# Round118 Belfast Public Heritage Projects

## Scope

This scan looked for additional Belfast official public, civic, university, health, transport, and heritage architecture project records from 2008-01-01 through 2026-05-19 that were not already present as same-stage records in `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json`.

The output is intentionally narrow: candidates are appointment, approval, funding, completion, or heritage/status observations. No causal, economic, health, visitor, or regeneration claims are made.

## Method

- Read the existing architecture milestones JSON and screened Belfast records by title, URL, source name, and project keywords.
- Searched official source families only: Belfast City Council, Belfast Region City Deal, Department for Communities, Department for Infrastructure, Department of Health, Ulster University, Queen's University Belfast, and HARNI/nidirect.
- Kept separate stages where the existing file already has a later opening but not the official earlier stage, for example York Street station funding/planning status and the new maternity hospital pre-handover status.
- Rejected source pages that only repeated already-ingested openings, were non-building programme launches, or used speculative future/outcome language that could not be reframed as an observed built-project stage.

## Candidate Highlights

- Belfast Stories design-team appointment, 2023-11-07.
- Belfast Blitz War Memorial design reveal at Cathedral Gardens, 2026-04-14.
- York Street station investment/planning-stage status, 2021-07-22.
- Lisburn Road Library upgrade funding-stage record, 2016-06-16.
- New Belfast maternity hospital nearing-completion status, 2022-07-08.
- Ulster University CDHT planning approval, 2026-01-30.
- Ulster University Belfast campus phase-two contract award, April 2015 with date caveat.
- Queen's Estates completion-stage records for Riddel Hall, MediaLab, and KN Cheung SK Chin InterSim Centre.
- Templemore Baths HARNI restored/Safe status observation.

## Dedupe Notes

The existing file is already dense for Belfast. I rejected several tempting official-source improvements because the same delivered-stage event is already represented: Sandy Row Arts and Digital Hub opening, City Cemetery visitor-centre/opening/completion records, Tropical Ravine reopening, Ulster University final campus opening, Grand Central/Transport Hub stages, Queen's Biomedical Library expansion, and the Seamus Heaney Centre opening.

For Queens and Ulster records, I kept only distinct source-stated stages: completion, contract award, or planning approval. These should stay separate from later openings/launches if ingested.

## Caveats

- Queen's Estates "Completed Projects" is a living page. Ingest should snapshot or archive it and retain the 2026-05-19 retrieval date.
- The Ulster University 2015 campus phase-two page is official, but the migrated page displays a 2023 page date while the URL path and article context place it in April 2015. The candidate therefore uses month precision and should be replaced by an original dated capture if available.
- The Lisburn Road Library coordinate was looked up with OpenStreetMap/Nominatim from the source-stated address and should retain ODbL attribution if reused.
- HARNI status is a live heritage-status record, not a completion certificate or detailed condition survey.

## Suggested Next Checks

- Cross-check CDHT against Belfast City Council planning application decision notices for the application reference and decision date.
- Search Libraries NI for a later official Lisburn Road Library reopening/completion record.
- Archive/snapshot Queen's Estates and HARNI pages before production ingestion.
- Keep design-stage, funding-stage, completion-stage, and opening-stage records distinct in the event schema.
