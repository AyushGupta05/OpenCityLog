# Final MVP product spec: **CivicReplay**

My honest recommendation: **do not build a simulation engine**. Build a **city-change atlas**: a beautiful, evidence-backed public website showing how real events, decisions, infrastructure, policies, developments, and environmental signals changed places over time.

The product should feel like:

> “Here is what changed, when it changed, where it changed, and what evidence supports that.”

Not:

> “Our model predicts the future of the city.”

---

# 1. One-sentence product positioning

**CivicReplay is an open-source city-change atlas that lets planners, researchers, journalists, students, and communities explore how real decisions, developments, infrastructure projects, policies, and environmental events changed a city over time — with every observed change tied back to public evidence.**

Homepage version:

> **Pick a place. Pick a year. See what changed — and what evidence supports it.**

Internal product principle:

> **A city changelog, not a city oracle.**

---

# 2. MVP feature set

## Must-have

| Feature                           | MVP decision                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **One flagship city story**       | Launch with one excellent case study, not six shallow city demos.                                                                                |
| **Timeline map**                  | A clean 2D map with a timeline from roughly 2000 to now, where data supports it.                                                                 |
| **Event/changelog rail**          | Cards showing real events: planning approvals, completions, transit openings, major policies, environmental changes, public investments.         |
| **Before/after compare**          | Let users compare two years or compare “before event” vs “after event.”                                                                          |
| **Observed-change panel**         | For each event, show nearby indicators that changed: housing, land use, transport access, air quality, services, demographics, economic signals. |
| **Evidence drawer**               | Every event must show source, publisher, date, licence, retrieval date, method, confidence, and limitations.                                     |
| **Category filters**              | Planning/development, transport, environment, public services, economy/demographics.                                                             |
| **Area search**                   | Search by borough/district, neighbourhood, ward, postcode, or known project area where available.                                                |
| **Export evidence brief**         | Export selected events/sources/caveats as Markdown or HTML/PDF-style report.                                                                     |
| **Open-source contribution flow** | GitHub issue templates and PR validation for corrections, new sources, new events, and city adapters.                                            |

## Should-have

| Feature                          | Decision                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Curated story mode**           | “Stratford 2000–2026,” “Hudson Yards,” “Ancoats,” “Fulton Market.” Useful for demos and public users.                          |
| **Source health page**           | Shows which datasets are complete, stale, partial, missing, or experimental.                                                   |
| **Area summary card**            | “Major observed changes in this area since 2000.”                                                                              |
| **Shareable links**              | Let journalists/students share an event, area, or replay state.                                                                |
| **Download city data pack**      | Useful later for open-data contributors. Not required for first public ship.                                                   |
| **Proposal Lens**                | Lightweight proposal-impact feature, but not a forecast engine.                                                                |
| **Multi-city adapter skeletons** | Create folders for London, Manchester, Bristol, New York, San Francisco, Chicago — but only fully populate one city at launch. |

## Cut

| Cut                             | Why                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| **10-year / 2036 simulation**   | Creates fake confidence and weakens trust.                                         |
| **Future branch simulator**     | Sounds impressive, but planners will ask for modelling assumptions and validation. |
| **Traffic prediction engine**   | Real traffic modelling is complex and not credible as a small MVP.                 |
| **Electricity/grid simulation** | Too narrow and distracts from the city-change atlas.                               |
| **AI-generated impact claims**  | Too easy to overclaim causality.                                                   |
| **Generic impact score**        | Fake precision. Replace with evidence, caveats, and confidence labels.             |
| **Retired provenance proof layer** | No planning/public-user value for the MVP.                                         |
| **User accounts**               | Not needed. Public, static-first, open-source is better.                           |
| **All-six-city launch**         | Too much surface area. One deep city is more impressive than six thin cities.      |

---

# 3. Best first city/cities and why

You asked specifically for **London, Manchester, Bristol, New York, San Francisco, and Chicago**. Here is the ruthless ranking.

## Recommended ranking

| Rank | City                                | Recommendation               | Why                                                                                                                                         |
| ---: | ----------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
|    1 | **London**                          | **First flagship**           | Best overall mix of planning data, historic depth, transport data, environmental data, recognisable urban-change stories, and UK relevance. |
|    2 | **New York City**                   | First US expansion           | Very strong parcel, land-use, zoning, planning, permits, transit, census, and environmental data.                                           |
|    3 | **Chicago**                         | Practical US backup          | Strong building-permit and city open-data ecosystem; easier than San Francisco politically.                                                 |
|    4 | **Manchester / Greater Manchester** | Best non-London UK expansion | Strong regeneration story and useful regional mapped data, but planning-event data will require more stitching.                             |
|    5 | **Bristol**                         | Best compact UK city         | Manageable scale, strong open-data/environment story, but less globally recognisable.                                                       |
|    6 | **San Francisco**                   | Later high-impact city       | Very relevant and data-rich, but politically sensitive and easy to overclaim around housing, displacement, permits, and homelessness.       |

