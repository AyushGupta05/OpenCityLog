# London discovery limitations

Updated: 2026-04-28T13:01:12.753027+00:00

This is a larger Part 1 discovery package, not a row-level ingestion or complete causal impact model. Sources were expanded with additional spatial layers, operational tables, environmental layers, public-service data, historical/imagery sources, and borough/agency portals.

## General limits
- No open package can literally include every event in the history of London/NYC. This package prioritises official/open sources that can seed a city-change atlas.
- Many records are proxies: permit/application dates are not construction dates; planning approval is not completion; modelled flood/noise/heat is not observed impact; public complaints are not complete incident universes.
- Borough/local portals and specialist feeds often have heterogeneous schemas, licences, rate limits and API access requirements.
- Full production use still needs row-level download, geometry/date normalisation, licence review, source briefs and confidence labels.

## Lightweight metadata fetch warnings
- gla-planning-datahub-applications: Planning London Datahub - planning applications. Warning/error: ['NetworkError: <urlopen error [Errno -2] Name or service not known>', 'NetworkError: <urlopen error [Errno -2] Name or service not known>']
- historic-england-nhle: National Heritage List for England (NHLE) downloads. Warning/error: ['HTTPError: Forbidden']
- gla-population-projections: GLA population projections. Warning/error: ['HTTPError: Forbidden']
- environment-agency-lidar: National LIDAR Programme data. Warning/error: ['NetworkError: The read operation timed out']
- dfe-gias: Get Information About Schools (GIAS). Warning/error: ['HTTPError: Forbidden']
- lldc-planning-authority: LLDC Planning Authority planning register and policy. Warning/error: ['NetworkError: <urlopen error timed out>']
- lon-extra-voa-non-domestic-rating-list-business-floorspace: VOA Non-Domestic Rating List / business floorspace. Warning/error: ['HTTPError: Not Found']
- lon-extra-national-public-transport-gazetteer: National Public Transport Gazetteer. Warning/error: ['HTTPError: Not Found']
- lon-extra-bus-open-data-service: Bus Open Data Service. Warning/error: ['HTTPError: Forbidden']
- lon-extra-network-rail-open-data-feeds: Network Rail Open Data feeds. Warning/error: ['HTTPError: Forbidden']
- lon-extra-traffic-regulation-orders-data-service: Traffic Regulation Orders data service. Warning/error: ['HTTPError: Not Found']
- lon-extra-national-forest-inventory-woodland-england: National Forest Inventory Woodland England. Warning/error: ['HTTPError: Not Found']
- lon-extra-tree-cover-outside-woodland: Tree Cover Outside Woodland. Warning/error: ['HTTPError: Not Found']
- lon-extra-strategic-noise-mapping-england: Strategic Noise Mapping England. Warning/error: ['HTTPError: Not Found']
- lon-extra-risk-of-flooding-from-surface-water: Risk of Flooding from Surface Water. Warning/error: ['HTTPError: Not Found']
- lon-extra-magic-map-environmental-designations: MAGIC Map environmental designations. Warning/error: ['NetworkError: <urlopen error [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1000)>']
- lon-extra-city-of-london-open-data: City of London Open Data. Warning/error: ['NetworkError: <urlopen error [Errno -2] Name or service not known>']
- lon-extra-westminster-open-data: Westminster Open Data. Warning/error: ['NetworkError: <urlopen error [Errno -2] Name or service not known>']
- lon-extra-hackney-open-data: Hackney Open Data. Warning/error: ['NetworkError: <urlopen error [Errno -2] Name or service not known>']
- lon-extra-islington-open-data: Islington Open Data. Warning/error: ['NetworkError: <urlopen error [Errno -2] Name or service not known>']
- lon-extra-southwark-open-data: Southwark Open Data. Warning/error: ['NetworkError: <urlopen error [Errno -2] Name or service not known>']
- lon-extra-lambeth-open-data: Lambeth Open Data. Warning/error: ['NetworkError: <urlopen error [Errno -2] Name or service not known>']
- lon-extra-rbkc-open-data: RBKC Open Data. Warning/error: ['NetworkError: <urlopen error [Errno -2] Name or service not known>']
- lon-extra-waltham-forest-open-data: Waltham Forest Open Data. Warning/error: ['HTTPError: Not Found']
- lon-extra-historic-england-aerial-photo-explorer-archive: Historic England Aerial Photo Explorer / Archive. Warning/error: ['HTTPError: Forbidden']
