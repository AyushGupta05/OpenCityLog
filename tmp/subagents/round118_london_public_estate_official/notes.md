# Round 118 London Public Estate Official Notes

## Scope

This pass looked for additional London public-estate and civic architecture records dated from 2008-01-01 through 2026-05-19. I used official public sources only: London borough pages and committee papers, NHS trust or NHS-linked project pages, public universities/research institutions, and public museum/cultural bodies.

The output is framed as source-stated observations: opening, official opening, completion/move-in, reopening, or planning-permission stage. No candidate claims social, economic, clinical, educational, or regeneration outcomes.

## Duplicate Handling

I checked likely titles, source URLs and alternate project names against:

`data/manual_drops/architecture_milestones/architecture_milestones_2008_2026.json`

Records were rejected when the same project was already present, even if a better official source was found. This removed London City Hall Royal Docks, GOSH Mittal/Premier Inn, Museum of London West Smithfield approval, Britannia Leisure Centre, Fellowship Square, Oak Cancer Centre, Pears Maudsley Centre, Horniman World Gallery, Sammy Ofer Wing, and LSBU Hub.

Oriel final planning permission was retained because the existing file contains a later groundbreaking milestone, not the final decision-notice approval stage.

## Candidate Summary

`candidates.json` contains 14 candidate records:

- UCL East One Pool Street opened in autumn 2022.
- LSBU Student Centre official opening in July 2013.
- Artizan Street Library and Community Centre opened in December 2012.
- Oriel final planning permission granted in August 2022.
- Paddock Secondary and Sixth Form School grand opening in November 2025.
- Springfield University Hospital Trinity building opened in December 2022.
- Springfield University Hospital Shaftesbury building opened in October 2023.
- Greatfields School final building completed / students moved in, March 2022.
- New Regent's College official opening ceremony in September 2021.
- The Dugdale Arts Centre reopening after refurbishment, December 2022.
- Centre for Molecular Pathology official opening, November 2012.
- Centre for Cancer Imaging opening celebration, March 2016.
- Centre for Cancer Drug Discovery opened to researchers / virtual opening, November 2020.
- Heartlands High School opened in September 2010.

## Geometry Notes

Coordinates are manual point approximations from source-stated addresses, streets, campuses, or named sites. Where a source gave only a campus or street, `geometry_precision` is set to `campus_approx`, `site_centroid_approx`, or `street_approx`.

Candidate geometry should be treated as atlas navigation geometry, not survey geometry.

## Date Notes

Some official sources state an exact day; others state only a month or season. The `date_precision` field should be respected:

- `season`: UCL One Pool Street, because the official UCL page states autumn 2022.
- `month`: Artizan Street Library, Trinity, Shaftesbury, Heartlands High School.
- `day`: records where the official source states or clearly dates the observation day.

Where source publication date differs from actual opening or move-in timing, `source_date_field` and `limitations` explain the distinction.

## License And Attribution

All sources are official public web pages or official PDFs, but reuse terms were not fully audited. The candidate records store small factual metadata and source URLs only. Do not reuse page text, photographs, or PDFs beyond citation/factual extraction without checking each publisher's terms.

## Open Issues

- Some strong official sources improve existing duplicate projects rather than adding new projects. They are listed in `rejected` so a later maintainer can decide whether to replace non-official existing citations.
- Paddock School geometry is street-level because the Wandsworth article names Broadwater Road but does not provide a full postal address.
- Heartlands High School is sourced from official planning documentation rather than a dedicated opening press release; it is included because the statement is explicit and official, but it has month-level precision only.
