# Red-team review: Bims-5 urban changelog

This note is retained as product guidance after the simulation cleanup. It intentionally avoids linking to retired file paths.

## Strongest product direction

Bims should be a timestamped, citation-backed record of how places changed over time. Each event should answer:

- what changed;
- when it changed;
- where it happened;
- which public evidence supports the claim;
- what the evidence cannot prove.

The product should feel like a source-backed city changelog, not a city oracle.

## Biggest credibility risks

- Cherry-picked analogues without a transparent retrieval method.
- Causation laundering when an event and a metric move in the same period.
- Treating OSM edit dates as construction/opening dates.
- Citywide dashboards hiding the parcel, corridor, or place where change occurred.
- Confidence labels that are not tied to evidence quality.
- Pretty map animation without queryable evidence and source exports.

## What stays cut

Keep retired:

- retired provenance proof flows;
- future scenario workspaces;
- long-horizon forecasts;
- transformer-style model artifacts;
- traffic microsimulation demos;
- decorative particle/fly-through dashboard demos;
- predictor language that implies calibrated future outcomes.

Replace these with observed event records, before/after imagery, source drawers, confidence labels, and descriptive context/evidence lenses.

## Trust rules

1. Every event needs source, license, accessed/retrieved date, geometry basis, confidence, and caveats.
2. Corroborated means independent sources, not two pages from the same publisher.
3. Inferred records must be visually distinct and labelled inline.
4. OSM-derived events must distinguish mapped/edit visibility from real-world effective date.
5. Every number should trace back to source rows or generated manifests.
6. Proposal copy must say "historical analogue", "observed change", "not a forecast", "evidence strength", or "observed during the same period"; never "caused" or "will".

## Architecture direction

The durable architecture is event-first: city adapters produce the same city-atlas contract from local data, the frontend reads those artifacts, and verification blocks stale legacy runtime paths from coming back.
