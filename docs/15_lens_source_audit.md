# 15-Lens City Source Audit

This audit records the public source families that support the 15-lens atlas contract for Belfast City Council, Greater London, and New York City. It is a source inventory and coverage note, not a claim that the atlas has a complete history of every change in each city.

Each launched city must expose all 15 lenses. A lens can use the same source-backed event record as another lens when the source family supports a different view of the same evidence. The event id, source ids, licence, date basis, confidence, geometry note, and caveats must remain unchanged.

## Boundary Scope

| City | Official atlas scope | Boundary evidence |
| --- | --- | --- |
| Belfast | Belfast City Council area | OpenDataNI / Spatial NI local government boundary resources under OGL where marked. |
| Greater London | The 32 London boroughs plus City of London | GLA London borough boundary packages and ONS/Open Geography boundary products under OGL-compatible public sector terms. |
| NYC | Bronx, Brooklyn, Manhattan, Queens, and Staten Island | NYC Open Data borough, community district, and agency geography resources; NYC Open Data FAQ states public data has no use restrictions, subject to terms. |

## Source Rules

- Prefer official open data, statutory registers, public authority project pages, and public data portals.
- Preserve source URL, publisher, licence or terms URL, attribution, access/review date, source row id, date field, and transformation script.
- Treat permit, planning, project, service, incident, and inspection rows as administrative or observed public records. Do not convert them into construction, service quality, capacity, causation, or outcome claims unless the source directly records that specific fact.
- Use OSM-derived geometry as mapped visibility or orientation context. OSM edit dates are not real-world construction dates.
- Sources with dataset-specific, unclear, website-only, or review-required terms can support citation metadata but should not be included in redistributed data packs until reviewed.

## Lens Coverage Matrix

### Planning Activity

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | Belfast City Council planning committee pages, DfI planning application/statistics resources, OpenDataNI geography, official project pages | OGL for public-sector information where stated; council pages often require page-level review | Approvals and committee decisions are administrative records, not observed construction. |
| London | Planning Data platform, Planning London Datahub, London borough planning registers, London Datastore planning layers | OGL or dataset-specific public terms | Planning lifecycle dates must remain tied to the field that supplied the date. |
| NYC | NYC DCP ZAP, DOB BIS/DOB NOW permits, City Planning public data, NYC Open Data | NYC Open Data terms/no-restriction FAQ, agency terms where applicable | Filings, actions, approvals, permits, and certificates are separate event types. |

### Development Sites

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | BCC development/project pages, planning application rows with coordinates, land availability and local development plan documents | OGL where applicable; website terms for page text/images | Point geometry may represent a named site when source boundary is absent. |
| London | Planning Data brownfield land, Article 4/designation data, London Datahub application geometry, GLA development datasets | OGL or dataset-specific terms | Brownfield or pipeline records are availability/status evidence, not delivery evidence. |
| NYC | DCP ZAP project geometries, PLUTO/MapPLUTO, DOB permits, HPD housing project data | NYC Open Data and DCP release terms | Parcel context is not a dated change unless a release/version or permit row supplies the date. |

### Built Change

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | BCC capital project pages, heritage/listing records, DfI application rows, OSM mapped visibility for geometry context | OGL and ODbL attribution where applicable | Completion, opening, listing, demolition, and mapped visibility must stay distinct. |
| London | Planning Data listed buildings/conservation areas, LPA application outcomes, OSM context, GLA/London Datastore layers | OGL, ODbL, and dataset-specific terms | Designation status is a legal/status change, not physical redevelopment. |
| NYC | DOB certificates/permits, LPC landmark/designation data, capital project tracker, PLUTO release context | NYC Open Data/DCP/LPC terms | Permits and certificates do not by themselves prove occupancy or use outcomes. |

### Access To Transport

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | Translink open data, Translink project/station pages, DfI transport pages, OSM network context | Translink open data licence or page terms; ODbL for OSM | Current route/stop feeds need archived snapshots before being used as historical evidence. |
| London | TfL open data, TfL disruptions, London Datastore transport layers, DfT road-safety data, OSM | TfL terms, OGL, ODbL | Access bands are descriptive mapped context, not measured journey times. |
| NYC | MTA open data, NYC DOT street network and street improvement data, Open Data transit/transport datasets, OSM | MTA/NYC Open Data terms, ODbL | Network context and access geometry are not service availability guarantees. |

