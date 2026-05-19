# Round115 NYC Development Records Notes

Created: 2026-05-19  
Subagent: codex

## Scope

Official non-LPC NYC records for built-environment, planning, architecture-adjacent, housing, and public-realm change between 2008-01-01 and 2026-05-19. Findings are written only in this tmp subagent folder.

## Sources Used

- DCP Zoning Application Portal Project Data (hgx4-8ukb): completed project/action rows. These are planning records, not proof that proposed buildings were constructed.
- DOB Certificate Of Occupancy (bs8b-p36w): legacy final CO rows for NB/A1 jobs, filtered toward high dwelling-unit counts.
- DOB NOW Certificate of Occupancy (pkdm-hqz6): final CO issued rows. The issuance date is text, so the API filtering uses submitted_date while preserving the issuance timestamp.
- HPD Affordable Housing Production by Building (hg8x-zxpr): building-level housing production rows from 2014 onward, filtered to new construction and larger counted-unit rows.
- NYC Parks Capital Project Tracker (4hcv-tc5r): completed construction/reconstruction capital project rows.

## License / Terms

NYC Open Data terms: https://opendata.cityofnewyork.us/overview/#termsofuse  
NYC.gov terms: https://www.nyc.gov/home/terms-of-use.page

NYC Open Data describes agency publishers as authoritative for data quality and says public datasets are informational. Candidate limitations carry that through so Bims-5 does not overclaim.

## Selection Notes

The JSON contains 47 candidates. I avoided LPC records because another Round115 subagent is covering LPC, and I avoided generic permits or speculative project proposals where the row did not document a meaningful status/date. ZAP rows remain planning-action evidence only; DOB rows remain certificate evidence only; HPD rows remain affordable-housing-production evidence only; Parks rows remain capital tracker evidence only.

## Follow-up Checks Before Ingestion

- Re-run exact source API queries at ingestion time because NYC Open Data rows can be corrected or refreshed.
- Decide whether DOB NOW c_of_o_issuance_date should be parsed into a normalized timestamp or retained as source text.
- For ZAP projects, use the BBL companion dataset (2iga-a6mk) or DCP project pages if parcel-level geometry is required.
- For Parks tracker, check if qiwj-i2jk and 4hcv-tc5r are aliases/superseded views before locking a source id.
- For HPD rows, display counted-unit limitations and do not merge with total NYC housing production without a separate methodology.
