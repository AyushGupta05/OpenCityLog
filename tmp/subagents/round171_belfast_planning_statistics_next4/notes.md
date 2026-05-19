# round171_belfast_planning_statistics_next4

Belfast residual candidate pack from Department for Infrastructure Northern Ireland planning activity statistics CSVs.

## Scope

- Date window: 2008-01-01 through 2025-03-31.
- Source date field: `DecisionIssuedDate`.
- Geography: Belfast planning authority / Belfast LPA rows with Easting/Northing points inside the local Belfast envelope.
- Dedupe: live manual architecture corpus plus round131, round134, round137, round145, round151, and round165; existing round171 output is read for rerun awareness because this script overwrites the same pack.

## Result

- Candidates retained: 12.
- Eligible before cap: 12.
- Candidate cap: 30.
- Counts by year: {"2016":3,"2017":2,"2018":1,"2019":1,"2020":2,"2021":2,"2022":1}.
- Counts by quality gate: {"listed_adaptive_reuse_or_built_use_next4":12}.

## Caveat

Planning approvals are administrative decisions only. They are not evidence of construction start, construction completion, opening, occupation, final built form, delivery, demolition completion, public use, or outcomes.
