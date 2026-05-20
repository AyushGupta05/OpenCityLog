# Round118 NYC Zoning Text More Notes

## Scope

This drop adds official NYC planning/zoning administrative candidates for 2008-01-01 through 2026-05-19. It is framed as zoning/planning evidence only, not construction, completion, occupancy, delivered units, or outcome evidence.

## Method

- Screened the existing `architecture_milestones_2008_2026.json` NYC records by title, source URL, source record ID, ZR action ID, and ZAP project ID.
- Queried official Zoning Resolution Recently Adopted pages for adopted text dates and action IDs.
- Queried NYC Open Data ZAP Project Data (`hgx4-8ukb`) by ULURP/action number for project IDs, actions, CEQR numbers, borough/community district context, and project-purpose text.
- Queried NYC Open Data ZAP BBL (`2iga-a6mk`) by project ID, then joined BBLs to current PLUTO/MapPLUTO (`64uk-42ks`) latitude/longitude for representative coordinates.
- Used the ZAP project detail API for the Seaside Park and Community Arts Center record because it exposed a later completed public-status milestone than the Open Data row visible in this pass.

## Candidate Count

- `candidates.json` contains 15 candidate records.
- Priority records include recent gaps (`217-14 24th Avenue`, `Ikos Senior Living`, `Seaside Park and Community Arts Center`) and older named rezonings with official ZR/ZAP identifiers plus usable BBL/PLUTO coordinate support.

## Rejections

Rejected records are retained in `candidates.json` when they were near-duplicates of existing ZAP records, lacked a safe geometry join in this pass, or did not meet the architecture/civic/housing priority.

## Caveats

- PLUTO coordinates are representative navigation points, not zoning amendment boundaries or project footprints.
- Current PLUTO may not match historical lot configuration at the adoption date.
- ZAP project briefs describe administrative purpose and requested/facilitating actions; they are not evidence that construction happened.
- Broad neighborhood plans such as Resilient Edgemere should use official plan/urban-renewal geometry instead of a point estimate.
