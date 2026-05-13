#!/usr/bin/env python3
"""Retired builder tombstone.

The old replay-manifest builder is intentionally disabled. The active product
uses the city-atlas artifacts under web/data/city-atlas/ and an OpenStreetMap
raster basemap configured in web/atlas.js.
"""

import sys

print(
    "This retired replay-manifest builder is disabled. "
    "Use `npm run build:data` for active city-atlas artifacts.",
    file=sys.stderr,
)
sys.exit(1)
