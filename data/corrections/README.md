# Data Corrections

Append-only correction records belong in `corrections.json` and must validate
against `schemas/correction_record.schema.json`.

Use corrections for accepted, rejected, superseded, or still-proposed changes to
event dates, geometry, categories, confidence labels, caveats, licences,
attribution, source URLs, or source record ids. Keep the original public source
row/file traceable; do not silently rewrite raw source data.
