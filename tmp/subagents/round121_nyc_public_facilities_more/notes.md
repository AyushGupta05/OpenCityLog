# round121_nyc_public_facilities_more

Generated: 2026-05-19

## Scope

This is a smaller provenance-clean pack of official NYC public/institutional architecture and city-change milestones from 2008-01-01 through 2026-05-19. It prioritizes official pages that were not already present in the manual architecture corpus or prior `tmp/subagents` packs.

Included records:

- 2 official public library milestones from Queens Public Library and Brooklyn Public Library.
- 7 official NYC Health + Hospitals facility, suite, or room milestones.

No candidate makes usage, outcome, access, health, traffic, or causal claims. Hospital records are treated as physical/interior facility changes only.

## Method

1. Searched official NYC and public-institution source pages for libraries, DDC-linked library work, and NYC Health + Hospitals facility milestones.
2. Screened exact titles and distinctive facility terms against:
   - `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json`
   - existing `tmp/subagents` NYC candidate packs
3. Kept only records with an official milestone page, a clear date, a public facility location, and enough provenance for later reviewer challenge.
4. Used official facility address context plus manual geocoding for point geometry. These are approximate address/campus points, not parcel, building-footprint, suite, or room geometries.

## Duplicate and rejection notes

Rejected as already present or already proposed:

- Ryder Library reopening after renovation.
- Leonard Library reopening after renovation closure.
- Del Valle Square upgrade completion.
- Rockaway Park firehouse groundbreaking.
- Elmhurst Hospital neurology clinic opening after renovation.
- Bellevue Hospital pathology grossing room renovation, because an exact official source page was not confirmed quickly enough for this partial pack.

Rejected as not a new physical milestone:

- Queens Public Library Central Library 60th anniversary page.

## Caveats for ingestion

- Groundbreaking records are not completion records.
- Press release dates are administrative publication/milestone dates; detailed construction start/completion dates may require DDC, DOB, capital-project, or agency project records.
- Health + Hospitals entries should remain facility-change records. Do not infer health outcomes, service access, patient volume, wait times, or neighborhood impact.
- Coordinates should be replaced by authoritative facility, parcel, or project geometry if a later adapter has it.
- License/terms notes are conservative: use factual metadata with attribution, and do not reuse page text or images without reviewing the publisher terms.

## Files

- `candidates.json` includes `source_audits`, `candidates`, and `rejected`.
- `source_audit.json` repeats the source-family audits as a standalone artifact for quick review.
