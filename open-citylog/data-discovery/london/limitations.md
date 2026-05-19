# London source limitations - Open Citylog Part 1 discovery

Retrieved: 2026-04-28T11:07:11.795950+00:00

This folder is a discovery inventory, not a finished ingestion. It identifies official source systems, access paths, licences/terms to check, and seed event cards.

Core caveats:
- Event dates must be tied to source rows/documents during Part 2 ingestion before appearing as production facts.
- Geometry must be sourced from official polygons/rows or explicitly labelled as approximate.
- Indicator snapshots must keep vintage, geography and uncertainty/margins-of-error.
- Planning approval, permit issue, construction start and completion are different states; do not collapse them.
- Air-quality monitors or modelled rasters are contextual evidence only unless the method states distance/site representativeness.
- Private/project websites are useful leads but need public/official corroboration for high-confidence events.
- Licences marked unknown/unspecified must be checked before redistribution of raw data.

Outstanding source-access gaps from the latest refresh:
- lon_lldc_planning_register: page snapshot still unresolved (URLError(ConnectionResetError(104, 'Connection reset by peer'))). Keep as a documented gap until a stable replacement URL/API path is confirmed.
- lon_dfe_schools: page snapshot still unresolved (<HTTPError 403: 'Forbidden'>). Keep as a documented gap until a stable replacement URL/API path is confirmed.
- lon_nhs_ods: page snapshot still unresolved (<HTTPError 404: 'Not Found'>). Keep as a documented gap until a stable replacement URL/API path is confirmed.
- lon_high_streets: page snapshot still unresolved (<HTTPError 404: 'Not Found'>). Keep as a documented gap until a stable replacement URL/API path is confirmed.
- lon_voa_nndr: page snapshot still unresolved (<HTTPError 404: 'Not Found'>). Keep as a documented gap until a stable replacement URL/API path is confirmed.


## Expanded-scope note

This pass broadened London coverage toward whole-city history over time, traffic/mobility, and event/change chronology. New London Datastore pages were verified for traffic flows, road-network KPIs, congestion-charge indicators, collisions/casualties, public-transport journeys, RODS travel patterns, and historical census series. Remaining London gaps still exist for sources that currently 403/404/reset or otherwise resist lightweight public verification.
