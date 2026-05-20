# Round 365 London PLD lifecycle next43 candidates

Generated 150 candidates from official Planning London Datahub application rows accessed on 2026-05-20.

Source URL: `https://planningdata.london.gov.uk/api-guest/applications/_search`; candidate rows link back to `https://planningdata.london.gov.uk/api-guest/applications/_source/{PLD row id}`.

Query window: `actual_commencement_date` and `actual_completion_date` values from `2008-01-01` through `2026-05-20`, submitted to the API as `01/01/2008` through `20/05/2026`. This run fetched 76,859 completion-date rows and 79,636 commencement-date rows before filtering. It does not use approval-only rows, previous-permission lifecycle fields, future-dated lifecycle values, or inferred delivery dates.

This round uses only `actual_commencement_date` and `actual_completion_date` values from `2008-01-01` through `2026-05-20`. It does not use approval-only rows, previous-permission lifecycle fields, future-dated lifecycle values, or inferred delivery dates.

Deduplication scanned the live manual architecture corpus plus all discovered prior London PLD lifecycle scratch packs through round362, explicitly including round126 direct, round126 more, round140, round147, round150, round153, round157, round161, round166, round172, round178, round184, round190, round196, round202, round208, round217, round223, round230, round238, round243, round248, round253, round261, round266, round272, round276, round284, round288, round298, round301, round306, round311, round316, round323, round327, round328, round333, round338, round343, round348, round350, round354, round358, and round362 by PLD row id, source URL/source record/date-field/date, source date field/date, and title/date.

Skipped duplicate-like records during candidate evaluation: 6,677 total, made up of 6,534 existing manual-corpus field/date-key matches and 143 existing title/date-key matches. Prior PLD lifecycle packs contributed 6,450 scanned field/date keys to the exclusion index; this sorted run had no additional prior-pack field/date duplicate rejections after the manual-corpus and title/date checks.

Every candidate keeps the PLD row id, LPA reference, official source row URL, API query, raw lifecycle date fields, source geometry fields, borough/publisher, access date, attribution, confidence, limitations, and transformation notes.

Use these as source-reported administrative planning lifecycle milestones only. Treat construction start, construction completion, opening, occupation, current use, design quality, service-result statements, delivery of a wider masterplan, and final built form as requiring separate source evidence.

The London Datastore applications page was checked on 2026-05-20 and listed daily update frequency with Licence: Not Specified, so redistribution terms need review before promoting this scratch pack into a public data release.
