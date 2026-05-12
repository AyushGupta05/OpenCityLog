# Retired Mode A replay contract

This document is intentionally retained only as a tombstone for the old replay contract.

The active product data contract is `web/data/city-atlas/index.json` plus the per-city event, source, current-state, and imagery manifests under `web/data/city-atlas/`.

The former Mode A replay artifacts are not public atlas endpoints. The local server returns `410 Gone` for `/data/mode-a/...`, and browser smoke tests assert that this retired path stays unavailable.

Do not reintroduce the retired replay contract unless a future accepted product spec defines a source-backed city-atlas use case and includes explicit tests.