## First public MVP city

# **London: Stratford / Olympic Park / Lower Lea Valley, 2000–2026**

This should be the flagship.

Why:

* It has a clear historical transformation story.
* It connects planning, housing, public investment, transport, land-use change, public realm, and environmental questions.
* It is visually understandable.
* It is globally recognisable.
* London has stronger planning-data infrastructure than the other UK options.

London’s Planning London Datahub brings together planning application and development proposal data from London planning authorities, including live feeds, development progress data, and historic London Development Database records. The older LDD has housing approvals and completions coverage from 01/04/2000 to 31/03/2019, which fits the “2000 to now” product ambition well. ([London City Hall][1])

## Second city

# **New York City: Hudson Yards / West Chelsea**

NYC should be the first US expansion. PLUTO gives extensive tax-lot-level land-use/geographic data with more than 70 fields, and ZAP provides land-use application/project tracking for roughly 30,000 projects since the late 1970s. ([NYC Open Data][2])

## Third city

# **Chicago: West Loop / Fulton Market**

Chicago is a strong practical US city because its building-permit dataset covers permits issued from 2006 to present, which makes it useful for an observed city-change timeline. ([Chicago][3])

## Fourth city

# **Manchester: Ancoats / New Islington / Salford Quays**

Greater Manchester is the best UK city after London because the story is strong: post-industrial regeneration, housing growth, Metrolink context, city-centre densification, MediaCity, and infrastructure. MappingGM is explicitly positioned as a gateway to Greater Manchester mapped data across housing, planning, infrastructure, socioeconomic, and demographic topics. ([mappinggm.org.uk][4])

## Fifth city

# **Bristol: Temple Quarter / Harbourside / Clean Air Zone**

Bristol is a good compact case because it has a manageable scale and strong environmental/open-data story. Open Data Bristol includes real-time and historic air-quality data that can be mapped and downloaded, and Bristol’s air-quality monitoring focuses heavily on traffic pollutants through continuous monitoring sites. ([opendata.bristol.gov.uk][5])

## Sixth city

# **San Francisco: Mission Bay / Central SoMa**

San Francisco is valuable but should not be first. It has strong open data and a very relevant housing/planning story, but it is easy to make controversial causal claims badly. The SF Planning pipeline includes development projects with formally submitted land-use or building-permit applications, while SF’s building-permit and housing-completion datasets are available through DataSF/SF Planning channels. ([sfplanning.org][6])

---

# 4. UK / US data-source strategy

## Core strategy

Do **not** build one giant universal scraper.

Build a **city adapter model**.

Each city should have the same structure:

```txt
cities/
  london/
    city.yml
    sources.yml
    events.ndjson
    indicators/
    layers/
    stories/
    manifests/
  manchester/
  bristol/
  new-york/
  chicago/
  san-francisco/
```

Each city adapter outputs the same frontend contract:

```txt
city_manifest.json
source_manifest.json
timeline_events.ndjson
indicator_snapshots.json
layers_manifest.json
proposal_analogs.json
```

The frontend should not care whether the city is London or Chicago. It should only read the manifest contract.

---

## UK base sources

Use these across London, Manchester, and Bristol.

| Need                                                 | Source strategy                                                                                                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Boundaries**                                       | ONS Open Geography Portal for administrative/statistical boundaries. ONS digital boundaries are supplied under the Open Government Licence. ([Office for National Statistics][7]) |
| **Basemap / roads / physical geography**             | Ordnance Survey OpenData, especially OS Open Zoomstack for a free GB vector basemap down to street detail. ([Ordnance Survey][8])                                                 |
| **Planning constraints / national planning context** | planning.data.gov.uk for England-wide planning and housing datasets, with caution around coverage and completeness. ([Planning Data][9])                                          |
| **Demographics**                                     | ONS Census and small-area statistics.                                                                                                                                             |
| **Environment**                                      | UK-AIR/DEFRA, local air-quality portals, and city-specific monitoring datasets.                                                                                                   |
| **Transport**                                        | TfL for London, TfGM/MappingGM for Manchester, local/West of England sources for Bristol.                                                                                         |

## London source stack