### Service Reliability

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | Translink status/project pages, DfI roadworks and transport notices, official station/service records | Dataset/page-specific terms | Service-status evidence may be current or page-specific, not a complete reliability history. |
| London | TfL disruptions/status feeds, DfT road-collision records, London Datastore transport datasets | TfL terms and OGL | Disruption records are event/status rows, not timetable reliability measurements. |
| NYC | MTA status/open data, NYC DOT street closures/permits, Open Data service and street-event feeds | MTA and NYC Open Data terms | Planned and active disruptions must be labelled separately. |

### Transport Activity

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | DfI roadworks/transport records, Translink records, OSM road context | OGL/page terms/ODbL | The current atlas uses source-backed activity and mapped delay proxies, not measured speeds. |
| London | TfL road disruptions, DfT STATS19, road-network context, OSM | TfL terms, OGL, ODbL | Collision or disruption records do not explain speed or traffic outcomes. |
| NYC | NYC DOT street closures, speed/safety program records where public, collision rows, OSM | NYC Open Data and ODbL | Street activity records should not be turned into live congestion claims. |

### Public Service Gaps

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | BCC facilities/open data, Department for Communities pages, health/education project pages, NISRA/OpenDataNI geography | OGL where stated; page terms for institutional pages | Gaps are descriptive source/mapped-context gaps, not proof of unmet need. |
| London | London Datastore civic/facility layers, FSA FHRS, Police.uk public-safety data, LFB incidents, ONS geographies | OGL and dataset-specific terms | Privacy-minimized public rows and current snapshots need careful labelling. |
| NYC | NYC 311, schools/facilities, FDNY/EMS open datasets, HPD and public housing context, community districts | NYC Open Data terms | Service request volume is a public record, not a direct measure of need or quality. |

### Service Catchments

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | BCC facilities, libraries/leisure pages, Department of Health/education facility records, Spatial NI boundaries | OGL where stated | Derived catchment cells are not official service boundaries. |
| London | London Datastore facilities, NHS/education public data where linked, ONS/GLA geographies | OGL/dataset-specific terms | Catchments are display aids around source rows, not eligibility areas. |
| NYC | NYC Open Data facilities, school, library, parks, health, community district datasets | NYC Open Data terms | Official service boundaries must only be shown when the dataset supplies them. |

### Service Context

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | Council service pages, NISRA denominators, civic facility/project records, public request/notice sources where available | OGL where stated | Service-context grids are descriptive context; no population or capacity model is implied. |
| London | Police.uk, LFB, FHRS, London Datastore demographic/geography datasets, ONS denominators | OGL/dataset-specific terms | Counts must preserve privacy-minimization and geography vintage. |
| NYC | NYC 311, HPD, FDNY/EMS, facilities and demographic geography from NYC Open Data/Census context | NYC Open Data/US public data terms | Request and incident rows are administrative records, not validated demand estimates. |

### Land Use

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | Local development plan, planning application use classes, land availability records, OSM/Spatial NI context | OGL/page terms/ODbL | Use-class evidence and mapped land use are separate from current occupancy. |
| London | Planning Data, brownfield/designations, VOA/HM Land Registry context where available, London Datastore | OGL/dataset-specific terms | Land use cells are not authoritative parcel classifications unless source says so. |
| NYC | PLUTO/MapPLUTO, ZAP, DOB permits/certificates, DCP land-use data | DCP/NYC Open Data terms | PLUTO release vintage must be retained. |

### High Street Activity

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | BCC business/project pages, FHRS where available, Companies/official high street datasets where licensed, OSM frontage context | OGL/ODbL and source-specific terms | Business activity records are not footfall, spend, or commercial success evidence. |
| London | FSA FHRS API, HM Land Registry Price Paid, UK HPI, London Datastore town-centre layers, Police.uk context | OGL and address-rights caveats | Current snapshots and transactions should not be presented as openings/closures unless source states that. |
| NYC | NYC Open Data business, restaurant inspection, permits, commercial context, storefront/streetscape datasets where licensed | NYC Open Data/agency terms | Inspection or permit rows are administrative records, not vitality scores. |

### Economic Pull

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | Major project pages, transport hubs, BCC regeneration pages, business/cultural venue records | OGL/page terms | Pull lines are co-location/context display, not measured flows. |
| London | GLA/London Datastore economic layers, transport hubs, HM Land Registry/HPI, FSA/LFB/Police context | OGL/dataset terms | Economic pull must remain a source-backed context grouping, not an opaque score. |
| NYC | Open Data employment/business/facility datasets, MTA/DOT anchors, DCP economic/geography resources | NYC Open Data/agency terms | Do not infer visitor flows, spending, or job impacts from anchor proximity. |

