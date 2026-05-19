# Round 125 Belfast Geocode Previous Rejects Notes

## Scope

Scratch-only geocoded candidate pack created from prior Belfast candidates that had missing or weak geometry, especially `round123_belfast_planning_portal_committee_more/candidates.json`, with a small number of useful public-facility records from `round123_belfast_public_facilities_universities_health/candidates.json`.

Files written in this directory only:

- `candidates.json`
- `source_audit.json`
- `notes.md`

## Method

- Preserved the prior source event metadata and dates.
- Kept all planning records as application, consent, or decision-stage records only; no construction, opening, occupation, causation, or forecast claim is made.
- Attempted the prior Planning Portal polygon endpoint pattern; the sampled endpoint returned HTTP 404, so the pack does not claim official Planning Portal WGS84 geometry.
- Used Nominatim/OpenStreetMap address or named-site geocoding where official page coordinates were unavailable.
- Used Food Standards Agency FHRS API coordinates for Harberton North Special School because the public official establishment record exposes a geocode.
- Retained only records with a Belfast latitude/longitude and a per-record `geometry_source` plus `geometry_precision` caveat.

## Geometry Caveat

Most points are approximate address, street, named-site, campus, or postcode context points. They are suitable for candidate review and map triage, but not for parcel analysis, measured footprints, construction extents, or proof that works happened. Planning records remain administrative milestones unless later evidence documents physical delivery.

## Exclusions

Excluded records that still lacked a defensible single point, had intentionally undisclosed locations, or represented multi-building/campus-wide work better handled by a different geometry model.
