# Data Licence And Attribution

Bims City Atlas separates project code from upstream public data.

## Project Code

Code, scripts, tests, configuration examples, and project documentation in this
repository are provided under the MIT License unless a file says otherwise.

## Source Data

Raw, discovered, generated, and derived data artifacts are not automatically
relicensed by this repository. They remain governed by the licence or terms of
the upstream publisher.

Before reusing data from this repo, inspect:

- `config/source_registry.json`
- `web/data/city-atlas/cities/<city_id>/sources.json`
- `docs/data_sources_uk_us.md`
- event-level `evidence`, `provenance`, `source_ids`, `caveats`, and source
  licence fields

Generated atlas records are citation surfaces, not a substitute for upstream
licence review. Some records are sampled, privacy-minimized, approximate, or
restricted to source-backed metadata.

## Important Source Families

- Open Government Licence datasets require attribution and may exclude personal
  data, logos, third-party rights, or unpublished information.
- OpenStreetMap-derived geometry is governed by ODbL and must retain OSM
  attribution. Do not mix OSM-derived databases with incompatible proprietary
  sources.
- Planning, permit, incident, project, and hygiene-rating records are
  administrative or observed public records. They do not prove construction,
  occupancy, causation, displacement, safety, affordability, or wider impact.
- Data with review-required, not-specified, or dataset-specific terms should
  not be redistributed until the source terms are checked.

## Adding A Source

Every new source must include:

- publisher and source URL
- licence name and licence URL
- attribution text
- accessed or retrieved date
- coverage years and geography
- update frequency when known
- reliability and confidence notes
- caveats for privacy, approximation, completeness, and date interpretation
- transformation script or method reference

If a source licence is unclear, mark the source as review-required and exclude
it from headline data packs until the licence is resolved.
