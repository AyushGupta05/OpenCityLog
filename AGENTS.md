# Codex Agent Guidance for Bims-5

Scope: this file applies to the whole repository.

## 1. Product Mission

Bims-5 is becoming an open-source urban changelog and city change atlas. It should help planners, researchers, journalists, students, and local communities answer:

- What changed in a place?
- When did it change?
- Where did it happen?
- Which public evidence supports the claim?
- What are the limits of the evidence?

The product should feel like a citation-backed city log, not a city oracle. Prefer "observed change with provenance" over "predicted impact."

## 2. What This Repo Is Becoming

The near-term product is a credible city-change atlas around the existing Belfast replay/data corpus. Future city adapters may support other UK/US cities, but the product should grow from one strong, evidence-rich pilot rather than many shallow demos.

The durable architecture should move toward:

- Event-first data: events, sources, geometry, dates, confidence, and limitations.
- City adapters: each city produces the same frontend contract from local source data.
- Provenance artifacts: every derived event or indicator can be traced to public source rows/files.
- A list/map/timeline UI: map views are important, but the changelog, evidence drawer, and exportable source brief are the trust center.
- Lightweight proposal lookup: compare proposals with historical analogues and confidence, not heavy forecasts.

Legacy "Mode A" replay assets may remain during migration, but new work should pull the repo toward a changelog/atlas model.

## 3. What Must Not Be Overclaimed

Do not claim that the project predicts, simulates, forecasts, proves, or causally explains urban outcomes unless a later product spec explicitly adds validated modelling.

Avoid:

- "This will increase/decrease..."
- "This caused..."
- "AI-powered prediction..."
- "10-year simulation..."
- Single-number impact scores without uncertainty and provenance.
- OSM edit dates presented as real-world construction dates.
- Generic planning simulator language.

Use:

- "Observed between DATE and DATE."
- "Occurred during the same period; causation is not claimed."
- "Inferred from SOURCE; not directly observed."
- "Effective date approximate: START to END."
- "Confidence: documented, corroborated, inferred, or disputed."
- "OSM edit date differs from real-world change date."

Heavy 10-year simulation should be removed or downgraded unless a later product spec explicitly restores it with a defensible model, validation plan, and clear user need.

## 4. Repo Layout

- `api/`: local API/static data contracts used by the UI.
- `config/`: source inventory and project configuration.
- `data/`: raw or local source data. Treat path years as hints only; trust metadata.
- `manifests/`: generated source/provenance manifests.
- `schemas/`: JSON/data schemas. Prefer schema-enforced contracts for events and sources.
- `scripts/`: Python and Node ETL, manifest builders, and verifiers.
- `tests/`: unit/integration tests for ETL and contracts.
- `web/`: vanilla frontend assets and browser smoke-test targets.
- `docs/`: product, data, methodology, and engineering documentation.
- `.agents/skills/`: repo-local Codex skills for product critique, data audit, ETL, UI review, impact modelling, maintainership, and release QA.
- `build/` and `web/data/`: generated artifacts or legacy replay outputs. Do not treat generated files as source of truth.

## 5. Commands To Run

Use PowerShell from the repo root.

Install dependencies when needed:

```powershell
npm install
```

Run the local product:

```powershell
npm start
```

Build current manifests:

```powershell
npm run build:manifest
```

Run source/event builders when touching those areas:

```powershell
npm run build:events
npm run build:transit
```

Run verifiers:

```powershell
npm run verify
python -m unittest discover tests
```

Run browser smoke checks after UI changes:

```powershell
npm run verify:browser
```

Run the full legacy test command only when the affected area depends on it:

```powershell
npm test
```

Some existing commands still cover legacy forecast/simulation artifacts. If they fail because of legacy scope that was not touched, report that clearly instead of expanding simulator code.

## 6. Testing And Verification Expectations

- Docs-only changes: verify file presence, links/paths, and skill frontmatter. Run the skill validator if local skills changed.
- ETL changes: add or update unit tests, schema validation, and small fixture tests before implementation.
- Data-contract changes: validate generated JSON/NDJSON against schemas and include negative tests for missing provenance.
- Frontend changes: run browser smoke tests, inspect desktop and mobile, and verify event/list/timeline/evidence interactions.
- Release changes: run source manifest checks, browser smoke tests, and a final review against the repo-local QA skill.

