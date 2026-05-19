# Round 121 London Official Facilities More

Created: 2026-05-19

## Scope

This partial pack adds 13 official London public/institutional architecture or city-change facility candidates from 2009 through 2026. I stopped at a smaller provenance-clean set after the status nudge rather than filling the maximum of 25.

Included source families:

- Borough libraries, community centres, halls, and cultural venues.
- Borough school and SEND school opening records.
- Official council pages and one official council magazine PDF.

Excluded source families:

- Non-official architecture press unless needed only as a search lead.
- Outcome, usage, attendance, service-quality, capacity, or causal claims.
- Records already found in the local manual architecture milestone corpus or prior London scratch packs.

## Duplicate Screen

I ran targeted `rg` checks against:

- `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json`
- `tmp/subagents` London packs from prior rounds

Accepted records had no local title/project match in those checks. Rejected records include known duplicates such as Grafton Way Building, Sight and Sound Centre, Oak Cancer Centre, Canada Water Library, Brent Cross West station, New Addington leisure and community centre, Wandsworth Town Library, Putney Library, Lee Valley Ice Centre, and Elleray Centre.

## Geometry Notes

All retained records use WGS84 approximate points manually placed from the named official facility context. They are suitable for review/navigation only and should not be promoted as surveyed building footprints. Several school/community-centre points should be checked against official address data before canonical import.

## Date Notes

Dates follow the source wording:

- Exact official opening/reopening dates are used where stated.
- Month precision is used where the source gives only a month or "opened this week" context without a separate ceremony day.
- Where a formal opening and first public/use month differ, the candidate limitations call that out.

## Files

- `candidates.json` contains `source_audits`, `candidates`, and `rejected`.
- `source_audit.json` contains the source audit list as a standalone review artifact.

## Known Gaps

This was a targeted partial pass, not an exhaustive London facilities sweep. Useful follow-up areas include official NHS estate pages beyond already-duplicated UCLH/GOSH/Royal Marsden leads, additional borough library relocation pages with exact dates, and TfL/Network Rail station-building records not already covered by the manual corpus.
