# Round 125 NYC Civic Capital Projects Scratch Notes

Created: 2026-05-19

Scope: NYC architecture-related observed-change candidates from official civic capital project sources, excluding DOB, HPD, Parks tracker, LPC, SCA, and PDC source packs. This scratch pass favors DDC, public library systems, DCLA, NYCEDC/H+H, and resilience/public-building milestone pages.

Output files:

- `candidates.json`: 35 candidate records with `city_id`, stable `candidate_id`, source metadata, date field notes, approximate point geometry, attribution, confidence, and non-causal limitations.
- `source_audit.json`: audit notes for the official source families used.
- `notes.md`: this file.

Discovery method:

- Reviewed prior scratch directories enough to avoid editing or replacing other agents' outputs.
- Used official NYC/DDC 2024, 2025, and 2026 press indexes and selected linked detail pages.
- Used official library/H+H/EDC pages where found through official linked pages or targeted search.
- Kept records as candidate-review scratch only. Some records use an official index URL rather than a detail URL when the index had the explicit date and milestone but the detail page was not fetched in this pass.

Important caveats:

- Opening, reopening, completion, ribbon-cutting, kickoff, construction-start, approval, and topping-out dates are source-reported milestones. They do not imply usage, occupancy, access equity, service quality, public-safety, health, resilience performance, economic outcomes, neighborhood effects, or causation.
- Groundbreakings and construction starts are not completions.
- Linear, coastal, plaza, and infrastructure projects use representative points only. Replace with official project geometries before atlas import.
- Branch/facility coordinates are approximate address or named-site points, suitable for duplicate review and candidate triage but not final survey geometry.
- Some DDC index entries link to external official library pages; detail URLs should be resolved and stored before promotion.

Duplicate-risk notes:

- This pass intentionally avoids using DOB, HPD, Parks tracker, LPC, SCA, and PDC as source packs.
- DDC/library public-building candidates may overlap semantically with older broad NYC architecture scratch files. Before production ingestion, dedupe by normalized source URL, facility name, milestone date, address, and candidate title.
- Records with weaker geometry precision include some resilience/public-realm area points and DDC index-only records; these should be refined from detail pages or project geometry before import.
