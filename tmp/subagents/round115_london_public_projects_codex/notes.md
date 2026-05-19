# Round115 London Public Projects Notes

Used repo-local `urban-data-source-auditor` guidance for source suitability and caveats. This batch intentionally avoids NHLE/HAR and treats official pages as evidence for observed administrative/public-project milestones, not as proof of physical delivery unless the page directly says something opened or was completed.

## Method

- Searched existing London candidate outputs and `open-citylog/data-discovery/london` for obvious duplicates by project terms.
- Prioritized official GLA/City Hall public-hearing and mayoral-decision pages, MHCLG/GOV.UK recovered appeal decisions, LLDC/QEOP project records, TfL official media releases, and borough pages.
- Kept rows that add non-heritage official records for planning decisions, station works, estate regeneration, public realm, or major public-project governance.

## Source Caveats

- GLA call-ins, Stage 2/public-hearing records, mayoral decisions, CPO decisions, and OPDC decisions are administrative planning/governance milestones. They should not be displayed as construction starts, completions, openings, or causal impacts.
- GOV.UK recovered appeals are strong for the Secretary of State/inspector decision record, but implementation requires separate planning-register, developer, or site evidence.
- LLDC/QEOP project pages are official public project pages, but reuse terms still need review before copying page text or images.
- TfL media releases are useful for station opening/transfer/contract milestones. General transport claims, ridership, economic effects, or future benefits should be excluded unless separately sourced.
- Borough news/project pages are official but often summarize committee outcomes. For ingestion, follow up with the linked planning-register/committee record where available.

## Duplicate Notes

Near-duplicate risks are mainly:

- Bond Street and Canary Wharf Elizabeth line station rows, because `open-citylog` already has general Elizabeth line opening events. These are only useful if station-specific architecture/redevelopment milestones are desired.
- Beam Park, because a prior candidate covers Beam Park Health Centre opening. The row here is wider GLA Beam Park planning permission.
- Aylesbury, because previous rounds include Aylesbury community-facility items. The row here is Phase 2b planning approval.
- North London Business Park, because a prior candidate references a school opening on the site. The row here is the MHCLG recovered appeal.

## Recommended Next Checks

- Resolve GLA report PDFs/application references for rows that currently cite public-hearing landing pages.
- Add application IDs/LPA references where not already in the source text.
- Replace approximate coordinates with planning-register geometries where available.
- Review council and LLDC reuse terms before treating page text as open data.
