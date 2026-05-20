# Round 120 NYC DDC Projects Official Notes

## Scope

Discovery was stopped on user request. I wrote a compact artifact from official NYC Department of Design and Construction pages already found in the active pass, limited to high-confidence public building, library, cultural/civic, public-safety, and public-realm milestones.

## Method

- Used the repo-local provenance and urban-source guidance.
- Compared already-found DDC candidate URLs against normalized DDC URLs seen in repository context before writing.
- Kept 17 candidate records, under the requested maximum of 50.
- Treated DDC dates as official page/event milestone dates.
- Used conservative observed-change wording only: opening, reopening, completion, groundbreaking, construction start, or renovation start where the DDC title supported it.
- Added approximate coordinates for review only; authoritative geometry should be verified before ingestion.

## Caveats

- Non-duplicate status is URL-level from the context scanned before discovery stopped. The same project may still appear in the corpus under a different source or later/earlier milestone.
- Coordinates are manually approximated from named facilities, addresses, or intersections and should not be treated as parcel-accurate.
- No record claims causality, forecast, public benefit, service outcome, occupancy, usage, traffic effect, or safety effect.
- Groundbreaking/start records should remain visually distinct from completion/opening records if ingested.

## Files

- `candidates.json` contains `source_audits`, `candidates`, and `rejected`.
