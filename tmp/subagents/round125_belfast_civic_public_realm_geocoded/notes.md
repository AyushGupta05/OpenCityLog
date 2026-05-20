# Round 125 Belfast Civic/Public Realm Geocoded Notes

Access date for all candidate records: 2026-05-19.

This scratch pass produced 40 architecture-related observed-change candidates for Belfast. The set is intentionally candidate-grade: it favours official public sources and preserves limitations rather than promoting the records as production-ready events.

## Source Coverage

- Belfast City Council: capital programme, leisure transformation, heritage restoration, Cathedral Gardens, Adelaide Street, Urban Villages and Planning Committee records.
- Department for Infrastructure: Belfast Grand Central Station, Saltwater Square and Colin Town Centre Transport Hub milestones.
- Queen's University Belfast: estates completed-projects list and selected official news releases for exact opening dates.
- Public geocoding: used only for approximate candidate points where official pages did not expose coordinates in accessible text.

## Candidate Mix

- Public realm / civic space / transport: Grand Central Station, Saltwater Square, Colin Hub, Adelaide Street, Cathedral Gardens.
- Council/community assets: Urban Villages parks, hubs and listed-building transformation candidates.
- Leisure/heritage facilities: Templemore Baths, Lisnasharragh, Brook, Andersonstown, Avoniel and Olympia.
- University/education/health-adjacent estate: QUB Lanyon conservation, School of Biological Sciences, Main Site Tower, Computer Science, Elms, MBC, Ashby, One Elmwood, Riddel Hall, MediaLab, Seamus Heaney Centre, Reboot, Willow Walk, Grant House, Nursing and Midwifery, Sonic Arts.
- Planning committee decisions: ECIT extensions, 14 Dublin Road PBMSA, 39 Corporation Street PBMSA and Fanum/Norwood Great Victoria Street redevelopment candidate.

## Geometry Caveats

Most official pages did not provide explicit coordinates. Points are rounded approximate coordinates derived from public address/site geocoding and should be treated as candidate markers only. They are not parcel polygons, not official planning GIS points and not evidence of construction dates.

Before production ingest:

- Replace approximate points with official Belfast/NI Planning Portal coordinates, council asset coordinates or project GIS where available.
- Split multi-site records such as Elms BT1/BT2 and Queen's MediaLab if the frontend needs one geometry per site.
- Run a point-in-Belfast-boundary verifier.
- Keep internal refurbishments visually distinct from new-build or public-realm changes.

## Date Caveats

The dataset separates exact dates, month-level ranges and broad candidate ranges.

- `effective_date` is used only where the source gives a specific milestone date or the source publication date directly documents the milestone.
- `effective_date_range` is used where the source gives only a month, year or broad "completed since 2019" status.
- Planning committee records are administrative decisions only. They must not be displayed as built, open or occupied without later implementation evidence.

## License / Terms Caveats

- DfI pages are relatively clean for reuse because DfI states Crown copyright material is reusable under the Open Government Licence v3.0, subject to exclusions.
- Belfast City Council and Queen's University Belfast pages should be treated as citation sources until reuse terms are reviewed. The scratch files extract short factual candidate metadata and preserve source links.
- Public geocoding is marked as OSM/Nominatim-style candidate geometry under ODbL caveats. If retained, future work should record exact OSM object IDs and Nominatim response metadata.

## Suggested Next Checks

1. Query NI Planning Portal for each planning application reference to capture decision notice, official address, case date fields and any available map coordinates.
2. Search BCC committee PDFs for the Urban Villages project names to narrow exact completion dates.
3. Look for council asset/open-data coordinates for leisure centres, parks and civic buildings.
4. Review QUB web reuse terms and, if acceptable, normalize completed-project entries into a repeatable university-estates source adapter.
5. Add a verifier that rejects candidates missing source URL, publisher, source date field, confidence, license note, limitations or geometry precision.
