# Contributing

Thanks for helping make Bims City Atlas a trustworthy city changelog. The main
rule is simple: every public claim should be traceable to public evidence, and
every limitation should be visible.

## Start Locally

```powershell
npm install
npm start
```

Open `http://localhost:5173`.

Run the main checks:

```powershell
npm run verify
python -m unittest discover tests
```

For UI changes, start the app and run:

```powershell
npm run verify:browser
```

## Good First Contributions

- Correct an event date, source link, caveat, confidence label, or geometry.
- Add a missing source licence or attribution note.
- Add a small source-backed fixture for a city adapter.
- Improve docs for coverage gaps, methodology, or source limitations.
- Strengthen tests around provenance, schema validation, or browser smoke paths.

## Event And Source Rules

Events should describe observed records, not predictions. Use language such as
"observed", "documented", "inferred", "effective date approximate", and
"causation is not claimed."

Do not add:

- unsupported prediction or simulation claims
- causal claims without a specific validated causal source
- single-number impact scores
- OSM edit dates as real-world construction dates
- private, sensitive, or non-public data
- source data without licence and attribution fields

## Correction Flow

1. Open a data-correction issue.
2. Include the event id, source id, or file path.
3. Link the public evidence that supports the correction.
4. State whether the correction affects date, geometry, category, confidence,
   caveat, source attribution, or licence.
5. Prefer append-only correction records or documented source updates over
   silently overwriting raw source data.

For 15-lens atlas corrections, also include:

- the city id and lens slug, for example `belfast` and `planning-pressure`
- whether the issue affects full-city scope, source compatibility, export
  fields, or visual classification only
- the official boundary, source licence, or source-row URL when the correction
  challenges coverage
- a note if the event should remain visible in other lenses because the same
  source-backed record supports multiple views

Do not submit placeholder records to fill a lens. A launched city must keep all
15 lenses available, but sparse areas should remain sparse until compatible
public evidence is added.

## Pull Request Checklist

- The change supports the city changelog and evidence-atlas mission.
- Public copy avoids prediction, causality, and unsupported simulation language.
- Event/source changes preserve provenance, licence, attribution, confidence,
  and limitations.
- Generated artifacts were rebuilt only when needed.
- Relevant commands from `AGENTS.md` were run and named in the PR.
- UI changes preserve keyboard access, focus states, evidence inspection, and
  non-map paths.
- 15-lens changes keep Belfast, Greater London, and NYC on the complete lens
  contract and pass `npm run verify:lens-contract`.
- Docs were updated when behavior, data coverage, or public workflow changed.
