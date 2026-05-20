# Round117 London PLD Major Planning Candidates

## Sources Used

- Planning London Datahub applications API: `https://planningdata.london.gov.uk/api-guest/applications/_search`
- PLD source-row URL pattern: `https://planningdata.london.gov.uk/api-guest/applications/_source/{id}`
- London Datastore dataset page: `https://data.london.gov.uk/dataset/planning-london-datahub-applications-236qk/`
- GLA Planning London Datahub context page: `https://www.london.gov.uk/programmes-strategies/planning/digital-planning/planning-london-datahub`
- GLA planning applications / PlanApps context page: `https://www.london.gov.uk/programmes-strategies/planning/planning-applications-and-decisions`
- GLA commenting/process page: `https://www.london.gov.uk/programmes-strategies/planning/planning-applications-and-decisions/commenting-planning-application`

The PLD source rows are official Greater London Authority / London planning authority application records. The London Datastore dataset page currently lists the licence as "Not Specified", so this drop keeps only factual metadata, record URLs, source ids, and derived representative coordinates.

## Query Strategy

I first loaded `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json` and checked existing London source coverage. The file contains 2,498 London events, including 7 plain PLD rows, 8 MHCLG+PLD combined records, and 17 GLA planning-application decision records.

Primary PLD query:

```json
{
  "size": 500,
  "query": {
    "bool": {
      "must": [
        { "exists": { "field": "wgs84_polygon" } },
        { "range": { "decision_date": { "gte": "01/01/2020", "lte": "19/05/2026", "format": "dd/MM/yyyy" } } },
        { "wildcard": { "application_details.projected_cost_of_works": "Over*" } }
      ]
    }
  }
}
```

That returned 414 PLD rows. I then ranked and manually reviewed rows for:

- approved or approve-like decision/status;
- official geometry in `wgs84_polygon`;
- major redevelopment language such as demolition, redevelopment, mixed-use, residential units, office, hospital, cultural, estate, tower, storey/storeys, public realm;
- high floorspace or tall-building details in `application_details`;
- no matching source record or obvious project duplicate in the existing architecture milestone file.

Several PLD `centroid` values were outside London, especially some Southwark, City, Ealing, and Haringey rows. For candidates, coordinates are representative points computed from `wgs84_polygon`, not from invalid centroids.

## Candidate Counts

- PLD high-cost, 2020-01-01 to 2026-05-19, with `wgs84_polygon`: 414 rows.
- New candidate rows retained: 22.
- Explicit duplicate/low-signal rejects recorded: 10.

The candidate set leans 2020+ and emphasizes major residential, office, mixed-use, tall-building, civic/cultural, hospital, and estate-regeneration planning approvals. These are planning-process milestones only. They should not be worded as construction starts, completions, occupations, openings, delivered homes, delivered public realm, or causal impacts without separate evidence.

## Duplicate Caveats

- New Barnsbury Estate and Timber Square Phase 2 were already present as PLD 2026 events.
- Westferry Printworks was rejected because the file already includes recovered appeal decision milestones for the same project.
- Aylesbury Phase 2B was rejected because an existing Southwark planning approval milestone already represents that project family.
- Paddington Green Police Station and Aberfeldy Estate were rejected because existing GLA call-in/public-hearing milestones already represent those cases.
- 85 Gracechurch Street had an older/superseded 2023 PLD row and a later 2025 row. The 2025 approval row is retained; the older row is rejected.
- Plot S1/S11 at International Quarter London appeared as both LLDC and Newham mirror-style PLD ids. It needs a separate de-duplication pass before ingestion.
- Some rows matched the `Over*` cost-band query but were clearly low-signal or likely data-entry artifacts, such as household loft works or temporary public-art applications. These were rejected.

## Ingestion Notes

- Use `source_record_id` for source-level duplicate checks before appending.
- Preserve both `date` and `source_date_field`; all retained candidate dates are PLD `decision_date`.
- Keep confidence as `documented` only for the administrative planning record, not for delivery of the proposed development.
- Keep geometry caveats visible. Derived coordinates are atlas navigation points from source polygons, not verified building footprints.
- Before final publication, recheck any candidate with a known GLA PlanApps/Stage 2 record if the product wants Mayoral referral-stage dates in addition to borough decision dates.
