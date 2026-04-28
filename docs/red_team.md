I'll explore the repo briefly to ground the architecture-risk section, then deliver the red-team review.

The repo grounding is enough. Marking the chapter and writing the review now.

# Red-team review: Bims-5 → urban changelog

Grounded in this repo: Node + Python build pipeline, vanilla `web/` UI, an existing layer-year manifest at [api/replay-manifest.json](api/replay-manifest.json), a strong [config/source_inventory.json](config/source_inventory.json), and a sprawling simulation surface (transformer forecast, traffic-sim, scenario studio, Solana commit). I'll be strict.

---

## 1. Strongest version of the product vision

One sentence: **a timestamped, citation-backed record of how the built environment of a place actually changed, year by year, with every change traceable to a primary source.**

It is `git log` for a city. Each entry has: what changed, when (effective date, not edit date), where (geometry), evidence (URL, capture date, license), and confidence. The "proposal-impact" mode is *secondary* — a retrieval that returns hand-curated historical analogues with their actual post-period indicator changes. Never a model output. Never a forecast.

The killer feature is the **reverse lookup**: a planner pastes a proposal description and receives "in this city, three similar things happened in 2009/2014/2019; here's what the surroundings looked like before, what changed in the 5 years after, and the open primary sources for both." Useful, defensible, hard to fake.

Drop the words "atlas", "simulation", "10-year", "predict" from the entire vocabulary — code paths, file names, copy.

---

## 2. Biggest ways this becomes bullshit

- **Cherry-picked analogues.** Without a published similarity metric and the *full* candidate set, "we found 3 analogues" is confirmation bias dressed up.
- **Causation laundering.** "After the bypass opened, NO2 fell 12%." NO2 was already trending down across the UK. Without counterfactual or cohort comparison, you mislead planners while pretending not to.
- **OSM-as-truth fallacy.** OSM building footprints appearing in year *Y* mean a contributor *edited* them in *Y*, not that the building was built in *Y*. ohsome time-series is "edits to OSM," not "changes to the city." This is the single biggest credibility trap and it's already lurking in your source inventory.
- **Aggregation hides the unit of action.** Citywide trends are dashboards. Planners need parcels and corridors. If your only view is LSOA/SOA/citywide, you've replicated NOMIS.
- **Open-source theatre.** A public site + GitHub repo ≠ open source as planners understand it. They expect a stable schema, versioned data releases, a citation format, and a corrections process.
- **Effective-date rot.** If half your events say "approximately 2020", it's a vibe, not a changelog.
- **The map-is-the-product trap.** A pretty Mapbox replay screenshots well and is useless without a tabular, queryable, exportable view. Fly-throughs are marketing, not infra.
- **Confidence-score security blanket.** Slapping "confidence: medium" on a guess doesn't make it not a guess. If you cannot articulate what would change a confidence rating, the rating is decorative.

---

## 3. Features I must cut (specific to this repo)

Cut without ceremony:

- **Solana scenario commit** — [web/solana-scenario-commit.js](web/solana-scenario-commit.js), [web/solana-web3.min.js](web/solana-web3.min.js), `@solana/web3.js` in [package.json](package.json). Civic-tech serious people will close the tab the moment they see a blockchain dependency.
- **Transformer forecast** — [scripts/build_transformer_model.py](scripts/build_transformer_model.py), [scripts/train_forecast_model.py](scripts/train_forecast_model.py), [web/data/mode-a/transformer_capacity_forecast.json](web/data/mode-a/transformer_capacity_forecast.json), [scripts/verify-transformer-model.js](scripts/verify-transformer-model.js). The data volume can't justify a transformer; you'll defend a toy model at every demo.
- **Traffic simulation** — [web/traffic-sim.js](web/traffic-sim.js), [scripts/dashboard_traffic_sim_smoke.js](scripts/dashboard_traffic_sim_smoke.js).
- **Scenario studio / proof** — [lib/scenario-studio.js](lib/scenario-studio.js), [lib/scenario-proof.js](lib/scenario-proof.js).
- **Impact predictor as a model** — [web/impact-predictor.js](web/impact-predictor.js). Replace with "impact lookup" over hand-curated events.
- **Lens / particle / fly-through demos** — [scripts/dashboard_lens_*](scripts/), [scripts/dashboard_lens_particles_smoke.js](scripts/dashboard_lens_particles_smoke.js). Demo-glam, not planner tools.
- **2036 simulation feasibility draft** — [.sisyphus/drafts/2036-simulation-feasibility.md](.sisyphus/drafts/2036-simulation-feasibility.md). Burn it.
- **Trend baseline branch** — [scripts/build_trend_baseline_branch.js](scripts/build_trend_baseline_branch.js) and verifier. Replace with explicit, documented per-indicator trend with intervals, or remove from MVP.
- **All `dashboard_*_smoke.js` scripts that test cut features.** Delete with the features they test. Keep [scripts/verify-manifest.js](scripts/verify-manifest.js) as the kernel of the new validation pipeline.

