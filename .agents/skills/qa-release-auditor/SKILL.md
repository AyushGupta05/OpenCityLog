---
name: qa-release-auditor
description: Run final Bims-5 ship-readiness checks across docs, data provenance, ETL contracts, frontend smoke tests, accessibility, performance, open-source readiness, and legacy simulation removal/downgrade. Use before merging, tagging, publishing data packs, release notes, demos, or major pull requests.
---

# QA Release Auditor

## Description

Use this skill for the last pass before a branch is merged, demoed, or released. It should surface blockers, residual risks, and exact verification evidence.

## When To Use

- Before merge or release.
- After ETL, frontend, schema, or docs changes.
- Before public demos or data-pack publication.
- When removing/downgrading legacy simulation paths.

## Inputs

- Git diff and intended scope.
- Commands already run and outputs.
- Screenshots or browser smoke logs for UI work.
- Source/provenance manifests and release notes.
- Known skipped tests or legacy failures.

## Output Format

Return:

1. Release verdict: ship, ship with notes, or block.
2. Blockers: ordered by severity with file/line when available.
3. Verification log: commands run and result.
4. Product/provenance review: overclaims, source lineage, licenses, caveats.
5. Residual risks and follow-up issues.

## Checklist

- Does the diff match the stated scope?
- Did product code stay untouched for docs-only work?
- Do all changed skills/docs have valid frontmatter/links/paths?
- Do ETL outputs validate against schemas?
- Can every event/layer/number trace to source and license?
- Are browser smoke tests run for UI changes?
- Are accessibility and performance risks checked?
- Are simulator/forecast claims removed, quarantined, or explicitly out of scope?
- Are README/docs/release notes updated when public behavior changed?
- Does `git status --short` show only intentional files?

## Failure Modes To Avoid

- Reporting "tests pass" without naming commands.
- Ignoring skipped or legacy-failing checks.
- Treating docs-only work as if product behavior was verified.
- Letting generated artifacts obscure source changes.
- Shipping public copy with forecast, causality, or fake precision.
- Merging broad cleanup with unrelated product-code changes.

