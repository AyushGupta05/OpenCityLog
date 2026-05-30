#!/usr/bin/env node

console.error(
  [
    "Provenance stub: architecture_milestones_2008_2026.json cites",
    "scripts/fetch_round652_nyc_lpc_permit_next114_candidates.js,",
    "but the original one-off fetch script was not present in the baseline checkout.",
    "The normalized source-backed rows remain in the architecture milestone package.",
  ].join(" "),
);
process.exitCode = 1;
