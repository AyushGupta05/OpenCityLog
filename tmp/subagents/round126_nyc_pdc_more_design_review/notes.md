# Round126 NYC PDC additional design-review candidates

Created: 2026-05-19

## Scope

Mined additional official NYC Public Design Commission meeting minutes/certificate PDF records beyond the prior `round124_nyc_public_design_commission` candidate pack. The output is scratch-only and stays within `tmp/subagents/round126_nyc_pdc_more_design_review/`.

## Outputs

- `candidates.json`: 50 JSON-valid candidate design-review milestones.
- `source_audit.json`: source/method/licensing/limitations audit for the scratch pack.
- `notes.md`: this summary.

## Method

- Reused the official PDC PDF text/certificate parse from `tmp/subagents/round124_nyc_public_design_commission/pdc_certificate_records.json`.
- Excluded certificates and titles already present in the round124 pack and the current NYC corpus PDC events.
- Filtered for architecture and public-realm design review language such as construction, reconstruction, rehabilitation, addition, facade, library, public restroom, community center, courthouse, park, plaza, greenway, esplanade, and bridge.
- Removed obvious non-architecture/security/equipment/art-only/utility/out-of-city records and rejected geocodes outside the stated borough when the geocoder exposed a borough.
- Required an approximate point geometry inside NYC for every retained candidate.

## Caveats

These candidates are documented PDC design-review approval milestones only. They do not show that construction started, construction finished, a facility opened, a project was occupied, or any urban outcome occurred. Coordinates are approximate map-placement points derived from PDC certificate location text, not official PDC geometry.

## Candidate certificate IDs

30293, 30319, 30336, 30357, 30371, 30209, 30210, 30223, 30241, 28744, 28757, 28771, 28782, 28809, 28823, 28936, 28996, 28354, 28360, 28345, 28566, 28043, 28121, 28203, 28218, 27690, 27830, 27831, 27340, 27406, 27449, 27453, 27527, 27608, 27630, 27031, 27175, 27176, 27177, 26453, 26642, 26767, 26027, 26165, 26174, 26199, 26323, 25795, 25822, 25864
