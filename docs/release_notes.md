# Release Notes

## 0.1.0 Public Readiness - 2026-05-09

This release prepares Bims City Atlas for public review as an open-source city
changelog and evidence atlas.

### Product Scope

- Static-first Open Citylog frontend in `web/index.html`, `web/atlas.js`, and
  `web/atlas.css`.
- City selector for London, New York City, and Belfast.
- Source-backed changelog, map, timeline, evidence brief, source panels, and
  exportable report payloads.
- Proposal Lens for historical analogue lookup, current-context screening,
  confidence, evidence, and caveats.
- Legacy replay, forecast, branch simulation, proof-flow, and Mode A runtime
  routes remain retired or quarantined.

### Data Scope

- Generated atlas artifacts are in `web/data/city-atlas/`.
- The current city-atlas manifest verifies 3 cities and 247,426 events.
- London and NYC include broad generated source-backed records plus catalogued
  source coverage; Belfast remains the evidence-rich pilot corpus with partial
  local adapters.
- Source licences, attribution, caveats, retrieval or review dates, and
  confidence values are carried through generated source briefs.

### Verification

The release-readiness pass ran:

- `npm run verify`
- `python -m unittest discover tests`
- `npm run verify:browser` against a fresh local server
- `npm test`

### Known Limits

- The app is not a forecast, simulator, approval tool, or causal model.
- Some generated rows are administrative records, current snapshots, sampled
  public rows, or approximate geographies.
- London and NYC are not complete histories of every urban change.
- OSM-derived records distinguish mapped visibility from real-world effective
  dates.
- Any source with dataset-specific, not-specified, or review-required terms
  needs source-level licence review before formal redistribution.
