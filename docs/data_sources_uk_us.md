# UK and US Data Sources

This is the starting source matrix for city-adapter contributors. Every dataset still needs source-level licence review before ingestion.

## Data Availability Matrix

| City | Source family | Status | Candidate sources | Notes |
| --- | --- | --- | --- | --- |
| Belfast | Planning | Partial local | NI planning activity statistics | Decision records are administrative events, not construction completions. |
| Belfast | OSM history | Partial local | OpenStreetMap Overpass, future ohsome | OSM timestamps are mapped visibility dates. |
| Belfast | Transport | Partial local | Translink open data, DfI/Translink project pages | Station/service events need source URLs and access dates. |
| Belfast | Civic services | Partial local | Belfast City Council open data and public pages | Facility pages support events; open datasets support current context. |
| Belfast | Statistics/environment | Partial local | Northern Ireland Air Belfast Centre 2021-2024 hourly CSV; NISRA and OpenDataNI still planned | Station-level air-quality monitoring is context, not citywide exposure or outcome evidence. Use statistics as context and denominators with official geography codes. |
| London | Planning | Partial source-backed | Planning Data brownfield land, conservation areas, listed-building outlines, heritage at risk, local-plan boundaries, Article 4 directions, tree-preservation records, Planning London Datahub application records | Legal/planning-status records and land pipeline evidence; Datahub application lifecycle dates are administrative planning records. |
| London | Open-data portal | Partial source-backed | London Datastore, London Fire Brigade incident records, Police.uk street-level crime/ASB rows, Police.uk stop-and-search rows | LFB incidents and Police.uk rows are operational/public-safety records; use as observed context, not built-form change or causal evidence. Stop-and-search rows are privacy-minimized before publication. |
| London | Housing/property market | Partial source-backed | HM Land Registry Price Paid yearly CSV rows, UK House Price Index full-file CSV | Transaction records from 1995 onward and aggregate borough-month HPI records through the latest published release. Use as housing-market evidence, not construction, affordability, displacement, or causal neighbourhood-change proof. |
| London | Public health / high street | Partial source-backed | Food Standards Agency Food Hygiene Rating Scheme API | Current-snapshot dated food-hygiene ratings by local authority. Adapter omits business names, addresses, postcodes, and contact fields; use as civic/public-health context, not business-opening or neighbourhood-causation evidence. |
| London | Transport | Partial source-backed | DfT STATS19 road-collision rows, TfL road disruption feed | Collision rows are reported personal-injury road-safety records; TfL disruptions are current/live feed records. Neither proves causation. |
| NYC | Open-data portal | Partial source-backed | NYC Open Data Socrata datasets | Use Socrata ids, dataset metadata, and update cadence. |
| NYC | Permits/buildings | Partial source-backed | NYC DOB Permit Issuance, DOB NOW approved permits, certificates of occupancy, HPD affordable housing production | Administrative records; label permits, approvals, starts, and completions separately. |
| NYC | Land use/parcels | Partial source-backed | NYC DCP ZAP, PLUTO/MapPLUTO, Parks properties | ZAP is planning/application history; parcel/property layers provide context unless version-diffed. |
| NYC | Heritage/public realm/transport | Partial source-backed | LPC landmark and historic-district designations, DOT street permits/closures, DOT street network changes, capital project tracker, permitted events, tree census, collision records, FDNY dispatch incidents | Designations, closures, network-change, dispatch, and project records describe observed administrative/status records, not permanent impact claims. |
| NYC | Demographics | Placeholder | US Census ACS/TIGER | Preserve geography vintage, table id, and margins of error. |

The generated machine-readable matrix for each city is `web/data/city-atlas/cities/<city_id>/availability.json`.

## Source Audits