| Layer                                 | Sources                                                                                                                                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Planning/development**              | Planning London Datahub, London Development Database.                                                                                                                                                                                       |
| **Residential approvals/completions** | PLD/LDD and London Datastore dashboards. The London Datastore notes PLD starts/completions data is supplied by applicants and planning authorities and may need quality review, so the UI must expose limitations. ([London Datastore][10]) |
| **Transport**                         | TfL open data.                                                                                                                                                                                                                              |
| **Environment**                       | London Air, UK-AIR, borough datasets.                                                                                                                                                                                                       |
| **Demographics/economy**              | ONS, London Datastore.                                                                                                                                                                                                                      |
| **Boundaries/basemap**                | ONS, OS OpenData, GLA/borough boundaries.                                                                                                                                                                                                   |

## Manchester source stack

| Layer                    | Sources                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Regional mapped data** | MappingGM for housing, planning, infrastructure, socioeconomic, and demographic mapped data. ([mappinggm.org.uk][4]) |
| **Road network**         | Greater Manchester Key Route Network, available in formats including SHP, KML, and GeoJSON. ([mappinggm.org.uk][11]) |
| **Planning/development** | Manchester and Salford local planning portals; city council planning application datasets where available.           |
| **Transport**            | TfGM datasets and MappingGM.                                                                                         |
| **Demographics**         | ONS and GMCA/MappingGM.                                                                                              |
| **Environment**          | UK-AIR and local authority air-quality datasets.                                                                     |

## Bristol source stack

| Layer                    | Sources                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **City open data**       | Open Data Bristol.                                                                                                                                                                         |
| **Air quality**          | Open Data Bristol air-quality dashboard and Bristol air-quality data; the air-quality dashboard includes real-time and historic data for mapping/download. ([opendata.bristol.gov.uk][12]) |
| **Planning/development** | Bristol planning portal and local planning datasets.                                                                                                                                       |
| **Demographics**         | ONS.                                                                                                                                                                                       |
| **Transport**            | Bristol/West of England transport datasets.                                                                                                                                                |
| **Environment**          | Bristol air-quality datasets, UK-AIR.                                                                                                                                                      |

---

## US base sources

Use these across New York, Chicago, and San Francisco.

| Need                  | Source strategy                                                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Boundaries**        | US Census TIGER/Line shapefiles. TIGER/Line provides geographic entity codes that can be linked to Census demographic data. ([Census.gov][13])                                    |
| **Demographics**      | US Census API, Decennial Census, ACS.                                                                                                                                             |
| **Environment**       | EPA AQS for historical air-quality monitoring. AQS is not real-time and may lag by six months or more, so the product must label it as historical/retrospective data. ([EPA][14]) |
| **Transport**         | MTA for NYC, CTA/CDOT for Chicago, SFMTA for San Francisco.                                                                                                                       |
| **Planning/land use** | City-specific open-data portals.                                                                                                                                                  |

## New York source stack

| Layer                     | Sources                                     |
| ------------------------- | ------------------------------------------- |
| **Land use/parcels**      | PLUTO/MapPLUTO.                             |
| **Planning applications** | Zoning Application Portal project data.     |
| **Building activity**     | DOB permits and historical permit datasets. |
| **Transit**               | MTA open data.                              |
| **Demographics**          | Census ACS/TIGER.                           |
| **Environment**           | EPA AQS, NYC environmental datasets.        |

## Chicago source stack

| Layer                | Sources                                        |
| -------------------- | ---------------------------------------------- |
| **Building permits** | Chicago building permits from 2006 to present. |
| **City open data**   | Chicago Data Portal.                           |
| **Planning/zoning**  | Chicago zoning and planning datasets.          |
| **Transport**        | CTA/CDOT/city transport datasets.              |
| **Demographics**     | Census ACS/TIGER.                              |
| **Environment**      | EPA AQS and city environmental datasets.       |

## San Francisco source stack

| Layer                             | Sources                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| **Planning/development pipeline** | SF Planning pipeline.                                        |
| **Building permits**              | DataSF building permits.                                     |
| **Housing completions**           | SF Planning housing dashboard / housing production datasets. |
| **Transport**                     | SFMTA open data.                                             |
| **Demographics**                  | Census ACS/TIGER.                                            |
| **Environment**                   | EPA AQS and Bay Area/local environmental datasets.           |

---

# 5. Exact user journey for a planner

Planner goal:

> “I need to understand what changed in this area, what evidence supports it, and what I can responsibly say.”

## Journey

1. Planner opens **CivicReplay**.
2. Selects **London → Stratford / Olympic Park / Lower Lea Valley**.
3. The page opens with:

   * map
   * timeline
   * changelog rail
   * category filters
   * visible note: **“Historical evidence map, not a prediction engine.”**
