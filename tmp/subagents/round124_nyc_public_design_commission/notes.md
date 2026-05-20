# NYC Public Design Commission Candidate Notes

Partial artifacts written on 2026-05-19 for `round124_nyc_public_design_commission`.

## What Was Produced

- `candidates.json`: 22 candidate NYC PDC design-review approval milestones from 2008-2026.
- `source_audit.json`: audit notes for the official PDC current meetings page, past-minutes archive, and the PDF certificate collection.
- Local support files in this same worker folder include downloaded PDFs, extracted text, link inventories, and a parsed certificate-record scratch file.

## Source Boundary

Only official NYC Public Design Commission pages and official PDC PDFs were used as event evidence:

- Current meetings page: `https://www.nyc.gov/site/designcommission/design-review/meetings/meetings.page`
- Past minutes archive: `https://www.nyc.gov/site/designcommission/design-review/pdc-meetings/past-minutes.page`
- Linked official `nyc.gov/assets/designcommission/...` meeting/minutes/certificate PDFs

No press releases, agency project pages, Wikipedia, news articles, or non-PDC pages were used as event sources.

## Method

1. Collected official PDC PDF links from the current meetings page and past-minutes archive.
2. Downloaded 2008-2026 candidate PDFs under this worker folder.
3. Extracted PDF text using local `pypdf`.
4. Parsed certificate-like records for adoption date, certificate number, approval type, subject text, source URL, and local text path.
5. Manually selected a small, high-signal set of public buildings, libraries, cultural facilities, parks, plazas, greenways, waterfronts, and streetscape projects.
6. Normalized selected records into Bims-style event candidates with source fields, provenance, confidence, limitations, and point coordinates.

## Important Limitations

The records in `candidates.json` are provenance-complete enough for candidate review, but they are not final production ingest.

- Coordinates are manual approximate points derived from the PDC address/intersection/location text. PDC did not provide official GIS geometry in the PDFs.
- Corridor and multi-site projects are represented as approximate midpoint points. They should become LineString or Polygon records before production if the UI needs precise geography.
- Approval dates are PDC certificate adoption dates. They are not construction start dates, completion dates, opening dates, or outcome dates.
- Preliminary approvals are included where they are high-signal design milestones; they should not be confused with final approvals.
- Some PDF filenames differ from their contents, and OCR extraction can introduce text defects. Certificate numbers, dates, and URLs should receive a second manual QA pass.
- The source PDFs do not clearly state an open-data license. The audit treats them as official NYC.gov public records for citation evidence, with reuse subject to NYC.gov terms.

## Parser Counts

- Official PDF links discovered: 253.
- 2008-2026 links selected for extraction: 242.
- Text files extracted successfully in this pass: 229 before retry, with additional space-encoded URLs retried.
- Parsed certificate-like records: 5,686.

## Recommended Next Pass

- Validate every coordinate against an official NYC geocoder or authoritative city facility/park layer, preserving that geometry source separately from PDC approval evidence.
- Deduplicate preliminary/final/amended-final records where a product view wants one project row rather than multiple approval milestones.
- Add a small verifier that rejects candidate events without `certificate_number`, `source_url`, `effective_date`, `milestone_type`, `confidence`, `geometry`, and `geometry_precision`.
- Decide whether source PDFs can be redistributed or whether only URLs and derived citation metadata should ship.