### Utility Context

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | OpenDataNI/Spatial NI utility/context where public, DfI streetworks/roadworks, OSM utility assets | OGL/ODbL and dataset terms | The atlas does not infer engineering capacity. |
| London | London Datastore infrastructure layers, streetworks/open works feeds where public, OSM utility context | OGL/ODbL/dataset-specific terms | Public works/assets are context, not capacity headroom. |
| NYC | NYC Open Data infrastructure/capital assets, DOT permits/street closures, DEP/utility-related public datasets, OSM | NYC Open Data/ODbL | Asset presence is not available capacity. |

### Utility Network Context

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | DfI roadworks, flood/environment public datasets, utility/streetwork context, OSM | OGL/ODbL/source terms | Resilience styling is descriptive evidence context, not outage risk modelling. |
| London | Environment Agency/GLA flood and infrastructure context, TfL disruptions, streetworks, OSM | OGL/TfL/ODbL terms | Hazard or disruption records need date and status preserved. |
| NYC | NYC Open Data flood, resilience, infrastructure, DOT, DEP, and capital project datasets | NYC Open Data/agency terms | Public resilience projects are records of plans/works/status, not proof of system performance. |

### Utility Works

| City | Compatible sources | Licence notes | Main caveats |
| --- | --- | --- | --- |
| Belfast | DfI roadworks/streetworks, Translink/utility-adjacent project pages, OSM context | OGL/page terms/ODbL | Works notices are not permanent asset changes unless the source states completion. |
| London | Street Manager/open streetworks feeds where available, TfL disruptions, borough roadworks pages, OSM | OGL/TfL/ODbL/source terms | Planned, active, and completed works need separate status labels. |
| NYC | NYC DOT street permits/closures, capital project trackers, DEP/utility-related public work datasets, OSM | NYC Open Data/ODbL | Permit rows are administrative works records, not utility performance evidence. |

## Machine-Readable Artifacts

The generated lens manifests are:

- `web/data/city-atlas/lens-manifest.json`
- `web/data/city-atlas/cities/belfast/lens_manifest.json`
- `web/data/city-atlas/cities/london/lens_manifest.json`
- `web/data/city-atlas/cities/nyc/lens_manifest.json`

The generated lens-year coverage artifacts are:

- `web/data/city-atlas/cities/belfast/lens_year_coverage.json`
- `web/data/city-atlas/cities/london/lens_year_coverage.json`
- `web/data/city-atlas/cities/nyc/lens_year_coverage.json`

Each city artifact contains 300 rows: 15 mandatory lenses times the required years 2007-2026. A row with `source_backed_records` has compatible same-lens event records for that year. A row with `source_backed_context_no_year_records` has `event_count: 0` and keeps the lens visible through source-backed coverage-context features from official scope/context sources. Those context features are not city-change events, are excluded from headline counts, and cannot be treated as evidence of a built, service, economic, utility, or transport change.

Run:

```powershell
npm run build:lens-contract
npm run verify:lens-contract
```

The verifier fails if a launched city is missing any lens, required 2007-2026 lens-year row, full-city boundary source, licence URL, attribution, compatible source count, freshness, export flag, reference-screen coverage, required year artifact, or basic provenance fields. Same-lens event count may be zero only when the corresponding lens-year row and `lens_detail_<year>.geojson` file expose source-backed context features that are explicitly labelled and excluded from headline counts.

## Public Reference Pages

- Open Government Licence v3.0: https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/
- OpenDataNI: https://www.opendatani.gov.uk/
- Belfast City Council open and linked data: https://www.belfastcity.gov.uk/open-and-linked-data
- Translink open data: https://www.translink.co.uk/foi-open-data
- London Datastore: https://data.london.gov.uk/
- Planning Data platform: https://www.planning.data.gov.uk/
- Planning London Datahub: https://www.london.gov.uk/programmes-strategies/planning/digital-planning/planning-london-datahub
- TfL open data users: https://tfl.gov.uk/info-for/open-data-users/
- HM Land Registry Price Paid Data: https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads
- Food Standards Agency open data: https://ratings.food.gov.uk/open-data/en-GB
- NYC Open Data FAQ: https://opendata.cityofnewyork.us/faq/
- NYC Open Data terms: https://opendata.cityofnewyork.us/overview/#termsofuse
- NYC Department of Buildings data: https://www.nyc.gov/site/buildings/dob/data-reporting.page
- NYC Department of City Planning open data: https://www.nyc.gov/site/planning/data-maps/open-data.page
