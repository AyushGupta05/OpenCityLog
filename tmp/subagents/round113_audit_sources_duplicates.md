# Round113 Source-Family and Duplicate Audit

Worker K audit-only output. I inspected the manual architecture corpus and generated city atlas after round112, and wrote no files outside `tmp/subagents`.

## Key Counts

- Manual architecture corpus: 3136 events.
- Generated atlas: 250524 events, 0 duplicate event IDs, 80 active sources.
- Architecture public-page corpus by city: London 1028, NYC 1014, Belfast 919.

## Highest-Value Next Official Sources

### London

1. Planning London Datahub applications and development-progress fields: use `gla-planning-datahub-applications`, `london-planning-datahub-core`, and `london-planning-datahub-api` as canonical planning rows. Gate on application reference + LPA code; geometry/title alone is only a review candidate.
2. Planning Data / Historic England designation rows: `lon-extra-planning-data-listed-building-outlines`, `planning-data-certificate-of-immunity`, `lon-extra-planning-data-heritage-at-risk`, `historic-england-nhle`. These should canonicalize listing/designation events and demote public pages to corroboration.
3. London Development Database archive: fill pre-2024 approval/completion history, but keep permission, start, completion and occupation as separate event types.

### NYC

1. DOB permits and certificates of occupancy: `ipu4-2q9a`, `rbx6-tga4`, `w9ak-ipjd`, `bs8b-p36w`, `pkdm-hqz6`. Canonical keys should be job number, BIN, BBL and permit/CO number.
2. DCP ZAP project data and BBL crosswalk: `hgx4-8ukb`, `2iga-a6mk`. Merge only by ZAP/ULURP/application ID; BBL proximity alone is not enough.
3. LPC landmark and permit data: `buis-pvji`, `dpm2-m9mq`, `nyc-lpc-permit-application-information`. Current collisions show these can canonicalize landmark designation events.

### Belfast

1. NI Planning Portal / Belfast planning applications and decisions: use application references as mandatory merge keys. Current planning-statistics rows create many spatial near-matches that are false-positive prone.
2. Belfast City Council open data and official facility/project pages: best for leisure, market, park, civic-facility and public-realm milestones. Merge by official URL + facility name + same event year/type.
3. DfC HED plus Translink/DfI project evidence: canonicalize heritage and station/transport milestones using HED record numbers or project/station identifiers where available.

## Current Soft Duplicate Hotspots

- London: 197 architecture-vs-official soft collisions found; mostly listed-building outline rows colliding with `london-architecture-public-pages` listing milestones. Examples include Lloyd's Building, Chelsea Embankment Cabmen's Shelter, and The Picturehouse / The Forum.
- NYC: 259 architecture-vs-official soft collisions found; mostly LPC individual landmark rows colliding with `nyc-architecture-public-pages`. Examples include 830 Broadway, 832-834 Broadway, and 550 Madison Avenue.
- Belfast: 485 architecture-vs-official soft collisions found. Exact duplicates include Andersonstown Leisure Centre, York Street Station, and Belfast Grand Central Station; planning-statistics near-matches should be treated as review candidates only.

## Strict Duplicate Gates

Hard duplicate only when one of these holds:

- Same city and same canonical source record ID: planning application reference, permit number, CO number, ZAP project ID, LPC landmark ID, NHLE/list-entry ID, HED record ID, or official project URL.
- Same city, normalized source URL, and source record ID.
- Same city, normalized title/address, same effective date and date type, same event type, and distance <= 25 m when no canonical ID exists.

Soft candidate only:

- Same city/year, distance <= 100 m, and title/address token similarity >= 0.35.
- Same site/facility name within +/- 1 year where a public-page milestone meets an official administrative row.
- Same property identifier family but different date fields.

Do not auto-merge planning approval, start, completion, CO, opening, listing/designation, funding/budget, or OSM edit events. They can refer to the same place while documenting different observed changes.

See `tmp/subagents/round113_audit_sources_duplicates.json` for source/year counts by city and machine-readable recommendations.
