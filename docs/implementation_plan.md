# CivicReplay Pivot Plan

## 1. Current Repo Summary
- The app is currently a Belfast 2016-2036 replay plus simulation studio, not yet an open-source city-change atlas.
- Runtime is a custom Node HTTP server in [server.js](C:/Users/ayush/dev/Bims-5/server.js), serving static files plus APIs for manifests, layers, events, Gemini helpers, building validation, simulation, PDF export, and Solana proof metadata.
- Frontend is a large vanilla Mapbox dashboard in [web/index.html](C:/Users/ayush/dev/Bims-5/web/index.html), [web/dashboard.js](C:/Users/ayush/dev/Bims-5/web/dashboard.js), and [web/styles.css](C:/Users/ayush/dev/Bims-5/web/styles.css), with historical mode, future simulation mode, branch tools, traffic sim, Solana integrity UI, and export modals.
- Historical replay assets are useful: `web/data/mode-a/summary.json`, grid GeoJSON files, event catalog, source inventory, provenance manifest, and 2026 Belfast layers.
- Current event catalog has about 29k events, mostly OSM-derived. This is useful as raw evidence, but too noisy to be the main planner-facing changelog without curation.
- Simulation stack is heavy and credibility-risky: [lib/scenario-studio.js](C:/Users/ayush/dev/Bims-5/lib/scenario-studio.js), [web/impact-predictor.js](C:/Users/ayush/dev/Bims-5/web/impact-predictor.js), [web/traffic-sim.js](C:/Users/ayush/dev/Bims-5/web/traffic-sim.js), [web/transit-engine.js](C:/Users/ayush/dev/Bims-5/web/transit-engine.js), forecast artifacts, transformer artifacts, and branch comparison flows.
- Docs already support the pivot, especially [docs/mvp_spec.md](C:/Users/ayush/dev/Bims-5/docs/mvp_spec.md) and [docs/red_team.md](C:/Users/ayush/dev/Bims-5/docs/red_team.md), currently untracked.
- Verification currently passes: `npm run verify` and `python -m unittest discover tests`.
- Risk notes from inspection: `.env` is tracked, Solana is a production dependency, Mapbox token/style are core runtime assumptions, and Mapbox attribution is hidden in CSS.

## 2. Product Decision
- Rename the product to **CivicReplay**.
- Public subtitle for first demo: **Belfast Change Atlas**.
- Positioning: “What changed, where, when, and what evidence supports it.”
- Product principle: **a city changelog, not a city oracle**.
- First shipped demo should remain Belfast because the data corpus is already assembled; architecture must support UK/US city adapters from day one.

## 3. Keep, Delete, Rename
**Keep**
- Static-first local server pattern, but simplify it.
- Belfast historical data as first demo.
- Source inventory/provenance mindset from `config/source_inventory.json`, `manifests/provenance_manifest.json`, and docs.
- ETL concepts from [scripts/index_sources.py](C:/Users/ayush/dev/Bims-5/scripts/index_sources.py), [scripts/spatial_replay_etl.py](C:/Users/ayush/dev/Bims-5/scripts/spatial_replay_etl.py), and [schemas/replay_spatial_model.sql](C:/Users/ayush/dev/Bims-5/schemas/replay_spatial_model.sql), generalized beyond Belfast.
- Event diff, source drawer, confidence labels, timeline, and map ideas.
- Translink/transport layer building only as observed historical context, not forecast logic.

**Delete From Core MVP**
- Solana/blockchain UI, dependency, bundled browser library, and `/api/solana/config`.
- 2026-2036 simulation framing, branch tree, “Run Simulation,” future playback, and deterministic forecast claims.
- Gemini scenario workflow as a required/core feature.
- Traffic microsimulation and road comparison modal.
- Transformer forecast/capacity model as core product.
- Forecast artifacts and old verify scripts that only validate the removed simulation.
- Hardcoded Mapbox token and any required paid-map dependency.
- Tracked `.env`; rotate any real secrets if found in repo history.

