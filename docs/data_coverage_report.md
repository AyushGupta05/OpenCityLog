# City Atlas Coverage Report

Generated: 2026-05-20T12:11:22Z

This report counts source-backed records emitted into `web/data/city-atlas`. It is not a claim of complete city coverage, and gaps are not padded with synthetic records.

| City | Events | Active sources | Catalog-only sources | Event years | Top layers | Gap to 100k |
| --- | ---: | ---: | ---: | --- | --- | ---: |
| Belfast, Northern Ireland | 32622 | 183 | 26 | 2007-2026 | transport 17118, built_environment 13303, utilities 851 | 67378 |
| London, England | 215451 | 190 | 101 | 1801-2026 | built_environment 96168, civic_services 53367, transport 37842 | 0 |
| New York City, New York | 75226 | 78 | 122 | 1797-2026 | built_environment 50241, environment 14859, transport 7092 | 24774 |

## Belfast, Northern Ireland

Backed events: 32622. Unique event IDs: 32622. Duplicate IDs: 0.

| Source | Events | Years | Layers | Reliability |
| --- | ---: | --- | --- | --- |
| OpenStreetMap extracts via Overpass API | 17965 | 2007-2026 | transport 17114, utilities 851 | usable_with_caveats |
| Northern Ireland planning activity statistics | 12920 | 2016-2025 | built_environment 11573, civic_services 675, economy 672 | usable_with_caveats |
| Belfast architecture and major project public pages | 928 | 2008-2026 | built_environment 928 | usable_with_caveats |
| Defence Heritage Record ArcGIS layer | 161 | 2017-2026 | built_environment 161 | usable_with_caveats |
| Heritage at Risk in Northern Ireland Belfast ArcGIS spatial layer | 113 | 2008-2025 | built_environment 113 | usable_with_caveats |
| Belfast City Council Planning Committee agenda items, minutes, reports and public document packs | 69 | 2015-2026 | built_environment 69 | usable_with_caveats |
| Northern Ireland Planning Portal public application register | 21 | 2024-2026 | built_environment 21 | usable_with_caveats |
| LDP Plan Strategy (May 2023) Supplementary Planning Guidance | 18 | 2022-2023 | built_environment 18 | usable_with_caveats |
| Belfast City Council Planning Committee agendas, minutes and supporting documents | 18 | 2020-2026 | built_environment 18 | usable_with_caveats |
| Queen's University Belfast Estates Completed Projects | 16 | 2016-2025 | built_environment 16 | usable_with_caveats |
| Belfast City Council Democratic Services minutes | 14 | 2013-2018 | built_environment 14 | usable_with_caveats |
| Department for Communities / nidirect listed building records | 14 | 2016-2025 | built_environment 14 | usable_with_caveats |

Catalog-only sources without emitted event rows: 26.

## London, England

Backed events: 215451. Unique event IDs: 215451. Duplicate IDs: 0.

| Source | Events | Years | Layers | Reliability |
| --- | ---: | --- | --- | --- |
| Police.uk stop and search custom CSV downloads | 27792 | 2023-2026 | civic_services 27792 | usable_with_caveats |
| Police.uk crime and outcomes API | 27362 | 1829-2026 | environment 26697, transport 665 | usable_with_caveats |
| London Fire Brigade incident records | 27002 | 2005-2026 | civic_services 25510, environment 1339, transport 152 | usable_with_caveats |
| Road Safety Open Data - STATS19 collision records | 27000 | 2020-2025 | transport 27000 | usable_with_caveats |
| HM Land Registry Price Paid Data | 25600 | 1995-2026 | built_environment 25600 | usable_with_caveats |
| Planning London Datahub applications | 20724 | 2008-2026 | built_environment 20724 | usable_with_caveats |
| Planning Data: Listed Building Outlines | 13875 | 1949-2026 | built_environment 13875 | usable_with_caveats |
| UK House Price Index | 12342 | 1995-2026 | built_environment 12342 | usable_with_caveats |
| Planning permissions on the London Development Database (LDD) | 11442 | 2008-2020 | built_environment 11382, civic_services 44, transport 12 | usable_with_caveats |
| Food Hygiene Rating Scheme API | 9900 | 2004-2026 | transport 9900 | usable_with_caveats |
| Planning Data: Brownfield Land | 5643 | 2017-2026 | built_environment 5643 | usable_with_caveats |
| Planning Data: Tree Preservation Zones | 1168 | 1951-2025 | built_environment 1168 | usable_with_caveats |

Catalog-only sources without emitted event rows: 101.

## New York City, New York

Backed events: 75226. Unique event IDs: 75226. Duplicate IDs: 0.

| Source | Events | Years | Layers | Reliability |
| --- | ---: | --- | --- | --- |
| LPC Permit Application Information | 14651 | 2008-2026 | environment 8674, built_environment 4999, transport 819 | usable_with_caveats |
| NYC Open Data: DOB Certificate Of Occupancy | 10977 | 2012-2026 | built_environment 10977 | usable_with_caveats |
| NYC Open Data: DOB Job Application Filings | 9429 | 2008-2026 | built_environment 9429 | usable_with_caveats |
| NYC Open Data: DOB Certificate Of Occupancy | 8723 | 2012-2026 | built_environment 8721, environment 2 | usable_with_caveats |
| NYC Open Data: Affordable Housing Production by Building | 7382 | 2014-2026 | built_environment 7382 | usable_with_caveats |
| NYC Open Data: DOB NOW: Certificate of Occupancy | 2586 | 2021-2026 | built_environment 2586 | usable_with_caveats |
| Motor Vehicle Collisions - Crashes | 2389 | 2012-2026 | transport 2389 | usable_with_caveats |
| DOB Permit Issuance | 2380 | 2004-2020 | built_environment 2380 | usable_with_caveats |
| Affordable Housing Production by Building | 2160 | 2014-2025 | built_environment 2160 | usable_with_caveats |
| Street Construction Permits (2013-2021) | 1810 | 1904-2025 | transport 1807, built_environment 3 | usable_with_caveats |
| 2015 Street Tree Census - Tree Data | 1800 | 2015-2015 | environment 1782, transport 18 | usable_with_caveats |
| Fire Incident Dispatch Data | 1794 | 2005-2024 | civic_services 1784, built_environment 6, transport 4 | usable_with_caveats |

Catalog-only sources without emitted event rows: 122.

