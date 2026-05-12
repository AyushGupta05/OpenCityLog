# Codex Workflow For Bims-5

Use this workflow to keep future Codex sessions aligned with the city changelog / city change atlas direction.

## Sessions To Run

Run small, focused sessions rather than one broad rewrite.

1. Product framing session
   - Prompt: "Use `.agents/skills/planning-product-critic` to review this feature against the Bims-5 city changelog mission. Identify useful planner value, overclaims, and what to cut."
   - Use for new features, copy, roadmap edits, or migration choices.

2. Data-source audit session
   - Prompt: "Use `.agents/skills/urban-data-source-auditor` to audit these UK/US city sources for license, coverage years, update frequency, geography, reliability, and ingestion risk."
   - Use before adding a source or city adapter.

3. Provenance ETL session
   - Prompt: "Use `.agents/skills/provenance-etl-builder` to design or review this ETL so it emits event/source/provenance artifacts with schema validation and fixtures."
   - Use before writing or changing ETL scripts.

4. Frontend review session
   - Prompt: "Use `.agents/skills/geospatial-frontend-reviewer` to review the map, timeline, event rail, evidence drawer, accessibility, and performance for this UI change."
   - Use after UI changes and before browser smoke testing.

5. Lightweight impact session
   - Prompt: "Use `.agents/skills/lightweight-impact-modeler` to turn this proposal-impact idea into analogue lookup, local-context comparison, confidence, and caveats without prediction language."
   - Use only for non-forecast proposal logic.

6. Open-source maintainer session
   - Prompt: "Use `.agents/skills/open-source-maintainer` to update docs, examples, issue templates, release notes, or contribution guidance for this data/product change."
   - Use before publishing or asking for outside contribution.

7. QA release session
   - Prompt: "Use `.agents/skills/qa-release-auditor` to run a final readiness review, commands, smoke checks, and residual-risk summary for this branch."
   - Use before merging or tagging.

## Reasoning Levels

- Low: typo fixes, link fixes, narrow docs edits, and simple copy cleanup.
- Medium: default for feature planning, docs, ETL review, frontend review, and small code changes.
- High: schema migrations, source-license decisions, provenance architecture, release readiness, or removal of legacy simulation paths.
- Extra high: only for major city-adapter architecture, disputed methodology, or high-risk modelling claims.

## Branches And Worktrees

Use short-lived branches with the `codex/` prefix unless the maintainer requests another name.

Recommended branch names:

- `codex/product-guidance`
- `codex/source-audit-<city>`
- `codex/provenance-etl-<source>`
- `codex/frontend-changelog-ui`
- `codex/remove-legacy-simulation`
- `codex/release-vYYYY-MM`

For large migrations, use separate worktrees or branches for:

- Product/docs guidance.
- Data schema and provenance contracts.
- ETL implementation.
- Frontend implementation.
- Legacy simulation removal.

Do not mix product-code migration with broad docs cleanup unless the branch is explicitly scoped that way.

## Merge Order

Prefer this order for substantial work:

1. Product principles and AGENTS guidance.
2. Source audit and license notes.
3. Schema/provenance contract.
4. ETL builders and fixtures.
5. Frontend event/list/map/timeline UI.
6. Browser smoke tests and QA fixes.
7. Open-source docs, examples, and release notes.
8. Legacy simulation removal or downgrade once replacement paths exist.

When removing legacy forecast/simulation code, merge after tests and docs describe the replacement behavior. Do not keep old simulator paths alive just to preserve demos.

## What Done Means

A task is done when:

- It advances the open-source urban changelog / city change atlas direction.
- It avoids unsupported prediction, causality, and 10-year simulation claims.
- Relevant sources have license, coverage, retrieval, and reliability notes.
- Generated artifacts can be traced back to inputs and scripts.
- Tests or verifiers cover the changed contract.
- Browser smoke checks pass for UI work.
- Docs explain user-facing behavior, contribution impact, and known gaps.
- `git status --short` shows only intentional files for the task.

Docs-only guidance work is done when `AGENTS.md`, relevant docs, and local skills exist, have valid frontmatter, and no product code changed.

