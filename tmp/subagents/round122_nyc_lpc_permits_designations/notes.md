# Round 122 NYC LPC Permits / Applications Notes

Generated: 2026-05-19

## Scope

This pack adds 17 official NYC LPC permit/application candidates from the NYC Open Data `LPC Permit Application Information` dataset (`dpm2-m9mq`). I intentionally did not use the existing `Designated and Calendared Buildings and Sites` source (`ncre-qhxs`) for candidate extraction.

The selected rows cover 2008-01-01 through 2026-05-19 and emphasize underused LPC administrative record types:

- Commission Denial
- Commission Binding Report
- Transfer of Development Rights
- Permit for Minor Work

## Method

I queried official NYC Open Data metadata and rows for `dpm2-m9mq`, checked the repo registry to identify `ncre-qhxs` as the existing designated/calendared source, and compared prior local LPC packs enough to avoid simply duplicating the earlier COFA-heavy permit sample.

Selection filters:

- `issue_date` in the requested 2008-2026 window, bounded to the current date: 2026-05-19.
- Official row has non-null `latitude` and `longitude`.
- Regulation types are additive to a designation/calendaring source.
- WorkTypes are clear enough to summarize without inventing scope.

## Caveats

All candidates are framed as LPC administrative actions. They do not claim construction start, construction completion, preservation outcome, current condition, causality, or physical impact. Rows with WorkTypes such as "New building", "rooftop addition", or "additions" preserve source category text only.

The coordinates are official row point/geocode fields for the address or parcel context. They are not exact work geometry and not landmark boundaries.

Transfer of Development Rights rows are treated as LPC regulation-type actions only. They should not be read as proof that a private transfer closed without supporting records.

## Files

- `candidates.json`: 17 candidate events with required provenance fields.
- `source_audit.json`: audit notes for the official LPC permit dataset, LPC permit-types context page, and the excluded designated/calendared source.
- `notes.md`: this summary.
