# Round 116 London Historic England Heritage Official Candidates

Generated: 2026-05-19

## Scope

- Target: Greater London architecture-related heritage-status candidates, 2008-01-01 through 2026-05-19.
- Sources: Historic England NHLE open data, Historic England Heritage at Risk annual map/open-data rows, and ONS London region boundary E12000007 for spatial filtering.
- Output file: candidates.json with source_audit, candidates, and rejects.

## Result Counts

- Total candidates: 1245
- By source family: {"historic-england-nhle":994,"historic-england-heritage-at-risk":251}
- By candidate year: {"2008":51,"2009":89,"2010":77,"2011":175,"2012":46,"2013":33,"2014":43,"2015":62,"2016":107,"2017":134,"2018":73,"2019":48,"2020":102,"2021":26,"2022":31,"2023":14,"2024":74,"2025":60}
- Reject rows recorded: 252 (individual duplicate rows capped to keep the drop reviewable)

## NHLE Query Summary

- Layer 0 Listed Building points: queried 1203, London 1089, promoted 958, duplicate rejects 131, missing geometry 0.
- Layer 6 Scheduled Monuments: queried 26, London 23, promoted 23, duplicate rejects 0, missing geometry 0.
- Layer 7 Parks and Gardens: queried 20, London 19, promoted 13, duplicate rejects 6, missing geometry 0.
- Layer 8 Battlefields: queried 0, London 0, promoted 0, duplicate rejects 0, missing geometry 0.
- Layer 9 Protected Wreck Sites: queried 0, London 0, promoted 0, duplicate rejects 0, missing geometry 0.
- Layer 10 World Heritage Sites: queried 0, London 0, promoted 0, duplicate rejects 0, missing geometry 0.

## HAR Query Summary

- HAR 2016: queried 710, London 681, baseline not promoted 681, first-observed keys 0, promoted after de-dupe 0, duplicate rejects 0.
- HAR 2017: queried 711, London 682, baseline not promoted 0, first-observed keys 77, promoted after de-dupe 1, duplicate rejects 76.
- HAR 2018: queried 688, London 659, baseline not promoted 0, first-observed keys 29, promoted after de-dupe 28, duplicate rejects 1.
- HAR 2019: queried 674, London 645, baseline not promoted 0, first-observed keys 31, promoted after de-dupe 27, duplicate rejects 4.
- HAR 2020: queried 678, London 649, baseline not promoted 0, first-observed keys 62, promoted after de-dupe 55, duplicate rejects 7.
- HAR 2021: queried 662, London 633, baseline not promoted 0, first-observed keys 32, promoted after de-dupe 17, duplicate rejects 15.
- HAR 2022: queried 653, London 630, baseline not promoted 0, first-observed keys 29, promoted after de-dupe 27, duplicate rejects 2.
- HAR 2023: queried 623, London 599, baseline not promoted 0, first-observed keys 13, promoted after de-dupe 11, duplicate rejects 2.
- HAR 2024: queried 627, London 599, baseline not promoted 0, first-observed keys 33, promoted after de-dupe 28, duplicate rejects 5.
- HAR 2025: queried 627, London 604, baseline not promoted 0, first-observed keys 70, promoted after de-dupe 57, duplicate rejects 13.

## De-duplication

The drop de-duplicated against data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json by London NHLE/List_Entry identifiers, source_record_id strings, normalized source URLs, and normalized title/date pairs. I also screened tmp/subagents/round115_london_nhle_official/round115_london_nhle_official_candidates.json so this round does not repeat the adjacent official-source subagent output.

Because the user asked to avoid duplicates by NHLE/list-entry IDs, HAR rows sharing an NHLE/List_Entry number with an existing manual event were rejected even when the status type differed. That is intentionally conservative for this round.

## Provenance And Caveats

- NHLE ListDate/SchedDate/RegDate/DesigDate/InscrDate values are administrative heritage designation/list-entry dates only. They are not construction, opening, occupation, repair, condition, or causal evidence.
- HAR rows are annual risk-register/status observations. They are not evidence of physical works, deterioration cause, restoration completion, ownership, or public access.
- HAR first-observed records are derived from the accessible annual map/open-data sequence after the 2016 baseline; they should not be worded as exact additions unless checked against the annual additions spreadsheet.
- Coordinates are Historic England point geometries or polygon centroids filtered against the ONS London region boundary; use them for atlas navigation, not statutory boundaries or curtilage.
- Historic England download guidance warns not to scrape HAR website pages for source data; this run used structured GIS/open-data endpoints instead.

## Source URLs Used

- NHLE data downloads: https://historicengland.org.uk/listing/the-list/data-downloads/
- NHLE FeatureServer: https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer
- HAR annual registers/maps: https://historicengland.org.uk/listing/heritage-at-risk/search-register/annual-heritage-at-risk-registers-and-maps/
- ONS London region boundary: https://www.data.gov.uk/dataset/47ca3295-6b3b-43ad-8f26-e3bc7cd67001/regions-december-2024-boundaries-en-bfc