4. Planner searches for a postcode, ward, borough, neighbourhood, opportunity area, or project name.
5. Planner chooses a lens:

   * Planning & development
   * Transport
   * Environment
   * Public services
   * Economy & demographics
6. Timeline highlights years with evidence-backed events.
7. Planner drags from **2000 → 2026**.
8. Changelog updates with events such as:

   * major planning permissions
   * residential approvals/completions
   * transport openings
   * public-realm changes
   * policy changes
   * air-quality monitoring changes
   * service/facility changes
9. Planner clicks an event.
10. Evidence drawer opens with:

    * event title
    * date/date range
    * location
    * source IDs
    * publisher
    * raw source link
    * licence
    * retrieval date
    * transformation method
    * confidence label
    * limitations
11. Planner switches to **Before/After Compare**.
12. Planner selects:

    * before year: 2004
    * after year: 2014 or 2026
13. App shows:

    * what changed on the map
    * which indicators changed
    * what sources support each change
    * what the data cannot prove
14. Planner opens **Proposal Lens**.
15. Planner draws a site or drops a point.
16. Planner selects proposal type:

    * housing
    * mixed-use
    * transit/public transport
    * road/public realm
    * green space
    * public facility
17. App returns:

    * local context
    * similar past events
    * indicators worth checking
    * evidence gaps
    * confidence level
    * non-causal interpretation
18. Planner exports an **Evidence Brief**.
19. Brief includes:

    * selected area
    * timeline events
    * observed changes
    * source list
    * caveats
    * confidence labels
    * proposal questions
20. Planner uses the brief for internal scoping, public communication, or further research — not as proof of causality.

---

# 6. Exact user journey for a public/open-source user

Public/open-source user goal:

> “I want to understand how this place changed, and maybe correct or improve the record.”

## Journey

1. User opens the homepage.
2. User sees plain-language positioning:

   > “See how cities changed through public evidence. CivicReplay does not claim to predict the future.”
3. User selects a city story:

   * London: Stratford 2000–2026
   * New York: Hudson Yards
   * Chicago: Fulton Market
   * Manchester: Ancoats
   * Bristol: Temple Quarter
   * San Francisco: Mission Bay
4. User clicks **Start Replay**.
5. Timeline animates key years.
6. Map updates with visible event pins and area highlights.
7. User clicks a changelog card.
8. App explains:

   * what happened
   * when it happened
   * where it happened
   * what changed nearby
   * what evidence supports it
   * what cannot be concluded
9. User opens **Evidence**.
10. Evidence drawer shows:

    * source title
    * publisher
    * licence
    * raw link
    * method
    * limitations
    * confidence label
11. User notices a missing event or wrong interpretation.
12. User clicks **Suggest correction**.
13. GitHub issue template opens prefilled with:

    * city
    * event ID
    * current wording
    * proposed correction
    * evidence link
14. Contributor forks repo.
15. Contributor edits:

    * `cities/london/events.ndjson`
    * `cities/london/sources.yml`
    * or relevant city adapter files
16. Contributor runs:

    ```bash
    npm install
    npm run validate:data
    npm run dev
    ```
17. Contributor opens PR.
18. CI checks:

    * valid event schema
    * valid source schema
    * source IDs exist
    * licences exist
    * dates are valid
    * geometry exists
    * no forbidden causal/predictive language
19. Maintainer reviews evidence quality.
20. Approved contribution appears in the public replay.

---

# 7. Lightweight proposal-impact feature, with clear limitations

Do **not** call it simulation.

Call it:

# **Proposal Lens**

Subtitle:

> **What should we investigate if something like this is proposed here?**

## What it does

The Proposal Lens answers:

> “Based on this place and similar past events, what evidence should a planner, journalist, student, or community group check before making an impact claim?”

It returns five things.

## 1. Local context

For a selected site, show:

* planning area/context
* nearby past developments
* current land-use context
* transport access
* environmental monitoring availability
* nearby public services
* demographic/economic context
* known data gaps

## 2. Similar past events

Find analogs based on:

* same city first
* same proposal category
* similar size/scale where data exists
* similar area type
* similar time period
* similar planning status

## 3. Observed changes around analogs

Show cautious statements:

* “Nearby indicators changed after similar events.”
* “Comparable areas saw recorded development activity increase.”
* “Transport/service/environment evidence is incomplete.”
* “No site-level causal conclusion is supported.”

## 4. Questions to investigate

Examples:

* Were completions delivered or only approved?
* Were transport mitigations required?
* Did school/health/service capacity change?
* Were air-quality monitors close enough to be meaningful?
* Are changes visible at the same spatial scale as the proposal?
* Did multiple events happen at once, making attribution difficult?