What you keep: the source-inventory and provenance discipline, the OSM 2026 layer set, the 2016 NDVI/NDBI rasters, NI air quality CSV, NISRA census 2021, Belfast Bikes snapshots, and the *idea* of a manifest contract.

---

## 4. Trust / provenance rules required for planner buy-in

Make these schema-enforced, not aspirational. Encode in `PROVENANCE.md` and a JSON Schema:

1. Every event entry carries: `source_url`, `source_name`, `license`, `accessed_at`, `effective_date` or `effective_date_range{min,max}`, `geometry_source`, `geometry_capture_date`, `confidence ∈ {documented, corroborated, inferred, disputed}`, `citation_count ≥ 1`.
2. **Two-source rule** for `corroborated`: two *independent* organizations. A council press release + a council page = one source.
3. **Inferred** events are visually distinct (dashed outline, italic label) and *never* aggregate into headline percentages.
4. `osm_observed_at` is a separate field from `effective_date`. The UI must surface this distinction on every OSM-derived view.
5. Versioned data releases (`vYYYY.MM`) with a meta-changelog of corrections. Old versions are preserved with strikethrough; corrections are append-only.
6. Attribution block on every map and every shareable artifact, listing per-layer license.
7. "Report a correction" button on every entry → templated GitHub issue with event ID prefilled.
8. Every numeric claim hyperlinks to the row of source data that produced it. No floating numbers.
9. Modeled or interpolated data renders in a different visual register (grey, hatched), labeled inline as "modeled" — not in a footnote.
10. Per-event diff view: before-state and after-state geometry/attributes side-by-side, plus indicator deltas with date ranges.

---

## 5. Best first pilot geography

**Belfast.** Reasons:

- The data corpus is *already mostly assembled and inventoried* in [config/source_inventory.json](config/source_inventory.json). Picking Manchester or Boston means restarting source acquisition.
- Single planning authority (Belfast CC + DfI for roads). Small enough to be tractable, large enough to be interesting.
- Open Government Licence covers most public-sector data. NI Planning Portal is a known finite resource.
- Real, charged, contested change events with primary documentation: Glider BRT (2018), Belfast Streets Ahead, Tribeca/Castle Buildings, Sirocco Quays, Belfast Transport Hub.
- Visible from space, debated in council — the conditions for a credible changelog.

**Don't pick London.** Too big, too fragmented, well-served by Mapping for Change / CDRC / GLA.

**Mitigate parochialism:** add one US comparator (Pittsburgh or Bristol UK) only after Belfast is stable and externally validated by ≥1 actual practising planner.

---

## 6. Minimum data for a credible MVP

Per pilot:

