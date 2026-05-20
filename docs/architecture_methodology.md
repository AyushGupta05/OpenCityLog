# Architecture Change Atlas Methodology

This pass covers London, New York City, and Belfast from `2008-01-01` through `2026-05-20`. It treats records as observed administrative or documented milestones. Planning approval is not construction, permit issuance is not completion, and a source-reported project intention is not a delivered outcome.

## Source Freeze

The frozen priority source inventory is `config/architecture_source_inventory.json`. Each row records source id, publisher, source family, API/CSV/portal/docs URLs, coverage years, update frequency, geography, licence, attribution, redistribution caveat, date fields, geometry fields, row id fields, status fields, current artifacts, supported event types, confidence default, caveats, and next checks.

The same 22 priority source-family entries are synchronized into `config/source_registry.json` by `npm run sync:architecture-registry`. The registry entries keep the inventory fields under `architecture_inventory` so source briefs can display access, data shape, and caveats without hardcoded copy.

Priority source families:

- London: Planning London Datahub, London Development Database archive, Planning Data listed-building outlines, Historic England/NHLE, and borough planning portals.
- New York City: DOB permit issuance, DOB job filings, DOB NOW filings and approved permits, DOB certificates of occupancy, LPC permits, ZAP planning records, Public Design Commission records, and HPD affordable-housing production.
- Belfast: DfI planning statistics, NI Planning Portal, Belfast current planning applications, Belfast committee packs, HED buildings records, HARNI, and official project pages from public owners/operators.

## Collection Workflow

1. Freeze source inventory before event collection. Add licence, coverage, data-shape, caveat, and next-check fields first.
2. Prefer APIs and CSV files. Use portal pages or manual project pages only when no structured source is available or when a completion/opening claim needs an official page.
3. Preserve raw or candidate artifacts in `tmp/subagents/...`, `planning_statistics/`, or the architecture milestone package. Do not silently overwrite raw source rows.
4. Filter to the city and date window. Date filtering uses the source event date, not retrieval date.
5. Normalize candidate rows into `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json`, preserving source row ids, source URLs, source date fields, coordinates or affected-area labels, confidence, licence/terms notes, attribution, limitations, and transformation method.
6. Build generated atlas event chunks through the existing city-atlas builders. Generated events map the raw architecture `bucket` into UI-facing `category` and `lens` fields.
7. Build architecture coverage artifacts with `npm run build:architecture-coverage`.
8. Build the consolidated per-source manifest with `npm run build:architecture-source-registry`.
9. Refresh row/source URL spot checks with `npm run spot-check:architecture-urls`; the generated manifest records reachable, access-controlled, and failed URLs without treating access control as source absence.

## Event Classification

Allowed architecture event types are:

- `planning_application`
- `planning_decision`
- `permit_issued`
- `heritage_permit`
- `listed_building_change`
- `demolition`
- `construction_start`
- `opening`
- `completion`

Completion and opening are used only when the cited source explicitly says a project completed, opened, reopened, launched, issued a certificate of occupancy, or otherwise documents the milestone being displayed. Certificates of occupancy are legal/administrative occupancy records; they are not whole-project narratives.

## Confidence

- `documented`: one official or reliable public source directly records the displayed milestone/date.
- `corroborated`: two independent organizations support the same milestone/date.
- `inferred`: geometry, date, or classification is derived from a source row, geocoder, register state, or approximate source wording.
- `disputed`: source records conflict or known quality issues affect the claim.

Corroboration requires independent organizations, not two pages from the same publisher. Inferred records must remain visibly caveated and excluded from headline delivery claims unless explicitly labelled.

## Deduplication

Deduplication uses source row id and source id first. If no exact source-row match exists, compare city, source ids, source record id, date, bucket/event family, title, address/site name, and geometry. Distinct lifecycle milestones from the same project remain separate events.

When records describe the same administrative milestone, merge evidence in the normalized event and keep raw/candidate rows available for review. Do not delete or mutate raw source records as a correction mechanism.

## Rejection Rules

Reject records when they lack a licence/terms basis, source URL, usable source date, geometry or affected-area label, source row id, or public-interest reason for any personal data. Reject records whose wording implies causality, speculative future modelling, construction outcome, completion, opening, or public benefit beyond the cited source.

Planning representations, public comments, names, signatures, private contact details, applicant documents, images, maps, and full PDFs are not ingested into public artifacts without a separate privacy and rights review.

## Artifacts

- Source inventory: `config/architecture_source_inventory.json`
- Source registry: `config/source_registry.json`
- Consolidated per-source architecture registry: `manifests/architecture_source_registry.json`
- Inventory schema: `schemas/architecture_source_inventory.schema.json`
- Manual candidate/event package: `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json`
- Architecture coverage JSON: `web/data/city-atlas/architecture-coverage-report.json`
- Architecture coverage notes: `docs/architecture_coverage_report.md`
- Row/source URL spot-check manifest: `manifests/architecture_url_spot_check.json`
- Generated atlas events: `web/data/city-atlas/cities/<city_id>/events*.json`

## Verification

Run:

```powershell
npm run sync:architecture-registry
npm run build:architecture-source-registry
npm run build:architecture-coverage
npm run spot-check:architecture-urls
npm run verify:architecture
npm run verify
```

`verify:architecture` checks the fixed date window, inventory schema, required priority sources, inventory-to-registry synchronization, the consolidated per-source architecture registry, the URL spot-check manifest, event/source required fields, HTTP source URLs, source row ids, confidence labels, coordinates, duplicate event ids, duplicate source-record milestones, and overclaiming language.

Known remaining thin areas are listed in `docs/architecture_coverage_report.md`: Belfast application-level annual planning CSVs and NI Planning Portal linking, London borough document links beyond PLD summaries, and NYC lifecycle linking across DOB NOW, DOB, LPC, ZAP, HPD, and certificate records.
