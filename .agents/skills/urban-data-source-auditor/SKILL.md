---
name: urban-data-source-auditor
description: Audit UK and US city data sources for Bims-5 before ingestion. Use when selecting or reviewing planning, development, transport, environmental, demographic, boundary, basemap, permit, zoning, air-quality, or open-data sources; check license, coverage years, update frequency, geographic scope, reliability, provenance fields, and whether the source supports observed city-change claims without overclaiming.
---

# Urban Data Source Auditor

## Description

Use this skill to decide whether a city data source is suitable for the Bims-5 changelog/atlas and what caveats must follow it into the UI and docs.

## When To Use

- Adding or comparing UK/US city sources.
- Creating a city adapter source list.
- Reviewing `config/source_inventory.json`, source manifests, or data-acquisition docs.
- Checking whether a dataset can support event dates, geometry, indicators, or historical analogues.

## Inputs

- Source URL, portal page, API docs, downloaded file, or source manifest entry.
- Target city/geography and intended use.
- Existing source inventory or license notes.
- Any sample rows/schema.

## Output Format

Return a source audit table with:

- Source name and publisher.
- URL/API endpoint.
- License and attribution requirements.
- Coverage years and update frequency.
- Geographic scope and granularity.
- Key fields for events, dates, geometry, and indicators.
- Reliability assessment: strong, usable with caveats, risky, or reject.
- Required caveats for UI/docs.
- Ingestion recommendation and next checks.

## Checklist

- Is the license compatible with open-source publication and derived artifacts?
- Are coverage years explicit, and do they match the desired timeline?
- Is update frequency published or inferable?
- Is the geography clear enough for map/event use?
- Are effective dates distinct from publication, edit, and retrieval dates?
- Are geometry source and capture date available?
- Can source rows be cited or linked?
- Does the source have known gaps, stale periods, suppressed fields, or quality warnings?
- Does it require authentication, scraping, or terms that block redistribution?
- For OSM/ohsome, is edit history clearly labelled as edits, not real-world change dates?

## Failure Modes To Avoid

- Assuming "open data" means redistribution is allowed.
- Using a portal landing page as a license.
- Treating latest snapshot data as historical truth.
- Ignoring missing geography or ambiguous dates.
- Combining sources without preserving per-source license and attribution.
- Selecting sources because they are easy to scrape rather than because they are reliable.

