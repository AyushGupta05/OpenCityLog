# Round 116 Belfast Planning Official Candidates

Accessed: 2026-05-19

## Scope

This drop gathers additional official/public-source Belfast architecture and built-environment change candidates for the 2008-01-01 through 2026-05-19 window. It is limited to records clearly inside Belfast and relevant to buildings, demolition, conservation/listed-building works, major redevelopment, public realm, hotels, residential-led schemes, or stadium/regeneration planning.

The output is `candidates.json` with:

- 4 source-audit records
- 12 candidate records
- 7 duplicate or unsuitable rejects

## Sources Used

- Belfast City Council Planning Committee agenda, reports and minutes: `https://minutes.belfastcity.gov.uk/`
- Belfast City Council current planning applications list: `https://www.belfastcity.gov.uk/planning-and-building-control/planning/current-planning-applications?action=Index&controller=TwentyEighty`
- Northern Ireland Planning Portal public register: `https://planningregister.planningsystemni.gov.uk/`
- DfI regionally significant and called-in planning application records: `https://www.infrastructure-ni.gov.uk/topics/regionally-significant-developments-and-called-applications`

Source-audit entries include copyright or terms notes for Belfast City Council, the NI Planning Portal, and DfI Crown copyright / OGL caveats.

## Method

I first screened the existing manual architecture milestone corpus at `data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json` for existing source IDs, planning refs, titles, URLs, and dates. The existing corpus already includes many 2024-2026 Belfast committee/planning records, so I excluded obvious overlaps.

I then checked official BCC committee pages, current BCC planning advertisements, DfI called-in/regionally significant records, and NI Planning Portal application records. For Planning Portal records, I retained stable public application IDs, planning references, status/decision fields, received/validated/advertised/decision dates, easting/northing where available, and approximate WGS84 lat/lon conversions.

## Interpretation Caveats

All accepted records are administrative evidence only. A planning permission, committee minute, listed-building consent, demolition consent, validation notice, advertisement, DfI call-in notice, or DfI final permission record does not prove construction started, construction completed, a building opened, or an urban outcome occurred.

For live applications, the candidate event should be interpreted as "application validated/advertised" rather than approval. These should be excluded from approval or completion totals unless later decision evidence is added.

Planning Portal easting/northing points are register locations and were converted to approximate WGS84 lat/lon for mapping convenience. They are not surveyed footprints, curtilage boundaries, or construction extents.

One current BCC/Portal advertisement for `LA04/2026/0855/DCA` shows an advertised date of 2026-05-22, which is after the access date of 2026-05-19. The candidate keeps this as a portal-supplied future advertisement field and records the limitation.

## Accepted Candidate Themes

- DfI called-in or regionally significant decisions: Casement Park and 448-450 Lisburn Road.
- BCC/Portal final planning permissions: Winetavern/Gresham/North Street and Butchers Building, Hamilton Dock hotel, Loft Lines, and City Quays.
- Newly advertised or validated 2026 applications: Clarendon Dock, Belfast Harbour Office / William Ritchie Building, Queen's University Administration Building, Clarence Chambers, 20 Rosemary Street, and Dalton Street apartments amendment.

## Reject Rationale

Rejected records were mainly duplicates of entries already present in the existing architecture milestone corpus, including Botanic hotel, Havelock House, Scottish Mutual/Bedford, Paisley Park, 3 Milner Street, Berry Street, and Ann Street discharge-condition material.

## Verification

`candidates.json` was parsed with PowerShell `ConvertFrom-Json` after writing. Counts confirmed:

- `source_audit`: 4
- `candidates`: 12
- `rejects`: 7

No existing source files were edited for this round.
