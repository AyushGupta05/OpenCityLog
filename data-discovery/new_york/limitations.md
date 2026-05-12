# New York discovery limitations

Updated: 2026-04-28T13:01:12.753027+00:00

This is a larger Part 1 discovery package, not a row-level ingestion or complete causal impact model. Sources were expanded with additional spatial layers, operational tables, environmental layers, public-service data, historical/imagery sources, and borough/agency portals.

## General limits
- No open package can literally include every event in the history of London/NYC. This package prioritises official/open sources that can seed a city-change atlas.
- Many records are proxies: permit/application dates are not construction dates; planning approval is not completion; modelled flood/noise/heat is not observed impact; public complaints are not complete incident universes.
- Borough/local portals and specialist feeds often have heterogeneous schemas, licences, rate limits and API access requirements.
- Full production use still needs row-level download, geometry/date normalisation, licence review, source briefs and confidence labels.

## Lightweight metadata fetch warnings
- new-033-mta-subway-turnstile-data: MTA Subway Turnstile Data. Warning/error: []
- new-044-u-s-census-api-decennial-census-and-acs: U.S. Census API: Decennial Census and ACS. Warning/error: ['NetworkError: <urlopen error [Errno -3] Temporary failure in name resolution>']
- new-055-epa-ejscreen-and-environmental-justice-data: EPA EJScreen and environmental justice data. Warning/error: ['NetworkError: <urlopen error [Errno -3] Temporary failure in name resolution>']
