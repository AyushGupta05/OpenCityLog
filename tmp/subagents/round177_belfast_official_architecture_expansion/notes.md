# Round 177 Belfast Official Architecture Expansion

## Scope

Scratch-only candidate pack for additional Belfast architecture-related city-change evidence from official Belfast City Council public minutes and news pages. Belfast NI Planning Statistics and HED/HARNI date-bearing rows were treated as nearly exhausted by prior rounds, so this pass focuses on a small public-realm/facilities tail.

## Method

- Read the live manual architecture corpus and every prior Belfast `tmp/subagents/*/candidates.json` pack.
- Built duplicate indexes for event IDs and source-record/date keys.
- Emitted only candidates inside the 2008-01-01 to 2026-05-19 window with Belfast-envelope coordinates.
- Used committee/news source dates or explicit source-stated milestone dates.
- Kept planning/programme/status records administrative and avoided construction, completion or outcome claims unless directly stated by the source.

## Caveats

Most geometries are approximate review points for named public spaces, sites, or distributed networks. They are not parcel boundaries, surveyed asset geometries, works extents, or proof of delivery beyond the source wording.

## Headroom

Round177 intentionally emits fewer than 80 candidates because high-volume Belfast planning statistics and HED/HARNI records are already heavily mined. Remaining headroom is likely in deeper committee report PDFs, DfC Belfast Streets Ahead project pages with clearer stage dates, and official project attachments that expose better geometry.

## Output

- Candidates: tmp/subagents/round177_belfast_official_architecture_expansion/candidates.json
- Source audit: tmp/subagents/round177_belfast_official_architecture_expansion/source_audit.json
- Summary: tmp/subagents/round177_belfast_official_architecture_expansion/summary.json
- Rejected: tmp/subagents/round177_belfast_official_architecture_expansion/rejected.json
