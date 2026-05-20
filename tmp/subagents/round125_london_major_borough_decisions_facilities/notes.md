# Round 125 London Major Borough Decisions And Facilities

Scratch-only batch for official-source London architecture-related observed-change candidates, accessed 2026-05-19.

## Scope

- Targeted major decisions/openings/completions for civic, education, culture, health, estate/public buildings, public facilities, and architecture-significant buildings from 2008-01-01 through 2026-05-19.
- Used official borough, GLA, NHS trust, university, public-facility operator, and cultural-institution pages.
- Did not use Planning Data LBC, Historic England, or LDD completion packs as candidate sources.

## Dedupe Notes

Checked requested nearby scratch outputs:

- `round121_london_official_facilities_more`: avoided listed items including Hope Corner, One Stonegrove, West Hampstead Library, Kingsgate Centre, King's Cross Academy/Frank Barnes, Thomas Fairchild, Garden SEN, Oasis Academy Arena, Northcote Library, Focus Hall, Pollards Hill Library, Carew Academy, Throwley Yard.
- `round122_london_borough_major_schemes`: avoided listed items including 300 Harrow Road, Church Street, Strand/Aldwych, Agar Grove, Canada Water Masterplan, Elephant and Castle, Elephant Park, Walworth Town Hall, Aylesbury, Tustin, Tower Hamlets Town Hall, Blackwall Reach, Britannia Leisure Centre, Colville, Woodberry Down, Carpenters, Woolwich Works, and City tower approvals.
- `round123_london_heritage_designations`: avoided NHLE amendments/removals/certificates of immunity.
- `round124_london_ldd_archive_completions`: avoided LDD completion records including Olympic Stadium, IBC/MPC, Kings Cross Central, Heathrow T2, Francis Crick, Westfield, 20 Fenchurch Street, 100 Bishopsgate, and other LDD pack records.
- `round125_london_ldd_archive_completions_next`: not present or empty when inspected.

## Quality Notes

- 40 candidates are in `candidates.json`.
- Every candidate has `city_id: london`, stable `candidate_id`, source provenance, `accessed_at: 2026-05-19`, a confidence value, and a point geometry within Greater London.
- Geometry is mostly geocoded to building/site centroids from official facility addresses or named sites. Items marked `site_approximate` should be refined against authoritative address/UPRN or council asset data before ingestion.
- Several otherwise useful candidates have weaker date provenance because official pages give year/month or retrospective notes. These are retained as scratch candidates with caveats in `limitations` and `source_audit.json`.

## Strongest Candidates

High-confidence, clean-source candidates include Sadler's Wells East, V&A East Storehouse, UCL East Marshgate, RCA Battersea, UCL Student Centre, QMUL Graduate Centre, UCLH Grafton Way Building, Royal National ENT and Eastman Dental Hospitals, Imperial School of Public Health, LSE Marshall Building, Design Museum, Science Museum Medicine Galleries, Courtauld Gallery, National Army Museum, Canada Water Leisure Centre, Idea Store Canary Wharf, Lambeth Town Hall, Kingston University Town House, and Hackney Stoke Newington Young People's Centre.

## Needs Follow-Up Before Production

- Replace weaker or retrospective sources for Battersea Arts Centre Grand Hall, Fairfield Halls, Brent Civic Centre, Museum of the Home, National Portrait Gallery, Royal London Hospital, and Tate Modern Blavatnik Building with dated official press releases or archived official pages where possible.
- Confirm exact day-level dates for Hounslow Meadowbank, Putney Library, West Wickham Library, Southbank Centre QEH/Purcell Room, and Hayward Gallery.
- If the production schema distinguishes `effective_date` from `official_opening_date`, split public opening, formal opening, completion, and occupation events where the source distinguishes them.
