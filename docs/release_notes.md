# Release Notes

## Unreleased - 2026-05-30

### Verification And Metadata

- Package and citation metadata now align with the 0.2.0 15-lens atlas release.
- Python verification docs standardize on `python3 -m unittest discover tests`.
- Browser-smoke docs include the matching `PORT=...` and `URL=...` override
  needed when the default local port is already in use.
- The current generated coverage report is refreshed from the committed atlas
  artifacts and should be treated as the source-backed coverage snapshot for
  this branch, not a claim of complete city history.

## 0.2.0 15-Lens Atlas Contract - 2026-05-25

### Product Scope

- Belfast, Greater London, and NYC now expose the shared 15-lens atlas contract
  across their official city scopes.
- The desktop atlas uses the 15 lenses as the primary map/list switcher and
  keeps evidence, confidence, licences, caveats, and exports attached to
  clickable records.
- Proposal-style future workflow affordances are not part of the launched
  atlas UI.

### Data Scope

- New generated manifests:
  - `web/data/city-atlas/lens-manifest.json`
  - `web/data/city-atlas/cities/<city_id>/lens_manifest.json`
  - `web/data/city-atlas/cities/<city_id>/lens_year_coverage.json`
- Lens manifests record official boundary evidence, compatible/review-required
  source counts, compatible/review-required event counts, freshness, caveats,
  methodology anchors, and export capability flags.
- Lens-year coverage artifacts enforce the mandatory 15 lenses across every
  year from 2007 through 2026.
- Zero-event lens-years are labelled as source-backed coverage context with
  `event_count: 0`, and are excluded from headline record counts.
- Event indexes include source-backed `affected_area.label` facets so area,
  borough, ward, district, street, and named-place filters can update map,
  list, timeline, compare counts, and filtered exports without inventing data.
- `docs/15_lens_source_audit.md` documents the source families and licence
  caveats used to support every lens in all launched cities.

### Verification

- `npm run build:lens-contract`
- `npm run verify:lens-contract`
- `python3 -m unittest tests.test_15_lens_contract`

### Known Limits

- The manifests confirm source-backed lens coverage, not complete city history.
- Sparse geographies remain sparse; no placeholder records are generated.
- Coverage-context surfaces are not evidence of a city-change event or measured
  condition.
- Review-required source terms remain visible and should be resolved before
  formal redistribution.

## 0.1.0 Public Readiness - 2026-05-09

This release prepares Bims City Atlas for public review as an open-source city
changelog and evidence atlas.

### Product Scope

- Static-first Open Citylog frontend in `web/index.html`, `web/atlas.js`, and
  `web/atlas.css`.
- City selector for London, New York City, and Belfast.
- Source-backed changelog, map, timeline, evidence brief, source panels, and
  exportable report payloads.
- A then-current lightweight analogue path for review context; the 0.2.0 atlas
  UI no longer launches future proposal workflows.
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
- `python3 -m unittest discover tests`
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
