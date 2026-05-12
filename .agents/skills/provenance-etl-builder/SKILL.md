---
name: provenance-etl-builder
description: Build or review Bims-5 ETL scripts that produce city-change events, source manifests, provenance artifacts, schemas, and verification fixtures. Use when changing Python or Node data pipelines, normalizing public data, generating event/source/provenance JSON or NDJSON, adding city adapters, or ensuring every displayed claim traces to source rows, files, licenses, retrieval dates, geometry, and transformation methods.
---

# Provenance ETL Builder

## Description

Use this skill to design, implement, or review ETL that turns public city data into reproducible Bims-5 event/source/provenance artifacts.

## When To Use

- Building scripts in `scripts/` that read raw data and emit manifests or events.
- Reviewing generated files in `manifests/`, `api/`, `build/`, or `web/data/`.
- Adding schemas or verifiers for events, sources, indicators, or city manifests.
- Migrating legacy layer/year replay data toward event-first contracts.

## Inputs

- Source inventory entries.
- Raw data samples or fixture files.
- Target output schema or frontend contract.
- Existing ETL script and verifier output.
- License and attribution requirements.

## Output Format

Return:

1. Contract: expected output files and required fields.
2. Pipeline plan: read, normalize, validate, enrich provenance, write, verify.
3. Test plan: fixtures, negative cases, schema validation, and command list.
4. Risk notes: data gaps, ambiguous dates, geometry quality, and license issues.
5. Implementation/review findings with file paths and line references when available.

## Checklist

- Preserve source ID, row/file reference, URL, publisher, license, and accessed date.
- Separate effective date, publication date, retrieval date, and geometry capture date.
- Validate required provenance before writing output.
- Emit stable IDs and deterministic ordering.
- Keep raw-source parsing separate from domain normalization.
- Include fixtures for missing license, invalid geometry, ambiguous date, and duplicate event.
- Generate human-readable summaries for coverage and rejected records.
- Make inferred/modelled values explicit and machine-readable.
- Avoid mutating raw inputs or silently overwriting corrections.

## Failure Modes To Avoid

- Building strings by hand where structured parsers are available.
- Letting generated files become the only source of truth.
- Dropping license or attribution during transformations.
- Encoding year or city truth only in file paths.
- Passing ETL despite partial failure or skipped records without a reject report.
- Extending legacy forecast/simulation artifacts instead of creating event/provenance contracts.

