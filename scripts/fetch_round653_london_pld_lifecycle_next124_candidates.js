#!/usr/bin/env node

console.error(
  [
    "Provenance stub: architecture_milestones_2008_2026.json cites",
    "scripts/fetch_round653_london_pld_lifecycle_next124_candidates.js,",
    "but the original one-off fetch script was not present in the baseline checkout.",
    "The normalized source-backed rows remain in the architecture milestone package.",
  ].join(" "),
);
process.exitCode = 1;