## 5. Confidence and caveats

Every Proposal Lens output must include:

```txt
This is not a forecast.
This does not estimate causal impact.
It identifies relevant past events, observed nearby changes, evidence gaps, and questions for further investigation.
```

## What it must never say

Do not say:

* “This will increase traffic by 15%.”
* “This will cause displacement.”
* “This will improve air quality.”
* “This will create 1,000 jobs.”
* “This will reduce congestion.”
* “This will raise rents.”
* “This development caused X.”

Unless you have a specific, credible, cited causal study, that wording is not allowed.

## Correct wording

Use:

* “observed change”
* “associated change”
* “nearby indicators changed”
* “evidence-supported interpretation”
* “data is incomplete”
* “this raises questions around…”
* “available evidence does not justify a causal claim”

## Example output

```txt
Proposal Lens: 300-home mixed-use development

Location context:
The selected site is near previous residential and mixed-use development activity.
Transport access is relatively strong.
Nearby air-quality evidence exists, but monitoring is not site-specific.
Service-capacity evidence is incomplete.

Comparable past events:
8 similar development events were found in the wider area from 2005–2021.

Observed changes around comparable events:
Nearby housing completions increased in several comparable periods.
Public-service and traffic effects cannot be isolated from available data.
Environmental indicators vary by monitoring location and should not be treated as site-level effects.

Questions to investigate:
- Were transport mitigations required?
- Were completions delivered or only approved?
- Did nearby school/health/service capacity change?
- Are site-level traffic or air-quality readings available?
- Did other major policies or developments happen at the same time?

Limitation:
This is not a forecast. It identifies evidence, analogs, and questions for further review.
```

---

# 8. Trust/provenance model

This is the most important part of the product.

## Trust rule

> **No source, no claim.
> No method, no derived metric.
> No causal language without causal evidence.**

## Evidence hierarchy

| Level                 | Meaning                                        | UI treatment            |
| --------------------- | ---------------------------------------------- | ----------------------- |
| **Raw source**        | Official/public dataset or document says this. | Strongest evidence.     |
| **Derived metric**    | Script calculated this from source data.       | Show method and script. |
| **Observed change**   | Before/after difference in evidence.           | Use cautious wording.   |
| **Interpretation**    | Human-readable explanation.                    | Must include caveats.   |
| **Proposal question** | Hypothesis or investigation prompt.            | Clearly non-predictive. |

## Required source schema

```yaml
source_id:
title:
publisher:
city:
country:
source_type:
access_url:
licence:
coverage_start:
coverage_end:
spatial_granularity:
temporal_granularity:
retrieved_at:
refresh_policy:
checksum:
known_limitations:
```

## Required event schema

```yaml
event_id:
city:
area:
title:
category:
date_start:
date_end:
geometry:
summary:
observed_change:
interpretation:
source_ids:
method:
confidence:
limitations:
created_by:
review_status:
```

## Confidence labels

| Label                          | Meaning                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| **Verified official**          | Directly supported by official/public source.                        |
| **Official but incomplete**    | Official data exists, but coverage or quality has known limitations. |
| **Derived from official data** | Computed from documented public data.                                |
| **Community submitted**        | Contributor supplied; awaiting deeper review.                        |
| **Experimental/contextual**    | Used only in Proposal Lens, never as historical fact.                |

## Forbidden wording

CI should flag:

```txt
caused
will cause
predicts
guarantees
proves
simulation proves
AI forecast
definitely
impact score
```

Allowed wording:

```txt
observed change
associated with
nearby indicators changed
evidence suggests
available data shows
data is incomplete
interpretation
proposal question
```

---

# 9. Open-source contribution model

## What contributors can add

| Contribution             | Example                                                                          |
| ------------------------ | -------------------------------------------------------------------------------- |
| **New source**           | Add Bristol planning dataset with licence, coverage, and limitations.            |
| **New event**            | Add a transit opening, major development, policy change, or environmental event. |
| **Correction**           | Fix a wrong date, geometry, source, or overclaiming sentence.                    |
| **City adapter**         | Add Manchester, Chicago, or San Francisco using the standard structure.          |
| **Indicator script**     | Generate annual housing completions by ward/community district.                  |
| **Story mode**           | Curated narrative like “Stratford 2000–2026.”                                    |
| **Frontend improvement** | Better evidence drawer, map filters, accessibility, export.                      |

## Contribution rules

