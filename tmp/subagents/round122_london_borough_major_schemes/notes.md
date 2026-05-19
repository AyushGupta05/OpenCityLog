# Round 122 London borough major schemes notes

Created: 2026-05-19

## Scope

This is a partial but clean candidate pack of official London borough architecture and development change records from 2008-2026. It intentionally avoids generic Planning London Datahub rows. Candidate sources are borough project pages, borough news releases, committee/minutes pages, CPO/supporting-document pages, and official borough accountability documents.

Priority borough coverage in this partial:

- Westminster
- Camden
- Southwark
- Tower Hamlets
- City of London
- Hackney
- Greenwich
- Newham

## Files

- `candidates.json`: 37 event candidates using the requested architecture milestone fields.
- `source_audit.json`: source-level suitability, caveats, and ingestion recommendations.
- `notes.md`: methodology and unresolved follow-up checks.

## Method

I kept application, approval, legal/CPO, construction-start, topping-out, completion, opening and deferral records separate. Where a source gave only a month, season, or year, I normalized `date` to a sortable placeholder date and recorded the uncertainty in `date_precision` and `limitations`.

Examples:

- `2023-12-01` plus `date_precision: "season"` for Westminster's "winter 2023" 300 Harrow Road completion.
- `2021-01-01` plus `date_precision: "year"` for Camden's 2021 Agar Grove phase completion.
- `2024-07-02` for City of London 1 Undershaft committee deferral, with an explicit limitation that it is not permission.

## High-value records included

- Westminster: 300 Harrow Road; Church Street Site A; Strand/Aldwych public realm.
- Camden: Agar Grove estate planning and phase completions.
- Southwark: Canada Water; Elephant and Castle town centre / Elephant Park; Walworth Town Hall; Aylesbury Estate; Tustin Estate.
- Tower Hamlets: Tower Hamlets Town Hall; Blackwall Reach / Robin Hood Gardens demolition milestone.
- Hackney: Britannia site; Colville Estate; Woodberry Down.
- Greenwich: Woolwich Works opening, backed by Royal Borough of Greenwich accounts and Woolwich regeneration context.
- Newham: Carpenters Estate / James Riley Point approval, masterplan approval and start on site.
- City of London: 22 Bishopsgate; 6-8 Bishopsgate / 150 Leadenhall; 2 Finsbury Avenue; 1 Undershaft deferral.

## Caveats

- Several official project pages are summary pages, not full planning records. Before production ingestion, add planning-register references or committee report PDFs where available.
- Greenwich Woolwich Works is official but weaker than the rest because the date came from the borough Statement of Accounts rather than a dedicated project/opening page.
- Tower Hamlets Town Hall is official and high-value, but the captured borough project page did not expose one exact public-opening date. The candidate uses year-level precision.
- Some borough pages use future-facing language. I excluded expected completions unless the source also stated observed start/approval/completion.
- No causality, impact, or forecast claims are made.

## Suggested next checks

- Pull original committee reports/decision notices for:
  - Westminster Church Street Site A planning committee report and hybrid permission PDF.
  - Southwark Elephant and Castle 16/AP/4458 decision notice.
  - Southwark Elephant Park January 2013 planning committee report.
  - Hackney Woodberry Down phase 4 planning decision.
  - LLDC decision notices for Newham Carpenters Estate and James Riley Point.
- Add exact coordinates from official planning polygons or site plans where available.
- Run a duplicate check against existing London architecture milestone packs before ingesting.
