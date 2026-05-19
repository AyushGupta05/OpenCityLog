# Round 120 London Public Facilities Official Notes

Stopped discovery per user instruction and wrote a compact scratch pack using only the official, non-duplicate leads already in hand.

## Output

- `candidates.json` contains 2 candidate records, 2 source audits, and 11 rejected leads.
- Candidate records are intentionally conservative. Most high-confidence public/institutional facility leads found during screening were already present in the existing corpus or round118/round119 packs.
- Both included records use official public-body pages and are marked `documented`, but retain review caveats for exact-day verification, official address wording, and surveyed geometry.

## Duplicate Screen

Local `rg` checks were run against the existing architecture milestone corpus and round118/round119 scratch packs before the stop instruction. The following were rejected as duplicates or overlaps:

- UCL Student Centre.
- V&A East Storehouse.
- The Courtauld Gallery reopening.
- Young V&A.
- Bank station capacity upgrade.
- Britannia Leisure Centre.
- Canada Water Leisure Centre.
- Sadler's Wells East.
- London College of Fashion East Bank.
- Multiple NHS/university/civic records already present in the manual corpus, including Grafton Way Building, Guy's Cancer Centre, Great Ormond Street Mittal Children's Medical Centre, Royal London Hospital, Queen Mary Graduate Centre, Roehampton Library, Goldsmiths CCA, LSE Centre Building, Marshall Building, Imperial Sir Michael Uren Hub, RCA Battersea, Greatfields Primary School, and Elleray Centre.

## Included Candidates

- Highgate Newtown Community Centre, Camden Council official page, month precision, approximate site point.
- EcoPark House, North London Waste Authority official page, month precision, approximate site point.

## Rejected But Not Exhausted

Old Vic Backstage and several Barnet community/library leads may still be useful in a later pass, but they were not carried forward because exact milestone date, official address/site language, or coordinate-ready details were not sufficiently confirmed before discovery stopped.

## Method And Caveats

- No outcome, impact, or causal claims were added.
- Geometry is point-level and approximate, not surveyed footprint geometry.
- License notes are conservative: factual metadata, URL, and attribution only pending final reuse-terms review.
- `accessed_at` is set to `2026-05-19` as requested.
- JSON parse validation was run after writing the file.