1. Every claim needs a source.
2. Every source needs a licence.
3. Every event needs a date or date range.
4. Every event needs geography.
5. Every derived metric needs a script or method.
6. No causal wording without causal evidence.
7. Missing data must be labelled missing.
8. Contributors cannot add private/manual claims without documentation.
9. City adapters must include a limitations page.
10. PR review is about evidence quality, not just code.

## Required repo docs

```txt
README.md
CONTRIBUTING.md
DATA_CONTRIBUTING.md
TRUST_MODEL.md
CITY_ADAPTER_SPEC.md
EVENT_SCHEMA.md
SOURCE_SCHEMA.md
GOVERNANCE.md
CODE_OF_CONDUCT.md
```

## GitHub templates

```txt
.github/ISSUE_TEMPLATE/
  data-correction.yml
  new-source.yml
  new-event.yml
  city-request.yml
  bug-report.yml

.github/PULL_REQUEST_TEMPLATE.md
```

## CI checks

```txt
npm run validate:data
npm run validate:sources
npm run validate:events
npm run validate:language
npm run validate:city-manifests
```

CI should fail if:

* event has no source
* source has no licence
* event date is invalid
* geometry is missing
* event uses forbidden language
* source ID does not exist
* confidence label is missing
* city manifest is invalid

---

# 10. Two-week implementation plan for Codex

## Week 1: reset product around replay, evidence, and London

| Day       | Codex task                                                                          | Acceptance criteria                                                                                                        |
| --------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Day 1** | Rename/reframe project as **CivicReplay** or **City Change Atlas**. Rewrite README. | README clearly says “city-change atlas,” not simulation engine.                                                            |
| **Day 1** | Remove simulation language from UI and docs.                                        | No “run simulation,” “2036 forecast,” “impact prediction,” or “future branch” language.                                    |
| **Day 2** | Create city adapter folders for all six cities.                                     | `cities/london`, `cities/manchester`, `cities/bristol`, `cities/new-york`, `cities/chicago`, `cities/san-francisco` exist. |
| **Day 2** | Define `sources.yml` and `events.ndjson` schemas.                                   | Sample London records validate successfully.                                                                               |
| **Day 3** | Build London Stratford source manifest.                                             | Includes PLD/LDD, ONS, OS, TfL, air/environment, London Datastore-style sources with limitations.                          |
| **Day 3** | Create 20–40 curated London Stratford event cards.                                  | Each event has date, geography, category, sources, confidence, and limitations.                                            |
| **Day 4** | Replace/rework frontend around replay interface.                                    | Map + timeline + event rail + evidence drawer render from static data.                                                     |
| **Day 4** | Add category filters.                                                               | Planning, transport, environment, services, demographics/economy filters work.                                             |
| **Day 5** | Implement before/after compare.                                                     | User can compare two years or event windows.                                                                               |
| **Day 5** | Implement export evidence brief.                                                    | Markdown export works for selected area/event.                                                                             |

## Week 2: trust, proposal lens, open-source readiness

| Day        | Codex task                                  | Acceptance criteria                                                                        |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Day 6**  | Implement evidence drawer properly.         | Every event shows source, method, licence, confidence, limitations.                        |
| **Day 6**  | Add forbidden-language validation.          | CI fails on unsupported causal/predictive wording.                                         |
| **Day 7**  | Build Proposal Lens MVP.                    | User selects site + proposal type and receives context/questions/analogs, not predictions. |
| **Day 7**  | Implement analog matcher.                   | Similar events are matched by category, geography, time, and confidence.                   |
| **Day 8**  | Add source health page.                     | Shows coverage, last retrieved, stale/missing/partial status.                              |
| **Day 8**  | Add contribution docs and GitHub templates. | Data correction, new source, new event, city request templates exist.                      |
| **Day 9**  | Visual polish pass.                         | Site feels serious, calm, civic, and beautiful — not like a toy simulator.                 |
| **Day 9**  | Accessibility pass.                         | Keyboard navigation, focus states, semantic headings, contrast, responsive layout.         |
| **Day 10** | Ship rehearsal.                             | Fresh clone → install → validate → build → run works.                                      |
| **Day 10** | Final public demo check.                    | London Stratford story is coherent, sourced, caveated, and exportable.                     |

---

# 11. Architecture changes Codex should make in the repo

The current repo is already close in one important way: its historical changelog direction preserves a useful 2016–2026 city evidence map with replay-style map interaction, evidence/confidence panels, provenance, and local OSM/raster/census/population/air-quality data. That historical replay/provenance direction is the part to keep. ([GitHub][15])

But the package scripts also include forecast/trend-baseline/transformer-model scripts, and the dependency list includes retired proof-flow dependency, so the architecture should be cleaned around the new evidence-first product. ([GitHub][16])

