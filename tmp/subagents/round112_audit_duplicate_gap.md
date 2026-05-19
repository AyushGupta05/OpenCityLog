# Round 112 Architecture Duplicate/Gap Audit

Generated: 2026-05-19T02:07:07.339Z

Scope: Architecture-related official/source-family audit for London, NYC, and Belfast, 2008-2026. Counts use architecture_milestones seed and generated yearly atlas events whose provenance/source ids point back to that seed/source family.

Manual seed event count: 2999

## london

Manual seed architecture events: 1058

Generated architecture events read from yearly atlas outputs: 1058

Top source_id counts:
- london-architecture-public-pages: 1028
- historic-england-nhle: 30

Duplicate key groups:
- Exact same city/title/date/source_url/source_record_id: 0
- Same source_record_id or source_url with different title/date: 0
- Same normalized title/date/city with different source record: 0

Underrepresented official source families:
- **GLA Planning London Datahub / borough planning application records**: Registered in sources.json but absent from architecture seed counts; current seed relies on public project pages and NHLE rather than application-level official records. Recommendation: Use Datahub application id plus borough/LPA, decision/validated dates, and document links as administrative events; never treat permission as completion.
- **London Development Database / residential approvals/completions dashboards**: No direct seed counts from LDD despite many named built-environment milestones. Recommendation: Use scheme id/site and permission/start/completion fields to corroborate major housing or mixed-use milestones.
- **Borough planning portals and committee decision notices**: Many borough council pages appear as generic public-page evidence, but no normalized borough-portal source ids or application references. Recommendation: Require local authority, application/reference number, decision date, and document URL before ingesting planning-stage events.
- **Building control/completion certificates and official completions**: Opening/completion claims are mostly project/news pages; administrative completion evidence is thin. Recommendation: Prefer completion certificate/building-control or GLA completion fields for built/opening events when available.
- **Mayoral development corporations and public estate bodies (LLDC, OPDC, NHS estates, DfE/Get Information About Schools)**: Public realm, schools, health, and regeneration entries are mixed into generic architecture pages. Recommendation: Create specific source ids for each official body to avoid broad bucket duplicates and improve licence review.

Duplicate-risk patterns:
- Generic public-page source ids aggregate many publishers; require publisher + canonical URL + record_id namespace so later official-source ingestion can match instead of duplicating.
- Opening, completion, listing/designation, planning permission, refurbishment, and reopening are different event types; duplicate checks should include event_type/status_phase, but also flag same site/date across event types for reviewer triage.
- Source URLs with query strings, trailing slashes, news mirrors, and renamed pages should be canonicalized before duplicate comparison.
- source_record_id values must be namespaced by source_id and stable upstream id; slug-only ids are collision-prone across rounds.
- Exact title matching misses near duplicates where worker batches rewrite titles; use normalized title + city + date + approximate coordinate/site label as a soft duplicate gate.

## nyc

Manual seed architecture events: 1014

Generated architecture events read from yearly atlas outputs: 1014

Top source_id counts:
- nyc-architecture-public-pages: 1014

Duplicate key groups:
- Exact same city/title/date/source_url/source_record_id: 0
- Same source_record_id or source_url with different title/date: 0
- Same normalized title/date/city with different source record: 4

Underrepresented official source families:
- **NYC DOB filings, permits, and Certificates of Occupancy**: Rich DOB sources are registered but absent from current architecture seed counts. Recommendation: Require job/permit/CO ids, BIN/BBL, status date type, and distinguish filing/permit/temporary CO/final CO from physical completion.
- **DCP ZAP / ULURP / CEQR land-use records**: Current seed is mostly LPC and public project pages rather than official zoning/environmental-review workflow records. Recommendation: Ingest project/action ids and milestone dates as planning-process events with caveats, not built outcomes.
- **DCP PLUTO/MapPLUTO and archived Bytes releases**: Parcel/building-stock snapshots are registered but not used as corroborating architecture source families. Recommendation: Use BBL/BIN/year-built/land-use changes for corroboration and geometry joins, with snapshot-vintage caveats.
- **HPD housing and capital project delivery datasets**: Affordable/public housing delivery is likely underrepresented by official HPD records. Recommendation: Use project/building ids and completion/finance closing dates where available; keep finance milestone separate from occupancy.
- **NYC DDC / Parks / Libraries / SCA capital projects**: Civic facilities appear through generic public pages without normalized agency project ids. Recommendation: Create agency-specific source ids and require contract/project number where exposed.

