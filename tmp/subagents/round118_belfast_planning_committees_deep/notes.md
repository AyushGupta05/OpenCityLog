# Round 118 Belfast Planning Committee Deep Pass

Scope: official Belfast planning committee/current/decided records from 2008-01-01 through 2026-05-19, written only in this scratch directory.

## Method

- Read the existing `architecture_milestones_2008_2026.json` for Belfast duplicates by application reference, address and rough title terms.
- Prioritised Belfast City Council Planning Committee minutes/agendas, Planning decisions issued PDFs and live major application PDFs.
- Checked DfI strategic/called-in/advertised records for Belfast leads; no non-duplicate DfI candidate was stronger than the BCC records in this pass.
- Treated committee approvals/refusals, decisions-issued rows and current/live application rows as planning milestones only. No candidate claims construction, completion, occupation, impact or causation.

## Candidate Themes

- 2015-2016 committee approvals: Ormeau Road apartments, Peter Pan/Springfield affordable housing, Victoria Street hotel conversion, Seaview stand, school/civic accommodation, Visteon mixed-use, former BMC/Maldron planning approval, NI Science Park workspace, Castle Street office/retail.
- 2022-2025 decisions and committee items: Queen's Square apartments, Library Street PBMSA refusal, Corporation Street BTR, Monarch Laundry care facility, Olympic House use flexibility, Derryvolgie theatre academy, Riddel's Warehouse, Beaufort House amendment.
- Current applications: King's Hall Plot 6 retirement living, Waterworks/Alexandra reservoir and public-realm works, Wolfhill school, North Foreshore adventure park, Dunmurry Cricket Club housing/recreation, 38-52 Lisburn Road research/community/cultural use.

## Important Caveats

- Monthly decisions PDFs were used at month precision where row-level decision day was not extracted.
- Live major applications are application-stage records with `Under Consideration` status as of the source list timestamp. They must not be displayed as approved or delivered.
- Coordinates are approximate address/site points. Multi-site records, especially Waterworks/Alexandra, need later polygon/line extraction from the planning register before spatial analysis.
- NI Planning Portal should be used in a follow-up pass for exact decision-issued dates, document references and red-line geometry where needed.

## Duplicate And Reject Notes

- Rejected exact or functional duplicates already in the existing milestone file: Botanic Avenue hotel, Marlborough House/Princes Court, The Oval, former Europa Buscentre/Halt, 39 Corporation Street PBMSA, Fanum/Norwood PBMSA, Castle/Fountain Street PBMSA, Shankill/Lanark/Caledon housing, Havelock House, and Belfast Transport Hub/Grand Central related DfI condition records.
- Stormont Hotel `LA04/2024/0569/O` and `LA04/2024/0570/F` were kept out of candidates because the 10 March 2026 committee record says those items were withdrawn from the agenda. They remain useful follow-up leads if later minutes record a decision.
- Some planning approvals relate to projects already represented by later completion/opening records, such as the former BMC/Maldron hotel. Those were kept only where the official planning approval itself was absent and useful as a planning-stage milestone.

## Files

- `candidates.json` contains `source_audits`, `candidates` and `rejected`.