## New architecture

```txt
/
  cities/
    london/
      city.yml
      sources.yml
      events.ndjson
      indicators/
      layers/
      stories/
      manifests/
    manchester/
    bristol/
    new-york/
    chicago/
    san-francisco/
    belfast_legacy/

  src/
    app/
    components/
      LandingPage.tsx
      CityReplayPage.tsx
      MapView.tsx
      Timeline.tsx
      EventRail.tsx
      EventCard.tsx
      EvidenceDrawer.tsx
      ComparePanel.tsx
      ProposalLens.tsx
      SourceHealthPage.tsx
    lib/
      loadCity.ts
      filterEvents.ts
      trustLabels.ts
      proposalLens.ts
      exportBrief.ts
      languageGuard.ts

  scripts/
    validate_sources.ts
    validate_events.ts
    validate_forbidden_language.ts
    validate_city_manifest.ts
    build_city_manifest.ts
    build_proposal_analogs.ts

  docs/
    TRUST_MODEL.md
    CITY_ADAPTER_SPEC.md
    DATA_CONTRIBUTING.md
    EVENT_SCHEMA.md
    SOURCE_SCHEMA.md
```

## Specific architecture decisions

### 1. Static-first public website

No required backend runtime for MVP.

The site should load prebuilt:

```txt
city_manifest.json
source_manifest.json
timeline_events.ndjson
indicator_snapshots.json
layers_manifest.json
proposal_analogs.json
```

### 2. City adapters

Do not hardcode London, Belfast, or New York into the frontend.

Each city produces the same manifest contract.

### 3. Keep the replay/provenance idea

Keep:

* timeline replay
* evidence/confidence panels
* deterministic derived metrics
* source inventory
* local-first data
* changelog/event metaphor

### 4. Rename “city commits”

For planners and public users, “city commits” is clever but slightly developer-coded.

Use:

> **Changelog events**

You can still internally keep the Git metaphor.

### 5. Replace simulation core with Proposal Lens

Delete or quarantine:

* forecast engine
* transformer model
* trend baseline branch
* future branch simulator

Create:

```txt
src/lib/proposalLens.ts
scripts/build_proposal_analogs.ts
```

### 6. Remove checked-in secrets

The repo listing currently shows a root `.env` file. Remove it from Git, keep `.env.example`, and rotate anything that was actually secret. ([GitHub][15])

### 7. Remove irrelevant dependencies

Remove the retired proof-flow dependency from MVP dependencies unless there is an absolutely clear civic provenance reason, which there is not for this product. ([GitHub][16])

### 8. CI should validate trust, not just code

Add GitHub Actions for:

* source schema
* event schema
* city manifest
* source ID references
* licence presence
* forbidden language
* build
* browser smoke test

---

# 12. Features Codex should delete or downgrade

## Delete from core MVP

| Feature/script/idea           | Decision                               |
| ----------------------------- | -------------------------------------- |
| `build:forecast`              | Delete from main build/test path.      |
| `build:trend-baseline`        | Delete or quarantine as experimental.  |
| `build:transformer-model`     | Delete from MVP.                       |
| `verify-forecast.js`          | Remove from default verification.      |
| `verify-transformer-model.js` | Remove from default verification.      |
| `verify-trend-baseline.js`    | Remove from default verification.      |
| retired proof-flow dependency             | Remove dependency.                     |
| Future year slider to 2036    | Remove.                                |
| Branch futures                | Remove.                                |
| “Run simulation” button       | Remove.                                |
| AI-generated impact claims    | Remove or make internal drafting only. |
| Generic impact score          | Remove.                                |
| Traffic prediction            | Remove.                                |
| Electricity/grid prediction   | Remove.                                |

The current package file lists forecast, trend-baseline, transformer-model scripts, and default tests that run forecast verification; those should not define the new MVP’s quality gate. ([GitHub][16])

## Downgrade

| Existing idea         | New MVP version                                   |
| --------------------- | ------------------------------------------------- |
| Simulation mode       | **Proposal Lens**                                 |
| Impact prediction     | **Evidence questions + analogs**                  |
| Future branches       | **Unsaved local proposal sketch**                 |
| City commits          | **Changelog events**                              |
| 3D city               | Optional future visual layer                      |
| Traffic model         | Transport context indicators                      |
| Economic forecast     | Observed economic/demographic signals             |
| Fairness score        | Specific indicators with caveats                  |
| AI explanation        | Source-grounded interpretation reviewed by humans |
| Digital twin language | Historical evidence atlas language                |

---

# 13. Final definition of “ship-ready”

CivicReplay MVP is ship-ready only when all of this is true.

