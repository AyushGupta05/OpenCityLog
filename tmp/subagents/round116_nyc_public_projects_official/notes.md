# Round 116 NYC Public Projects Official Candidate Notes

Accessed: 2026-05-19

Scope: official NYC Open Data/API rows and official NYC agency pages only. This pass avoided LPC landmark/designation sources and screened against `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json` by source family, source record ID, title/date terms, and source URL.

## Sources Used

- NYC DDC official press release pages for public-building/project-delivery milestones.
- NYC Parks Capital Project Tracker (`4hcv-tc5r`) for completed capital project rows with `constructionactualcompletion` and official lat/lon.
- HPD Affordable Housing Production by Building (`hg8x-zxpr`) for building-level affordable-housing completion rows.
- DOB NOW Certificate of Occupancy (`pkdm-hqz6`) for high-unit final CO rows.
- DCP Zoning Application Portal Project Data (`hgx4-8ukb`) for public-facility, public-space, infrastructure, and development-review milestones.

## Candidate Mix

- Total candidates: 35
- Source audits: 7
- Rejects: 15

The strongest ingestion-ready rows are Parks tracker completions, HPD building completions, and DOB NOW final COs because they have stable row IDs, date fields, and official coordinates. ZAP rows are useful planning/project milestones but should stay visibly administrative. DDC page candidates are high-signal but need official geocoding before map ingestion when the page lacks coordinates.

## Provenance Caveats

Administrative milestones are labelled as such. ZAP approvals/completions and DDC procurement/program pages should not be rewritten as construction completion, opening, occupancy, or delivered impact. HPD completion is not equivalent to DOB final CO or first resident move-in. DOB final CO is legal occupancy/use evidence, not lease-up or architectural-quality evidence. Parks `constructionactualcompletion` is a tracker completion milestone, not necessarily a public reopening.

## Duplicate Handling

Rejected rows include already-covered DDC 2025 civic projects, Parks tracker IDs already present in the manual file, DOB NOW rows that duplicate legacy DOB CO address/job records, and ZAP neighborhood-plan rows already represented through zoning text events. The two DDC candidates for Shirley Chisholm LEED and 70 Mulberry CM-Build are related to existing projects but represent distinct non-construction administrative/certification milestones and are explicitly labelled that way.

## Follow-Up Checks

- For DDC page candidates, run official NYC geocoding or join to an official facility/capital asset row before map display.
- For HPD and DOB candidates, consider cross-linking by BBL/BIN where candidate records describe the same building from different official sources.
- For ZAP candidates, look for official ZAP map geometry, ULURP documents, or disposition/acquisition maps before creating geometry beyond borough/community-district context.
- Before ingestion, decide whether Bims-5 wants certification/procurement milestones as events or only as source/evidence records attached to later construction/opening events.
