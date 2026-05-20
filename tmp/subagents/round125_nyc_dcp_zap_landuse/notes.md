# Round125 NYC DCP ZAP land-use notes

## Scope

This scratch pass used official NYC Department of City Planning datasets on NYC Open Data to identify observed-change candidates from approved/adopted/completed ZAP land-use applications and rezonings dated 2008-01-01 through 2026-05-19.

## Method

- Queried `hgx4-8ukb` ZAP Project Data for completed public-status rows with approval, completed, or current milestone dates in range.
- Joined selected projects to validated rows in `2iga-a6mk` ZAP BBL.
- Joined BBLs to `64uk-42ks` PLUTO latitude/longitude points and used the average of mapped lot points as a representative candidate point.
- Scored projects toward major rezonings, zoning actions, mixed-use/residential/housing, waterfront/open-space, public acquisition/disposition, public facilities, and MIH terms.
- Internally de-duplicated by stable `candidate_id` / ZAP `project_id`; previous scratch outputs were reviewed only as context because this task asked for a full 50-candidate ZAP-focused scratch set.

## Outputs

- `candidates.json`: 50 JSON-valid candidate records.
- `source_audit.json`: source suitability and caveat audit for the three official DCP datasets.
- `notes.md`: this note.

## Caveats

- ZAP approval/completion/adoption is an administrative land-use milestone. It does not prove construction, opening, occupancy, delivered housing, public-space completion, or causal outcomes.
- ZAP BBL and PLUTO joins provide representative mappable lot points, not exact action-area polygons or construction footprints.
- PLUTO is a current tax-lot snapshot; coordinates may post-date the land-use milestone and may reflect later lot changes.
- Production ingestion should preserve source date semantics and, where available, replace representative points with official project or zoning geometry.

## Prior scratch context

- Earlier ZAP/LPC and DCP rounds in `tmp/subagents` were present and treated as read-only context.
- This round may overlap earlier ZAP IDs where the official DCP source is the strongest available evidence; production ingestion should run a global candidate merge/dedupe before promotion.
