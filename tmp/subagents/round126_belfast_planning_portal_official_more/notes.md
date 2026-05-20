# Round126 Belfast planning/committee official candidates

Created: 2026-05-19

## Scope

This scratch pack adds 40 Belfast architecture-related candidates from official Belfast Planning Committee pages/reports and Planning Portal-style public-register references, dated within 2008-01-01 through 2026-05-19. The pack is intentionally conservative: it records planning, committee, site-visit, report, deferral, approval/recommendation, or application milestones only. It does not claim construction, completion, opening, occupation, delivered homes/beds, jobs, visitor activity, or causal effects.

## Duplicate handling

Excluded visible round123/124/125 duplicates, especially the 2025/2026 Planning Portal applications, 39 Corporation Street PBMSA, 14 Dublin Road PBMSA, Queen's ECIT, Fanum/Norwood, round124 appeals, and round125 civic/public-realm completions. Some older references may exist elsewhere in the broader repo; this task only required avoiding round123/124/125 Belfast packs.

## Geometry

All candidates include latitude/longitude inside Belfast. Clear-address records use approximate address/site points. Records whose agenda snippets did not preserve a full address are marked `confidence: inferred` and have coarse geometry caveats; they should be reconciled to the NI Planning Portal polygon before production import.

## Recommended next pass

1. Query the NI Planning Portal for each `source_record_id` and replace coarse points with portal polygons/centroids.
2. Split linked F/LBC/DCA/RM references where production events need separate consent claims.
3. Drop inferred/coarse records if the official portal record cannot be matched unambiguously.