| Source | Publisher | Licence / terms | Coverage and update notes | Reliability | Adapter recommendation |
| --- | --- | --- | --- | --- | --- |
| OpenStreetMap / Overpass | OSM contributors | ODbL 1.0 with attribution and share-alike requirements | Continuous edits; extract timestamp must be recorded | Usable with caveats | Use for mapped visibility and current geometry. Label dates carefully. |
| Open Government Licence v3 datasets | UK public-sector publishers | OGL v3 requires attribution and excludes some rights/personal data | Dataset-specific | Strong when dataset page is explicit | Good default for UK public data, but verify each resource. |
| Belfast City Council open data | Belfast City Council | Listed open datasets are free to use under OGL | Dataset-specific; page has open-data catalog | Strong | Use for facilities and local public-service context. |
| Translink open data | Translink/NITHC | OGL or Translink Access to Information Licence, dataset-specific | Feed-specific | Strong when feed licence is explicit | Use routes/stops/timetables with archived snapshots for history. |
| Planning London Datahub | GLA and London Planning Authorities | Public access; dataset/layer terms need review | Publicly accessible, daily updates during process | Usable with caveats | Good London planning adapter candidate. Preserve authority and quality notes. |
| London Datastore | Greater London Authority | Datastore terms and dataset-level terms | Dataset-specific | Strong | Good portal for London context layers and statistics. |
| TfL open data | Transport for London | TfL transport data terms | Feed-specific | Strong | Use current feeds for context; archived snapshots for historical replay. |
| NYC Open Data | NYC agencies and partners | NYC Open Data FAQ says no restrictions; Terms of Use still apply | Dataset-specific | Strong | Use Socrata ids, update metadata, and agency attribution. |
| NYC DOB data | NYC Department of Buildings | NYC Open Data / DOB dataset terms | Dataset-specific | Strong | Good for filings, permits, complaints, and violations as administrative events. |
| NYC MapPLUTO | NYC Department of City Planning | DCP release terms and disclaimers | Release-specific | Usable with caveats | Use as parcel context, not as dated change event source. |
| Planning Data brownfield/designations | MHCLG Planning Data | OGL v3 where dataset pages state it; Crown copyright/database right attribution | Collector and provider-specific | Strong for official planning-status records | Use row IDs, geometry points, quality fields, and local-planning-authority scope. |
| LFB incident records | London Fire Brigade / London Datastore | UK OGL where dataset page states it | 2009-present with periodic updates | Strong | Operational incident records; useful context, not causal built-form evidence. |
| DfT STATS19 road-collision data | Department for Transport | OGL v3 unless otherwise stated on GOV.UK | 1979-present, annual validated files plus provisional current-year files | Strong with scope caveat | Use as reported transport-safety events; label provisional rows and do not infer street-design causation. |
| HM Land Registry Price Paid Data | HM Land Registry | OGL v3 for Price Paid, with HM Land Registry address-data conditions for Ordnance Survey/Royal Mail-derived address fields | England and Wales yearly files from 1995; page updated monthly, with recent months incomplete and yearly files amendable | Strong with address-rights caveat | Use as property-transaction evidence. Omit address fields/full postcodes/exact prices in the atlas event layer and label postcode-derived points as approximate. |
| UK House Price Index | HM Land Registry / ONS / Registers of Scotland / Land and Property Services Northern Ireland | OGL v3 | Monthly full-file release; current artifact uses February 2026 data, published 22 April 2026 | Strong with revision caveat | Use as aggregate borough-level housing-market context. Label as nominal, revised over time, and not site-specific evidence. |
| Food Hygiene Rating Scheme API | Food Standards Agency / local authorities | OGL v3 | Current UK-wide API snapshot with rating dates; London local authorities publish independently | Strong with current-snapshot caveat | Use as dated public-health/high-street context. Do not infer openings, closures, business success, or broader area change from ratings. |
| Police.uk street-level crime/ASB data | Single Online Home National Digital Team / police forces | OGL v3 | Monthly street-level crime/ASB CSVs; custom download currently covers recent months | Strong with privacy caveat | Use as anonymized public-safety context. Locations are approximate and records are management information, not complete safety outcomes. |
| Police.uk stop and search data | Single Online Home National Digital Team / police forces | OGL v3 | Monthly stop-and-search CSVs by force where supplied | Strong with privacy minimization required | Omit demographic fields, exact timestamps, and operation names before writing atlas events; use only month-level public-safety context. |
| NYC HPD housing production | NYC HPD | NYC Open Data terms, HPD attribution | 2014-present housing production era | Strong with scope caveat | Covers HPD-counted affordable housing, not all housing delivery. |
| NYC capital and parks records | NYC Parks / NYC capital project agencies | NYC Open Data terms, agency attribution | Dataset-specific | Usable with caveats | Separate recorded actual dates/source reporting dates from projected dates. |

## Compatibility Notes

- OSM-derived artifacts must retain ODbL attribution and must not mix incompatible proprietary sources into an OSM-derived database.
- UK OGL datasets require attribution and may exclude personal data, logos, third-party rights, and non-published information.
- Public project web pages are useful evidence URLs but are not automatically open datasets.
- Permit and planning records are administrative events. They should be labelled as approvals, filings, starts, completions, or inspections based only on the source field that supports that date.
- Planning designations and protection records are legal/status evidence. Do not present them as physical redevelopment.
- Forecast completion, budget forecast, projected construction, or capacity fields are not observed outcomes. Display them only with explicit caveats.

## Verified Reference Pages

- OpenStreetMap copyright and licence: https://www.openstreetmap.org/copyright
- Open Government Licence v3.0: https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
- Belfast City Council open and linked data: https://www.belfastcity.gov.uk/open-and-linked-data
- Translink FOI and open data: https://www.translink.co.uk/foi-open-data
- Planning London Datahub: https://www.london.gov.uk/programmes-strategies/planning/digital-planning/planning-london-datahub
- London Datastore terms: https://data.london.gov.uk/about/terms-and-conditions/
- TfL open data users: https://tfl.gov.uk/info-for/open-data-users/
- DfT road safety open data: https://www.gov.uk/government/statistical-data-sets/road-safety-open-data
- HM Land Registry Price Paid Data: https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads
- HM Land Registry Price Paid guidance: https://www.gov.uk/guidance/about-the-price-paid-data
- UK House Price Index data downloads: https://www.gov.uk/government/statistical-data-sets/uk-house-price-index-data-downloads-february-2026
- Food Hygiene Rating Scheme API: https://www.food.gov.uk/uk-food-hygiene-rating-data-api
- Police.uk data downloads and licence: https://data.police.uk/data/
- NYC Open Data FAQ: https://opendata.cityofnewyork.us/faq/
- NYC DOB Data and Reporting: https://www.nyc.gov/site/buildings/dob/data-reporting.page
- NYC MapPLUTO metadata: https://www.nyc.gov/assets/planning/download/pdf/data-maps/open-data/meta_mappluto.pdf
