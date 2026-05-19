# Round 121 London PLD Listed-Building / Civic More

Accessed: 2026-05-19

## Sources

- Planning London Datahub guest API: https://planningdata.london.gov.uk/api-guest/applications/_search
- PLD source-row URL pattern: https://planningdata.london.gov.uk/api-guest/applications/_source/{PLD id}
- London Datastore dataset page: https://data.london.gov.uk/dataset/planning-london-datahub-applications/
- GLA PLD context page: https://www.london.gov.uk/programmes-strategies/planning/digital-planning/planning-london-datahub

## Method

- Queried PLD by year from 2008-01-01 through 2026-05-19 for listed-building-consent, conservation/heritage-sensitive, estate-regeneration, civic, health, education, culture, public-realm, and major mixed-use signals.
- Used `decision_date` as the administrative event date and retained only approved/granted decision/status rows after local date parsing.
- Converted PLD centroids to WGS84 points; where the centroid was missing or outside the London envelope, used a representative point from `wgs84_polygon`.
- Rejected duplicates against the existing corpus and prior scratch packs by PLD id, LPA reference, source URL, and normalized title/date.

## Counts

- Unique PLD rows fetched before filtering: 16315
- Candidate rows written: 70
- Rejected rows reported: 495
- Existing duplicate index sizes: {'pld_ids': 9581, 'lpa_refs': 354, 'source_urls': 9533, 'title_dates': 117616}

## Query Stats

- listed building consent with civic/heritage signal: total hits by-year sum 11383; fetched 2797.
- listed building consent broad backfill: total hits by-year sum 29974; fetched 2280.
- conservation-sensitive major applications: total hits by-year sum 22199; fetched 3795.
- estate regeneration and masterplans: total hits by-year sum 10682; fetched 3438.
- civic health education culture: total hits by-year sum 26488; fetched 4560.
- major public realm mixed use: total hits by-year sum 69053; fetched 3040.

## Rejection Summary

- PLD row did not contain an approved/granted planning decision/status.: 2148
- candidate cap reached for listed-building-consent: 918
- No usable London centroid or WGS84 polygon found in PLD row.: 563
- candidate cap reached for estate-regeneration: 398
- PLD id already present in corpus/prior packs: 233
- candidate cap reached for civic-health-education-culture: 99
- Location fields too sparse for a useful atlas candidate.: 53
- title/date already present in corpus/prior packs: 13
- title/date duplicated within this scratch fetch: 9

## Caveats

- These are administrative planning rows, not evidence of construction start, completion, occupation, opening, heritage improvement, or local outcome effects.
- London Datastore lists the PLD applications dataset licence as Not Specified, so this pack keeps factual metadata and source-row URLs for review rather than a reproduced bulk dataset.
- PLD borough feeds/backfills vary; source dates, decision labels, and centroids should be checked before promoted ingestion.
- Proposal descriptions are source text fields and should be displayed as application/proposal language, not as delivered change.