When test coverage is not practical because the repo is migrating away from legacy simulation, add a focused verifier and document the gap.

## 7. Data Provenance Rules

Every event, source, layer, indicator, and derived claim must carry enough provenance for a reviewer to reproduce or challenge it.

Minimum event/source fields:

- Stable `id`.
- `title` and plain-language summary.
- `effective_date` or `effective_date_range`.
- `geometry` or `geometry_ref`.
- `source_name`, `publisher`, `source_url`, and `source_type`.
- `license` and attribution text.
- `accessed_at` or retrieval date.
- Transformation method or script reference.
- Confidence: `documented`, `corroborated`, `inferred`, or `disputed`.
- Limitations and coverage notes.

Rules:

- Corroborated means at least two independent organizations, not two pages from the same publisher.
- Inferred data must be visually distinct and excluded from headline totals unless explicitly labelled.
- OSM-derived records must distinguish edit date, observation date, and likely real-world effective date.
- Numeric claims must link to the source rows/files or manifest entries that produced them.
- Licenses must be checked before ingestion and displayed in source briefs.
- Do not silently patch or overwrite source data. Prefer append-only correction records.

## 8. Frontend Quality Rules

The UI should be useful to planners and public-interest reviewers before it is visually dramatic.

- Put the changelog, evidence, and filters on equal footing with the map.
- Make every event clickable to a source/evidence drawer.
- Preserve a tabular/list path for users who cannot or do not want to use the map.
- Avoid fake simulator chrome, particle demos, speculative "scenario" language, and decorative dashboards.
- Prefer dense, legible, work-focused UI over marketing-style hero sections.
- Show missing/stale/partial data states honestly.
- Show confidence and limitations inline, not buried in a methodology footnote.

## 9. Accessibility And Performance Rules

- Provide keyboard access for map-adjacent controls, filters, timeline steps, drawers, and export actions.
- Maintain visible focus states and sufficient contrast.
- Do not rely on color alone for category, confidence, or data quality.
- Provide text equivalents for map-selected events and source evidence.
- Respect reduced-motion preferences.
- Keep heavy geospatial layers lazy-loaded and bounded by viewport, year, and category filters.
- Keep smoke tests sensitive to blank maps, broken timelines, overlapping UI, and unavailable data.

## 10. Open-Source Docs Rules

Public trust depends on docs as much as UI polish.

Maintain or create documentation for:

- Product principles and non-goals.
- Data acquisition and source licenses.
- Methodology and transformation scripts.
- Coverage gaps and known issues.
- Contribution flow for corrections, new sources, and new city adapters.
- Stable schemas and example data packs.
- Release notes with data version, retrieval dates, and corrections.

Do not create open-source theatre. A public repo is not enough; contributors need schemas, fixtures, citation format, issue templates, and a correction process.

## 11. Review Checklist

Before considering work complete, check:

- Product: Does this strengthen the city changelog/atlas mission?
- Overclaiming: Are prediction, causality, and simulation claims removed or clearly downgraded?
- Provenance: Can every event, layer, and numeric claim be traced to a source?
- Licenses: Are source licenses captured and compatible with use?
- Data quality: Are gaps, stale data, and inferred records labelled?
- Frontend: Can a user inspect evidence without understanding the implementation?
- Accessibility: Are keyboard, contrast, reduced motion, and non-map paths handled?
- Performance: Are large layers and generated artifacts bounded or lazy-loaded?
- Tests: Were the relevant unit, schema, verifier, and browser checks run?
- Docs: Did README/docs/coverage/methodology need updates?
- Security: No secrets, tokens, or private data added.

## 12. Simulation Direction

Heavy 10-year simulation, future-branch scenario engines, transformer-style forecasts, blockchain proof flows, generic impact scores, and traffic/electricity simulators are legacy or non-goals for the current product direction. Remove, quarantine, or downgrade them unless a later accepted product spec explicitly restores them with validation requirements.

