# Round117 NYC ZAP/LPC candidate notes

## Scope

This pass looked for additional official New York City planning and preservation administrative milestones from 2008-01-01 through 2026-05-19. I used NYC Open Data DCP ZAP Project Data, ZAP BBL, DCP PLUTO, LPC Historic Districts, LPC Designated and Calendared Buildings and Sites, and LPC Permit Application Information.

The resulting `candidates.json` contains 20 candidate records: 12 DCP ZAP/ULURP records and 8 LPC designation records. All candidate wording is administrative: approvals, completions in ZAP workflow, acquisitions/dispositions, certifications, or LPC designations. No candidate claims construction, opening, occupancy, causation, forecast, or impact.

## Method

- Parsed the existing architecture milestone file as read-only context and searched it by project id, LP number, COFA number, title fragments, and obvious project names.
- Queried official NYC Open Data APIs directly.
- For ZAP candidates, required a project row plus validated ZAP BBL rows and a DCP PLUTO coordinate join.
- Multi-lot ZAP candidates use a representative average of official tax-lot points and keep BBL/coordinate counts in the geometry source.
- For LPC historic districts, used official `skyk-mpzq` multipolygons and stored a representative bbox-center point for candidate triage. Production ingestion should preserve the official polygon.
- For LPC interiors, used official `ncre-qhxs` point geometry and dates.
- Avoided additional LPC COFA rows because the existing seed already has many COFA records and exact permit duplication risk is high.

## Candidate Families

- DCP/ZAP public acquisitions and dispositions: ACS Dean Street, Walk to Park Brooklyn/Queens, HRA Northern Boulevard, 7 North Moore, Water Tunnel Shaft 21.
- DCP/ZAP development and design actions with official parcel geometry: Atlantic Avenue Mixed-Use Plan, Bally's Ferry Point, 870-888 Atlantic FRESH, 1200 Manhattan Avenue waterfront certification, 1510 Broadway, and 300 Huntington Street.
- LPC preservation milestones: Sunset Park historic district designations, Wallabout, Crown Heights North II/III, Bronx General Post Office lobby interior, and NYPL Schwarzman Building interiors.

## Rejections And Caveats

Some relevant records were rejected because they lacked validated BBL rows or because the existing manual file already had the same effective milestone. Examples are listed in `rejected` in `candidates.json`.

Important ingestion caveat: ZAP approval/completion dates are process milestones. They should not be displayed as construction starts, completions, openings, delivered housing, built public space, or project effects. LPC designations likewise document preservation status, not restoration work or property condition.
