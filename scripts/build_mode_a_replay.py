#!/usr/bin/env python3
"""Retired builder tombstone.

The old Mode A replay data builder is intentionally disabled. The active product
uses source-backed city-atlas artifacts and does not expose /data/mode-a as a
public atlas path.
"""

import sys

print(
    "This retired Mode A replay builder is disabled. "
    "Use `npm run build:data` for active city-atlas data.",
    file=sys.stderr,
)
sys.exit(1)
