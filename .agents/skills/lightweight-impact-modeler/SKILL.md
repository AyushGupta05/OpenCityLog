---
name: lightweight-impact-modeler
description: Design or review Bims-5 proposal-impact logic as lightweight historical analogue lookup, local-context comparison, confidence labelling, and caveated descriptive summaries. Use when implementing proposal lens, impact lookup, analogue matching, contextual indicators, or confidence rules; avoid predictive simulation, fake precision, generic scores, and unsupported causal claims.
---

# Lightweight Impact Modeler

## Description

Use this skill to turn proposal-impact ideas into descriptive analogue lookup. The output should help users compare a proposal with historical examples without claiming to forecast future outcomes.

## When To Use

- Building or reviewing proposal-impact, impact lookup, or analogue matching.
- Replacing forecast/simulation features with descriptive comparison.
- Writing confidence criteria for impact summaries.
- Choosing local context variables for historical comparison.

## Inputs

- Proposal description, geometry, category, and date assumptions.
- Candidate historical events and source provenance.
- Local context indicators before/after historical events.
- Similarity criteria and user-facing copy.

## Output Format

Return:

1. Analogue contract: required proposal fields, event fields, and context fields.
2. Similarity method: transparent criteria and weights, or a no-weight rule if simpler.
3. Output language: descriptive summary with caveats and confidence.
4. Validation plan: fixtures, edge cases, and reviewer checks.
5. Anti-overclaim notes: banned wording and safer alternatives.

## Checklist

- Does the method retrieve historical analogues rather than predict outcomes?
- Are similarity criteria visible and explainable?
- Are all analogue events provenance-complete?
- Are before/after indicator windows explicit?
- Are local context differences shown, not hidden?
- Is confidence based on data quality, similarity, coverage, and source strength?
- Are outputs phrased as descriptive, not causal or predictive?
- Are small sample sizes and missing indicators clearly labelled?
- Are analogues reproducible from the same input and data version?

## Failure Modes To Avoid

- Producing a generic "impact score."
- Ranking analogues without showing why.
- Claiming "will", "expected", "forecast", "caused", or "proved."
- Comparing areas with incompatible geography or time windows.
- Hiding uncertainty behind a polished sentence.
- Reviving heavy 10-year simulation under softer wording.

