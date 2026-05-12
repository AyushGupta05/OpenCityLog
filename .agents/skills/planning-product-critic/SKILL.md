---
name: planning-product-critic
description: Evaluate whether Bims-5 features, copy, roadmap items, and UI/product ideas serve real urban planners and public-interest users as an evidence-backed city changelog. Use when reviewing proposed features for planner value, bullshit risk, unsupported prediction, fake simulation, causality overclaiming, or scope creep away from the open-source city change atlas mission.
---

# Planning Product Critic

## Description

Use this skill to judge whether a feature belongs in Bims-5 as an open-source urban changelog / city change atlas. Be direct about planner value, evidence quality, and overclaiming.

## When To Use

- Reviewing a new feature, roadmap item, UI flow, tagline, README claim, or demo script.
- Deciding whether a legacy forecast/simulation feature should stay, be downgraded, or be removed.
- Translating "impact simulator" ideas into evidence-backed changelog or analogue-lookup features.
- Checking whether a feature helps planners, researchers, journalists, students, or communities make defensible use of public data.

## Inputs

- Feature description or diff.
- User story and intended audience.
- Data sources and evidence claims.
- Screenshots/copy if available.
- Relevant docs: `AGENTS.md`, `docs/product_principles.md`, `docs/mvp_spec.md`, and `docs/red_team.md`.

## Output Format

Return:

1. Verdict: keep, reshape, defer, or cut.
2. Planner value: concrete user benefit in one or two sentences.
3. Evidence basis: what sources/provenance support it.
4. Overclaim risk: prediction, causality, simulation, fake precision, or missing caveats.
5. Required changes: short actionable list.
6. Exact copy edits: safer wording for risky claims.

## Checklist

- Does the feature answer what changed, when, where, and with what evidence?
- Is it useful without pretending to predict the future?
- Does it expose source, license, retrieval date, confidence, and limitations?
- Is "observed", "inferred", "modeled", or "unknown" clear to users?
- Could a planner cite or challenge the output?
- Does it avoid generic impact scores and unsupported causal claims?
- Does it keep the product list/map/timeline/evidence centered?
- Does it reduce or quarantine heavy 10-year simulation unless a later spec restores it?

## Failure Modes To Avoid

- Accepting a feature because it demos well while weakening trust.
- Using "confidence" as decoration without criteria.
- Treating correlation as causation.
- Hiding caveats in footnotes.
- Letting map spectacle replace evidence inspection.
- Preserving legacy simulator language to avoid hard product choices.

