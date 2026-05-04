# Lightweight Proposal Impact

## Summary

The Proposal Lens is an evidence screen for proposed city changes. It answers:

> Based on similar past events and current local context, this proposal may affect these signals.

It is not a calibrated forecast, simulator, causal model, or approval tool. It retrieves historical analogues, extracts local context, and turns those records into planner-facing questions, caveats, and evidence links.

## Proposal Input

Inputs are validated against `schemas/proposal.schema.json`.

Required:

- `category`: one of `building_development`, `road_transport_change`, `energy_infrastructure`, `green_public_space`, or `service_civic_infrastructure`.

Recommended:

- `title` or `description`
- `location` with `lng` and `lat`, or a GeoJSON `geometry`
- `scale`: `small`, `medium`, `large`, or `unknown`
- `details`: optional domain notes such as route type, service type, floors, or capacity class

Missing location or unknown scale does not block assessment, but it lowers confidence and adds caveats.

## Method

The implementation lives in `lib/proposal-impact.js` and is exposed through:

- `GET /api/proposal-impact/schema`
- `POST /api/proposal-impact`

The assessment has three stages.

1. Local context extraction:
   - Find grid cells near the proposal location.
   - Summarize normalized current signal values for built environment, mobility, utilities, civic services, green/public space, and jobs.
   - Return nearby historical events and source confidence.

2. Similar-event retrieval:
   - Score historical city-atlas events by category match, distance, recency, confidence, and source quality.
   - Keep source links and event caveats attached to the result.

3. Proposal Lens output:
   - Return affected signals with direction, strength, confidence, evidence, caveats, and follow-up investigation prompts.
   - Direction is limited to `positive`, `negative`, `mixed`, or `unknown`.
   - Strength is limited to `low`, `medium`, or `high`.

Similarity weights are transparent heuristics:

| Factor | Weight |
| --- | ---: |
| Category | 0.34 |
| Distance | 0.24 |
| Recency | 0.18 |
| Event confidence | 0.16 |
| Source quality | 0.08 |

## Confidence

Confidence rises when:

- A usable point or geometry is supplied.
- Nearby current context cells are available.
- Several historical analogues are found.
- At least two analogues are documented or corroborated.
- Source records are strong or usable with caveats.

Confidence falls when:

- Location or scale is missing.
- Most analogues are inferred.
- OSM-derived mapped visibility dates are the main evidence.
- Current context data is sparse.
- No close analogue exists for a signal.

## Output Contract

The proposal-impact result includes:

- `summary`: plain English, using "may affect" language.
- `affected_signals`: direction, strength, confidence, reason, evidence, caveats, and what to investigate next.
- `similar_events`: historical analogues with distance, source quality, confidence, and evidence links.
- `local_context`: nearby events, current signal values, nearest cells, source confidence, and caveats.
- `confidence`: overall label and reasons.
- `caveats`: global limitations.
- `evidence`: source IDs, event evidence, and current-context evidence.
- `method`: method version, weights, radius, and limitations.

## Non-goals

The Proposal Lens must not:

- Claim a proposal will cause an outcome.
- Produce single-number impact scores.
- Treat OSM edit dates as construction dates.
- Hide missing data.
- Replace transport modelling, utility engineering review, environmental assessment, planning judgement, or community consultation.

The correct use is screening: what to investigate, what precedent exists, which signals might be affected, and which sources support or weaken the claim.

## Verification

Run:

```powershell
npm run verify:proposal
python -m unittest discover tests
```

The verifier checks schema coverage, retrieval behavior, confidence and caveat behavior, and that proposal-impact outputs avoid overclaiming language.
