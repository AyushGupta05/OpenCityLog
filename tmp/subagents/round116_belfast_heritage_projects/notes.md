# Round 116 Belfast heritage/project candidates

Access date for all web sources: 2026-05-19.

## Scope

This pass looked for additional official or public-source Belfast architecture and built-environment candidates from 2008-01-01 through 2026-05-19, emphasizing HED/nidirect HARNI records, DfC historic environment and regeneration pages, DfI project/procurement pages, Belfast City Council planning/reuse pages, and civic/institutional buildings.

The output file is:

- `tmp/subagents/round116_belfast_heritage_projects/candidates.json`

## Method

- Read the repo-local `urban-data-source-auditor` skill.
- Parsed `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json` enough to identify Belfast source IDs, existing 2024-2026 records, and duplicate keys.
- Duplicate screened candidate terms with `rg` against the existing manual drop using source IDs, application IDs, HARNI/HB refs, titles, URLs, and distinctive site names.
- Used only official/public pages. No source text, images, maps, or drawings were copied beyond short factual metadata.
- Labelled planning advertisements, EOIs, procurement awards, guidance adoption, project-stage notes, heritage-risk reviews, and openings as separate event types.

## Candidate Summary

Strongest additions:

- HARNI heritage-risk/status records for Belvoir Park Hospital, The Water Margin / former Donegall Pass Presbyterian Church, Spencer House, and the former Annesley Street synagogue.
- DfI official records for Grand Central Station rail-service commencement, BRT2 next steps, BRT2 professional-services award, Crumlin Road Gaol cottages EOI, and Cuff's Bar and Grill opening at the Gaol.
- DfC records for 308-312 Shankill Road development brief, Riddel's Warehouse conservation-work status during EHOD 2025, and St Joseph's Sailortown 2017 holding-works support.
- Belfast City Council records for 2 Royal Avenue ground-floor reuse EOI, historic-area SPG masterplans, and the Mercy College SEN building planning application advertisement.

## Important Caveats

- HARNI pages document heritage-risk or safe-status records. They are not construction records unless the narrative directly states a repair or restoration milestone.
- BCC current planning applications are live pages. The Mercy College entry should be reconciled with the Planning Portal before ingestion.
- BRT2 is a multi-council corridor project. Any Belfast atlas display should either clip to Belfast corridors or clearly label the geography as multi-corridor approximate.
- DfC/DfI Crown copyright material is generally reusable under OGL unless otherwise stated, but logos, images, third-party rights, and mapping are excluded.
- Belfast City Council pages are council copyright with restricted redistribution terms. Keep factual metadata and URLs only.

## Duplicate Rejects

Rejected as duplicates or near-duplicates already present in the existing manual drop:

- Queen's Seamus Heaney Centre opening.
- Sandy Row Arts and Digital Hub official opening.
- Cathedral Gardens transformation start.
- St Mary's CBS sports hall approval.
- Saltwater Square / Reflections public-art phase at Grand Central Station.
- Templemore Baths HARNI safe/restored status.
- 2-4 Bruce Street and 22-24 Berry Street current application advertisements.

## Follow-up Checks

- Reconcile Mercy College, BRT2, and 308-312 Shankill Road against Planning Portal or procurement documents if a later ingestion round needs exact red-line geometry.
- Consider a separate HARNI import path with status/review-date fields, because HARNI records mix original entry dates, current status fields, and narrative review years.
- For Riddel's Warehouse, find a direct Hearth Historic Buildings Trust or planning/consent source before representing any conservation works as started or completed.
