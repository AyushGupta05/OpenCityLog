# UK and US Data Sources

This is the starting source matrix for city-adapter contributors. Every dataset still needs source-level licence review before ingestion.

## Data Availability Matrix

| City | Source family | Status | Candidate sources | Notes |
| --- | --- | --- | --- | --- |
| Belfast | Planning | Partial local | NI planning activity statistics | Decision records are administrative events, not construction completions. |
| Belfast | OSM history | Partial local | OpenStreetMap Overpass, future ohsome | OSM timestamps are mapped visibility dates. |
| Belfast | Transport | Partial local | Translink open data, DfI/Translink project pages | Station/service events need source URLs and access dates. |
| Belfast | Civic services | Partial local | Belfast City Council open data and public pages | Facility pages support events; open datasets support current context. |
| Belfast | Statistics/environment | Planned | NISRA, OpenDataNI, Northern Ireland Air | Use as context and denominators with official geography codes. |
| London | Planning | Placeholder | Planning London Datahub | Public API and daily updates; preserve borough/source references and quality flags. |
| London | Open-data portal | Placeholder | London Datastore | Dataset-specific terms and update frequency must be recorded. |
| London | Transport | Placeholder | TfL open data | Feed terms and current-vs-historical status must be explicit. |
| NYC | Open-data portal | Placeholder | NYC Open Data | Use Socrata ids, dataset metadata, and update cadence. |
| NYC | Permits/buildings | Placeholder | NYC DOB Data & Reporting / NYC Open Data | Permit filings are administrative records, not completion evidence. |
| NYC | Land use/parcels | Placeholder | NYC DCP MapPLUTO | Parcel context only; do not treat as an event feed. |
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

## Compatibility Notes

- OSM-derived artifacts must retain ODbL attribution and must not mix incompatible proprietary sources into an OSM-derived database.
- UK OGL datasets require attribution and may exclude personal data, logos, third-party rights, and non-published information.
- Public project web pages are useful evidence URLs but are not automatically open datasets.
- Permit and planning records are administrative events. They should be labelled as approvals, filings, starts, completions, or inspections based only on the source field that supports that date.

## Verified Reference Pages

- OpenStreetMap copyright and licence: https://www.openstreetmap.org/copyright
- Open Government Licence v3.0: https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
- Belfast City Council open and linked data: https://www.belfastcity.gov.uk/open-and-linked-data
- Translink FOI and open data: https://www.translink.co.uk/foi-open-data
- Planning London Datahub: https://www.london.gov.uk/programmes-strategies/planning/digital-planning/planning-london-datahub
- London Datastore terms: https://data.london.gov.uk/about/terms-and-conditions/
- TfL open data users: https://tfl.gov.uk/info-for/open-data-users/
- NYC Open Data FAQ: https://opendata.cityofnewyork.us/faq/
- NYC DOB Data and Reporting: https://www.nyc.gov/site/buildings/dob/data-reporting.page
- NYC MapPLUTO metadata: https://www.nyc.gov/assets/planning/download/pdf/data-maps/open-data/meta_mappluto.pdf

