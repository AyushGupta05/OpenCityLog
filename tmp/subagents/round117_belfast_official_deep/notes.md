# Round117 Belfast Official Deep Audit

## Method

I screened the existing `architecture_milestones_2008_2026.json` with `rg` before retaining candidates, using application references, HARNI/HB references, project names, and address terms. I then checked official-source pages from Belfast City Council, DfI, DfC/HED/nidirect, HARNI, and the NI Planning Portal landing page.

## Retained Candidates

`candidates.json` contains 11 retained candidate records:

- 4 BCC decisions-issued rows from February, April, and May 2023.
- 2 BCC current-application advertisement rows from May 2026.
- 1 DfI Strategic Planning Directorate advertisement for the Belfast Transport Hub condition-removal application.
- 4 DfC/HED/HARNI heritage status or risk records.

The highest-value additions are probably the Belfast City Hospital stem cell facility permission, Tower Street former Belfast Met housing/community hub permission, Beaufort House aparthotel permission, Brookfield Mill HARNI safe-status narrative, and the Lime Kilns listed-building/HARNI risk record.

## Caveats

Planning permission means permission only. It does not confirm demolition, construction, completion, occupation, opening, public use, or any outcome effect.

Current BCC application rows are live-advertisement evidence. They should be archived or reconciled to Planning Portal records before production ingestion because the page can change.

HARNI records are useful for risk/status, but some pages do not expose an explicit review date. For those, I used `2026-05-19` as an access-date status observation and marked the limitation.

Coordinates are approximate navigation points. The Lime Kilns point uses the HED Irish Grid reference `J3098 7820`; other points were address approximations and should be checked against Planning Portal/HED GIS before map publication.

## Rejections

The rejected list includes tempting official rows that are already represented in the existing corpus, including HERoNI at PRONI, City Quays 4, Corporation Street PBMSA, the Annesley Street former synagogue HARNI record, Templemore Baths, Carlton House, King's Hall/Balmoral Avenue, and Blackstaff Chambers.

## Files

- `candidates.json`: source audits, retained candidates, rejected records, and notes.
- `notes.md`: this summary.
