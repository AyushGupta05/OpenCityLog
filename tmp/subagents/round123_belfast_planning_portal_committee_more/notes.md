# Round 123 Belfast Planning Portal / Committee Notes

## Scope

Produced a smaller clean pack after the status nudge. The retained records are additional Belfast architecture/development candidates from official Planning Portal NI public-register application pages/API results, with Belfast City Council current/committee pages treated as discovery and audit context.

Files written:

- `candidates.json`
- `source_audit.json`
- `notes.md`

## Method

- Queried the Planning Portal public-register API exposed by `https://planningregister.planningsystemni.gov.uk/simple-search`.
- Filtered results to Belfast City Council records.
- Favoured architecture/development records with clear public-register metadata: hotels, school buildings, social housing, heritage/listed-building consents, community facilities, mixed-use conversions and utility buildings.
- Checked each retained application reference with `rg --fixed-strings` against `scripts`, `web/data/city-atlas/cities/belfast` and prior `tmp/subagents` Belfast packs, excluding this new round123 directory.
- Kept claim types separate: application receipt, planning decision granted, listed-building consent granted/application, and conservation-area consent granted/application.

## Retained Candidate References

- LA04/2026/0432/F
- LA04/2025/2163/F
- LA04/2025/1839/F
- LA04/2025/1841/DCA
- LA04/2025/2140/F
- LA04/2026/0861/F
- LA04/2025/0906/F
- LA04/2025/0175/F
- LA04/2026/0109/F
- LA04/2026/0021/F
- LA04/2026/0022/LBC
- LA04/2026/0246/F
- LA04/2026/0341/F
- LA04/2025/1066/F
- LA04/2025/1014/LBC
- LA04/2024/1322/F
- LA04/2024/1323/DCA
- LA04/2024/1595/LBC
- LA04/2024/0432/DCA
- LA04/2024/0771/F
- LA04/2025/0706/F

## Exclusions

Excluded records that appeared to duplicate existing Belfast current-application or committee packs, including Blackstaff Chambers full application LA04/2026/0482/F, Berry Street shopfront applications LA04/2026/0809/F and LA04/2026/0810/DCA, and Fountain Street applications LA04/2026/0472/F and LA04/2026/0471/A.

No new committee-only candidate was retained in this short pass because the obvious high-signal committee/current-application records were already represented in existing Belfast atlas files or prior Belfast subagent packs.

## Caveats

- Application receipt dates are planning-administration dates only.
- Decision dates and granted status are planning decisions only; they do not prove construction, completion, occupation or opening.
- DCA and LBC records are separate consent claims and should remain linked but distinct from full planning applications.
- Geometry is stored as `geometry_ref` to Planning Portal application geometry endpoints. I did not transform Planning Portal geometry to WGS84 in this scratch pack.
- Planning Portal and Belfast City Council pages have copyright/terms caveats. This pack stores factual metadata, short paraphrases and URLs only.

## Next Checks

- Fetch and transform Planning Portal geometry for retained application ids.
- Reconcile related F/LBC/DCA/PAN records for sites where the pack currently includes one consent pathway.
- For any future "opening" or "completion" claim, use official applicant/public-authority opening/completion pages and keep it separate from planning-administration milestones.
