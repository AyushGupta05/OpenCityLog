# Round 195 Belfast Deep Tail Notes

Created a scratch-only conservative candidate pack from official/public Belfast City Council and Department for Communities source families.

## Included source families

- BCC physical investment project/status pages: Cathedral Gardens and Giant's Park.
- BCC regeneration/status pages: Future City Centre Programme, Vacant to Vibrant, BelfastWiFi, and Open and linked data.
- DfC public realm / architecture pages: Five Cs screening and MAG Living High Streets launch.

## Dedupe

The generator indexes the current architecture milestone corpus, Belfast atlas event chunks, prior Belfast candidate packs, and explicitly rounds 177, 183, and 189. It rejects duplicate event_id, source-record/date, and title/date keys.

## Caveats

- Several records are programme, current-status, publication, screening, works-start, or initiative-launch milestones rather than completed physical works.
- Point geometries are review coordinates only; they are not surveyed boundaries, parcels, asset footprints, hotspot locations, or street alignments.
- Current-status records use the retrieval date because the source page did not state an exact effective date. They should be corroborated before production import.
- No candidate claims causation, impact, usage, vacancy reduction, access quality, economic effect, or forecast outcome.

Accepted candidates: 13
Rejected seeds: 0
