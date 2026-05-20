# Round119 London Planning Data Local Fetch

Fetched Planning Data entity API rows for listed-building, locally-listed-building, certificate-of-immunity, and building-preservation-notice datasets.
Rows were filtered to the London coordinate envelope and 2008-2026 source-date window.
Rows with only `entry-date` are status-observed records, not original adoption, designation, or physical-change dates.
The candidate pack keeps factual metadata, identifiers, source URLs and caveats only.