# Round 118 NYC DDC/HPD/Parks Pages Notes

## Method

I checked the existing `architecture_milestones_2008_2026.json` for NYC title, URL, and record-id fragments before writing candidates. The strongest new records came from official HPD, NYC Health + Hospitals, NYCEDC, NYC Parks, DCLA, and NYCHA pages.

All candidates are framed as source-stated announcements, openings, completions, ribbon-cuttings, or administrative milestones. I avoided causality, prediction, economic-impact, and neighborhood-effect claims even where source pages used that language.

## Candidate Summary

- 15 candidate records were written to `candidates.json`.
- Coverage includes affordable/supportive housing, health-facility openings and renovations, public realm, public-site renovation, a public housing community center, and a cultural facility interior opening.
- Each candidate includes a date, source URL, publisher, source record id, source type, coordinates, geometry source, confidence, limitations, and transformation method.

## Duplicate And Rejection Notes

Several official pages were rejected because they were already represented in the existing milestone file, including Pier 42, P.S. 487 / LEAD school, L10 Arts and Cultural Center, Far Rockaway Library, Broadway Library, Manhattan Pet Adoption Center, Bushwick Health Center, and Raven Hall.

Laurelton Playground was also rejected as a likely enrichment source rather than a new event because the existing file already has Parks capital tracker records for Laurelton skate elements/reconstruction, and the specific press-release page was not fully accessible.

Arverne East Nature Preserve remains a promising future candidate, but I did not include it because the full official NYC Parks announcement page was not accessible in this pass. Secondary pages were not used as source evidence.

## Geometry Caveats

Coordinates are approximate manual geocodes from official source-stated addresses, sites, parks, or street segments. Records with weaker geometry are explicitly marked as `approximate_site`, `street_segment`, `public_housing_campus`, or `park_feature`.

Before ingesting into the production architecture milestones file, run official NYC geocoding or PLUTO/BBL matching, especially for Surf Vets Place, Mill Brook Terrace, Mariner's Harbor Community Center, and park-feature points.

## Recommended Follow-Up

- Validate candidate coordinates with NYC Geosupport, PLUTO, or official agency facility datasets.
- Decide whether H+H clinic/interior openings should be first-class architecture milestones or a lower-level facility-renovation subtype.
- If adding candidates to the main dataset, preserve source announcement dates separately from construction completion, lease-up, opening, and ribbon-cutting dates when the source states multiple dates.
- Review NYC, NYCEDC, and H+H terms before reusing source prose or images; the candidate file uses factual metadata and short summaries only.
