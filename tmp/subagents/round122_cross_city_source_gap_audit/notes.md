# Cross-City Architecture Source Gap Audit

Date: 2026-05-19

Scope: London, New York City, and Belfast architecture/built-environment source families for 2008-2026. This audit read:

- `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json`
- `config/source_registry.json`

No candidate events were created. Existing repo files were not edited.

## Local Corpus Shape

The architecture milestone file currently has 186 source entries and 9,344 event entries.

Event counts by city:

- London: 2,958 events
- NYC: 5,297 events
- Belfast: 1,089 events

Source entries in the architecture milestone file:

- London: 106
- NYC: 41
- Belfast: 39

Source entries in `config/source_registry.json`:

- London: 121
- NYC: 57
- Belfast: 47
- Cross-city/global: 4

The strongest duplicate risk is source-family sprawl: some broad catch-all sources already cover a lot of rows, while several registry-only sources are not represented in the milestone source list. Future workers should expand/canonicalize existing source IDs before adding new ones.

## Concentration Risks

London is heavily dependent on:

- `london-architecture-public-pages`
- `historic-england-nhle`
- `historic-england-har-annual-map-series-2016-2025`
- `gla-planning-datahub-applications`
- `gla-planning-datahub-listed-building-consent`

NYC is heavily dependent on:

- `nyc-dob-filings-permits`
- `nyc-hpd-affordable-housing-production-hq68-rnsi-hg8x-zxpr`
- `nyc-architecture-public-pages`
- `nyc-dob-permit-issuance-ipu4-2q9a`
- `nyc-parks-capital-project-tracker-4hcv-tc5r`

Belfast is especially concentrated in:

- `belfast-architecture-public-pages`
- `bcc-planning-committee-minutes`
- `bcc-planning-committee-minutes-round119`
- `dfc-hed-nidirect-buildings`
- `ni-planning-portal-public-register`

The main Belfast concern is that `belfast-architecture-public-pages` accounts for most Belfast events, so official source-family IDs should be split out during future ingestion where possible.

## High-Yield Gaps

London:

- Expand existing PLD usage from approval rows into construction lifecycle fields: commencement and completion, where available.
- Use the London Development Database archive for 2008-2019 significant permissions and completions. It is already in the registry as `london-development-database-archive` but not in the milestone source list.
- Treat EPC data as corroboration only. It can help indicate assessed new or active building state, but not construction completion or opening.
- Add normal Planning Inspectorate appeal casework only where it fills ordinary appeal outcomes not covered by `mhclg-called-in-decisions`.
- Reject bulk London borough building-control certificate ingestion for now: fragmented, often fee-based, and not a central open source.

NYC:

- Add NYC Capital Projects Dashboard / CPDB as a citywide public capital spine. It should complement, not replace, Parks, DDC, SCA, NYCHA, HPD, and DOB sources.
- Add Public Design Commission design review for city-owned buildings, public spaces, streetscape elements, memorials, and public art. This is design approval evidence, not construction evidence.
- Add NYC DOT Current Projects and older project pages for public realm and street redesign work.
- Add NYCHA Capital Projects and Needs Tracker for public housing modernization and building-system work since 2017.
- Use SCA Capital Plan Reports/Data later for schools, de-duplicating against existing SCA source IDs.
- Reject broad new DOB scraping in this round because DOB filings, permits, and CO datasets are already heavily represented.

Belfast:

- Expand `ni-planning-portal-public-register` for per-application records and decision notices; use application references to avoid duplicate committee/minutes rows.
- Add Planning Appeals Commission NI for appeal outcomes after council decisions or DfI referrals.
- Use OpenDataNI / DfC HED spatial datasets as canonical heritage geometry/status feeds, while retaining HED/nidirect pages as detail citations.
- Add DfC public realm/environmental improvement and Belfast Regeneration pages as the official source family for streetscape/public realm schemes.
- Add Department of Education NI major works/school building pages for schools and education capital works.
- Use Belfast Region City Deal project pages for project-stage and funding/design milestones, with strong caveats against treating intended benefits as observed outcomes.
- Reject Belfast Building Control as a bulk source for now because no open repeatable register was identified.

