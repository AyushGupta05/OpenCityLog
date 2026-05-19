# Round 116 NYC LPC permit candidates

Scope: official/public NYC LPC permit records for New York City architecture-related city-change candidates, issue dates from 2008-01-01 through 2026-05-19 inclusive. Accessed 2026-05-19.

Sources used:

- NYC Open Data, LPC Permit Application Information (`dpm2-m9mq`): https://data.cityofnewyork.us/Housing-Development/LPC-Permit-Application-Information/dpm2-m9mq
- SODA API endpoint: https://data.cityofnewyork.us/resource/dpm2-m9mq.json
- Dataset metadata: https://data.cityofnewyork.us/api/views/dpm2-m9mq
- Dataset columns: https://data.cityofnewyork.us/api/views/dpm2-m9mq/columns.json
- LPC permit type context: https://www.nyc.gov/site/lpc/applications/permit-types.page
- NYC Open Data terms context: https://opendata.cityofnewyork.us/overview/#termsofuse

Method:

- Queried official NYC Open Data only, using `issue_date >= 2008-01-01` and `issue_date < 2026-05-20` to cover the requested inclusive window.
- Prioritized `regulation_type = Certificate of Appropriateness` because LPC describes COFA as Commission-level review for work that does not meet staff-level rules.
- Selected a bounded, high-signal set where the row involved `New building`, `ROOFTOP ADDITION`, `ADDITIONS`, designated interior alterations at especially significant landmarks, or similarly substantial work categories.
- Deduped against `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json` by `source_record_id`, source URL, title/date pattern, and known existing COFA source IDs. Existing recent COFA rows are listed in `rejects`.

Important caveats for ingestion/UI:

- These records document LPC administrative permit issuance only. They are not evidence that work started, finished, opened, or caused any outcome.
- `issue_date` is the proposed event date for the administrative action. `received_date` and `expiration_date` are supporting permit dates, not physical-change dates.
- `WorkTypes` are category labels from the dataset, not a full narrative scope or verified construction description.
- Latitude/longitude are included only when the Open Data row supplies them. Missing coordinates should fall back to address/block/lot and should not be silently geocoded without provenance.
- Landmark names in `LMNameType` are copied from the current row and may reflect later dataset corrections or naming updates.
- NYC Open Data terms are not a conventional CC-style license; retain attribution/source URLs and review terms before bulk redistribution.

Candidate count: 23. Reject count: 16.

Files written in this round:

- `tmp/subagents/round116_nyc_lpc_permits_official/candidates.json`
- `tmp/subagents/round116_nyc_lpc_permits_official/notes.md`
