# Round 115 Belfast Public Project Notes

Agent: codex  
Date: 2026-05-19  
Scope: Belfast architecture-related official/public project records, 2008-01-01 through 2026-05-19, likely to complement the existing HED listing and planning lanes.

## Method

- Used the repo-local `urban-data-source-auditor` guidance.
- Searched official/public sources only: Belfast City Council project pages and committee papers, Department for Communities, Department for Infrastructure, Translink, Queen's University Belfast, and Ulster University.
- Ran a repo duplicate scan for key names. The scan showed:
  - `Belfast Stories` and `Ulster University public campus pages` already exist in `config/source_registry.json`.
  - Generated Belfast events already include at least one `Belfast Stories` pre-application consultation event and a `2 Royal Avenue` landlord works Stage 1 event.
  - `Grand Central Station` appears in raw Translink timetable files and in at least one 2025 planning/PV event, but the official station opening/project milestone may still be a gap.
- Wrote findings only under this folder and did not edit repo source files.

## Strongest Gaps

- Council heritage restorations and civic building changes: Templemore Baths, Tropical Ravine, City Cemetery, St Comgall's, Ulster Hall, City Hall visitor exhibition, Assembly Rooms acquisition, Fernhill House, Wilmont House, 2 Royal Avenue.
- Public realm and transport project pages not captured cleanly by HED/listing data: Lagan Gateway, Cathedral Gardens, Belfast Streets Ahead Phases 3 and 5, Five Cs, Shankill Gateway, Weavers Cross/Belfast Grand Central Station.
- University estate milestones: QUB Lanyon conservation, Seamus Heaney Centre, Wellcome-Wolfson Institute, One Elmwood, Biological Sciences, Ulster University Belfast campus.

## Cautions

- Many official project pages include forward-looking claims. Ingest only observed milestones such as published consultation dates, construction-start announcements, openings, acquisitions, or completed restoration statements.
- Public project pages are usually citation sources, not open datasets. Preserve URL, publisher, access date, and terms note; avoid copying body text into redistributable artifacts.
- HED/listed status, planning permission, construction start, opening, and public-use dates are separate facts. Keep them as separate events unless a source explicitly ties them together.
- Coordinates in the JSON are approximate address/site points for candidate triage, not surveyed footprints or statutory boundaries.

## Output

- `candidates.json` contains 31 candidate rows with publisher, source URL, terms/access note, date/date range, location, confidence, limitations, and duplicate-check notes.
