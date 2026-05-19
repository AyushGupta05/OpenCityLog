# Round 120 NYC LPC Designations More

Stopped search expansion after the interruption and wrote a conservative pack from the official LPC Open Data gap already computed.

## What Was Used

- Source: NYC Open Data `ncre-qhxs`, "Designated and Calendared Buildings and Sites".
- Publisher: NYC Landmarks Preservation Commission / NYC Open Data.
- Window: `2008-01-01` through `2026-05-19`.
- Kept records where the available official row showed current designated status and a `DESDATE`.

## Duplicate Screen

I screened LP numbers against already-seen repository LP identifiers and checked obvious title hits under corpus/script paths. I then excluded records that appeared in append scripts or had only calendared status in the available Open Data row.

The output intentionally keeps the set small: 7 candidates, all administrative heritage/protective status milestones. They should not be presented as construction, restoration, occupancy, physical-condition, or preservation-outcome events.

## Files

- `candidates.json`: source audit, 7 candidates, and rejected records.