1. **Boundaries** at two scales (LA + small-area, e.g., SOA / Census Block Group), versioned.
2. **Land cover or building footprints** at ≥3 dated points 2010–now with documented capture date. ohsome with explicit edits-vs-changes labelling.
3. **Planning decisions** — 50 substantive approvals with effective date, geometry, applicant, status. Not 5,000 with ambiguous metadata.
4. **Transit network deltas** from ≥2 dated GTFS snapshots — route additions/removals with effective dates.
5. **Air quality** at ≥3 stations with ≥8 years monthly data.
6. **Population / demographics** at small-area for ≥2 census points.
7. **A hand-curated set of 30–50 verified change events with full provenance.** *This is the actual product, not a viewer over scraped data.*
8. **`LICENSES.csv`** mapping `source_id → license → attribution_text`.

Cap MVP scope: 30–50 hand-curated events + 5–10 indicator series. Resist ingesting "everything available."

---

## 7. Architecture risks in converting an existing simulation repo

Specific to *this* codebase:

1. **The manifest is layer-year shaped, not event shaped.** [api/replay-manifest.json](api/replay-manifest.json) indexes by `(year, layerId)`. The new model is `event_id → {effective_date, geometry, sources[], indicators_before, indicators_after}`. Don't extend the existing manifest — author a new one and run both during migration.
2. **`web/` is vanilla HTML/JS with 20+ smoke scripts.** Brittle. The changelog is *list-first* (feed view, tabular view, event detail), not map-first. Rebuild the frontend or you'll spend months ripping out simulation chrome. Recommend Astro or SvelteKit; MDX for event detail pages.
3. **Mixed Python + Node build.** Doubles CI cost and onboarding friction. Keep Python for ETL (rasters, geopandas), Node only for frontend.
4. **Solana dep in [package.json](package.json:22)** drags into transitive deps until removed. First commit of pivot.
5. **Forecast/transformer artifacts pre-committed under `web/data/mode-a/`.** Audit every reference before deletion — a stale reference will silently fall back to "no data" and nobody notices.
6. **`data/2016/` contains files dated 2018 and 2024** (NDVI 2018 file under 2016/, per the source inventory's own note). Encoding year in the *path* is a lie. Migrate to `data/<source_id>/<file>` with year only in metadata.
7. **Build artifacts committed** ([build/spatial_replay/catalog.json](build/spatial_replay/catalog.json), [build/spatial_replay/timeline_manifest.json](build/spatial_replay/timeline_manifest.json), `web/data/mode-a/*`). Move to GitHub Releases or a CDN.
8. **No data-layer tests.** UI smoke tests exist; manifest schema validation does not. MVP needs JSON-Schema validation of every event before publish, run in CI.
9. **`.env` in the repo root** (visible in the directory listing). Verify it's gitignored *and* check git history for committed secrets; rotate if any leaked.
10. **Lots of "verify-*" scripts assume the old artifacts.** Don't keep them limping; cut and rewrite a single `verify-events.js` against the new schema.

---

## 8. Exact wording to avoid overclaiming causality

**Use:**
- "Between [date] and [date], in this area, [X changed by Y]. [Event] occurred during the same period. We do not claim causation."
- "[N] historical examples in this dataset resemble [proposed project] by the criteria below. Post-period changes in those areas are summarised. Descriptive, not predictive."
- "Source: [name], retrieved [date], licensed [license]."
- "Inferred from [source] — not directly observed."
- "Effective date approximate (range: [start]–[end])."
- "OSM edit date: [date]. The change in the world may have occurred earlier."
- "Confidence: documented / corroborated / inferred / disputed. See methodology."
- "This dataset is incomplete. Coverage gaps are listed in /coverage."

**Ban:**
- "predicts", "forecasts", "will increase/decrease", "expected to"
- "caused", "led to", "resulted in", "drove"
- "simulation", "scenario", "what-if" (sim words; you're cutting sims)
- "AI-powered insights", "smart analysis"
- "proven", "verified" (unless externally audited with citation)
- single-number summaries without uncertainty range

**Acceptable taglines:**
- "What changed in Belfast, when, and where the evidence is."
- "A citation-backed log of how the built environment of [city] actually changed."

**Reject:** "Predict the impact of your project." "Powered by AI." Anything ending in "intelligence."

---

## 9. Planner credibility checklist

A practising planner will silently check these before trusting any output:

- [ ] One click from any number on the page to its primary source.
- [ ] Data license shown next to every dataset.
- [ ] Methodology page naming every transformation step.
- [ ] Coverage page explicitly listing what is *missing*.
- [ ] Dated, citable releases (e.g., "v2026.04 retrieved 2026-05-01").
- [ ] Public known-issues page.
- [ ] Public corrections process *and* a log of past corrections.
- [ ] Identifiable team — real names, affiliations, contact email.
- [ ] "Modeled" data visually distinct from "observed" in every view.
- [ ] Written confidence framework with criteria, not just labels.
- [ ] Underlying data downloadable, not just viewable.
- [ ] Stable API or schema, not only a website.
- [ ] Any disagreement with ONS/NISRA/council figures is explained.
- [ ] At least one peer-reviewed citation, planner endorsement, or partnership.
- [ ] OSM caveat ("edits ≠ changes") visible on every OSM-derived view.

If you cannot tick 12+ at MVP, planners revert to ONS / NOMIS / Spatial NI.

---

## 10. Ship-ready open-source checklist

- [ ] LICENSE — split: code (MIT or Apache-2.0) and data (CC-BY-4.0 or ODbL). State both.
- [ ] DATA-LICENSES.md — per-source, with original license text.
- [ ] CONTRIBUTING.md focused on *data corrections*, not just code.
- [ ] CODE_OF_CONDUCT.md, SECURITY.md.
- [ ] CITATION.cff so academics can cite the dataset.
- [ ] Tagged releases (`v0.1.0`) with per-dataset release notes.
- [ ] Reproducible build: `npm run build` from a clean clone reproduces the published artifacts.
- [ ] CI: lint, test, JSON-Schema-validate every event entry; fail PRs that don't validate.
- [ ] Issue templates: "Report a data correction", "Suggest a source", "Request a city".
- [ ] PR template with provenance checklist.
- [ ] `/docs` site: methodology, schema, coverage, glossary.
- [ ] Public roadmap (GitHub Project board).
- [ ] Hosted demo with explicit "preview / incomplete" banner.
- [ ] GitHub topics: `civic-tech`, `urban-planning`, `open-data`, `geospatial`.
- [ ] Real human contact + email + (optional) Matrix/Discord.
- [ ] Privacy review: redact individual planning applicants where applicable.
- [ ] Accessibility: tabular view, keyboard nav, alt text, non-map view of every page.
- [ ] Performance: <3s on 3G; no heavy WebGL on landing page.
- [ ] Privacy-respecting analytics (Plausible/Umami), not GA.
- [ ] At least one external user has used it and given written feedback before launch.

---

## 11. Final recommendation

**Pivot further, then build.** The direction is right but the heart of the product is currently underspecified.

Sequence:

1. **Week 1 — strip.** Remove simulation, transformer, Solana, scenario, forecast, lens-glam surface. Ruthless. Keep source inventory, OSM layers, rasters, air quality, census, bikes, manifest concept.
2. **Weeks 2–3 — curate.** Lock the event schema. Hand-curate 30–50 Belfast events with full provenance. *This is the moat. Do this before any UI.*
3. **Week 4 — list-first frontend.** Tabular and feed views primary; map secondary. Astro or SvelteKit.
4. **Week 5 — analogue lookup** as retrieval over hand-curated events, not a model.
5. **Week 6 — one Belfast CC planner or QUB Planning academic uses it.** Iterate from their notes.

**Stop signal:** if after a month of curation you cannot find 30 well-evidenced Belfast change events, the product is not viable in this framing. Pivot to a *tooling* play — sell the schema, the linter, the manifest format itself to planning departments — rather than building a destination site.

If you skip step 2 and ship a viewer over auto-ingested OSM diffs, the project fails the planner credibility checklist on day one and becomes another OSM time-lapse demo. That is the most likely failure mode given the current repo.

Now saving project memory so this framing survives future sessions.

Review delivered above; project pivot saved to memory so future sessions know to treat sim/forecast/Solana code as cut targets, not extension points.