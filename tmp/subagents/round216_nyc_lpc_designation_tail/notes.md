# Round216 NYC LPC designation tail

Generated: 2026-05-19T00:00:00Z

Scope: official NYC LPC Open Data designation/amendment rows from 2008-01-01 through 2026-05-19, excluding dpm2-m9mq permit rows.

Sources reviewed:

- Individual Landmark Sites (`buis-pvji`) for `LPC_SiteSt=Designated` and `LPC_SiteSt=Amended` individual-landmark rows.
- Designated and Calendared Buildings and Sites (`ncre-qhxs`) for `LAST_ACTIO=DESIGNATED (AMENDMENT/MODIFICATION ACCEPTED)` and individual-landmark designation tail checks.
- `ncre-qhxs` calendared rows were audited but not emitted because they are not final designation/amendment records.

Duplicate screening:

- Screened against the live manual architecture corpus.
- Screened against prior LPC designation packs: round103, round107, round110, round115, round120, round122, round138, and round142.
- Full LP numbers with amendment suffixes were preserved, but same base-LP/name near-date matches were rejected to avoid double-counting one LPC action.

Counts:

- Candidates: 1
- Date range: 2013-07-23 to 2013-07-23
- Rows reviewed: 657
- Eligible LP groups reviewed: 576
- Remaining high-signal headroom after dedupe: 0

Caveat: these records document LPC administrative legal/protective status only. They do not document construction starts, completions, restorations, openings, occupancy, condition, preservation outcomes, or causal impacts.
