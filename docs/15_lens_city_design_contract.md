# 15-Lens City Design Contract

This contract captures the agreed implementation target for city lenses. The only visual reference set for this work is `tmp/reference-screens/`, which contains the full 15-lens desktop reference set. Treat those screenshots as a structural and interaction contract, not as a pixel-perfect target.

Do not use the older single mockup or unrelated comparison images as the design source of truth for this contract.

## Product Intent

Bims should behave like a source-backed city-change atlas, not a prediction engine or simulator. Every launched city must support all 15 lenses with real, license-compatible, provenance-backed data across the official city boundary.

Cities should share the same lens design grammar. They should look different because their geography, source coverage, administrative areas, built form, and evidence density are different, not because each city receives a separate design language.

## Launch Scope

The first mandatory city scopes are:

- Belfast: Belfast City Council area.
- London: Greater London.
- New York: all five NYC boroughs.

Each launched city must cover its whole official boundary for every lens. It is acceptable for some areas to look thin when the evidence is thin. It is not acceptable to fake density, invent marks, or crop the product around the city centre.

## Lens Set

All launched cities must implement all 15 lenses. Users choose and compare the lenses they want; the product should not depend on a fixed presentation order.

Use stable internal slugs, but public-facing labels:

| Slug | Public label |
| --- | --- |
| `planning-pressure` | Planning Activity |
| `planning-parcels` | Development Sites |
| `planning-delta` | Built Change |
| `transport-access` | Access to Transport |
| `transport-reliability` | Service Reliability |
| `transport-speed` | Transport Activity |
| `civic-access-gaps` | Service Coverage Context |
| `civic-catchment` | Service Catchments |
| `civic-demand` | Service Context |
| `economy-land-use` | Land Use |
| `economy-vitality` | High Street Activity |
| `economy-gravity` | Economic Context Links |
| `utilities-capacity` | Utility Context |
| `utilities-resilience` | Utility Network Context |
| `utilities-works` | Utility Works |

No partial lens list is allowed for a launched city. If a city lacks data for a lens, find credible public data and add it to the repo before launch.

Every launched city must also expose every mandatory lens for every year from 2007 through 2026 inclusive. This is a lens-year visibility contract, not permission to invent records. When no same-lens event rows are available for a city/year/lens, the atlas must either add credible public event data or show a source-backed coverage-context surface from official scope/context sources with an explicit limitation:

- `event_count` remains `0`.
- Context features are visually distinct and excluded from headline record counts.
- The map, timeline, legend, list state, evidence text, and exports must state that the year has no source-backed event records for that lens.
- Context features cannot become clickable evidence objects unless they have their own source-backed evidence panel record.

## Visual Grammar

The 15 reference screenshots define the shared grammar:

- Fixed desktop layout skeleton: compact left lens summary/navigation, central map, right evidence/details panel, and bottom timeline.
- Same lens color roles across cities. A color should mean the same thing in the same lens everywhere.
- Same lens metaphor unless source data cannot honestly support it: parcels/sites for Development Sites, route/corridor traces for Transport Activity, catchment cells for Service Catchments, network traces for utilities, and so on.
- Neutral, light basemap treatment with muted ordinary map labels such as roads, rivers, boroughs, neighbourhoods, and stations.
- No extra editorial landmark layer unless it is a source-backed object or source-backed context layer.
- Sparse areas must look sparse. The reference screens define structure, not required visual density.

Each lens should open from the user's current app context. Switching lenses preserves city, map viewport, zoom, selected year/time window, and broad filters. Clear the selected object unless it has a meaningful equivalent in the new lens.

## Evidence Model

Every clickable map object must resolve to a real evidence/details panel. The object must be traceable to public source rows, files, or records.

Minimum evidence requirements:

- Stable object id.
- Plain-language title/name and summary.
- Effective date, exact date, or effective date range.
- Geometry or geometry reference.
- Source name, publisher, source URL, source type, license, attribution, accessed/retrieved date.
- Transformation method and script reference.
- Confidence: documented, corroborated, inferred, or disputed.
- Limitations and coverage notes.

The right evidence panel should start with the selected object's story, dates, confidence, and limitations, then immediately show provenance: source rows/files, publisher, license, accessed date, and transformation notes.

Tooltips stay lightweight: title/name, object type, date range, confidence, and one source cue. Full evidence belongs in the right panel.

Sources that cannot support object-level evidence are not valid as the main data behind clickable lens features. They may be used only as contextual background.

## Geometry And Interaction

Each lens has one primary selectable object type, with secondary context layers allowed. Secondary context layers are clickable only when they have their own source-backed evidence record. Otherwise they are hover-only or visual context.

Every lens must also provide a serious list/table path. List rows mirror the same atomic source-backed objects that are clickable on the map. Each row should include title/name, category, effective date or date range, confidence, source count, limitation flags, and an action to open the evidence panel.

Every selected object supports an exportable evidence brief. Every filtered lens view supports a source-backed summary export.

Baseline export formats:

- Markdown for readable evidence briefs.
- CSV for tabular review.
- GeoJSON for spatial reuse.

Exports must include uncertainty, confidence, limitations, citations, licenses, accessed/retrieved dates, and transformation notes by default.

## Time And Change

For now, lenses show observed historical/current changes only. Do not include future proposals, forecast scenarios, or proposal lensing yet, even when official planning records exist.

