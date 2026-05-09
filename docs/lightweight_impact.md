# Lightweight Proposal Impact

## Summary

The Proposal Lens is an evidence screen for proposed city changes. It answers:

> Which observed precedents, source caveats, before/after records, and traffic evidence should be reviewed before a proposal claim is made?

It is not a calibrated outcome estimator, simulator, causal model, or approval tool. It retrieves historical analogues, extracts local context, and turns those records into planner-facing questions, caveats, and evidence links.

The frontend planning workbench in `web/index.html` and `web/atlas.js` applies the same rule to the selected atlas event as a proposed site or precedent. A user can name the working proposal, choose a proposal type, scale, and project stage, then copy a planning report that includes:

- selected historical precedent and confidence
- before/after imagery dates and archive fallback notes
- related loaded records in before/after windows
- traffic or mobility evidence counts, clearly separated from measured traffic volumes
- full-city proposal-lens analogues from `POST /api/proposal-impact`
- visible analogue match factors for category, distance, recency, confidence, and source quality
- a local context snapshot that uses source-backed grid cells when available and nearby historical event density when grid cells are absent
- an evidence matrix for planning status, mobility, services, environment, economy, and analogue strength
- a city-architect design review basis for context/character, connectivity, public realm, environment/resilience, and everyday use value
- an architect learning brief with evidence readiness, historical patterns, fieldwork tasks, and next evidence to find
- a work queue that distinguishes ready evidence from gaps that need surveys, source review, or specialist assessment
- a city-architect review brief that turns precedent into public-life fieldwork, eye-level design tests, and a non-causal impact-learning ledger
- comparable loaded events, design review questions, data gaps, and linked sources

The workbench deliberately uses "screening", "review", "evidence", and "data gap" language. It must not say a future project will produce an outcome.

The browser-side report has two scopes:

- Full-city proposal lens: retrieved from the local API using the selected event geometry, proposal category, scale, and evidence radius.
- Loaded browser scope: counts and visible analogues from the timeline years already loaded in the UI.

Both scopes are reported explicitly so users do not mistake a currently loaded map layer for complete city coverage.

The city-architect review is informed by public-life practice associated with Jan Gehl and Gehl: use public-space/public-life observation, combine high-level and eye-level evidence, count people moving and staying, and treat "measure, test, refine" as a planning workflow rather than an outcome model.

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
   - If grid cells are unavailable, derive a labelled context snapshot from nearby historical event density, event confidence, and source quality.
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
- `similar_events`: historical analogues with distance, source quality, confidence, transparent match factors, and evidence links.
- `local_context`: nearby events, current signal values or event-density context, nearest cells when present, source confidence, context basis, and caveats.
- `confidence`: overall label and reasons.
- `caveats`: global limitations.
- `evidence`: source IDs, event evidence, and current-context evidence.
- `proposal_brief`: a city-architect learning brief with evidence readiness, historical patterns, fieldwork tasks, review questions, and the next evidence to find before citation.
- `design_review_basis`: city-architect review themes, evidence counts, confidence labels, and review prompts.
- `method`: method version, weights, radius, and limitations.

## Non-goals

The Proposal Lens must not:

- Claim a proposal produces an outcome.
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