**Rename**
- `Belfast 2016-2036 - Simulation Studio` -> `CivicReplay: Belfast Change Atlas`.
- `mode-a` -> `atlas` or `cities/belfast`.
- `city commits` -> `change events` or `changelog entries`.
- `scenario` -> `proposal`.
- `forecast` -> `analogue summary` or `context screen`.
- `simulation` -> `proposal lens`.
- `confidence: high/medium/low` -> `documented/corroborated/inferred/disputed` with definitions.

## 4. New Product IA
- **Home**: product explanation, demo city selector, “data is incomplete” banner, local run commands.
- **Atlas**: timeline, event feed, category filters, search, map, selected event drawer.
- **Event Detail**: what changed, where, when, source citations, confidence, limitations, related signals.
- **Compare**: compare two dates or event-before/event-after where source coverage supports it.
- **Sources & Coverage**: dataset health, gaps, licenses, retrieval dates, per-layer attribution.
- **Methodology**: confidence framework, ETL steps, OSM caveats, no-causality policy.
- **Proposal Lens**: lightweight analogue lookup for a proposed change, clearly labelled as descriptive screening.
- **Contribute**: corrections, new events, new source adapters, city requests.

## 5. New Data Model
Static artifacts should live under `public/data/cities/<city_id>/` or equivalent generated output.

**City**
- `city_id`, `name`, `country`, `region`, `timezone`, `bbox`, `center`, `default_zoom`, `available_years`, `preferred_start_year`, `admin_levels`, `source_adapters`, `license_summary`.

**Year Snapshot**
- `city_id`, `year`, `coverage_status`, `coverage_note`, `layer_refs`, `signal_snapshot_refs`, `source_ids`, `known_gaps`.

**Change Event**
- `event_id`, `city_id`, `title`, `summary`, `category`, `effective_date`, `effective_date_range`, `observed_date`, `geometry`, `area_refs`, `source_refs`, `signal_refs`, `confidence`, `confidence_reason`, `limitations`, `tags`, `is_inferred`, `corrections`.

**Source**
- `source_id`, `publisher`, `title`, `source_url`, `license`, `license_url`, `accessed_at`, `retrieved_by`, `local_path`, `checksum`, `temporal_coverage`, `spatial_coverage`, `freshness`, `completeness`, `quality_notes`.

**Provenance**
- `provenance_id`, `source_id`, `method`, `transform_script`, `parameters`, `input_checksum`, `output_checksum`, `generated_at`, `record_refs`, `limitations`.

**Change Signal**
- `signal_id`, `event_id`, `signal_type`, `metric_id`, `area_id`, `before_value`, `after_value`, `delta`, `unit`, `before_date`, `after_date`, `method`, `confidence`, `source_refs`, `caveat`.

