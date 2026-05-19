# round165_belfast_planning_statistics_next3

Belfast residual candidate pack from Department for Infrastructure Northern Ireland planning activity statistics CSVs.

## Scope

- Date window: 2016-01-01 through 2025-03-31.
- Source date field: `DecisionIssuedDate`.
- Geography: Belfast planning authority / Belfast LPA rows with Easting/Northing points inside the local Belfast envelope.
- Dedupe: live manual architecture corpus plus round131, round134, round137, round145, and round151; existing round165 output is read for rerun awareness because this script overwrites the same pack.

## Result

- Candidates retained: 30.
- Eligible before cap: 42.
- Candidate cap: 30.
- Counts by year: {"2016":2,"2017":4,"2018":7,"2019":3,"2020":2,"2022":3,"2023":3,"2024":5,"2025":1}.
- Counts by quality gate: {"civic_or_public_facility_next3":5,"industrial_or_commercial_built_use_next3":1,"listed_adaptive_reuse_or_built_use_next3":7,"scaled_residential_residual_next3":17}.

## Caveat

Planning approvals are administrative decisions only. They are not evidence of construction start, construction completion, opening, occupation, final built form, delivery, demolition completion, public use, or outcomes.
