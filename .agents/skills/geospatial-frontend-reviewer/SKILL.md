---
name: geospatial-frontend-reviewer
description: Review Bims-5 map, timeline, event rail, evidence drawer, filters, source panels, and export UI for planner usefulness, accessibility, performance, and provenance clarity. Use when changing geospatial frontend code, visual encodings, Mapbox/map layers, event selection, timeline replay, source/evidence interactions, or browser smoke tests.
---

# Geospatial Frontend Reviewer

## Description

Use this skill to keep the Bims-5 frontend honest, inspectable, accessible, and fast while presenting city-change events on a map/timeline.

## When To Use

- Changing `web/` map, timeline, event rail, filter, detail, or evidence UI.
- Reviewing screenshots or browser smoke-test results.
- Adding visual encodings for confidence, data quality, or source status.
- Removing or downgrading simulator/future-forecast UI.

## Inputs

- Diff or files changed.
- Screenshots, smoke-test logs, or local URL.
- Target user workflow.
- Event/source/provenance contract.
- Known data-quality caveats.

## Output Format

Return:

1. Overall verdict: ready, needs fixes, or block.
2. Findings by severity with file/line when possible.
3. Workflow review: list, map, timeline, evidence, export.
4. Accessibility/performance review.
5. Suggested smoke-test cases and commands.

## Checklist

- Can users inspect event evidence in one click from map, list, and timeline?
- Is there a non-map path to every selected event and source?
- Are confidence, inferred/modelled status, stale data, and gaps visible inline?
- Does copy avoid predict/forecast/simulation language?
- Are keyboard focus, contrast, labels, reduced motion, and color-independent signals handled?
- Are large layers lazy-loaded or bounded by viewport/filter/date?
- Do mobile and desktop layouts avoid overlap and text clipping?
- Do smoke tests catch blank maps, broken controls, missing evidence, and bad layer loads?
- Are attribution and source-license surfaces visible where needed?

## Failure Modes To Avoid

- Treating the map as the whole product.
- Hiding evidence behind tiny or unreachable controls.
- Making confidence visible only through color.
- Shipping dramatic animation that slows inspection or hurts accessibility.
- Letting generated legacy simulator panels remain as first-class UI.
- Ignoring empty, stale, or partial data states.