## 6. UK/US Generalization
- Use a city adapter model, not one universal scraper.
- Structure:
```text
cities/
  belfast/
    city.yml
    sources.yml
    events.ndjson
    signals/
    layers/
    stories/
  examples/
    london/
    new-york/
```
- Each adapter emits the same contract: `city_manifest.json`, `events.ndjson`, `sources.json`, `provenance.json`, `signals.json`, `layers.json`, `coverage.json`, `proposal_analogs.json`.
- UK source anchors: ONS Open Geography, OS Open Zoomstack, Planning Data Platform, local planning portals, NISRA/OpenDataNI for Northern Ireland, local transport feeds.
- US source anchors: US Census TIGER/Line and ACS, city open-data portals, local planning/permit datasets, GTFS, EPA/local environment data.
- Official reference anchors checked: [ONS Open Geography](https://www.ons.gov.uk/methodology/geography/geographicalproducts/opengeography), [OS Open Zoomstack](https://www.ordnancesurvey.co.uk/business-government/products/open-zoomstack), [Planning Data docs](https://www.planning.data.gov.uk/docs), [London Planning Datahub](https://www.london.gov.uk/programmes-strategies/planning/digital-planning/planning-london-datahub), [US Census TIGER/Line](https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html), [NYC MapPLUTO](https://www.arcgis.com/home/item.html?id=1564ace0b4f44318ac39920737f9bd07), [Chicago building permits](https://data.cityofchicago.org/Buildings/Building-permits_Chicago_project-value/es8x-r4cb/about), [SF Pipeline Report](https://sfplanning.org/pipeline-report).

## 7. Historical Replay
- Target range is **2000-now where data exists**, not a hard-coded universal timeline.
- City config declares `preferred_start_year`; build output declares actual `available_years`.
- UI shows unavailable years as gaps, not empty certainty.
- Belfast MVP may start with 2016-now if that is the reliable source range.
- Event dates can be exact, approximate, or ranged.
- Before/after comparison only appears when both sides have sufficient source coverage.
- OSM edit timestamps must be labelled as “mapped/edited on,” not “built/opened on.”

## 8. Proposal-Impact Mode
- Replace the 10-year simulation with a **Proposal Lens**.
- Input: location, geometry, proposal type, scale, planned date/range, notes.
- Output: contextual screening cards for mobility, services, housing/development, environment, economy/demographics, utilities.
- Method: retrieve similar past events and current nearby context, then summarize observed post-period signals.
- No “will,” “forecast,” “caused,” or calibrated numeric prediction.
- Every suggestion cites analogous event IDs, source IDs, confidence, and limitations.
- Core mode must work without Gemini or secrets.
- Optional LLM summarization can be isolated behind a disabled-by-default feature flag, never used for calculations or uncited claims.

## 9. Frontend Architecture
- Rebuild as a static-first TypeScript app, preferably Vite + React for maintainability and easy OSS onboarding.
- Replace Mapbox with MapLibre and local/static styles so paid APIs are not required.
- Make event feed and source detail primary; map is supporting context, not the only way to use the product.
- Split frontend into modules: `CityShell`, `Timeline`, `EventFeed`, `AtlasMap`, `EventDrawer`, `SourceDrawer`, `CoveragePage`, `ProposalLens`, `DataDownload`.
- Persist state in URL params: `city`, `year`, `event`, `category`, `bbox`, `compare`.
- Add non-map table views for accessibility.
- Remove old branch tools, traffic controls, Solana integrity panel, forecast comparison modal, and simulation-specific state.

## 10. Backend/API Changes
- Keep a tiny local server only for static files, health, and optional convenience endpoints.
- New API style:
  - `GET /api/health`
  - `GET /api/cities`
  - `GET /api/cities/:cityId/manifest`
  - `GET /api/cities/:cityId/events`
  - `GET /api/cities/:cityId/events/:eventId`
  - `GET /api/cities/:cityId/sources/:sourceId`
  - `POST /api/cities/:cityId/proposal-impact`
- Prefer static equivalents under `/data/cities/<city_id>/...`.
- Use `{ data, meta, links }` for success and `{ error: { code, message, details } }` for errors.
- Remove core secret-dependent Gemini routes.
- Remove scenario proof/Solana endpoints.
- Add strict path safety and schema validation for all served city artifacts.

## 11. ETL Changes
- Add `scripts/build_city.py --city belfast` or equivalent orchestrator.
- Generalize hard-coded Belfast constants into city config.
- Convert current bulk OSM events into a lower-confidence evidence layer, not the primary changelog feed.
- Create a curated Belfast seed set of 30-50 high-confidence events with full provenance.
- Add schema validation for events, sources, provenance, layers, and signals.
- Build generated static outputs deterministically.
- Keep acquisition optional: core build must not download data or require API keys.
- Move large raw/build artifacts out of core repo where practical, or document why they remain.

## 12. Testing Strategy
- Replace old simulation tests with artifact/schema tests.
- Required checks:
  - JSON Schema validation for every city artifact.
  - Unit tests for event confidence rules.
  - Unit tests for source/provenance completeness.
  - Unit tests for proposal analogue retrieval.
  - ETL tests with small fixture cities.
  - Playwright smoke: load atlas, filter events, open event, view source, compare dates, run proposal lens.
  - Accessibility smoke for keyboard navigation and non-map event access.
  - Secret scan and tracked `.env` guard.
  - Link/license check for source URLs and attribution fields.
- Keep a single command: `npm run verify`.

## 13. Deployment Strategy
- Static build deploys to GitHub Pages, Netlify, Vercel static, or any static host.
- No required secrets for public demo.
- Local commands after pivot:
```powershell
npm install
npm run build:data
npm run dev
npm run verify
npm run build
```
- Publish versioned data packs in GitHub Releases.
- Add CI for install, data build, schema validation, unit tests, browser smoke, and docs link checks.
- Add a visible preview/incomplete banner on hosted demo until external planner review.

## 14. Open-Source Documentation
- Rewrite README around CivicReplay, local commands, data model, and first Belfast demo.
- Add or polish:
  - `CONTRIBUTING.md`
  - `DATA-LICENSES.md`
  - `PROVENANCE.md`
  - `METHODOLOGY.md`
  - `COVERAGE.md`
  - `SECURITY.md`
  - `CODE_OF_CONDUCT.md`
  - `CITATION.cff`
  - `ROADMAP.md`
  - GitHub issue templates for data correction, source suggestion, city adapter, and bug report.
  - PR template with provenance checklist.
- Docs must explain confidence, limitations, OSM edit-date caveats, and no-causality policy.

## 15. Branch/Session Plan
1. `codex/pivot-cleanup-core`
   - Remove Solana, simulation routes, Gemini-as-core, branch UI, traffic sim, forecast artifacts references, tracked `.env`.
   - Write scope: package/server/web shell only.

2. `codex/city-schema-contract`
   - Add city/event/source/provenance/signal schemas and examples.
   - Write scope: `schemas/`, `docs/`, sample `cities/belfast`.

3. `codex/belfast-curated-events`
   - Curate 30-50 Belfast events with source/provenance records.
   - Write scope: `cities/belfast/events`, `cities/belfast/sources`, coverage notes.

4. `codex/static-etl-builder`
   - Implement city build pipeline and validation.
   - Write scope: `scripts/`, generated `public/data/cities/belfast`.

5. `codex/frontend-atlas`
   - Build list-first CivicReplay frontend with MapLibre and source drawers.
   - Write scope: `web/` or new `src/` frontend only.

6. `codex/proposal-lens`
   - Add lightweight analogue lookup, proposal form, and cited output cards.
   - Write scope: proposal modules, tests, API/static helper.

7. `codex/tests-ci-docs`
   - Add CI, verification scripts, Playwright flows, README, contributor docs.
   - Write scope: `.github/`, `tests/`, `docs/`, root docs.

8. `codex/release-hardening`
   - Accessibility, performance, license audit, attribution, deployment config, v0.1.0 release notes.
   - Write scope: polish and release files.

## 16. Risks And Mitigation
- **Causality overclaiming**: enforce banned language and source-cited descriptive copy.
- **OSM timestamps misread as real-world dates**: separate `observed_date`, `effective_date`, and `osm_timestamp`.
- **Noisy event volume**: main feed uses curated events; raw OSM appears as supporting evidence.
- **Source licensing gaps**: block ship if source lacks license/attribution.
- **Tracked `.env`**: remove from index, check history, rotate if needed.
- **Paid API dependency**: replace Mapbox with MapLibre/static assets.
- **Frontend rewrite scope**: cut simulation first, then build the smaller atlas UI.
- **Planner credibility**: require coverage page, methodology, source drawer, and at least one external review before v0.1.
- **Data gaps before 2016**: UI shows shorter Belfast range honestly while schema supports 2000-now for other cities.
- **Proposal mode perceived as forecast**: label as “analogue/context screen” and cite similar events.

## 17. Definition Of Ship-Ready
- Local clean clone runs with documented commands.
- No Solana/blockchain in core MVP.
- No required secret, paid API, or hosted database.
- Static Belfast demo loads and works offline except optional external map tiles if explicitly documented.
- 30-50 curated Belfast events have complete provenance, source links, licenses, confidence, and limitations.
- Event pages show what changed, where, when, evidence, confidence, and affected signals.
- Proposal Lens returns cited, caveated analogue/context summaries only.
- `npm run verify` passes in CI.
- README, contribution docs, methodology, coverage, data licenses, and security docs are polished.
- Website exposes data provenance and confidence prominently.
- Accessibility smoke passes for non-map navigation.
- Release `v0.1.0` includes data pack, changelog, known gaps, and correction process.
