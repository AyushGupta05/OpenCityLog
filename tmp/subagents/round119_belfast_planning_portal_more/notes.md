# Round 119 Belfast Planning Portal More Notes

Created: 2026-05-19

This pass was stopped early on user request and converted into a compact, validated candidate pack. I retained 20 high-confidence official Belfast City Council planning records and avoided continuing the search.

## Method

- Checked prior Belfast atlas/manual data and prior subagent packs through round118 by planning reference.
- Used Belfast City Council Planning Committee meeting pages and agenda-item minute pages as the retained official evidence.
- Treated committee dates as administrative planning dates only.
- Kept approvals/refusals distinct from physical change: none of the retained approval records are framed as built, completed, open or occupied.
- Coordinates are approximate triage points from Nominatim/OpenStreetMap or manual site-description placement. They should be replaced with NI Planning Portal register coordinates or red-line geometry before production ingestion.

## Files

- `candidates.json`: source audits, 17 retained candidates and rejected/duplicate records.
- `notes.md`: this summary.

## Known Gaps

- I did not continue the DfI or NI Planning Portal dynamic-page search after the stop request.
- I did not extract exact decision-notice issue dates from the NI Planning Portal.
- Some candidates use meeting-page URLs instead of supporting-PDF URLs because the meeting or agenda-item page is the stable official minute source.
- Geometry is intentionally conservative and labelled approximate.

## Validation

`candidates.json` was validated locally after writing for JSON parseability, required top-level arrays, retained candidate count under 80, `accessed_at = 2026-05-19`, required candidate fields, and duplicate candidate IDs/source record IDs within the pack.