## Priority Recommendations

Recommended `ingest_now` candidates:

- London: Planning London Datahub construction lifecycle expansion
- London: London Development Database archive
- NYC: NYC Capital Projects Dashboard / CPDB
- NYC: Public Design Commission design reviews/archive
- NYC: NYC DOT current and older street/public-realm project pages
- NYC: NYCHA Capital Projects and Needs Tracker
- Belfast: NI Planning Portal expansion
- Belfast: Planning Appeals Commission NI
- Belfast: OpenDataNI / DfC HED heritage spatial datasets
- Belfast: DfC public realm and Belfast Regeneration pages
- Belfast: Department of Education NI major works
- Belfast: Belfast Region City Deal project pages

Recommended `later` candidates:

- London: EPC open data for corroboration only
- London: Planning Inspectorate ordinary appeal casework
- London: Building Safety Regulator higher-risk building approval data
- NYC: SCA Capital Plan Reports/Data
- NYC: MTA Capital Program Dashboard
- Belfast: ISNI Investment Pipeline and project pages

Recommended `reject` candidates:

- London: Planning Data planning-application dataset for current ingestion, because the source itself says it is incomplete and not ready.
- London: bulk borough building-control certificate/register scraping.
- NYC: broad new DOB permits/filings/CO ingestion, because existing DOB source IDs already cover this.
- Belfast: Belfast City Council Building Control as a bulk source.
- Belfast: private crane/market surveys as direct source rows without explicit licence review.

## Duplicate-Avoidance Notes

Use these existing source IDs before adding new source families:

- London planning: `gla-planning-datahub-applications`, `gla-planning-datahub-listed-building-consent`, `london-planning-datahub-api`, `london-planning-datahub-core`, `gla-planning-application-decisions`
- London pre-2020 significant development: `london-development-database-archive`
- London appeals: `mhclg-called-in-decisions`
- London planning-data constraints/heritage: `planning-data-archaeological-priority-area`, `planning-data-article-4-direction-area`, `planning-data-asset-of-community-value`, `planning-data-certificate-of-immunity`, `planning-data-conservation-area`
- NYC DOB: `nyc-dob-filings-permits`, `nyc-dob-permit-issuance-ipu4-2q9a`, `nyc-dob-co-bs8b-p36w`, `nyc-dob-now-co-pkdm-hqz6`, `nyc-dob-open-data`, `nyc-certificates-occupancy`
- NYC public capital: `nyc-parks-capital-project-tracker-4hcv-tc5r`, `nyc-ddc-public-building-press-pages`, `nyc-ddc-news-archive-pages`, `nyc-sca-school-openings-projects`, `nycha-press-pages`
- Belfast planning: `ni-planning-portal-public-register`, `bcc-planning-committee-minutes`, `bcc-planning-committee-minutes-round119`, `bcc-current-planning-applications`, `bcc-live-major-applications-2025-05-06`, `bcc-live-major-applications-2026-04-14`
- Belfast heritage: `opendatani-spatial-ni`, `dfc-hed-buildings`, `dfc-hed-buildings-harni`, `dfc-hed-nidirect-buildings`, `dfc-harni`, `dfc-harni-belfast`, `dfc-hed-via-bcc-notifications`
- Belfast public projects: `dfi-ni-public-project-pages`, `translink-public-project-pages`, `round118-dfi-york-street-station-investment-2021`, `round118-doh-belfast-maternity-nearing-completion-2022`, `round118-qub-capital-completed-projects`, `round118-brcd-belfast-stories-design-team-2023`

## Method Caveats

- This is a source-family audit, not a completeness proof.
- License notes were checked at source-family level where practical, but every production ingestion should re-check resource-level terms.
- Public pages can move or mutate; future ETL should preserve retrieval date, source URL, source title, publisher, and where possible a checksum or archived snapshot reference.
- Planning, design review, funding, procurement, commencement, completion, opening, occupation, and outcome are distinct event stages and should not be collapsed.
