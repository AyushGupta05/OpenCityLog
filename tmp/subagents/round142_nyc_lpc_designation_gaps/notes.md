# Round 142 NYC LPC designation gaps

Generated: 2026-05-19T00:00:00Z

Scope: official NYC Landmarks Preservation Commission Open Data records with designation dates from 2008-01-01 through 2026-05-19 that are not already represented as final designation events in the current manual architecture corpus.

Duplicate screening:

- LP numbers were normalized to LP-00000 form before comparison.
- Manual corpus events that only say calendared/designation consideration do not suppress later final designation candidates.
- Existing final designation LP numbers, source_record_id values, and title/date keys suppress candidates.

Source priority:

- Historic Districts (`skyk-mpzq`) is preferred for historic-district polygons.
- Designated and Calendared Buildings and Sites (`ncre-qhxs`) is used for interiors/scenic landmarks and for historic districts missing from `skyk-mpzq` at retrieval time.
- Individual Landmark Sites (`buis-pvji`) is used for individual-landmark site polygons.

Counts:

- Candidates: 27
- Historic District: 20
- Interior Landmark: 6
- Scenic Landmark: 0
- Individual Landmark: 1

Caveat: these candidates document LPC legal/protective designation status only. They do not document physical works, restoration, opening, construction, occupancy, preservation outcome, or causal impact.