Every lens must have a meaningful bottom timeline. For current-state lenses, the timeline can show observation windows, source update periods, retrieval dates, effective date ranges, or known review cycles.

Timeline granularity follows source evidence while the control remains visually consistent. Exact dates, month/year bins, and effective ranges are allowed when supported. Uncertain dates render as visual ranges or bands, not fake exact points.

Date uncertainty should also be visible on the map through subtle non-color cues such as stroke style, opacity, icons, or range badges.

For 2007-2026, timeline cells must not disappear just because a same-lens event count is zero. No-record lens-years render a subtle coverage-context marker labelled as context only, with `0` event records.

## Confidence, Limits, And Freshness

Confidence must be visible on the map, in the list/table, and in the evidence panel. Use non-color cues such as stroke, opacity, icons, or shape.

Inferred records are allowed only when source-backed, explicitly labelled, visually distinct, and excluded from headline counts unless a lens specifically defines otherwise. OSM edit dates must not be presented as real-world construction dates.

Limitations should be visible before opening evidence: on the map, in the list/table, and in the evidence panel.

Every city/lens shows data freshness:

- Last retrieved.
- Source coverage period.
- Known staleness or update cadence.

Source licenses and attribution are visible in the normal evidence workflow, at minimum in evidence panels and exports. Sources with stricter attribution requirements should also be surfaced in the lens/source summary.

## City Data And Adapters

Production ingestion should use reusable city adapters for Belfast, London, and NYC. Each adapter outputs the same frontend contract for all 15 lenses. One-off scripts are allowed for experiments only.

Adapter output must be schema-validated as a hard gate before frontend use. Invalid objects, missing provenance, bad geometry, missing license, or weak date metadata fail the build.

Source priority:

1. Official/public institutional sources: city open data portals, planning authorities, transport agencies, utility/public works records, statistical agencies, and official boundary datasets.
2. National datasets where local city data is weak.
3. OSM as supplemental/contextual geometry only unless limitations are explicitly labelled.

The same source may power multiple lenses when each lens has an explicit transformation method and does not duplicate claims.

## Administrative Areas

Use local civic/admin terminology per city: boroughs, wards, community districts, and similar real local geographies.

Support multiple source-backed administrative overlays per city while keeping the official city boundary as the primary scope. Admin overlays are optional context unless a lens directly uses them.

Every lens supports admin-area filtering where source-backed boundaries exist. The filter applies to map, list/table, timeline, evidence summaries, and exports together. Runtime filtering uses source-backed `affected_area.label` facets plus city overlay metadata; it must not fabricate a ward, borough, district, or neighborhood when the source row only supports a thinner place label.

The official city boundary should remain visible or contextually available across zoom levels: faint at overview, and via contextual indicator or mini-map when zoomed in.

## Accessibility And Platform Scope

This implementation is desktop-first. A mobile-specific experience is not required right now.

Desktop accessibility is a hard gate:

- Keyboard access for lens selection, filters, timeline, map-adjacent controls, list/table rows, evidence panels, and exports.
- Visible focus states.
- Sufficient contrast.
- Non-color cues for category, confidence, quality, and uncertainty.
- Text/list alternatives to map-only exploration.
- Evidence paths that are readable without relying on the map.

## Methodology And Corrections

Every lens includes a concise methodology link covering:

- Sources used.
- Transformations.
- Confidence rules.
- Geometry rules.
- Update cadence.
- Limitations.
- Known coverage gaps.

Every evidence panel and lens source summary should provide a correction/contribution path for missing sources, wrong dates, bad geometry, source-row problems, license issues, and attribution concerns.

## Explicit Non-Goals

Do not add:

- Future proposal lensing in the current implementation.
- Prediction, simulation, causality, or forecast language.
- Single opaque scores, impact scores, city scores, or unexplained rankings.
- Fake visual density to match the reference screenshots.
- Placeholder or partial lenses for launched cities.
- Decorative landmark layers not backed by source data.

Transparent, source-backed aggregates are allowed, but they must remain explainable and auditable.

## QA Checklist

Use `tmp/reference-screens/` for structural and interaction QA, not pixel-perfect matching.

Before a city launches, verify:

- All 15 lenses are implemented for the full official city boundary.
- All 15 lenses have visible, schema-valid rows for every year from 2007 through 2026.
- Each lens uses its agreed visual metaphor and globally consistent color roles.
- Each lens has one primary selectable geometry type.
- Every clickable object opens a source-backed evidence panel.
- Every lens has a synced list/table path.
- Every lens has a meaningful timeline with uncertainty ranges where needed.
- Confidence, limitations, and date uncertainty are visible before opening evidence.
- Exports are available for selected objects and filtered views in Markdown, CSV, and GeoJSON.
- Exports include citations, licenses, confidence, uncertainty, limitations, retrieved dates, and transformation notes.
- Admin-area filters update the map, list/table, timeline, evidence summaries, and exports together.
- Data freshness and methodology links are visible per lens.
- Correction/contribution paths are present.
- Desktop keyboard access, focus states, contrast, non-color cues, and text alternatives pass review.
- Browser QA confirms no blank maps, broken timelines, overlapping UI, or missing evidence panels.
- Build/schema validation fails on missing provenance, missing license, invalid geometry, or weak date metadata.
- Build/schema validation fails on a zero-event lens-year unless it is backed by explicit source-backed coverage context that is excluded from record counts.
