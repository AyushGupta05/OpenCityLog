# City Atlas Coverage Report

Generated: 2026-05-19T01:28:59Z

This report counts source-backed records emitted into `web/data/city-atlas`. It is not a claim of complete city coverage, and gaps are not padded with synthetic records.

| City | Events | Active sources | Catalog-only sources | Event years | Top layers | Gap to 100k |
| --- | ---: | ---: | ---: | --- | --- | ---: |
| Belfast, Northern Ireland | 30239 | 8 | 8 | 2007-2026 | transport 17118, built_environment 10920, utilities 851 | 69761 |
| London, England | 190196 | 34 | 94 | 1801-2026 | built_environment 71029, civic_services 53319, transport 37811 | 0 |
| New York City, New York | 29938 | 32 | 118 | 1797-2026 | built_environment 14766, transport 6235, environment 6081 | 70062 |

## Belfast, Northern Ireland

Backed events: 30239. Unique event IDs: 30239. Duplicate IDs: 0.

| Source | Events | Years | Layers | Reliability |
| --- | ---: | --- | --- | --- |
| OpenStreetMap extracts via Overpass API | 17965 | 2007-2026 | transport 17114, utilities 851 | usable_with_caveats |
| Northern Ireland planning activity statistics | 11347 | 2016-2025 | built_environment 10000, civic_services 675, economy 672 | strong |
| Belfast architecture and major project public pages | 911 | 2008-2026 | built_environment 911 | usable_with_caveats |
| Department for Communities / nidirect listed building records | 8 | 2016-2025 | built_environment 8 | usable_with_caveats |
| Belfast City Council public project and facility pages | 3 | 2017-2023 | civic_services 3 | usable_with_caveats |
| Translink public project and station pages | 3 | 2021-2024 | transport 3 | usable_with_caveats |
| Department for Infrastructure NI public project pages | 1 | 2018-2018 | transport 1 | usable_with_caveats |
| Ulster University public campus pages | 1 | 2022-2022 | built_environment 1 | usable_with_caveats |

Catalog-only sources without emitted event rows: 8.

## London, England

Backed events: 190196. Unique event IDs: 190196. Duplicate IDs: 0.

| Source | Events | Years | Layers | Reliability |
| --- | ---: | --- | --- | --- |
| Police.uk stop and search custom CSV downloads | 27792 | 2023-2026 | civic_services 27792 | usable_with_caveats |
| Police.uk crime and outcomes API | 27362 | 1829-2026 | environment 26697, transport 665 | usable_with_caveats |
| London Fire Brigade incident records | 27002 | 2005-2026 | civic_services 25510, environment 1339, transport 152 | usable_with_caveats |
| Road Safety Open Data - STATS19 collision records | 27000 | 2020-2025 | transport 27000 | usable_with_caveats |
| HM Land Registry Price Paid Data | 25600 | 1995-2026 | built_environment 25600 | usable_with_caveats |
| Planning Data: Listed Building Outlines | 13875 | 1949-2026 | built_environment 13875 | usable_with_caveats |
| UK House Price Index | 12342 | 1995-2026 | built_environment 12342 | usable_with_caveats |
| Food Hygiene Rating Scheme API | 9900 | 2004-2026 | transport 9900 | usable_with_caveats |
| Planning London Datahub - planning applications | 9485 | 2024-2026 | built_environment 9485 | usable_with_caveats |
| Planning Data: Brownfield Land | 5643 | 2017-2026 | built_environment 5643 | usable_with_caveats |
| Planning Data: Tree Preservation Zones | 1168 | 1951-2025 | built_environment 1168 | usable_with_caveats |
| Planning Data: Conservation Areas | 1129 | 1827-2026 | built_environment 1129 | usable_with_caveats |

Catalog-only sources without emitted event rows: 94.

## New York City, New York

Backed events: 29938. Unique event IDs: 29938. Duplicate IDs: 0.

| Source | Events | Years | Layers | Reliability |
| --- | ---: | --- | --- | --- |
| Motor Vehicle Collisions - Crashes | 2389 | 2012-2026 | transport 2389 | usable_with_caveats |
| DOB Permit Issuance | 2380 | 2004-2020 | built_environment 2380 | usable_with_caveats |
| Affordable Housing Production by Building | 2160 | 2014-2025 | built_environment 2160 | usable_with_caveats |
| Street Construction Permits (2013-2021) | 1810 | 1904-2025 | transport 1807, built_environment 3 | usable_with_caveats |
| 2015 Street Tree Census - Tree Data | 1800 | 2015-2015 | environment 1782, transport 18 | usable_with_caveats |
| Fire Incident Dispatch Data | 1794 | 2005-2024 | civic_services 1784, built_environment 6, transport 4 | usable_with_caveats |
| Housing Database Project Level Files | 1700 | 2010-2025 | built_environment 1700 | usable_with_caveats |
| LPC Permit Application Information | 1600 | 2004-2025 | built_environment 1600 | usable_with_caveats |
| Parks Properties | 1599 | 1797-2002 | environment 1580, transport 19 | usable_with_caveats |
| Individual Landmark Sites | 1542 | 1965-2025 | built_environment 1542 | usable_with_caveats |
| DOB Certificate Of Occupancy | 1309 | 2012-2026 | built_environment 1309 | usable_with_caveats |
| Capital Project Tracker | 1308 | 2013-2026 | environment 1112, built_environment 144, transport 52 | usable_with_caveats |

Catalog-only sources without emitted event rows: 118.