## Product readiness

* Public homepage is polished and clear.
* Product is framed as a **city-change atlas**, not a simulator.
* First city story is complete enough to impress.
* Recommended first story: **London Stratford / Olympic Park / Lower Lea Valley, 2000–2026**.
* Timeline map works.
* Event rail works.
* Evidence drawer works.
* Before/after compare works.
* Export evidence brief works.
* Proposal Lens works in limited, non-predictive form.

## Data readiness

* At least **20–40 high-quality events** for the flagship area.
* Every event has:

  * source IDs
  * date/date range
  * geography
  * category
  * confidence
  * limitations
* Every source has:

  * publisher
  * URL
  * licence
  * coverage
  * retrieval date
  * known limitations
* Missing data is shown as missing.
* Derived metrics have documented methods.
* No unsupported causal claims.

## Trust readiness

The app must use:

* “observed change”
* “associated change”
* “nearby indicators changed”
* “evidence-supported interpretation”
* “available evidence suggests”
* “data is incomplete”

The app must avoid:

* “caused”
* “will cause”
* “predicts”
* “proves”
* “guarantees”
* “impact score”
* “AI forecast”
* “simulation result”

Unless causal evidence genuinely exists, the product should never say something “caused” something else.

## Technical readiness

* Fresh clone runs locally.
* `npm install` works.
* `npm run validate:data` passes.
* `npm run build` passes.
* Static deployment works.
* No secrets in repo.
* No paid API required for default demo.
* No huge raw datasets committed unnecessarily.
* CI blocks invalid events, invalid sources, missing licences, and forbidden language.

## Open-source readiness

* README explains the product clearly.
* Contribution docs exist.
* City adapter spec exists.
* Event/source schemas exist.
* Issue templates exist.
* PR template exists.
* A contributor can add one event without understanding the entire codebase.

## Credibility readiness

A planner should be able to say:

> “This helps me understand what changed here and what evidence supports it.”

A public user should be able to say:

> “I finally understand the timeline of this area.”

An open-source contributor should be able to say:

> “I can improve this city record with better evidence.”

Nobody should leave thinking:

> “This app pretends to predict the future.”

That is the line. Keep it on the evidence side, and the project becomes much more serious.

[1]: https://www.london.gov.uk/programmes-strategies/planning/digital-planning/planning-london-datahub?utm_source=chatgpt.com "The Planning London Datahub - Greater London Authority"
[2]: https://data.cityofnewyork.us/City-Government/Primary-Land-Use-Tax-Lot-Output-PLUTO-/64uk-42ks?utm_source=chatgpt.com "Primary Land Use Tax Lot Output (PLUTO) - NYC Open Data -"
[3]: https://data.cityofchicago.org/Buildings/BuildingPermits2006/cm65-sjan?utm_source=chatgpt.com "BuildingPermits2006 | City of Chicago | Data Portal"
[4]: https://mappinggm.org.uk/?utm_source=chatgpt.com "MappingGM - Home"
[5]: https://opendata.bristol.gov.uk/?utm_source=chatgpt.com "Open Data Bristol"
[6]: https://sfplanning.org/project/pipeline-report?utm_source=chatgpt.com "Pipeline Report | SF Planning"
[7]: https://www.ons.gov.uk/methodology/geography/geographicalproducts/digitalboundaries?utm_source=chatgpt.com "Digital boundaries"
[8]: https://www.ordnancesurvey.co.uk/products/os-open-zoomstack?utm_source=chatgpt.com "OS Open Zoomstack | Data Products"
[9]: https://www.planning.data.gov.uk/?utm_source=chatgpt.com "Planning Data"
[10]: https://data.london.gov.uk/dataset/residential-completions-dashboard-e196j?utm_source=chatgpt.com "Residential completions dashboard - London Datastore"
[11]: https://mappinggm.org.uk/data/?utm_source=chatgpt.com "Data"
[12]: https://opendata.bristol.gov.uk/datasets/air-quality-dashboard?utm_source=chatgpt.com "Air Quality Dashboard | Open Data Bristol"
[13]: https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html?utm_source=chatgpt.com "TIGER/Line Shapefiles"
[14]: https://aqs.epa.gov/aqsweb/documents/data_api.html?utm_source=chatgpt.com "Air Quality System (AQS) API - U.S. EPA Web Server"
[15]: https://github.com/M-Masood4/Bims-5 "GitHub - M-Masood4/Bims-5 · GitHub"
[16]: https://github.com/M-Masood4/Bims-5/blob/main/package.json "Bims-5/package.json at main · M-Masood4/Bims-5 · GitHub"
