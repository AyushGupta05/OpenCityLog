# Round359 NYC LPC Permit Application Information Next37 Candidates

Generated: 2026-05-20T00:00:00Z
Source: NYC Open Data: LPC Permit Application Information (dpm2-m9mq)
Window: 2008-01-01 through 2026-05-20, using issue_date.
Official endpoint: `https://data.cityofnewyork.us/resource/dpm2-m9mq.json`
First-page query:

```text
https://data.cityofnewyork.us/resource/dpm2-m9mq.json?%24select=docket%2Caddress%2Creceived_date%2Cborough%2Cblock%2Clot%2Clmnametype%2Capplicant_name%2Capplicant_co%2Ccommunityboard%2Ccommunity_board%2Cworktypes%2Cregulation_type%2Cissue_date%2Clatitude%2Clongitude%2Cxcoordinate%2Cycoordinate%2Cregulation_number%2Cexpiration_date&%24where=issue_date+between+%272008-01-01T00%3A00%3A00%27+and+%272026-05-20T23%3A59%3A59%27+AND+latitude+IS+NOT+NULL+AND+longitude+IS+NOT+NULL+AND+regulation_number+IS+NOT+NULL+AND+worktypes+IS+NOT+NULL&%24order=issue_date+ASC%2C+regulation_number+ASC&%24limit=50000&%24offset=0
```

## Selection

Fetched 213,359 rows and collapsed them to 211,791 regulation_number records.
Retained 200 high-signal, non-duplicate administrative preservation milestones out of 27,293 eligible records before the cap.

Rows were scored for architecture/preservation signal in WorkTypes and regulation_type, then balanced across years and regulation types. Dedupe checked the current corpus files and prior LPC permit/designation candidate packs through round355.

Skipped duplicates: 8,226 rows/records total, including 7,854 duplicate regulation_number records and 372 duplicate title/date records already present in the corpus or prior packs.

## Caveat

LPC permit/application processing is an administrative preservation action. These records are not construction starts, completions, compliance sign-offs, final physical condition observations, preservation outcomes, or full approved-work geometries.

## Files

- candidates.json
- source_audit.json
- summary.json
- rejected.json
- notes.md
- validation_report.json
