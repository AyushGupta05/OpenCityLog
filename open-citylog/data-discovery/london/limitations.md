# London source limitations - Open Citylog Part 1 discovery

Retrieved: 2026-04-28T09:52:10.257166+01:00

This folder is a discovery inventory, not a finished ingestion. It identifies official source systems, access paths, licences/terms to check, and seed event cards.

Core caveats:
- Event dates must be tied to source rows/documents during Part 2 ingestion before appearing as production facts.
- Geometry must be sourced from official polygons/rows or explicitly labelled as approximate.
- Indicator snapshots must keep vintage, geography and uncertainty/margins-of-error.
- Planning approval, permit issue, construction start and completion are different states; do not collapse them.
- Air-quality monitors or modelled rasters are contextual evidence only unless the method states distance/site representativeness.
- Private/project websites are useful leads but need public/official corroboration for high-confidence events.
- Licences marked unknown/unspecified must be checked before redistribution of raw data.
