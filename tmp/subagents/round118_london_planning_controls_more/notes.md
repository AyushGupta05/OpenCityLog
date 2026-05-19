# Round 118 London Planning Controls Notes

## Method

- Read the existing London architecture milestone set and excluded already-heavy families: NHLE, Heritage at Risk, Article 4, conservation-area, certificate-of-immunity, and existing PLD/GLA records.
- Queried official public sources only: Planning Data entity/dataset endpoints, Planning London Datahub public API, GLA/London Datastore report material, and Camden Open Data.
- Treated all rows as administrative status records. No candidate claims construction, opening, occupation, causation, forecast impact, or delivered outcomes.
- Kept `accessed_at` fixed at `2026-05-19` per task instruction.

## Added Coverage

- 1 GLA Stage 3 planning-process candidate for the 2026 Canada Water Masterplan Section 73 report.
- 6 listed-building-consent decision candidates from Planning London Datahub / borough feeds, including Bromley by Bow Gasworks, London Coliseum, Abbey Road Studios, Ealing Common Underground Station, and Buckingham Palace.
- 5 Planning Data archaeological-priority-area status rows with official points and source entity IDs.
- 4 Planning Data asset-of-community-value successful listing decisions from Camden.
- 4 Camden Local List open-data snapshot rows with polygon-derived centroids.

## Caveats

- Planning Data APA `entry-date` and Camden `last_uploaded` are source publication/status-observed dates, not necessarily original adoption/designation dates.
- PLD centroids are application centroids. Where a row has a polygon, this candidate file still stores only point coordinates for easy manual review.
- Camden Local List rows rely on OS-derived borough open data. Preserve Camden and OS attribution before redistribution.
- ACV status is not a heritage designation and should be visually/category-distinct from listed-building and local-list records.
- The GLA Canada Water candidate records a decision-stage/planning-process milestone only; it should not be displayed as delivered development or housing outcome evidence.

## Rejected/Deferred

- Planning Data building-preservation-notice: checked but current sample had no London coordinates/rows.
- Planning Data locally-listed-building: checked but current 448-row extract was outside London; Camden Open Data supplied London local-list rows instead.
- COI, Article 4, conservation areas, NHLE and HAR were intentionally skipped because the existing milestone file already contains those candidate families.