Duplicate-risk patterns:
- Generic public-page source ids aggregate many publishers; require publisher + canonical URL + record_id namespace so later official-source ingestion can match instead of duplicating.
- Opening, completion, listing/designation, planning permission, refurbishment, and reopening are different event types; duplicate checks should include event_type/status_phase, but also flag same site/date across event types for reviewer triage.
- Source URLs with query strings, trailing slashes, news mirrors, and renamed pages should be canonicalized before duplicate comparison.
- source_record_id values must be namespaced by source_id and stable upstream id; slug-only ids are collision-prone across rounds.
- Exact title matching misses near duplicates where worker batches rewrite titles; use normalized title + city + date + approximate coordinate/site label as a soft duplicate gate.

## belfast

Manual seed architecture events: 927

Generated architecture events read from yearly atlas outputs: 927

Top source_id counts:
- belfast-architecture-public-pages: 919
- dfc-hed-nidirect-buildings: 8

Duplicate key groups:
- Exact same city/title/date/source_url/source_record_id: 0
- Same source_record_id or source_url with different title/date: 0
- Same normalized title/date/city with different source record: 3

Underrepresented official source families:
- **NI Planning Portal / application-level planning records**: NI planning statistics are registered, but application-level planning records are not represented in architecture seed counts. Recommendation: Require application reference, decision/status date, address/site, authority, and document URL; keep planning consent distinct from construction/opening.
- **Belfast City Council open data and committee/minutes records as normalized source ids**: Council evidence is mostly folded into belfast-architecture-public-pages rather than specific official source ids. Recommendation: Split council minutes, open data, leisure/parks, and capital projects into stable source families to reduce broad-bucket duplicate risk.
- **Building control/completion and property/address base sources**: No official completion/building-control source family appears in the seed. Recommendation: If available under usable terms, use completion certificate/building control records as built/opening corroboration, with address/UPRN or parcel keys.
- **DfC/HED heritage records beyond listed-building point records**: HED listed-building records are present, but conservation-area, scheduled monument, grants/restoration programmes are not separated. Recommendation: Separate statutory designation, restoration grant, and project-delivery records; do not let listing amendments duplicate restoration/opening events.
- **DfI/Translink public project and transport estate sources**: Transport-related architecture/public-realm milestones are not strongly represented as architecture source families. Recommendation: Use DfI/Translink project ids and opening dates for station/interchange/public-realm works, not generic architecture pages.

Duplicate-risk patterns:
- Generic public-page source ids aggregate many publishers; require publisher + canonical URL + record_id namespace so later official-source ingestion can match instead of duplicating.
- Opening, completion, listing/designation, planning permission, refurbishment, and reopening are different event types; duplicate checks should include event_type/status_phase, but also flag same site/date across event types for reviewer triage.
- Source URLs with query strings, trailing slashes, news mirrors, and renamed pages should be canonicalized before duplicate comparison.
- source_record_id values must be namespaced by source_id and stable upstream id; slug-only ids are collision-prone across rounds.
- Exact title matching misses near duplicates where worker batches rewrite titles; use normalized title + city + date + approximate coordinate/site label as a soft duplicate gate.

## Stricter Ingestion Recommendations

- **Require canonical duplicate key before append**: Current exact key only catches identical titles; architecture batches often rewrite event wording. Fields: city_id, normalized_title, effective_date or date range, canonical_source_url, source_record_id, source_id, event_type/status_phase.
- **Add soft duplicate gate**: Official pages can describe the same project with different titles or URLs. Fields: city_id, normalized_site_label, rounded_coordinates, year, event_type, publisher.
- **Keep administrative milestones separate from built/opening milestones**: Prevents planning or heritage records from duplicating public opening/completion claims. Fields: planning_permission, designation, permit, certificate_of_occupancy, completion, opening, reopening, refurbishment.
- **Split generic architecture-public-pages into publisher-specific source ids during promotion**: Broad source ids hide official family gaps and make licence/provenance review too coarse. Fields: publisher, source_family, licence_url, record_id_namespace.
- **Reject or quarantine candidates missing source_record_id or source_url**: Without both URL and upstream id/slug, same project can be re-added by later rounds. Fields: source_url, source_record_id, source_date_field, retrieved_at.

See JSON for full per-source/category/year counts and sampled duplicate records.
